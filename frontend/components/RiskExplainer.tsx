"use client";

import ScrollReveal from "@/components/ScrollReveal";

const panels = [
  {
    title: "Low Risk",
    desc: "Standard, fair clauses. Safe to sign after review.",
    example: "Eg: Standard notice period",
    accent: "var(--risk-low)",
    bg: "var(--risk-low-bg)",
    delay: 0,
    className: ""
  },
  {
    title: "Review Carefully",
    desc: "Some terms need attention. Negotiate before signing.",
    example: "Eg: Compounding late penalty",
    accent: "var(--risk-mid)",
    bg: "var(--risk-mid-bg)",
    delay: 0.1,
    className: "md:-translate-y-2"
  },
  {
    title: "High Risk - Act Now",
    desc: "Dangerous terms present. Seek legal advice.",
    example: "Eg: Unilateral termination right",
    accent: "var(--risk-high)",
    bg: "var(--risk-high-bg)",
    delay: 0.2,
    className: ""
  }
];

export default function RiskExplainer() {
  return (
    <section className="bg-[linear-gradient(180deg,var(--bg-void),var(--bg-deep))] py-20">
      <div className="mx-auto max-w-6xl px-4">
        <ScrollReveal className="text-center">
          <h2 className="font-display text-5xl font-semibold text-[color:var(--text-primary)]">What the Risk Score Means</h2>
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {panels.map((panel) => (
            <ScrollReveal key={panel.title} delay={panel.delay} className={`rounded-2xl border border-[color:var(--border-dark)] p-5 ${panel.className}`}>
              <div className="rounded-xl p-4" style={{ backgroundColor: panel.bg, borderLeft: `3px solid ${panel.accent}` }}>
                <p className="text-sm font-semibold" style={{ color: panel.accent }}>{panel.title}</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{panel.desc}</p>
                <span className="mt-4 inline-flex rounded-full border border-[color:var(--border-mid)] px-3 py-1 text-xs text-[color:var(--text-secondary)]">
                  {panel.example}
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
