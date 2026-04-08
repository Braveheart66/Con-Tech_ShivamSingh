"use client";

import { RefObject, useEffect, useState } from "react";

export function usePageScroll() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId = 0;

    const update = () => {
      rafId = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const next = max <= 0 ? 0 : Math.min(window.scrollY / max, 1);
      setProgress((current) => (Math.abs(current - next) < 0.001 ? current : next));
    };

    const handler = () => {
      if (rafId) {
        return;
      }
      rafId = window.requestAnimationFrame(update);
    };

    handler();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler, { passive: true });

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

  return progress;
}

export function useElementScroll(ref: RefObject<HTMLElement>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    let rafId = 0;

    const update = () => {
      rafId = 0;
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const p = 1 - rect.top / viewportHeight;
      const next = Math.max(0, Math.min(1, p));
      setProgress((current) => (Math.abs(current - next) < 0.001 ? current : next));
    };

    const handler = () => {
      if (rafId) {
        return;
      }
      rafId = window.requestAnimationFrame(update);
    };

    handler();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler, { passive: true });

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [ref]);

  return progress;
}

export function useActiveSectionIndex(sectionIds: string[]) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(sectionIds.indexOf(entry.target.id));
          }
        });
      },
      { threshold: 0.5 }
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [sectionIds]);

  return active;
}
