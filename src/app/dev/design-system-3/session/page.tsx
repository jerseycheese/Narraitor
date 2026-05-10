'use client';

import SessionDemo from '../SessionDemo';
import '../design-system-3.css';

export default function DesignSystem3SessionPage() {
  return (
    <div
      className="design-system-session-fullscreen"
      data-theme="ds3"
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
