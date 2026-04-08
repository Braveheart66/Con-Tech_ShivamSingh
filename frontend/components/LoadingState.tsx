"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const messages = [
  "Reading your document...",
  "Extracting legal clauses...",
  "Translating legalese to plain Hindi-English...",
  "Checking for risky terms...",
  "Generating your plain-English summary..."
];

export default function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, 2500);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const phaseTimer = window.setInterval(() => {
      setPhase((current) => (current + 1) % 4);
    }, 1500);

    return () => {
      window.clearInterval(phaseTimer);
    };
  }, []);

  useEffect(() => {
    let rafId = 0;
    let current = 0;

    const tick = () => {
      current = current < 85 ? current + 0.7 : current + 0.1;
      const value = Math.min(current, 96);
      setProgress(value);

      if (value < 96) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  const states = [
    <svg key="legalese" viewBox="0 0 240 120" className="h-24 w-56" fill="none" aria-hidden>
      {[14, 28, 42, 56, 70, 84, 98].map((y, i) => (
        <rect key={y} x="20" y={y} width={170 - i * 10} height="4" rx="2" fill="rgba(138,155,142,0.45)" />
      ))}
    </svg>,
    <svg key="processing" viewBox="0 0 240 120" className="h-24 w-56" fill="none" aria-hidden>
      {[14, 28, 42, 56, 70, 84, 98].map((y, i) => (
        <rect key={y} x="20" y={y} width={170 - i * 10} height="4" rx="2" className="loading-gold-shift" />
      ))}
    </svg>,
    <svg key="structured" viewBox="0 0 240 120" className="h-24 w-56" fill="none" aria-hidden>
      {[16, 50, 84].map((y) => (
        <g key={y}>
          <rect x="20" y={y} width="8" height="8" rx="1" fill="var(--gold-mid)" />
          <rect x="34" y={y + 1} width="130" height="3" rx="1.5" fill="rgba(240,180,41,0.7)" />
          <rect x="34" y={y + 7} width="98" height="3" rx="1.5" fill="rgba(138,155,142,0.55)" />
        </g>
      ))}
    </svg>,
    <svg key="done" viewBox="0 0 240 120" className="h-24 w-56" fill="none" aria-hidden>
      {[16, 50, 84].map((y) => (
        <g key={y}>
          <circle cx="24" cy={y + 4} r="5" fill="rgba(240,180,41,0.2)" stroke="var(--gold-bright)" />
          <path d={`M22 ${y + 4}l2 2 4-4`} stroke="var(--gold-bright)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="34" y={y + 1} width="130" height="3" rx="1.5" fill="rgba(240,180,41,0.75)" />
          <rect x="34" y={y + 7} width="98" height="3" rx="1.5" fill="rgba(138,155,142,0.5)" />
        </g>
      ))}
    </svg>
  ];

  return (
    <section className="card-noir relative flex min-h-[400px] w-full flex-col items-center justify-center gap-8 overflow-hidden p-6 text-center">
      <div className="absolute inset-0 bg-[rgba(8,11,9,0.5)] backdrop-blur-[2px]" />

      <div className="relative z-[1] w-full max-w-2xl space-y-4 opacity-60">
        <div className="h-20 rounded-xl bg-[color:var(--bg-surface)] p-4">
          <div className="h-full w-full rounded-lg shimmer" />
        </div>
        <div className="h-28 rounded-xl bg-[color:var(--bg-surface)] p-4">
          <div className="h-full w-full rounded-lg shimmer" />
        </div>
        <div className="h-16 rounded-xl bg-[color:var(--bg-surface)] p-4">
          <div className="h-full w-full rounded-lg shimmer" />
        </div>
      </div>

      <div className="relative z-[2] space-y-4">
        <div className="mx-auto grid h-28 w-64 place-items-center rounded-xl border border-[color:var(--border-mid)] bg-[rgba(20,29,23,0.85)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`phase-${phase}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
            >
              {states[phase]}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={messages[messageIndex]}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="legal text-lg italic text-[color:var(--text-secondary)]"
          >
            {messages[messageIndex]}
          </motion.p>
        </AnimatePresence>

        <div className="mx-auto h-1 w-64 overflow-hidden rounded-full bg-[color:var(--bg-raised)]">
          <motion.div
            className="h-full bg-[linear-gradient(90deg,var(--gold-mid),var(--gold-bright))]"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </div>
    </section>
  );
}
