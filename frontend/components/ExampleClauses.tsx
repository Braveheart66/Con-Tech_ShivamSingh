"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ExampleClause {
  label: string;
  icon: string;
  text: string;
}

interface ExampleClausesProps {
  onSelect: (clause: string) => void;
}

const examples: ExampleClause[] = [
  {
    label: "Rent Payment",
    icon: "₹",
    text: "The Tenant shall pay to the Landlord a monthly rent of ₹28,000/- (Rupees Twenty-Eight Thousand only) on or before the 5th day of each calendar month. In the event of delay beyond 7 (seven) days, a penalty of 2% per month shall be levied on the outstanding amount, compounding monthly, without prejudice to the Landlord's right to terminate this Agreement."
  },
  {
    label: "Security Deposit",
    icon: "🔒",
    text: "The Tenant shall deposit with the Landlord a refundable interest-free security deposit of ₹84,000/- (Rupees Eighty-Four Thousand only) equivalent to three months' rent, as security for the due performance of the covenants herein. The said deposit shall be refunded within 30 days of vacation subject to deduction of amounts, if any, due to the Landlord."
  },
  {
    label: "Notice Period",
    icon: "📅",
    text: "Either party may terminate this Agreement by giving 2 (two) calendar months' prior written notice to the other party. In the event of the Tenant vacating the premises without serving due notice, the Landlord shall be entitled to forfeit an amount equivalent to 2 (two) months' rent from the security deposit held."
  },
  {
    label: "Subletting Ban",
    icon: "🚫",
    text: "The Tenant shall not sublet, underlet, assign, transfer or part with the possession of the premises or any part thereof to any person, firm, company or body corporate without the prior written consent of the Landlord, which may be withheld at the Landlord's sole and absolute discretion. Any breach of this covenant shall render this Agreement voidable at the Landlord's option."
  },
  {
    label: "Maintenance",
    icon: "🔧",
    text: "The Tenant shall keep and maintain the premises in good and tenantable repair and condition at his own cost and expense. Minor repairs up to ₹2,000/- (Rupees Two Thousand) per incident shall be the Tenant's responsibility. Major structural repairs exceeding the said threshold shall be carried out by the Landlord upon written notice from the Tenant within 15 days."
  }
];

export default function ExampleClauses({ onSelect }: ExampleClausesProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const previewText = useMemo(() => {
    if (activeIndex === null) {
      return "";
    }

    const value = examples[activeIndex]?.text ?? "";
    return value.length > 80 ? `${value.slice(0, 80)}...` : value;
  }, [activeIndex]);

  return (
    <section className="space-y-2">
      <p className="text-xs font-light text-[color:var(--text-secondary)]">Try an example clause -&gt;</p>

      <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
        {examples.map((example, index) => (
          <motion.button
            key={example.label}
            type="button"
            onClick={() => {
              setActiveIndex(index);
              onSelect(example.text);
            }}
            className="relative inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[color:var(--border-dark)] bg-[color:var(--bg-surface)] px-3.5 py-1.5 text-xs text-[color:var(--text-secondary)] transition hover:border-[color:var(--border-mid)] hover:text-[color:var(--text-gold)]"
            whileTap={{ scale: 0.97 }}
          >
            {activeIndex === index ? (
              <span className="pointer-events-none absolute inset-0 rounded-full border border-[color:var(--gold-bright)] animate-ring-fade" />
            ) : null}
            <span>{example.icon}</span>
            <span>{example.label}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {activeIndex !== null ? (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="inline-flex max-w-full rounded-md border border-[color:var(--border-mid)] bg-[rgba(20,29,23,0.95)] px-3 py-1.5 text-[11px] text-[color:var(--text-secondary)]"
          >
            {previewText}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
