export type InputMode = "text" | "pdf" | "image" | "url";

export type RiskLevel = "low" | "medium" | "high" | string;

export interface AnalyzeResponse {
  source_type: string;
  file_name: string | null;
  extracted_text: string;
  plain_english: string;
  key_points: string[];
  risk_level: RiskLevel;
  warnings: string[];
}

export interface AppErrorState {
  message: string;
  status?: number;
  details?: string;
}
