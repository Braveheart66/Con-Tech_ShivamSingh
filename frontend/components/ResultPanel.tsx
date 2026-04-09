"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CheckCircle2, File, FileImage, FileText, Link2, Sparkles, ThumbsDown, ThumbsUp, ArrowRight } from "lucide-react";
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

  if (sourceType === "url" || sourceType === "web_url") {
    return { label: "URL", icon: Link2 };
  }

  return { label: "Text", icon: FileText };
}

export default function ResultPanel({ result }: ResultPanelProps) {
  const [typedExtractedText, setTypedExtractedText] = useState("");
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
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
  const wordCount = useMemo(() => {
    return result.plain_english.trim() ? result.plain_english.trim().split(/\s+/).length : 0;
  }, [result.plain_english]);
  const SourceIcon = source.icon;

  const reasonClass = result.risk_level.toLowerCase().includes("high")
    ? "text-[color:var(--risk-high)]"
    : result.risk_level.toLowerCase().includes("medium")
      ? "text-[color:var(--risk-mid)]"
      : "text-[color:var(--risk-low)]";

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
        <article className="grid items-stretch gap-3 rounded-xl border border-[color:var(--border-dark)] bg-[color:var(--bg-surface)] p-4 md:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-lg border border-[color:var(--border-dark)] bg-[rgba(255,255,255,0.04)] p-3">
            <p className="mb-2 text-[11px] uppercase tracking-[0.08em] text-[color:var(--text-secondary)]">Before</p>
            <p className="mono text-xs leading-6 text-[color:var(--text-secondary)]">{result.extracted_text}</p>
          </div>

          <div className="grid place-items-center">
            <ArrowRight className="h-5 w-5 text-[color:var(--text-gold)]" />
          </div>

          <div className="rounded-lg border border-[color:var(--border-mid)] bg-white p-3">
            <p className="mb-2 text-[11px] uppercase tracking-[0.08em] text-[color:var(--bg-void)]">After</p>
            <p className="text-lg font-semibold leading-7 text-[color:var(--bg-void)]">{result.plain_english}</p>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-xl border border-[color:var(--gold-mid)] bg-gradient-to-br from-[rgba(240,180,41,0.08)] to-[rgba(20,29,23,0.95)] p-6 shadow-[0_0_30px_rgba(240,180,41,0.15)] backdrop-blur-md">
          <span className="pointer-events-none absolute -left-6 -top-8 font-display text-[200px] leading-none text-white/5">
            "
          </span>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[color:var(--gold-bright)] to-transparent opacity-70"></div>
          
          <div className="relative z-[1]">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(240,180,41,0.1)] px-3 py-1 text-[11px] uppercase tracking-[0.1em] text-[color:var(--gold-bright)] font-semibold shadow-inner">
              <Sparkles size={12} className="animate-pulse" /> AI Translated to Plain English
            </p>
            <motion.p
              initial={{ opacity: 0, filter: "blur(8px)", y: 10 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="mt-5 border-l-4 border-[color:var(--gold-bright)] pl-5 text-2xl md:text-3xl font-display leading-[1.4] tracking-tight text-white drop-shadow-md"
            >
              {result.plain_english || "No plain-English explanation available."}
            </motion.p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[color:var(--border-mid)] bg-[rgba(95,217,138,0.12)] px-3 py-1 text-xs text-[color:var(--green-text)]">
                {wordCount} words
              </span>

              <button
                type="button"
                onClick={() => setFeedback("up")}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${feedback === "up" ? "border-[color:var(--risk-low)] text-[color:var(--risk-low)]" : "border-[color:var(--border-mid)] text-[color:var(--text-secondary)]"}`}
              >
                <ThumbsUp size={14} />
                Helpful
              </button>

              <button
                type="button"
                onClick={() => setFeedback("down")}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${feedback === "down" ? "border-[color:var(--risk-high)] text-[color:var(--risk-high)]" : "border-[color:var(--border-mid)] text-[color:var(--text-secondary)]"}`}
              >
                <ThumbsDown size={14} />
                Not helpful
              </button>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-[color:var(--border-dark)] bg-[color:var(--bg-surface)] p-4">
          <RiskMeter level={result.risk_level} score={result.risk_score} />
          <div className="mt-3 text-center">
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${reasonClass} border-current bg-[rgba(255,255,255,0.04)]`}>
              {result.risk_level}
            </span>
          </div>

          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
            {result.reasons.length ? result.reasons.map((reason, index) => (
              <li key={`${reason}-${index}`} className={reasonClass}>{reason}</li>
            )) : <li className="text-[color:var(--text-secondary)]">No specific risk triggers detected.</li>}
          </ul>
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
