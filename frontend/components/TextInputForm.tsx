"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import ExampleClauses from "@/components/ExampleClauses";

interface TextInputFormProps {
  value: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onError: (message: string) => void;
  onClearError: () => void;
}

const MAX_CHARS = 5000;

const placeholder = `The Tenant shall pay a monthly rent of ₹25,000/- (Rupees Twenty-Five Thousand only)
on or before the 5th day of each calendar month. In the event of default exceeding
seven days, a penalty of 2% per diem shall accrue on the outstanding amount...`;

export default function TextInputForm({
  value,
  isLoading,
  onChange,
  onSubmit,
  onError,
  onClearError
}: TextInputFormProps) {
  const [isFocused, setIsFocused] = useState(false);

  const submitHandler = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!value.trim()) {
      onError("Please paste a legal clause to analyze.");
      return;
    }

    onClearError();
    onSubmit(value);
  };

  const counterColor = value.length > 4000 ? "text-[color:var(--gold-bright)]" : "text-[color:var(--text-secondary)]";

  return (
    <form onSubmit={submitHandler} className="space-y-4">
      <div className="relative rounded-xl border border-[color:var(--border-dark)] bg-[color:var(--bg-deep)] p-3">
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-xl border border-[color:var(--gold-bright)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: isFocused ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />

        <label htmlFor="legal-text" className="mb-2 block text-xs uppercase tracking-[0.08em] text-[color:var(--text-secondary)]">
          Paste Legal Clause
        </label>
        <textarea
          id="legal-text"
          value={value}
          maxLength={MAX_CHARS}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="mono min-h-[180px] w-full resize-y rounded-lg border border-[color:var(--border-dark)] bg-[rgba(8,11,9,0.9)] p-4 text-[14px] leading-7 text-[color:var(--text-primary)] outline-none transition placeholder:legal placeholder:text-[13px] placeholder:italic placeholder:text-[color:var(--text-secondary)] placeholder:opacity-30 focus:border-[color:var(--border-mid)]"
        />

        <div className="mt-2 flex justify-end">
          <span className={`mono text-xs ${counterColor}`}>{value.length} / {MAX_CHARS}</span>
        </div>
      </div>

      <ExampleClauses onSelect={onChange} />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="group relative overflow-hidden rounded-[10px] bg-[linear-gradient(135deg,var(--gold-mid),var(--gold-bright))] px-8 py-3 text-sm font-medium text-[color:var(--bg-void)] transition hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_8px_24px_rgba(240,180,41,0.3)] active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <span className="pointer-events-none absolute inset-y-0 left-[-130%] w-1/2 -skew-x-12 bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.55),rgba(255,255,255,0))] transition duration-500 group-hover:left-[140%]" />
          <span className="relative inline-flex items-center gap-2">
            {isLoading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" />
              </svg>
            ) : null}
            {isLoading ? "Analyzing..." : "Analyze Clause"}
          </span>
        </button>
      </div>
    </form>
  );
}
