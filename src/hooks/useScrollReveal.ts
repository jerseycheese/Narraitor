'use client';

import { useEffect, useRef } from 'react';

interface ScrollRevealOptions {
  revealClass: string;
  visibleClass: string;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Reveals elements matching `revealClass` by adding `visibleClass` as they scroll
 * into view. Respects prefers-reduced-motion by revealing everything immediately.
 * Returns a ref to attach to the container whose descendants should be observed.
 */
export function useScrollReveal({
  revealClass,
  visibleClass,
  threshold = 0.12,
  rootMargin = '0px 0px -60px 0px',
}: ScrollRevealOptions) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.querySelectorAll(`.${revealClass}`).forEach((child) => child.classList.add(visibleClass));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add(visibleClass);
        }),
      { threshold, rootMargin }
    );

    el.querySelectorAll(`.${revealClass}`).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [revealClass, visibleClass, threshold, rootMargin]);

  return ref;
}
