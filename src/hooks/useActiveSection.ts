'use client';

import { useEffect, useState } from 'react';

interface ActiveSectionOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * Tracks which section is currently active based on scroll position, returning the
 * id of the topmost visible section. Used to highlight in-page navigation.
 */
export function useActiveSection(
  ids: string[],
  { threshold, rootMargin = '-20% 0px -60% 0px' }: ActiveSectionOptions = {}
) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { threshold, rootMargin }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [ids, threshold, rootMargin]);

  return active;
}
