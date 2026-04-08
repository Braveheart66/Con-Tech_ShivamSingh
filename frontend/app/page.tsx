"use client";

import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform
} from "framer-motion";
import { AlertTriangle, ChevronDown } from "lucide-react";
import Footer from "@/components/Footer";
import FileUploadForm from "@/components/FileUploadForm";
import Header from "@/components/Header";
import HowItWorks from "@/components/HowItWorks";
import InputTabs from "@/components/InputTabs";
import LoadingState from "@/components/LoadingState";
import MagneticCursor from "@/components/MagneticCursor";
import ResultPanel from "@/components/ResultPanel";
import RiskExplainer from "@/components/RiskExplainer";
import ScrollProgressBar from "@/components/ScrollProgressBar";
import ScrollReveal from "@/components/ScrollReveal";
import SectionNavigator from "@/components/SectionNavigator";
import StickyResultBar from "@/components/StickyResultBar";
import TextInputForm from "@/components/TextInputForm";
import TrustSection from "@/components/TrustSection";
import UrlScrapeForm from "@/components/UrlScrapeForm";
import LegalOrb from "@/components/three/LegalOrb";
import ParticleField from "@/components/three/ParticleField";
import { useAnalyze } from "@/lib/hooks/useAnalyze";

function HeroCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const start = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress) * (1 - progress);
      setCurrent(Math.round(value * eased));

      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [value]);

  return (
    <div className="text-center">
      <p className="font-display text-4xl font-bold text-[color:var(--text-gold)] md:text-5xl">{current}{suffix}</p>
      <p className="mt-1 text-xs font-light text-[color:var(--text-secondary)]">{label}</p>
    </div>
  );
}

