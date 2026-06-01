"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Lightweight replacement for framer-motion's useInView.
 * Uses the native Intersection Observer API (zero bundle cost).
 */
export function useInView(
  ref: RefObject<Element | null>,
  options?: { once?: boolean; margin?: string },
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setInView(isIntersecting);
        if (isIntersecting && options?.once) {
          observer.disconnect();
        }
      },
      { rootMargin: options?.margin },
    );

    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, options?.once, options?.margin]);

  return inView;
}
