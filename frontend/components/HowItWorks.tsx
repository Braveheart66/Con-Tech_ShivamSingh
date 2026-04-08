"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, FileText, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    number: "01",
    Icon: FileText,
    accentColor: "#F0B429",
    accentGlow: "rgba(240,180,41,0.15)",
    lineColor: "#C9960C",
    title: "Share Your Clause",
    body: "Paste text, upload a PDF, photograph your stamp paper, or drop a URL. UnLegalize handles any format - even handwritten agreements on plain paper.",
    tags: ["Plain Text", "PDF Upload", "Image / OCR", "URL Scraping"]
  },
  {
    number: "02",
    Icon: Brain,
    accentColor: "#0FADA3",
    accentGlow: "rgba(15,173,163,0.15)",
    lineColor: "#0D4A4A",
    title: "AI Decodes the Legalese",
    body: "Gemma 3 270M, fine-tuned with LoRA on India-specific rental and leave-and-license data, extracts every clause, scores risk, and translates dense legalese into plain actionable English.",
    tags: ["Gemma 3 270M", "LoRA Fine-tuned", "India Law Data", "Risk Scoring"]
  },
  {
    number: "03",
    Icon: ShieldCheck,
    accentColor: "#2DB55D",
    accentGlow: "rgba(45,181,93,0.15)",
    lineColor: "#1A6B35",
    title: "Understand. Negotiate. Sign.",
    body: "Know exactly what you are agreeing to. Spot the risky clauses before your landlord does. Walk into negotiations with confidence. Never sign blind again.",
    tags: ["Plain English", "Risk Warnings", "Key Clauses", "Instant Results"]
  }
] as const;

