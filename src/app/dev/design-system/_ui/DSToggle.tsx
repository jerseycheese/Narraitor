'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export type DSTheme = 'ds1' | 'ds2' | 'ds3';

type Variant = {
  id: DSTheme;
  folio: string;
  name: string;
  tagline: string;
  href: string;
};

const VARIANTS: Variant[] = [
  { id: 'ds1', folio: '01', name: 'Paper & Ink',  tagline: 'Manuscript',  href: '/dev/design-system' },
  { id: 'ds2', folio: '02', name: 'Sanctuary',    tagline: 'Warm earth',  href: '/dev/design-system/2' },
  { id: 'ds3', folio: '03', name: 'Mechanical',   tagline: 'Drafting',    href: '/dev/design-system/3' },
];

export function DSToggle({ active }: { active: DSTheme }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const onPick = useCallback((href: string) => {
    router.push(href);
  }, [router]);

  return (
    <nav
      className="ds-toggle"
      data-mounted={mounted ? 'true' : 'false'}
      aria-label="Design system variant"
    >
      <span className="ds-toggle__label" aria-hidden="true">Design System</span>
      <ul className="ds-toggle__list" role="tablist">
        {VARIANTS.map((v) => {
          const isActive = v.id === active;
          return (
            <li key={v.id} role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onPick(v.href)}
                className="ds-toggle__btn"
                data-active={isActive ? 'true' : 'false'}
              >
                <span className="ds-toggle__folio">{v.folio}</span>
                <span className="ds-toggle__name">{v.name}</span>
                <span className="ds-toggle__tagline">{v.tagline}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <style>{`
        .ds-toggle {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 9999;
          font-family: ui-sans-serif, -apple-system, "Segoe UI", Roboto, sans-serif;
          color: #1f1b16;
          background: rgba(252, 249, 243, 0.92);
          backdrop-filter: blur(8px) saturate(120%);
          -webkit-backdrop-filter: blur(8px) saturate(120%);
          border: 1px solid rgba(31, 27, 22, 0.12);
          border-radius: 4px;
          padding: 10px 10px 8px;
          width: 200px;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.7) inset,
            0 12px 32px -16px rgba(31, 27, 22, 0.35);
          opacity: 0;
          transform: translateY(-4px);
          transition: opacity 220ms ease, transform 220ms ease;
        }
        .ds-toggle[data-mounted="true"] {
          opacity: 1;
          transform: translateY(0);
        }
        .ds-toggle__label {
          display: block;
          font-family: ui-monospace, "SF Mono", Menlo, monospace;
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(31, 27, 22, 0.55);
          padding: 2px 4px 8px;
          border-bottom: 1px solid rgba(31, 27, 22, 0.08);
          margin-bottom: 4px;
        }
        .ds-toggle__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .ds-toggle__btn {
          all: unset;
          box-sizing: border-box;
          display: grid;
          grid-template-columns: 22px 1fr auto;
          grid-template-rows: auto;
          column-gap: 10px;
          align-items: baseline;
          width: 100%;
          padding: 7px 6px;
          cursor: pointer;
          border-radius: 2px;
          color: inherit;
          transition: background-color 160ms ease, color 160ms ease;
        }
        .ds-toggle__btn:hover {
          background: rgba(31, 27, 22, 0.04);
        }
        .ds-toggle__btn:focus-visible {
          outline: 2px solid #1f1b16;
          outline-offset: 1px;
        }
        .ds-toggle__btn[data-active="true"] {
          background: #1f1b16;
          color: #fcf9f3;
        }
        .ds-toggle__folio {
          font-family: ui-monospace, "SF Mono", Menlo, monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: rgba(31, 27, 22, 0.45);
          font-variant-numeric: tabular-nums;
        }
        .ds-toggle__btn[data-active="true"] .ds-toggle__folio {
          color: rgba(252, 249, 243, 0.7);
        }
        .ds-toggle__name {
          font-size: 13px;
          font-weight: 500;
          letter-spacing: -0.005em;
          line-height: 1.2;
        }
        .ds-toggle__tagline {
          font-family: ui-monospace, "SF Mono", Menlo, monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(31, 27, 22, 0.4);
        }
        .ds-toggle__btn[data-active="true"] .ds-toggle__tagline {
          color: rgba(252, 249, 243, 0.55);
        }
        @media (max-width: 640px) {
          .ds-toggle {
            top: 8px;
            right: 8px;
            width: 168px;
            padding: 8px 8px 6px;
          }
          .ds-toggle__tagline { display: none; }
          .ds-toggle__btn { grid-template-columns: 22px 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ds-toggle { transition: none; }
        }
      `}</style>
    </nav>
  );
}
