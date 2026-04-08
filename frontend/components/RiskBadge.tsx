"use client";

import { motion } from "framer-motion";

interface RiskBadgeProps {
  level: string;
}

function normalize(level: string): "low" | "medium" | "high" {
  const normalized = level.toLowerCase();

  if (normalized === "high") {
    return "high";
  }

  if (normalized === "medium") {
    return "medium";
  }

  return "low";
}

export default function RiskBadge({ level }: RiskBadgeProps) {
  const normalized = normalize(level);

  const config =
    normalized === "high"
      ? {
          text: "High Risk - Act Now",
          className: "border-[color:var(--risk-high)] bg-[color:var(--risk-high-bg)] text-[color:var(--risk-high)]",
          dotClass: "bg-[color:var(--risk-high)] animate-pulse-dot"
        }
      : normalized === "medium"
        ? {
            text: "Review Carefully",
            className: "border-[color:var(--risk-mid)] bg-[color:var(--risk-mid-bg)] text-[color:var(--risk-mid)]",
            dotClass: "bg-[color:var(--risk-mid)]"
          }
        : {
            text: "Low Risk",
            className: "border-[color:var(--risk-low)] bg-[color:var(--risk-low-bg)] text-[color:var(--risk-low)]",
            dotClass: "bg-[color:var(--risk-low)]"
          };

  return (
    <motion.span
      initial={{ x: 0 }}
      animate={normalized === "high" ? { x: [0, -4, 4, -4, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      {config.text}
    </motion.span>
  );
}
