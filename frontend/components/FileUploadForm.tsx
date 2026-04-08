"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ImageIcon, UploadCloud, X } from "lucide-react";

interface FileUploadFormProps {
  mode: "pdf" | "image";
  selectedFile: File | null;
  isLoading: boolean;
  onFileChange: (file: File | null) => void;
  onSubmit: (file: File) => void;
  onError: (message: string) => void;
  onClearError: () => void;
}

function fileSizeLabel(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function isValidFile(file: File, mode: "pdf" | "image"): boolean {
  if (mode === "pdf") {
    return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  }

  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return type === "image/png" || type === "image/jpeg" || name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg");
}

export default function FileUploadForm({
  mode,
  selectedFile,
  isLoading,
  onFileChange,
  onSubmit,
  onError,
  onClearError
}: FileUploadFormProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [hovered, setHovered] = useState(false);

  const accept = mode === "pdf" ? ".pdf,application/pdf" : ".png,.jpg,.jpeg,image/png,image/jpeg";

  const imagePreviewUrl = useMemo(() => {
    if (!selectedFile || mode !== "image") {
      return null;
    }

    return URL.createObjectURL(selectedFile);
  }, [selectedFile, mode]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const chooseFile = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!isValidFile(file, mode)) {
      onError(mode === "pdf" ? "Please upload a valid PDF file." : "Please upload PNG/JPG/JPEG image files.");
      onFileChange(null);
      return;
    }

    onClearError();
    onFileChange(file);
  };

  const submit = () => {
    if (!selectedFile) {
      onError("Select a file before analyzing.");
      return;
    }

    onClearError();
    onSubmit(selectedFile);
  };

  return (
    <div className="space-y-4">
      <motion.label
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragOver(false);
          chooseFile(event.dataTransfer.files?.[0] ?? null);
        }}
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.995 }}
        className={`relative block min-h-[200px] cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-6 transition ${
          isDragOver
            ? "border-[color:var(--gold-bright)] bg-[color:var(--green-deep)]"
            : "border-[color:var(--border-mid)] bg-[color:var(--bg-deep)]"
        }`}
      >
        {isDragOver ? (
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(240,180,41,0.2),transparent)] [background-size:200%_100%] animate-shimmer" />
        ) : null}

        <input
          type="file"
          className="hidden"
          accept={accept}
          disabled={isLoading}
          onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
        />

        <div className="relative z-[1] flex min-h-[150px] flex-col items-center justify-center text-center">
          {!selectedFile ? (
            <>
              <span className="mb-3 grid h-14 w-14 place-items-center rounded-full border border-[color:var(--border-mid)] bg-[rgba(240,180,41,0.08)] text-[color:var(--text-gold)]">
                {mode === "pdf" ? <UploadCloud size={32} /> : <ImageIcon size={32} />}
              </span>
              <p className="font-display text-2xl font-semibold text-[color:var(--text-primary)]">
                {isDragOver
                  ? "Release to analyze"
                  : mode === "pdf"
                    ? "Drop your PDF here"
                    : "Drop your stamp paper photo here"}
              </p>
              <p className="mt-2 text-sm font-light text-[color:var(--text-secondary)]">
                {mode === "pdf"
                  ? "Accepts .pdf files - text extraction runs server-side"
                  : "Accepts .jpg .png .jpeg - OCR extracts handwritten or printed text"}
              </p>

              {mode === "image" ? (
                <span className="mt-3 rounded-full border border-[color:var(--border-mid)] px-3 py-1 text-[11px] text-[color:var(--text-gold)]">
                  📸 Works with stamp paper photos - OCR extracts text automatically
                </span>
              ) : null}
            </>
          ) : (
            <div className="w-full space-y-3 rounded-xl border border-[color:var(--border-mid)] bg-[color:var(--bg-surface)] p-4">
              {mode === "image" && imagePreviewUrl ? (
                <img src={imagePreviewUrl} alt="Preview" className="mx-auto max-h-40 rounded-lg border border-[color:var(--border-dark)]" />
              ) : (
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-lg border border-[color:var(--border-dark)] bg-[rgba(240,180,41,0.08)] text-[color:var(--text-gold)]">
                  <UploadCloud size={34} />
                </div>
              )}

              <div className="space-y-1 text-left">
                <p className="mono truncate text-sm text-[color:var(--text-primary)]">{selectedFile.name}</p>
                <p className="text-xs text-[color:var(--text-secondary)]">{fileSizeLabel(selectedFile.size)}</p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--risk-low-bg)] px-3 py-1 text-xs text-[color:var(--green-text)]">
                  <CheckCircle2 size={14} /> Ready to analyze
                </span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    onFileChange(null);
                    onClearError();
                  }}
                  className="inline-flex items-center gap-1 text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--risk-high)]"
                >
                  <X size={14} /> Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {!isDragOver && hovered ? (
          <span className="pointer-events-none absolute inset-0 rounded-2xl border border-[color:var(--border-mid)]" />
        ) : null}
      </motion.label>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={isLoading || !selectedFile}
          className="group relative overflow-hidden rounded-[10px] bg-[linear-gradient(135deg,var(--gold-mid),var(--gold-bright))] px-8 py-3 text-sm font-medium text-[color:var(--bg-void)] transition hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_8px_24px_rgba(240,180,41,0.3)] active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <span className="pointer-events-none absolute inset-y-0 left-[-130%] w-1/2 -skew-x-12 bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.55),rgba(255,255,255,0))] transition duration-500 group-hover:left-[140%]" />
          <span className="relative inline-flex items-center gap-2">
            {isLoading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" />
              </svg>
            ) : null}
            {isLoading ? "Analyzing..." : "Analyze Document"}
          </span>
        </button>
      </div>
    </div>
  );
}