export default function HomePage() {
  const {
    activeTab,
    setMode,
    isLoading,
    error,
    setErrorMessage,
    clearError,
    result,
    selectedFile,
    setSelectedFile,
    urlInput,
    setUrlInput,
    textInput,
    setTextInput,
    resetAll,
    submitText,
    submitFile,
    submitUrl,
    inputPulseKey
  } = useAnalyze();

  const inputSectionRef = useRef<HTMLElement | null>(null);
  const workbenchRef = useRef<HTMLElement | null>(null);
  const [showWorkbenchLabel, setShowWorkbenchLabel] = useState(false);
  const [workbenchPulse, setWorkbenchPulse] = useState(false);
  const tiltTargetRef = useRef({ rotateX: 0, rotateY: 0, x: 50, y: 50 });
  const tiltRafRef = useRef<number | null>(null);

  const rotateX = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 });
  const highlightX = useSpring(useMotionValue(50), { stiffness: 220, damping: 30 });
  const highlightY = useSpring(useMotionValue(50), { stiffness: 220, damping: 30 });
  const highlightGradient = useMotionTemplate`radial-gradient(circle at ${highlightX}% ${highlightY}%, rgba(255,255,255,0.05) 0%, transparent 60%)`;

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const orbScale = useTransform(scrollY, [0, 600], [1, 0.7]);
  const orbOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  const modeHint = useMemo(() => {
    return "Paste text, upload a PDF or image, or scrape a URL - get plain English, risk scores, and warnings instantly.";
  }, [activeTab]);

  const scrollToInput = () => {
    inputSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const section = workbenchRef.current;
    if (!section) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShowWorkbenchLabel(true);
            setWorkbenchPulse((current) => current || true);
          } else {
            setShowWorkbenchLabel(false);
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
    };
  }, []);

  const handleWorkbenchMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const nextRotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -8;
    const nextRotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 8;

    tiltTargetRef.current = { rotateX: nextRotateX, rotateY: nextRotateY, x, y };

    if (tiltRafRef.current !== null) {
      return;
    }

    tiltRafRef.current = window.requestAnimationFrame(() => {
      tiltRafRef.current = null;
      rotateX.set(tiltTargetRef.current.rotateX);
      rotateY.set(tiltTargetRef.current.rotateY);
      highlightX.set(tiltTargetRef.current.x);
      highlightY.set(tiltTargetRef.current.y);
    });
  };

  useEffect(() => {
    return () => {
      if (tiltRafRef.current !== null) {
        window.cancelAnimationFrame(tiltRafRef.current);
      }
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[color:var(--bg-void)]">
      <ScrollProgressBar />
      <MagneticCursor />
      <SectionNavigator sections={["hero", "how-it-works", "trust", "risk-explainer", "workbench", "footer"]} />
      <ParticleField />

      <div className="relative z-10">
        <Header />

        <AnimatePresence>
          {showWorkbenchLabel ? (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-none fixed left-6 top-1/2 z-[65] hidden -translate-y-1/2 items-center gap-3 lg:flex"
            >
              <span className="h-5 w-px bg-[color:var(--gold-mid)]" />
              <span className="text-[11px] uppercase tracking-[0.15em] text-[color:var(--text-tertiary)]">Analysis Workbench</span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <section id="hero" className="relative isolate min-h-[60vh] overflow-hidden border-b border-[color:var(--border-dark)] md:min-h-[70vh]">
          <div className="pointer-events-none absolute inset-0 z-[1]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(45,181,93,0.24)_0%,rgba(8,11,9,0)_52%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_58%,rgba(240,180,41,0.18)_0%,rgba(8,11,9,0)_62%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(240,180,41,0.06),rgba(8,11,9,0.05),rgba(45,181,93,0.06))] [background-size:200%_200%] animate-hero-fallback-shift" />
            <div className="absolute left-1/2 top-[56%] h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(240,180,41,0.22)] opacity-80" />
            <div className="absolute left-1/2 top-[56%] h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(240,180,41,0.18)] opacity-75" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,11,9,0)_0%,rgba(8,11,9,0.25)_40%,rgba(8,11,9,0.8)_100%)]" />
          </div>

          <motion.div style={{ scale: orbScale, opacity: orbOpacity }} className="absolute inset-0 z-0 will-change-transform">
            <LegalOrb />
          </motion.div>
          <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_center,transparent_32%,rgba(8,11,9,0.92)_100%)]" />

          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-[3] mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center px-4 py-16 text-center md:min-h-[70vh] md:px-8">
            <p className="text-lg font-light tracking-[0.08em] text-[color:var(--text-secondary)]">Decode your</p>
            <h1 className="mt-1 font-display text-5xl font-bold leading-none md:text-7xl">
              {"Rental Agreement".split(" ").map((word, index) => (
                <motion.span
                  key={word}
                  className="text-gradient-gold inline-block pr-3"
                  initial={{ opacity: 0, filter: "blur(12px)", y: 20 }}
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>
            <h2 className="font-display text-4xl italic text-[color:var(--text-primary)] md:text-6xl">with confidence.</h2>

            <p className="mt-6 max-w-[520px] text-base font-light leading-7 text-[color:var(--text-secondary)]">
              Paste any Indian rental clause. Get plain English, risk scores, and warnings - instantly.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2 text-[11px] text-[color:var(--text-secondary)]">
              {[
                "⚖ Indian Tenancy Law",
                "📄 PDF · Image OCR · URL Scraping",
                "🔒 Runs Locally - No Data Leaves",
                "🤖 Gemma 3 270M Fine-tuned"
              ].map((item, index) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span>{item}</span>
                  {index < 3 ? <span className="text-[color:var(--text-tertiary)]">.</span> : null}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
              <HeroCounter value={4} suffix=" modes" label="Input Sources" />
              <span className="hidden h-12 w-px bg-[color:var(--border-dark)] md:block" />
              <HeroCounter value={270} suffix="M" label="Parameter Model" />
              <span className="hidden h-12 w-px bg-[color:var(--border-dark)] md:block" />
              <HeroCounter value={6} suffix=" types" label="Clause Categories" />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={scrollToInput}
                className="group relative overflow-hidden rounded-[10px] bg-[linear-gradient(135deg,var(--gold-mid),var(--gold-bright))] px-8 py-3 text-sm font-medium text-[color:var(--bg-void)] transition hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_8px_24px_rgba(240,180,41,0.3)] active:translate-y-0 active:scale-[0.99]"
              >
                <span className="pointer-events-none absolute inset-y-0 left-[-130%] w-1/2 -skew-x-12 bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.55),rgba(255,255,255,0))] transition duration-500 group-hover:left-[140%]" />
                <span className="relative">Start Analysis</span>
              </button>

              <button
                type="button"
                onClick={scrollToInput}
                className="rounded-[10px] border border-[color:var(--border-mid)] bg-[rgba(20,29,23,0.8)] px-8 py-3 text-sm font-medium text-[color:var(--text-primary)] transition hover:border-[color:var(--gold-bright)] hover:text-[color:var(--text-gold)]"
              >
                Explore Input Modes
              </button>
            </div>

            <ChevronDown className="mt-10 h-5 w-5 animate-chevron text-[color:var(--text-secondary)]" />
          </motion.div>
        </section>

        <HowItWorks />

        <section id="trust">
          <TrustSection />
        </section>

        <section id="risk-explainer">
          <RiskExplainer />
        </section>

        <section id="workbench" ref={(node) => {
          inputSectionRef.current = node;
          workbenchRef.current = node;
        }} className="relative z-10 mx-auto w-full max-w-[820px] px-4 py-10 md:px-0">
          <motion.div
            className={`card-noir relative p-6 md:p-8 ${workbenchPulse ? "workbench-pulse-once" : ""}`}
            onMouseMove={handleWorkbenchMove}
            onMouseLeave={() => {
              rotateX.set(0);
              rotateY.set(0);
              highlightX.set(50);
              highlightY.set(50);
            }}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d", willChange: "transform" }}
          >
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-[20px]"
              style={{ background: highlightGradient }}
            />

            <AnimatePresence mode="wait">
              <motion.span
                key={`input-pulse-${inputPulseKey}`}
                className="pointer-events-none absolute inset-0 rounded-[20px] border border-[color:var(--gold-bright)]"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: [0, 0.6, 0], scale: [0.99, 1.005, 1.01] }}
                transition={{ duration: 0.6 }}
              />
            </AnimatePresence>

            <div className="mb-5 text-center">
              <h3 className="font-display text-3xl font-semibold text-[color:var(--text-primary)]">
                Analysis Workbench
              </h3>
              <div className="mx-auto mt-3 h-px w-10 bg-[color:var(--gold-mid)] shadow-[0_0_8px_var(--gold-bright)]" />
              <p className="mt-3 text-sm text-[color:var(--text-secondary)]">{modeHint}</p>
            </div>

            <InputTabs activeTab={activeTab} onChange={setMode} disabled={isLoading} />

            {error ? (
              <div className="mt-4 rounded-xl border border-[color:var(--risk-high)] bg-[color:var(--risk-high-bg)] p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={20} className="mt-0.5 text-[color:var(--risk-high)]" />
                  <div>
                    <p className="text-sm font-medium text-[color:var(--risk-high)]">Analysis failed</p>
                    <p className="text-sm text-[color:var(--text-primary)]">{error.message}</p>
                    <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
                      Check that the FastAPI backend is running: uvicorn app.main:app --reload (default: localhost:8000)
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6">
              <AnimatePresence mode="wait">
                {activeTab === "text" ? (
                  <motion.div
                    key="text-form"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TextInputForm
                      value={textInput}
                      isLoading={isLoading}
                      onChange={setTextInput}
                      onSubmit={submitText}
                      onError={setErrorMessage}
                      onClearError={clearError}
                    />
                  </motion.div>
                ) : null}

                {activeTab === "pdf" ? (
                  <motion.div
                    key="pdf-form"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FileUploadForm
                      mode="pdf"
                      selectedFile={selectedFile}
                      isLoading={isLoading}
                      onFileChange={setSelectedFile}
                      onSubmit={(file) => submitFile(file, "pdf")}
                      onError={setErrorMessage}
                      onClearError={clearError}
                    />
                  </motion.div>
                ) : null}

                {activeTab === "image" ? (
                  <motion.div
                    key="image-form"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FileUploadForm
                      mode="image"
                      selectedFile={selectedFile}
                      isLoading={isLoading}
                      onFileChange={setSelectedFile}
                      onSubmit={(file) => submitFile(file, "image")}
                      onError={setErrorMessage}
                      onClearError={clearError}
                    />
                  </motion.div>
                ) : null}

                {activeTab === "url" ? (
                  <motion.div
                    key="url-form"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <UrlScrapeForm
                      value={urlInput}
                      isLoading={isLoading}
                      onChange={setUrlInput}
                      onSubmit={submitUrl}
                      onError={setErrorMessage}
                      onClearError={clearError}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        {isLoading ? (
          <section className="mx-auto w-full max-w-[1100px] px-4 pb-10">
            <LoadingState />
          </section>
        ) : null}

        {result && !isLoading ? (
          <ScrollReveal className="mx-auto w-full max-w-[1100px] px-4 pb-16" delay={0.08}>
            <StickyResultBar result={result} />
            <ResultPanel result={result} />
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  resetAll();
                  scrollToInput();
                }}
                className="text-sm text-[color:var(--text-gold)] transition hover:text-[color:var(--gold-shine)]"
              >
                &larr; Analyze another clause
              </button>
            </div>
          </ScrollReveal>
        ) : null}

        <Footer />
      </div>
    </main>
  );
}
