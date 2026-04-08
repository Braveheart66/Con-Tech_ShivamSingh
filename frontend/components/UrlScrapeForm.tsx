"use client";

import { FormEvent, useMemo, useState } from "react";
import { Globe, Link2 } from "lucide-react";

interface UrlScrapeFormProps {
  value: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onError: (message: string) => void;
  onClearError: () => void;
}

const suggestions = [
  { label: "NoBroker", url: "https://www.nobroker.in/" },
  { label: "MagicBricks", url: "https://www.magicbricks.com/" },
  { label: "99acres", url: "https://www.99acres.com/" },
  { label: "Housing.com", url: "https://housing.com/" }
];

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function UrlScrapeForm({
  value,
  isLoading,
  onChange,
  onSubmit,
  onError,
  onClearError
}: UrlScrapeFormProps) {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [isInvalid, setIsInvalid] = useState(false);
  const [flashGold, setFlashGold] = useState(false);

  const wrapperClass = useMemo(() => {
    if (isInvalid) {
      return "border-[color:var(--risk-high)]";
    }

    if (flashGold) {
      return "border-[color:var(--gold-bright)] animate-border-flash";
    }

    return "border-[color:var(--border-dark)]";
  }, [isInvalid, flashGold]);

  const fetchFavicon = (url: string) => {
    try {
      const parsed = new URL(url);
      setFaviconUrl(`https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`);
    } catch {
      setFaviconUrl(null);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = value.trim();
    if (!isValidHttpUrl(trimmed)) {
      setIsInvalid(true);
      onError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setIsInvalid(false);
    setFlashGold(true);
    onClearError();
    onSubmit(trimmed);
    window.setTimeout(() => {
      setFlashGold(false);
    }, 300);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className={`rounded-xl border bg-[color:var(--bg-deep)] px-4 py-3 transition ${wrapperClass} ${isInvalid ? "animate-risk-shake" : ""}`}>
        <label htmlFor="url-input" className="mb-2 block text-xs uppercase tracking-[0.08em] text-[color:var(--text-secondary)]">
          Public Agreement URL
        </label>

        <div className="flex items-center gap-2">
          <Link2 size={18} className="text-[color:var(--text-gold)]" />
          <input
            id="url-input"
            value={value}
            disabled={isLoading}
            onChange={(event) => {
              onChange(event.target.value);
              if (isInvalid) {
                setIsInvalid(false);
              }
            }}
            onBlur={() => {
              if (isValidHttpUrl(value.trim())) {
                fetchFavicon(value.trim());
              }
            }}
            placeholder="https://www.nobroker.in/lease-agreement/..."
            className="w-full bg-transparent text-sm text-[color:var(--text-primary)] outline-none placeholder:text-[color:var(--text-secondary)]"
          />
          <span className="grid h-6 w-6 place-items-center rounded-md border border-[color:var(--border-dark)] bg-[color:var(--bg-surface)]">
            {faviconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={faviconUrl} alt="Site favicon" className="h-4 w-4" />
            ) : (
              <Globe size={14} className="text-[color:var(--text-secondary)]" />
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.label}
            type="button"
            onClick={() => {
              onChange(suggestion.url);
              onClearError();
              setIsInvalid(false);
              fetchFavicon(suggestion.url);
            }}
            className="rounded-full border border-[color:var(--border-mid)] px-3 py-1 text-[11px] text-[color:var(--text-secondary)] transition hover:border-[color:var(--gold-bright)] hover:text-[color:var(--text-gold)]"
          >
            {suggestion.label}
          </button>
        ))}
      </div>

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
            {isLoading ? "Analyzing..." : "Analyze URL"}
          </span>
        </button>
      </div>
    </form>
  );
}
