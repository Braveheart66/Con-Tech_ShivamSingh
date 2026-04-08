"use client";

import { motion } from "framer-motion";

interface WarningCardProps {
  warning: string;
  index: number;
}

function suggestionForWarning(warning: string): string {
  const text = warning.toLowerCase();

  if (text.includes("deposit")) {
    return "Ask for a clear, written refund timeline and deduction conditions.";
  }

  if (text.includes("notice") || text.includes("termination")) {
    return "Negotiate balanced notice terms so both parties have equal exit rights.";
  }

  if (text.includes("penalty") || text.includes("late")) {
    return "Request a capped penalty clause before signing this agreement.";
  }

  return "Ask your landlord to clarify or remove this clause before signing.";
}

export default function WarningCard({ warning, index }: WarningCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, delay: index * 0.06 }}
      className="rounded-lg border border-[color:var(--risk-high)] bg-[color:var(--risk-high-bg)] p-3"
    >
      <div className="border-l-[3px] border-[color:var(--risk-high)] pl-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--risk-high)]">Warning</p>
        <p className="mt-1 text-sm leading-6 text-[color:var(--text-primary)]">{warning}</p>
        <p className="mt-2 text-xs italic text-[color:var(--text-secondary)]">{suggestionForWarning(warning)}</p>
      </div>
    </motion.article>
  );
}
