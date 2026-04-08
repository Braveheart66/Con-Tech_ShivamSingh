"use client";

import { motion } from "framer-motion";
import { useActiveSectionIndex } from "@/lib/hooks/useScrollProgress";

interface SectionNavigatorProps {
  sections: string[];
}

function toLabel(id: string) {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function SectionNavigator({ sections }: SectionNavigatorProps) {
  const active = useActiveSectionIndex(sections);

  return (
    <nav className="pointer-events-none fixed right-6 top-1/2 z-[70] hidden -translate-y-1/2 lg:block" aria-label="Section navigation">
      <div className="pointer-events-auto flex flex-col items-center gap-5">
        {sections.map((sectionId, index) => {
          const isActive = index === active;

          return (
            <button
              key={sectionId}
              type="button"
              onClick={() => {
                document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="group relative h-8 w-8"
              aria-label={`Go to ${toLabel(sectionId)}`}
            >
              <motion.span
                className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                animate={{
                  scale: isActive ? 1.3 : 1,
                  backgroundColor: isActive ? "var(--gold-bright)" : "transparent",
                  borderColor: isActive ? "var(--gold-bright)" : "var(--border-mid)",
                  boxShadow: isActive ? "var(--glow-gold)" : "none"
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />

              <span className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-[color:var(--border-mid)] bg-[color:var(--bg-surface)] px-3 py-1 text-[11px] text-[color:var(--text-secondary)] opacity-0 transition-all duration-300 group-hover:right-10 group-hover:opacity-100">
                {toLabel(sectionId)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
