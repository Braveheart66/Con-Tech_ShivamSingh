"use client";

import { Brain, FileText, ShieldCheck } from "lucide-react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

const steps = [
  {
    number: "01",
    icon: FileText,
    accentColor: "var(--gold-bright)",
    accentLine: "var(--gold-mid)",
    title: "Share Your Clause",
    body: "Paste text, upload a PDF, photograph your stamp paper, or drop a URL. UnLegalize handles any format - even handwritten agreements.",
    tags: ["Plain Text", "PDF Upload", "Image / OCR", "URL Scraping"]
  },
  {
    number: "02",
    icon: Brain,
    accentColor: "var(--teal-bright)",
    accentLine: "var(--teal-mid)",
    title: "AI Decodes the Legalese",
    body: "Gemma 3 270M, fine-tuned using LoRA on India-specific rental and leave-and-license agreements, extracts each clause, scores risk 0-100, and translates dense legalese into plain, actionable English.",
    tags: ["Gemma 3 270M", "LoRA Fine-tuned", "India Law Data", "Risk Scoring"]
  },
  {
    number: "03",
    icon: ShieldCheck,
    accentColor: "var(--risk-low)",
    accentLine: "var(--green-mid)",
    title: "Understand. Negotiate. Sign.",
    body: "Know exactly what you're agreeing to. Spot risky clauses. Ask the right questions. Never sign blind again.",
    tags: ["Plain English", "Risk Warnings", "Key Clauses", "Instant Results"]
  }
] as const;

export default function HowItWorks() {
  const isMobile = useMediaQuery("(max-width: 1024px)");

  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 20,
    restDelta: 0.001
  });

  const card1Y = useTransform(smoothProgress, [0, 0.25, 0.4], ["0%", "0%", "-110%"]);
  const card1O = useTransform(smoothProgress, [0, 0.05, 0.25, 0.4], [0, 1, 1, 0]);

  const card2Y = useTransform(smoothProgress, [0.28, 0.4, 0.58, 0.72], ["110%", "0%", "0%", "-110%"]);
  const card2O = useTransform(smoothProgress, [0.28, 0.4, 0.58, 0.72], [0, 1, 1, 0]);

  const card3Y = useTransform(smoothProgress, [0.6, 0.72, 1], ["110%", "0%", "0%"]);
  const card3O = useTransform(smoothProgress, [0.6, 0.72], [0, 1]);

  const dot1 = useTransform(smoothProgress, [0, 0.33], [1, 1]);
  const dot2 = useTransform(smoothProgress, [0.28, 0.45], [0, 1]);
  const dot3 = useTransform(smoothProgress, [0.6, 0.75], [0, 1]);

  const lineScaleY = useTransform(smoothProgress, [0, 1], [0, 1]);
  const nudgeOpacity = useTransform(smoothProgress, [0, 0.1, 0.85, 1], [1, 1, 1, 0]);

  if (isMobile) {
    return <MobileHowItWorks />;
  }

  return (
    <section id="how-it-works" ref={sectionRef} className="relative h-[400vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(15,74,74,0.18),rgba(8,11,9,0)_30%,rgba(8,11,9,0)_70%,rgba(201,150,12,0.1))]" />

        <div className="pointer-events-none absolute inset-x-0 top-[10%] z-10 text-center">
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[color:var(--text-tertiary)]">The Process</p>
          <h2 className="font-display text-[clamp(36px,5vw,56px)] font-bold text-[color:var(--text-primary)]">How UnLegalize Works</h2>
        </div>

        <div className="pointer-events-none absolute left-[8%] top-1/2 z-10 hidden h-[200px] -translate-y-1/2 lg:flex">
          <div className="relative h-full w-[2px] rounded-[1px] bg-[color:var(--border-dark)]">
            <motion.div
              style={{
                scaleY: lineScaleY,
                transformOrigin: "top",
                willChange: "transform"
              }}
              className="absolute left-0 top-0 h-full w-full rounded-[1px] bg-[linear-gradient(to_bottom,var(--gold-bright),var(--teal-bright))]"
            />

            {[dot1, dot2, dot3].map((opacityValue, index) => (
              <motion.div
                key={`dot-${steps[index].number}`}
                style={{ opacity: opacityValue, top: `${index * 50}%` }}
                className="absolute left-1/2 h-[10px] w-[10px] -translate-x-1/2 rounded-full border-2 border-[color:var(--bg-void)] bg-[color:var(--gold-bright)] shadow-[0_0_12px_var(--gold-bright)]"
              />
            ))}
          </div>

          {steps.map((step, index) => (
            <div
              key={`label-${step.number}`}
              className="absolute left-5 -translate-y-1/2 font-mono text-[11px] text-[color:var(--text-tertiary)]"
              style={{ top: `${index * 50}%` }}
            >
              {step.number}
            </div>
          ))}
        </div>

        <div className="relative z-[2] mx-auto h-[420px] w-full max-w-[680px] px-6">
          <motion.div style={{ y: card1Y, opacity: card1O }} className="absolute inset-0">
            <StepCard step={steps[0]} />
          </motion.div>

          <motion.div style={{ y: card2Y, opacity: card2O }} className="absolute inset-0">
            <StepCard step={steps[1]} />
          </motion.div>

          <motion.div style={{ y: card3Y, opacity: card3O }} className="absolute inset-0">
            <StepCard step={steps[2]} />
          </motion.div>
        </div>

        <motion.div style={{ opacity: nudgeOpacity }} className="pointer-events-none absolute bottom-[5%] left-1/2 z-10 -translate-x-1/2">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.15em] text-[color:var(--text-tertiary)]">Keep scrolling</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-8 w-px bg-[color:var(--border-mid)]"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function StepCard({ step }: { step: (typeof steps)[number] }) {
  const Icon = step.icon;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px] border border-[color:var(--border-dark)] bg-[image:var(--gradient-card)] p-12 shadow-[var(--glow-card)]">
      <div className="pointer-events-none absolute right-8 top-[-20px] select-none font-display text-[160px] font-bold leading-none text-[color:var(--text-primary)] opacity-[0.03]">
        {step.number}
      </div>

      <div className="flex h-full flex-col justify-center gap-6">
        <div
          className="grid h-16 w-16 place-items-center rounded-2xl border bg-[color:var(--bg-raised)]"
          style={{ borderColor: `${step.accentColor}40` }}
        >
          <Icon size={28} color={step.accentColor} />
        </div>

        <div
          className="h-[2px] w-10 rounded-[1px]"
          style={{ background: step.accentLine, boxShadow: `0 0 8px ${step.accentColor}` }}
        />

        <h3 className="font-display text-[clamp(28px,4vw,40px)] font-bold leading-[1.2] text-[color:var(--text-primary)]">
          {step.title}
        </h3>

        <p className="max-w-[480px] text-base font-light leading-[1.7] text-[color:var(--text-secondary)]">
          {step.body}
        </p>

        <div className="flex flex-wrap gap-2">
          {step.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-[20px] border px-3 py-1 text-[11px]"
              style={{
                color: step.accentColor,
                borderColor: `${step.accentColor}40`,
                background: `${step.accentColor}08`
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileHowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-20">
      <div className="mb-16 text-center">
        <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[color:var(--text-tertiary)]">The Process</p>
        <h2 className="font-display text-4xl font-bold text-[color:var(--text-primary)]">How UnLegalize Works</h2>
      </div>

      <div className="mx-auto flex max-w-[600px] flex-col gap-6">
        {steps.map((step, index) => (
          <ScrollReveal key={step.number} delay={index * 0.15}>
            <StepCard step={step} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
