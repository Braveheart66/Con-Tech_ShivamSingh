"use client";

import ScrollReveal from "@/components/ScrollReveal";

const clauseTypes = [
  { icon: "₹", title: "Rent & Payment", desc: "Monthly rent, advance rent, due dates, penalty clauses" },
  { icon: "🔒", title: "Security Deposit", desc: "Refund timelines, deduction rights, interest terms" },
  { icon: "📅", title: "Notice & Lock-in", desc: "Termination windows, lock-in periods, early exit penalties" },
  { icon: "🚫", title: "Subletting Rights", desc: "Permission requirements, breach consequences" },
  { icon: "🔧", title: "Maintenance Duties", desc: "Who repairs what, cost thresholds, timeline obligations" },
  { icon: "⚖", title: "Dispute Resolution", desc: "Jurisdiction, arbitration clauses, court access rights" }
];

const testimonials = [
  "Finally understood my landlord's penalty clause. Saved me Rs 15,000. - Priya M., Bengaluru",
  "The warnings section caught a sneaky subletting ban I almost missed. - Rahul K., Mumbai",
  "Used this before negotiating my renewal. Got 2 clauses removed. - Ananya S., Pune",
  "Plain English mode is exactly what I needed. No law degree required. - Vikram T., Delhi",
  "Uploaded my stamp paper photo. Analysis was instant and accurate. - Meena R., Hyderabad",
  "The risk meter is brilliant. Bright red on my first draft and rightly so. - Arjun N., Chennai"
];

function TickerRow({ reverse = false }: { reverse?: boolean }) {
  const items = [...testimonials, ...testimonials];
  return (
    <div className="ticker-mask overflow-hidden py-2">
      <div className={`flex min-w-max gap-4 ${reverse ? "animate-marquee-right" : "animate-marquee-left"}`}>
        {items.map((item, index) => (
          <span key={`${item}-${index}`} className="text-sm text-[color:var(--text-secondary)]">
            {item}
            <span className="mx-3 text-[color:var(--gold-bright)]">.</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TrustSection() {
  return (
    <section className="bg-[color:var(--bg-deep)] py-24">
      <div className="mx-auto max-w-6xl px-4">
        <ScrollReveal className="text-center">
          <h2 className="font-display text-5xl font-semibold text-[color:var(--text-primary)]">
            Built for Indian Rental & Leave-and-License Agreements
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clauseTypes.map((item, index) => (
            <ScrollReveal key={item.title} delay={index * 0.08} className="group rounded-2xl border border-[color:var(--border-dark)] bg-[color:var(--bg-surface)] p-6 transition duration-300 hover:-translate-y-1 hover:border-[color:var(--border-mid)] hover:shadow-[var(--glow-card)]">
              <div className="grid h-10 w-10 place-items-center rounded-full border border-[color:var(--border-mid)] bg-[rgba(240,180,41,0.1)] text-sm text-[color:var(--text-gold)]">
                {item.icon}
              </div>
              <h3 className="mt-4 text-[15px] font-medium text-[color:var(--text-primary)]">{item.title}</h3>
              <p className="mt-2 text-[13px] font-light leading-6 text-[color:var(--text-secondary)]">{item.desc}</p>
            </ScrollReveal>
          ))}
        </div>

        <div className="mt-12 space-y-3">
          <TickerRow />
          <TickerRow reverse />
        </div>
      </div>
    </section>
  );
}
