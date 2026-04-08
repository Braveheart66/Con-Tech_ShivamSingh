"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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
    return { label: "PDF", icon: File };
  }

  if (sourceType === "image") {
    return { label: "Image", icon: FileImage };
  }

  if (sourceType === "url") {
    return { label: "URL", icon: Link2 };
  }

  return { label: "Text", icon: FileText };
}

export default function ResultPanel({ result }: ResultPanelProps) {
  const [typedExtractedText, setTypedExtractedText] = useState("");
  const extractedRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: extractedRef, offset: ["start end", "end start"] });
  const extractedY = useTransform(scrollYProgress, [0, 1], [0, -30]);

  useEffect(() => {
    const source = result.extracted_text ?? "";
    let index = 0;

    setTypedExtractedText("");

    if (!source.length) {
      return;
    }

    const timer = window.setInterval(() => {
      index += 1;
      setTypedExtractedText(source.slice(0, index));

      if (index >= source.length) {
        window.clearInterval(timer);
      }
    }, 8);

    return () => {
      window.clearInterval(timer);
    };
  }, [result.extracted_text]);

  const source = useMemo(() => sourceMeta(result.source_type), [result.source_type]);
  const SourceIcon = source.icon;

  return (
    <motion.section
      id="result-panel"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="card-noir grid gap-5 p-5 lg:grid-cols-[1fr_1.2fr] lg:p-8"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[color:var(--border-dark)] bg-[color:var(--bg-surface)] p-4">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[color:var(--text-secondary)]">Source</p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--border-mid)] bg-[rgba(240,180,41,0.08)] px-3 py-1 text-xs text-[color:var(--text-gold)]">
            <SourceIcon size={14} />
            {source.label}
          </div>
          {result.file_name ? (
            <p className="mono mt-2 truncate text-xs text-[color:var(--text-secondary)]">{result.file_name}</p>
          ) : null}
        </div>

        <motion.article
          ref={extractedRef}
          style={{ y: extractedY, willChange: "transform" }}
          className="relative rounded-xl border border-[color:var(--border-dark)] bg-[color:var(--bg-void)] p-4"
        >
          <span className="absolute right-3 top-3 rounded-full border border-[rgba(95,217,138,0.25)] bg-[rgba(95,217,138,0.08)] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[color:var(--green-text)]">
            Extracted
          </span>
          <p className="mb-3 text-[11px] uppercase tracking-[0.08em] text-[color:var(--text-secondary)]">Original Legal Text</p>
          <div className="mono max-h-[300px] overflow-y-auto rounded-lg border border-[color:var(--border-dark)] bg-[rgba(0,0,0,0.25)] p-3 text-[12px] leading-7 text-[color:var(--text-secondary)]">
            {typedExtractedText || "No extracted text returned."}
          </div>
        </motion.article>
      </div>

      <div className="space-y-4">
        <article className="relative overflow-hidden rounded-xl border border-[color:var(--border-dark)] bg-[color:var(--bg-surface)] p-5">
          <span className="pointer-events-none absolute -left-6 -top-8 font-display text-[200px] leading-none text-white/5">
            "
          </span>
          <div className="relative z-[1]">
            <p className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.08em] text-[color:var(--text-gold)]">
              <Sparkles size={12} /> Plain English
            </p>
            <motion.p
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-3 font-display text-[20px] leading-9 text-[color:var(--text-primary)]"
            >
              {result.plain_english || "No plain-English explanation available."}
            </motion.p>
          </div>
        </article>

        <article className="rounded-xl border border-[color:var(--border-dark)] bg-[color:var(--bg-surface)] p-4">
          <RiskMeter level={result.risk_level} />
        </article>

        <article id="result-key-points" className="rounded-xl border border-[color:var(--border-dark)] bg-[color:var(--bg-surface)] p-4">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[color:var(--text-secondary)]">Key Clauses</p>
          <div className="mt-3 space-y-2">
            {result.key_points.length ? (
              result.key_points.map((point, index) => <KeyPointCard key={`${point}-${index}`} point={point} index={index} />)
            ) : (
              <p className="text-sm text-[color:var(--text-secondary)]">No key points detected.</p>
            )}
          </div>
        </article>

        <article id="result-warnings" className="rounded-xl border border-[color:var(--border-dark)] bg-[color:var(--bg-surface)] p-4">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[color:var(--risk-high)]">Warnings</p>
          {result.warnings.length ? (
            <div className="mt-3 space-y-2">
              {result.warnings.map((warning, index) => (
                <WarningCard key={`${warning}-${index}`} warning={warning} index={index} />
              ))}
            </div>
          ) : (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-[color:var(--green-text)]">
              <CheckCircle2 size={16} /> No critical warnings found
            </p>
          )}
        </article>
      </div>
    </motion.section>
  );
}
