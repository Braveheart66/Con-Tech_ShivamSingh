"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, File, FileImage, FileText, Link2, Sparkles } from "lucide-react";
import KeyPointCard from "@/components/KeyPointCard";
import RiskMeter from "@/components/RiskMeter";
import WarningCard from "@/components/WarningCard";
import { AnalyzeResponse } from "@/lib/types";

interface ResultPanelProps {
  result: AnalyzeResponse;
}

function sourceMeta(sourceType: string) {
  if (sourceType === "pdf") {
    return { label: "PDF", icon: "📁", IconComponent: File };
  }

  if (sourceType === "image") {
    return { label: "Image", icon: "🖼", IconComponent: FileImage };
  }

  if (sourceType === "url" || sourceType === "web_url") {
    return { label: "URL", icon: "🔗", IconComponent: Link2 };
  }

  return { label: "Text", icon: "📄", IconComponent: FileText };
}

function riskColor(level: string): string {
  const normalized = level.toLowerCase();
  if (normalized.includes("high")) return "var(--risk-high)";
  if (normalized.includes("medium")) return "var(--risk-mid)";
  return "var(--risk-low)";
}

export default function ResultPanel({ result }: ResultPanelProps) {
  const [typedText, setTypedText] = useState("");
  const [isTypingDone, setIsTypingDone] = useState(false);

  const source = useMemo(() => sourceMeta(result.source_type), [result.source_type]);
  const wordCount = useMemo(() => {
    return result.plain_english.trim() ? result.plain_english.trim().split(/\s+/).length : 0;
  }, [result.plain_english]);

  const color = useMemo(() => riskColor(result.risk_level), [result.risk_level]);

  // Typing animation for extracted text
  useEffect(() => {
    const raw = result.extracted_text ?? "";
    const cap = 800;
    const displaySource = raw.length > cap ? raw.slice(0, cap) : raw;

    let index = 0;
    setTypedText("");
    setIsTypingDone(false);

    if (!displaySource.length) {
      setIsTypingDone(true);
      return;
    }

    const delayTimer = window.setTimeout(() => {
      const interval = window.setInterval(() => {
        index += 1;
        setTypedText(displaySource.slice(0, index));

        if (index >= displaySource.length) {
          window.clearInterval(interval);
          setIsTypingDone(true);
        }
      }, 6);

      return () => window.clearInterval(interval);
    }, 400);

    return () => {
      window.clearTimeout(delayTimer);
    };
  }, [result.extracted_text]);

  const truncated = (result.extracted_text ?? "").length > 800;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ====== SECTION 1: HERO BANNER — Plain English ====== */}
      <div
        style={{
          width: "100%",
          padding: "40px 48px",
          background: "linear-gradient(135deg, var(--bg-deep) 0%, var(--bg-surface) 100%)",
          border: "1px solid var(--border-dark)",
          borderRadius: 20,
          position: "relative",
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
        {/* Corner accent — top-right radial glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 300,
            height: 300,
            background: "radial-gradient(circle at 100% 0%, var(--gold-glow) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Large decorative quote mark */}
        <span
          style={{
            position: "absolute",
            top: 16,
            left: 40,
            fontFamily: "var(--font-display), Georgia, serif",
            fontSize: 180,
            fontWeight: 300,
            color: "var(--text-primary)",
            opacity: 0.025,
            pointerEvents: "none",
            userSelect: "none",
            lineHeight: 1,
            zIndex: 0,
          }}
          aria-hidden
        >
          &ldquo;
        </span>

        {/* Source badge row */}
        <div style={{ marginBottom: 24, position: "relative", zIndex: 1 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--bg-raised)",
              border: "1px solid var(--border-mid)",
              borderRadius: 999,
              padding: "4px 12px",
              fontFamily: "var(--font-body), sans-serif",
              fontSize: 11,
              color: "var(--text-secondary)",
            }}
          >
            <span>{source.icon}</span>
            <span>{source.label}</span>
            {result.file_name ? (
              <span style={{ color: "var(--text-tertiary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                · {result.file_name.length > 30 ? result.file_name.slice(0, 30) + "…" : result.file_name}
              </span>
            ) : null}
          </span>
        </div>

        {/* Label */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            style={{
              fontFamily: "var(--font-body), sans-serif",
              fontWeight: 500,
              fontSize: 11,
              color: "var(--text-gold)",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Sparkles size={12} /> PLAIN ENGLISH
          </p>
          <div
            style={{
              width: 24,
              height: 1,
              background: "var(--gold-mid)",
              marginBottom: 16,
            }}
          />
        </div>

        {/* THE MAIN TRANSLATION TEXT */}
        <motion.p
          initial={{ opacity: 0, filter: "blur(6px)", y: 12 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(24px, 3.5vw, 36px)",
            color: "var(--text-primary)",
            lineHeight: 1.55,
            maxWidth: 720,
            position: "relative",
            zIndex: 1,
            margin: 0,
          }}
        >
          {result.plain_english || "No plain-English explanation available."}
        </motion.p>

        {/* Word count pill */}
        <div style={{ marginTop: 20, position: "relative", zIndex: 1 }}>
          <span
            style={{
              fontFamily: "var(--font-body), sans-serif",
              fontWeight: 300,
              fontSize: 12,
              color: "var(--text-tertiary)",
            }}
          >
            {wordCount} words
          </span>
        </div>
      </div>

      {/* ====== SECTION 2: TWO-COLUMN ROW — Original Text + Risk Panel ====== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
        className="result-two-col"
      >
        {/* LEFT — Original Legal Text terminal */}
        <div
          style={{
            background: "var(--bg-void)",
            border: "1px solid var(--border-dark)",
            borderRadius: 16,
            padding: 24,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span
              style={{
                fontFamily: "var(--font-body), sans-serif",
                fontWeight: 500,
                fontSize: 10,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              ORIGINAL LEGAL TEXT
            </span>
            <span
              style={{
                background: "var(--green-deep)",
                color: "var(--green-text)",
                fontSize: 10,
                fontFamily: "var(--font-body), sans-serif",
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              EXTRACTED
            </span>
          </div>

          {/* Scrollable text area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              maxHeight: 240,
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
              color: "var(--text-secondary)",
              lineHeight: 1.8,
            }}
            className="terminal-scroll"
          >
            {typedText || "No extracted text returned."}
            {!isTypingDone && typedText.length > 0 && (
              <span
                style={{
                  color: "var(--gold-bright)",
                  animation: "blink 0.8s step-end infinite",
                }}
              >
                |
              </span>
            )}
            {isTypingDone && truncated && (
              <span style={{ color: "var(--text-tertiary)", fontStyle: "italic" }}>
                {" "}... [text truncated for display]
              </span>
            )}
          </div>
        </div>

        {/* RIGHT — Risk Panel */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-dark)",
            borderRadius: 16,
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background glow */}
          <div
            style={{
              position: "absolute",
              top: -40,
              left: "50%",
              transform: "translateX(-50%)",
              width: 200,
              height: 200,
              background: `radial-gradient(circle, color-mix(in srgb, ${color} 7%, transparent) 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />

          {/* Risk Meter */}
          <RiskMeter level={result.risk_level} score={result.risk_score} />

          {/* Footer note */}
          <p
            style={{
              fontFamily: "var(--font-body), sans-serif",
              fontWeight: 300,
              fontSize: 10,
              color: "var(--text-tertiary)",
              textAlign: "center",
              marginTop: "auto",
              paddingTop: 12,
            }}
          >
            Risk assessed by Gemma 3 270M · LoRA fine-tuned
          </p>
        </div>
      </div>

      {/* ====== SECTION 3: KEY CLAUSES — Full width card grid ====== */}
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            fontFamily: "var(--font-body), sans-serif",
            fontWeight: 500,
            fontSize: 11,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            marginBottom: 16,
          }}
        >
          KEY CLAUSES
        </p>

        {result.key_points.length ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            {result.key_points.map((point, index) => (
              <KeyPointCard key={`${point}-${index}`} point={point} index={index} />
            ))}
          </div>
        ) : (
          <p
            style={{
              fontFamily: "var(--font-body), sans-serif",
              fontSize: 14,
              color: "var(--text-tertiary)",
            }}
          >
            No specific clauses extracted.
          </p>
        )}
      </div>

      {/* ====== SECTION 4: WARNINGS — Full width ====== */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 8 }}
      >
        {result.warnings.length > 0 ? (
          <>
            <p
              style={{
                fontFamily: "var(--font-body), sans-serif",
                fontWeight: 500,
                fontSize: 11,
                color: "var(--risk-high)",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: 16,
              }}
            >
              ⚠ WARNINGS
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {result.warnings.map((warning, index) => (
                <WarningCard key={`${warning}-${index}`} warning={warning} index={index} />
              ))}
            </div>
          </>
        ) : (
          <div
            style={{
              background: "var(--risk-low-bg)",
              border: "1px solid rgba(45,181,93,0.2)",
              borderRadius: 12,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <CheckCircle2 size={16} style={{ color: "var(--risk-low)" }} />
            <span
              style={{
                fontFamily: "var(--font-body), sans-serif",
                fontWeight: 400,
                fontSize: 14,
                color: "var(--green-text)",
              }}
            >
              No critical warnings found
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