const cardVariants = {
  enter: {
    opacity: 0,
    y: 48,
    scale: 0.97,
    filter: "blur(8px)"
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
    }
  },
  exit: {
    opacity: 0,
    y: -48,
    scale: 0.97,
    filter: "blur(8px)",
    transition: {
      duration: 0.4,
      ease: [0.7, 0, 0.84, 0] as [number, number, number, number]
    }
  }
};

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFixed, setIsFixed] = useState(false);
  const [fixedTop, setFixedTop] = useState(false);
  const [fixedBottom, setFixedBottom] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current;
      if (!section) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = section.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrolled = -sectionTop;
      const scrollable = Math.max(1, sectionHeight - viewportHeight);
      const progress = Math.max(0, Math.min(1, scrolled / scrollable));

      setScrollProgress(progress);

      const sectionInView = sectionTop <= 0 && rect.bottom >= viewportHeight;
      setIsFixed(sectionInView);
      setFixedTop(rect.bottom < viewportHeight);
      setFixedBottom(sectionTop > 0);

      if (progress < 0.333) {
        setActiveIndex(0);
      } else if (progress < 0.666) {
        setActiveIndex(1);
      } else {
        setActiveIndex(2);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  if (isMobile) {
    return (
      <section id="how-it-works" style={{ padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--text-tertiary)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "12px"
            }}
          >
            The Process
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "36px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0
            }}
          >
            How UnLegalize Works
          </h2>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "600px",
            margin: "0 auto"
          }}
        >
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.12,
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              <StepCard step={step} />
            </motion.div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      style={{
        height: "300vh",
        position: "relative"
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 20,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
          background: "var(--bg-void)",
          opacity: isFixed ? 1 : 0,
          visibility: isFixed ? "visible" : "hidden",
          transition: "opacity 0.4s ease, visibility 0.4s ease",
          transform: fixedTop ? "translateY(-10px)" : fixedBottom ? "translateY(10px)" : "translateY(0px)"
        }}
      >
        <div style={{ pointerEvents: "auto", width: "100%", maxWidth: "780px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                color: "var(--text-tertiary)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "14px"
              }}
            >
              The Process
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
                lineHeight: 1.1
              }}
            >
              How UnLegalize Works
            </h2>
          </div>

          <div style={{ position: "relative", width: "100%" }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeIndex} variants={cardVariants} initial="enter" animate="visible" exit="exit">
                <StepCard step={STEPS[activeIndex]} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              marginTop: "40px"
            }}
          >
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                style={{
                  width: i === activeIndex ? "28px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  background: i === activeIndex ? step.accentColor : "var(--border-mid)",
                  boxShadow: i === activeIndex ? `0 0 12px ${step.accentColor}` : "none",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
              />
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                color: "var(--text-tertiary)",
                letterSpacing: "0.1em",
                opacity: 0.6
              }}
            >
              {activeIndex + 1} of {STEPS.length}
            </p>
          </div>

          {activeIndex < STEPS.length - 1 ? (
            <div
              style={{
                position: "absolute",
                bottom: "-80px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                opacity: 1 - scrollProgress * 0.5
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "10px",
                  color: "var(--text-tertiary)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  margin: 0
                }}
              >
                Scroll to continue
              </p>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: "1px",
                  height: "28px",
                  background: "linear-gradient(to bottom, var(--border-mid), transparent)"
                }}
              />
            </div>
          ) : null}

          <div
            className="hidden lg:block"
            style={{
              position: "absolute",
              left: "-80px",
              top: "50%",
              transform: "translateY(-50%)"
            }}
          >
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
              {STEPS.map((step, i) => (
                <div key={step.number} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: i === activeIndex ? step.accentColor : "var(--border-dark)",
                      border: `1px solid ${i === activeIndex ? step.accentColor : "var(--border-mid)"}`,
                      boxShadow: i === activeIndex ? `0 0 10px ${step.accentColor}` : "none",
                      transition: "all 0.4s ease",
                      flexShrink: 0
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: i === activeIndex ? "var(--text-secondary)" : "var(--text-tertiary)",
                      transition: "color 0.4s ease"
                    }}
                  >
                    {step.number}
                  </span>
                </div>
              ))}

              <div
                style={{
                  position: "absolute",
                  left: "4px",
                  top: "10px",
                  width: "1px",
                  height: "calc(100% - 10px)",
                  background: "var(--border-dark)"
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${(activeIndex / (STEPS.length - 1)) * 100}%`,
                    background: STEPS[activeIndex].accentColor,
                    transition: "height 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: `0 0 6px ${STEPS[activeIndex].accentColor}`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepCard({ step }: { step: (typeof STEPS)[number] }) {
  const { Icon, number, accentColor, accentGlow, lineColor, title, body, tags } = step;

  return (
    <div
      style={{
        width: "100%",
        background: "linear-gradient(145deg, rgba(20,29,23,0.95) 0%, rgba(13,20,16,0.98) 100%)",
        border: "1px solid var(--border-dark)",
        borderRadius: "24px",
        padding: "clamp(32px, 5vw, 56px)",
        position: "relative",
        overflow: "hidden",
        boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 1px 0 ${accentColor}20 inset`
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-16px",
          right: "24px",
          fontFamily: "var(--font-display)",
          fontSize: "clamp(100px, 15vw, 160px)",
          fontWeight: 700,
          color: "var(--text-primary)",
          opacity: 0.04,
          lineHeight: 1,
          userSelect: "none",
          pointerEvents: "none"
        }}
      >
        {number}
      </div>

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "200px",
          height: "200px",
          background: `radial-gradient(circle at 0% 0%, ${accentColor}12 0%, transparent 70%)`,
          pointerEvents: "none"
        }}
      />

      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "16px",
          background: accentGlow,
          border: `1px solid ${accentColor}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px"
        }}
      >
        <Icon size={26} color={accentColor} strokeWidth={1.5} />
      </div>

      <div
        style={{
          width: "36px",
          height: "2px",
          background: `linear-gradient(90deg, ${accentColor}, ${lineColor})`,
          borderRadius: "1px",
          marginBottom: "24px",
          boxShadow: `0 0 10px ${accentColor}80`
        }}
      />

      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(28px, 4.5vw, 42px)",
          fontWeight: 700,
          color: "var(--text-primary)",
          lineHeight: 1.15,
          margin: "0 0 16px 0"
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "16px",
          fontWeight: 300,
          color: "var(--text-secondary)",
          lineHeight: 1.75,
          margin: "0 0 28px 0",
          maxWidth: "520px"
        }}
      >
        {body}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              fontWeight: 400,
              color: accentColor,
              border: `1px solid ${accentColor}35`,
              borderRadius: "20px",
              padding: "5px 14px",
              background: `${accentColor}08`,
              letterSpacing: "0.02em"
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default HowItWorks;
