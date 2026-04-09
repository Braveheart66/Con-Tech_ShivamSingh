"use client";

const samplePairs = [
  {
    clause: "The lessee shall not sublet or assign the premises without prior written consent of the lessor.",
    plain: "You cannot give your flat to someone else without your landlord's written permission."
  },
  {
    clause: "The lessor reserves the right to terminate this agreement with 30 days notice in case of breach.",
    plain: "Your landlord can end this agreement by giving you 30 days written notice."
  },
  {
    clause: "The entire security deposit may be forfeited at the sole discretion of the Licensor.",
    plain: "Your landlord can keep your entire deposit for any reason they choose."
  },
  {
    clause: "Delay in rent beyond seven days shall attract a penalty of 2% per day.",
    plain: "You must pay on time or face a daily penalty."
  },
  {
    clause: "The licensee shall be liable for damages arising from misuse of the premises.",
    plain: "You must pay for damage caused by misuse of the property."
  }
];

const buckets = [
  { label: "0-30", count: 9 },
  { label: "31-50", count: 21 },
  { label: "51-70", count: 36 },
  { label: "71-90", count: 27 },
  { label: "91+", count: 20 }
];

export default function DataPage() {
  const maxCount = Math.max(...buckets.map((bucket) => bucket.count));

  return (
    <main className="min-h-screen bg-[color:var(--bg-void)] px-4 py-10 text-[color:var(--text-primary)] md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-2xl border border-[color:var(--border-mid)] bg-[color:var(--bg-surface)] p-6">
          <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-tertiary)]">Data Quality Dashboard</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-[color:var(--text-gold)]">UnLegalize Dataset Metrics</h1>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Built for Kalpathon 2.0 - AI/SLM Fine-Tuning Track</p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <MetricCard label="Total clauses" value="113" />
          <MetricCard label="Quality score" value="91.33 / 100" />
          <MetricCard label="Unique clause ratio" value="92%" />
          <MetricCard label="Avg clause length" value="70.94 words" />
          <MetricCard label="Sources scraped" value="21" />
          <MetricCard label="Inference" value="100% Offline" />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-2xl border border-[color:var(--border-mid)] bg-[color:var(--bg-surface)] p-5">
            <h2 className="font-display text-2xl text-[color:var(--text-gold)]">Sample Clause to Plain-English Pairs</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--border-dark)] text-[color:var(--text-secondary)]">
                    <th className="py-2 pr-4">Clause</th>
                    <th className="py-2">Plain English</th>
                  </tr>
                </thead>
                <tbody>
                  {samplePairs.map((pair, index) => (
                    <tr key={index} className="border-b border-[color:var(--border-dark)] align-top">
                      <td className="py-3 pr-4 mono text-xs text-[color:var(--text-secondary)]">{pair.clause}</td>
                      <td className="py-3 text-sm text-[color:var(--text-primary)]">{pair.plain}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-2xl border border-[color:var(--border-mid)] bg-[color:var(--bg-surface)] p-5">
            <h2 className="font-display text-2xl text-[color:var(--text-gold)]">Clause Length Distribution</h2>
            <div className="mt-6 space-y-4">
              {buckets.map((bucket) => {
                const width = `${Math.round((bucket.count / maxCount) * 100)}%`;
                return (
                  <div key={bucket.label}>
                    <div className="mb-1 flex items-center justify-between text-xs text-[color:var(--text-secondary)]">
                      <span>{bucket.label} words</span>
                      <span>{bucket.count}</span>
                    </div>
                    <div className="h-3 rounded-full bg-[rgba(255,255,255,0.08)]">
                      <div
                        className="h-3 rounded-full bg-[linear-gradient(90deg,var(--gold-mid),var(--risk-low))]"
                        style={{ width }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--border-mid)] bg-[color:var(--bg-surface)] p-4">
      <p className="text-[11px] uppercase tracking-[0.08em] text-[color:var(--text-tertiary)]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[color:var(--text-primary)]">{value}</p>
    </div>
  );
}
