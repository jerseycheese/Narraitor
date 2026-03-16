'use client';

import { useEffect, useRef } from 'react';
import SessionDemo from '../SessionDemo';
import '../design-system-2.css';

export default function DesignSystem2SessionPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mark all scroll-reveal elements as visible (no scroll observer in standalone route)
  useEffect(() => {
    containerRef.current?.querySelectorAll('.ds2-reveal').forEach(el => {
      el.classList.add('ds2-visible');
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="design-system-session-fullscreen"
      data-theme="ds2"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        background: 'var(--color-canvas)',
        padding: '2rem',
      }}
    >
      <SessionDemo />
    </div>
  );
}
