"use client";

import { useEffect, useMemo, useState } from "react";
import { File, FileImage, FileText, Link2 } from "lucide-react";
import RiskBadge from "@/components/RiskBadge";
import { AnalyzeResponse } from "@/lib/types";

interface StickyResultBarProps {
  result: AnalyzeResponse;
}

function sourceIcon(sourceType: string) {
  if (sourceType === "pdf") return File;
  if (sourceType === "image") return FileImage;
  if (sourceType === "url") return Link2;
  return FileText;
}

export default function StickyResultBar({ result }: StickyResultBarProps) {
  const [visible, setVisible] = useState(false);
  const Icon = useMemo(() => sourceIcon(result.source_type), [result.source_type]);

  useEffect(() => {
    const onScroll = () => {
      const panel = document.getElementById("result-panel");
      if (!panel) {
        setVisible(false);
        return;
      }

      const rect = panel.getBoundingClientRect();
      const shouldShow = rect.top < 0 && rect.bottom > 120;
      setVisible(shouldShow);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-40 border-b border-[color:var(--border-dark)] bg-[rgba(13,20,16,0.95)] backdrop-blur-xl transition duration-300 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0 pointer-events-none"
      }`}
    >
      <div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between gap-3 px-4 text-xs md:px-8">
        <div className="flex min-w-0 items-center gap-2 text-[color:var(--text-secondary)]">
          <Icon size={14} className="text-[color:var(--text-gold)]" />
          <span className="truncate">{result.file_name || "Pasted text"}</span>
        </div>

        <RiskBadge level={result.risk_level} />

        <div className="hidden items-center gap-3 text-[color:var(--text-secondary)] md:flex">
          <button type="button" onClick={() => document.getElementById("result-key-points")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="hover:text-[color:var(--text-gold)]">Key Points</button>
          <span className="text-[color:var(--text-tertiary)]">|</span>
          <button type="button" onClick={() => document.getElementById("result-warnings")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="hover:text-[color:var(--text-gold)]">Warnings</button>
        </div>
      </div>
    </div>
  );
}
