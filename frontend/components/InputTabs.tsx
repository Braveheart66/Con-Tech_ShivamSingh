"use client";

import { motion } from "framer-motion";
import { File, FileText, Image, Link } from "lucide-react";
import { InputMode } from "@/lib/types";

interface InputTabsProps {
  activeTab: InputMode;
  onChange: (mode: InputMode) => void;
  disabled?: boolean;
}

const tabs: Array<{ id: InputMode; icon: typeof FileText; label: string }> = [
  { id: "text", icon: FileText, label: "Paste Text" },
  { id: "pdf", icon: File, label: "Upload PDF" },
  { id: "image", icon: Image, label: "Upload Image" },
  { id: "url", icon: Link, label: "Scrape URL" }
];

export default function InputTabs({ activeTab, onChange, disabled = false }: InputTabsProps) {
  return (
    <div className="flex w-full justify-center">
      <div
        className="inline-flex flex-wrap items-center justify-center gap-1 rounded-full border border-[color:var(--border-dark)] bg-[color:var(--bg-surface)] p-1"
        role="tablist"
        aria-label="Input mode selector"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={disabled}
              onClick={() => onChange(tab.id)}
              className="relative overflow-hidden rounded-full px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 md:px-4 md:text-[13px]"
            >
              {isActive ? (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-full border border-[color:var(--border-mid)] bg-[color:var(--bg-raised)]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}

              <span
                className={`relative z-[1] inline-flex items-center gap-1.5 ${
                  isActive ? "text-[color:var(--text-gold)]" : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
