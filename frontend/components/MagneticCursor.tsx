"use client";

import { useEffect, useRef, useState } from "react";

export default function MagneticCursor() {
  const [enabled, setEnabled] = useState(false);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const ringRefPos = useRef({ x: 0, y: 0 });
  const ringStateRef = useRef<"default" | "interactive" | "text">("default");

  useEffect(() => {
    const media = window.matchMedia("(hover: hover)");
    const update = () => {
      setEnabled(media.matches);
      document.body.classList.toggle("custom-cursor-on", media.matches);
    };

    update();
    media.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
      document.body.classList.remove("custom-cursor-on");
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let raf = 0;

    const move = (event: MouseEvent) => {
      targetRef.current = { x: event.clientX, y: event.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${event.clientX - 4}px, ${event.clientY - 4}px, 0)`;
      }
    };

    const over = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !ringRef.current) {
        return;
      }

      if (target.closest("button, a")) {
        ringStateRef.current = "interactive";
        return;
      }

      if (target.closest("p, h1, h2, h3, h4, h5, h6, span, li")) {
        ringStateRef.current = "text";
        return;
      }

      ringStateRef.current = "default";
    };

    const tick = () => {
      const ring = ringRef.current;
      if (ring) {
        ringRefPos.current.x += (targetRef.current.x - ringRefPos.current.x) * 0.12;
        ringRefPos.current.y += (targetRef.current.y - ringRefPos.current.y) * 0.12;

        const state = ringStateRef.current;
        const scale = state === "interactive" ? 1.5 : state === "text" ? 0.65 : 1;
        const opacity = state === "interactive" ? 0.85 : state === "text" ? 0.7 : 0.65;

        ring.style.opacity = `${opacity}`;
        ring.style.transform = `translate3d(${ringRefPos.current.x - 16}px, ${ringRefPos.current.y - 16}px, 0) scale(${scale})`;
      }
      raf = window.requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <div ref={dotRef} className="magnetic-cursor-dot" aria-hidden />
      <div ref={ringRef} className="magnetic-cursor-ring" data-state="default" aria-hidden />
    </>
  );
}
