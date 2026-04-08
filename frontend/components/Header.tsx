"use client";

import { useEffect, useState } from "react";

interface HeaderProps {
  onDemoMode?: () => void;
  isDemoRunning?: boolean;
}

export default function Header({ onDemoMode, isDemoRunning = false }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-[color:var(--border-dark)] bg-[rgba(8,11,9,0.8)] backdrop-blur-[20px] transition duration-300 ${
        isScrolled ? "scale-[0.98]" : "scale-100"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--border-mid)] bg-[rgba(240,180,41,0.08)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-[color:var(--text-gold)]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3v2" />
              <path d="M5 7h14" />
              <path d="M8 7l-3 5h6z" />
              <path d="M16 7l-3 5h6z" />
              <path d="M12 5l-4 7" />
              <path d="M12 5l4 7" />
              <path d="M6 18h12" />
              <path d="M12 12v6" />
            </svg>
          </span>
          <div>
            <p className="font-display text-2xl font-semibold leading-none text-[color:var(--text-gold)]">ClauseClarity</p>
            <p className="text-[11px] font-light tracking-[0.08em] text-[color:var(--text-secondary)]">
              Built for Kalpathon 2.0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-[color:var(--border-mid)] px-3 py-1 text-[11px] font-medium text-[color:var(--text-gold)] md:inline-flex">
            Powered by fine-tuned TinyLlama
          </span>

          {onDemoMode ? (
            <button
              type="button"
              onClick={onDemoMode}
              disabled={isDemoRunning}
              className="rounded-full border border-[color:var(--gold-bright)] bg-[rgba(240,180,41,0.12)] px-3 py-1 text-[11px] font-semibold text-[color:var(--text-gold)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDemoRunning ? "Demo Running..." : "Demo Mode"}
            </button>
          ) : null}

          <span className="hidden rounded-full border border-[rgba(95,217,138,0.45)] bg-[rgba(95,217,138,0.12)] px-3 py-1 text-[10px] font-medium text-[color:var(--green-text)] lg:inline-flex">
            Model loaded locally - no internet required
          </span>
        </div>
      </div>
    </header>
  );
}
