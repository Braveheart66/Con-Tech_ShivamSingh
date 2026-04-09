"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValueEvent, useSpring, useTransform } from "framer-motion";
import RiskBadge from "@/components/RiskBadge";

interface RiskMeterProps {
  level: string;
  score?: number;
}

function levelToScore(level: string): number {
  const normalized = level.toLowerCase();

  if (normalized === "high" || normalized.includes("high")) {
    return 90;
  }

  if (normalized === "medium" || normalized.includes("medium")) {
    return 65;
  }

  return 25;
}

function levelToColor(level: string): string {
  const normalized = level.toLowerCase();

  if (normalized === "high" || normalized.includes("high")) {
    return "var(--risk-high)";
  }

  if (normalized === "medium" || normalized.includes("medium")) {
    return "var(--risk-mid)";
  }

  return "var(--risk-low)";
}

export default function RiskMeter({ level, score }: RiskMeterProps) {
  const resolvedScore = typeof score === "number" ? Math.max(0, Math.min(100, score)) : levelToScore(level);
  const color = useMemo(() => levelToColor(level), [level]);

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;

  const spring = useSpring(0, {
    stiffness: 130,
    damping: 20,
    mass: 0.9
  });

  const [displayScore, setDisplayScore] = useState(0);
  const dashOffset = useTransform(spring, (value) => arcLength * (1 - value / 100));

  useMotionValueEvent(spring, "change", (value) => {
    setDisplayScore(Math.round(value));
  });

  useEffect(() => {
    spring.set(resolvedScore);
  }, [resolvedScore, spring]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-40 w-40">
        <svg viewBox="0 0 160 160" className="h-full w-full" aria-hidden>
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            transform="rotate(135 80 80)"
          />
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            style={{ strokeDashoffset: dashOffset, filter: `drop-shadow(0 0 10px ${color})` }}
            transform="rotate(135 80 80)"
          />
        </svg>

        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-4xl font-bold text-[color:var(--text-primary)]">{displayScore}</p>
            <p className="text-[11px] font-light uppercase tracking-[0.08em] text-[color:var(--text-secondary)]">
              Risk Score
            </p>
          </div>
        </div>
      </div>

      <RiskBadge level={level} />
    </div>
  );
}
