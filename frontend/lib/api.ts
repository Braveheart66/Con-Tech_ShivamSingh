import { AnalyzeResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  status?: number;
  details?: string;

  constructor(message: string, status?: number, details?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function asNonEmptyString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeAnalyzeResponse(payload: unknown): AnalyzeResponse {
  const response = (payload ?? {}) as Partial<AnalyzeResponse>;

  return {
    source_type: asNonEmptyString(response.source_type, "unknown"),
    file_name: typeof response.file_name === "string" ? response.file_name : null,
    extracted_text: asNonEmptyString(response.extracted_text),
    plain_english: asNonEmptyString(response.plain_english),
    key_points: asStringArray(response.key_points),
    risk_level: asNonEmptyString(response.risk_level, "low"),
    warnings: asStringArray(response.warnings)
  };
}

async function buildApiError(response: Response): Promise<ApiError> {
  let message = `Request failed with status ${response.status}.`;
  let details: string | undefined;

  try {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as {
        detail?: unknown;
        message?: unknown;
        error?: unknown;
      };

      const candidate = payload.detail ?? payload.message ?? payload.error;
      if (typeof candidate === "string" && candidate.trim()) {
        message = candidate.trim();
      } else if (Array.isArray(candidate) && candidate.length > 0) {
        message = candidate.map(String).join("; ");
      }

      details = JSON.stringify(payload);
    } else {
      const text = await response.text();
      if (text.trim()) {
        message = text.trim();
        details = text.trim();
      }
    }
  } catch {
    // Keep default fallback message when response body cannot be parsed.
  }

  return new ApiError(message, response.status, details);
}

async function parseAnalyzeResponse(response: Response): Promise<AnalyzeResponse> {
  if (!response.ok) {
    throw await buildApiError(response);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new ApiError(
      "Server returned an unexpected response format.",
      response.status,
      text
    );
  }

  const payload = await response.json();
  return normalizeAnalyzeResponse(payload);
}

function validateFileType(file: File, allowedMimeTypes: string[], allowedExtensions: string[]): void {
  const fileName = file.name.toLowerCase();
  const extensionMatch = allowedExtensions.some((ext) => fileName.endsWith(ext));
  const mimeMatch = file.type ? allowedMimeTypes.includes(file.type) : false;

  if (!extensionMatch && !mimeMatch) {
    throw new ApiError("The selected file type is not supported for this input mode.");
  }
}

async function analyzeWithFile(file: File): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    body: formData
  });

  return parseAnalyzeResponse(response);
}

export async function analyzeText(text: string): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("text", text);

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    body: formData
  });

  return parseAnalyzeResponse(response);
}

export async function analyzePdf(file: File): Promise<AnalyzeResponse> {
  validateFileType(file, ["application/pdf"], [".pdf"]);
  return analyzeWithFile(file);
}

export async function analyzeImage(file: File): Promise<AnalyzeResponse> {
  validateFileType(file, ["image/png", "image/jpeg"], [".png", ".jpg", ".jpeg"]);
  return analyzeWithFile(file);
}

export async function scrapeUrl(url: string): Promise<AnalyzeResponse> {
  const endpoint = `${API_BASE_URL}/scrape-url`;

  const jsonResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });

  if (jsonResponse.ok) {
    return parseAnalyzeResponse(jsonResponse);
  }

  if (![400, 415, 422].includes(jsonResponse.status)) {
    throw await buildApiError(jsonResponse);
  }

  const formData = new FormData();
  formData.append("url", url);

  const formResponse = await fetch(endpoint, {
    method: "POST",
    body: formData
  });

  return parseAnalyzeResponse(formResponse);
}
