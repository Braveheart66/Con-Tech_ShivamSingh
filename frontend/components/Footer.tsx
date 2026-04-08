"use client";

import ScrollReveal from "@/components/ScrollReveal";
import LegalOrb from "@/components/three/LegalOrb";

export default function Footer() {
  return (
    <footer id="footer" className="border-t border-[color:var(--border-dark)] bg-[color:var(--bg-void)] py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <ScrollReveal className="relative mx-auto mb-10 h-[200px] w-[200px] opacity-30">
          <div className="pointer-events-none absolute inset-0">
            <LegalOrb />
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-[color:var(--border-mid)] bg-[rgba(240,180,41,0.08)] text-[color:var(--text-gold)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
              <p className="font-display text-4xl text-[color:var(--text-gold)]">UnLegalize</p>
            </div>
            <p className="legal mt-3 max-w-xs text-lg italic text-[color:var(--text-secondary)]">Making Indian property law accessible to every renter.</p>
            <span className="mt-4 inline-flex rounded-full border border-[color:var(--border-mid)] px-3 py-1 text-xs text-[color:var(--text-gold)]">Built for India</span>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-tertiary)]">Product</p>
            <div className="mt-3 space-y-2 text-sm text-[color:var(--text-secondary)]">
              <a href="#workbench" className="block hover:text-[color:var(--text-gold)]">Analyze a Clause</a>
              <a href="#how-it-works" className="block hover:text-[color:var(--text-gold)]">How It Works</a>
              <a href="#risk-explainer" className="block hover:text-[color:var(--text-gold)]">Risk Guide</a>
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.12em] text-[color:var(--text-tertiary)]">Legal</p>
            <div className="mt-3 space-y-2 text-sm text-[color:var(--text-secondary)]">
              <a href="#" className="block hover:text-[color:var(--text-gold)]">Privacy Policy</a>
              <a href="#" className="block hover:text-[color:var(--text-gold)]">Terms of Use</a>
              <a href="#" className="block hover:text-[color:var(--text-gold)]">Disclaimer</a>
            </div>
          </div>

          <div className="lg:text-right">
            <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-tertiary)]">Stack</p>
            <div className="mt-3 space-y-1 text-sm text-[color:var(--text-tertiary)]">
              <p>⚡ Gemma 3 270M · LoRA Fine-tuned</p>
              <p>🐍 FastAPI · Python backend</p>
              <p>Next.js 14 . TypeScript</p>
              <p>Three.js . Framer Motion</p>
              <p>📄 PDF extraction · OCR · Web scraping</p>
            </div>
            <p className="mt-4 text-xs italic text-[color:var(--text-tertiary)]">Running locally - data processed at localhost:8000. Nothing is sent to third-party servers.</p>
          </div>
        </div>

        <div className="my-10 h-px w-full bg-[color:var(--border-dark)]" />

        <div className="grid grid-cols-1 gap-4 text-xs text-[color:var(--text-tertiary)] lg:grid-cols-[1fr_auto]">
          <p>Copyright 2025 UnLegalize. All rights reserved.</p>
          <p className="max-w-xl italic lg:text-right">
            Disclaimer: UnLegalize provides informational clause analysis only. This is not legal advice under the Advocates Act, 1961. For binding legal decisions, consult a qualified advocate registered with the Bar Council of India.
          </p>
        </div>
      </div>
    </footer>
  );
}
