"use client";

import { motion, useSpring } from "framer-motion";
import { usePageScroll } from "@/lib/hooks/useScrollProgress";

export default function ScrollProgressBar() {
  const raw = usePageScroll();
  const smooth = useSpring(raw, { stiffness: 200, damping: 30 });

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "4px",
        zIndex: 9999,
        background: "rgba(240,180,41,0.08)"
      }}
      aria-hidden
    >
      <motion.div
        style={{
          height: "100%",
          background:
            "linear-gradient(90deg, var(--gold-mid), var(--gold-bright), var(--teal-bright))",
          scaleX: smooth,
          transformOrigin: "left",
          boxShadow: "0 0 12px var(--gold-bright)",
          willChange: "transform"
        }}
      />
    </div>
  );
}
