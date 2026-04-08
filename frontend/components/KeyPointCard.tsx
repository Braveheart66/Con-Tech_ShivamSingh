"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  GitFork,
  IndianRupee,
  Lock,
  Scale,
  Wrench
} from "lucide-react";

interface KeyPointCardProps {
  point: string;
  index: number;
}

function pickIcon(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("₹") || lower.includes("rent") || lower.includes("payment")) {
    return IndianRupee;
  }

  if (lower.includes("notice") || lower.includes("termination") || lower.includes("days")) {
    return CalendarDays;
  }

  if (lower.includes("deposit") || lower.includes("security")) {
    return Lock;
  }

  if (lower.includes("maintenance") || lower.includes("repair")) {
    return Wrench;
  }

  if (lower.includes("sublet") || lower.includes("subletting")) {
    return GitFork;
  }

  return Scale;
}

export default function KeyPointCard({ point, index }: KeyPointCardProps) {
  const Icon = useMemo(() => pickIcon(point), [point]);
  const [expanded, setExpanded] = useState(false);
  const isLong = point.length > 170;
  const collapsedText = isLong ? `${point.slice(0, 170)}...` : point;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.28 }}
      className="rounded-lg border border-[color:var(--border-dark)] bg-[color:var(--bg-surface)] p-3"
      whileHover={{ x: 2 }}
    >
      <div className="flex gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--gold-glow)] text-[color:var(--text-gold)]">
          <Icon size={16} />
        </span>

        <div className="min-w-0 flex-1 border-l-2 border-[color:var(--gold-dim)] pl-3">
          <p className="text-sm leading-6 text-[color:var(--text-primary)]">{expanded ? point : collapsedText}</p>

          {isLong ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="mt-1 text-xs text-[color:var(--text-gold)]"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
