import React from 'react';
import Link from 'next/link';

/**
 * LegalPage — shared layout for the lightweight privacy/terms surfaces (#1366).
 * Token-driven server component. Structural treatment (mono labels with a dot
 * bullet, compact) lives in src/app/legal.css under .component-legal*
 * selectors (mirrors the About/dashboard pattern).
 */

interface LegalPageProps {
  /** Document title, e.g. "Privacy" */
  title: string;
  /** One-line plain-language summary under the title */
  lead: string;
  /** Human month/year the document was last revised, e.g. "June 2026" */
  updated: string;
  children: React.ReactNode;
}

export function LegalPage({ title, lead, updated, children }: LegalPageProps) {
  return (
    <main className="component-legal">
      <header className="component-legal-hero">
        <p className="component-legal-eyebrow">Narraitor</p>
        <h1 className="component-legal-title">{title}</h1>
        <p className="component-legal-lead">{lead}</p>
        <p className="component-legal-updated">Last updated {updated}</p>
      </header>

      {children}

      <nav className="component-legal-footer" aria-label="More information">
        <Link href="/about" className="component-legal-footer-link">
          About
        </Link>
        <Link href="/faq" className="component-legal-footer-link">
          FAQ
        </Link>
        <Link href="/privacy" className="component-legal-footer-link">
          Privacy
        </Link>
        <Link href="/terms" className="component-legal-footer-link">
          Terms
        </Link>
      </nav>
    </main>
  );
}

interface LegalSectionProps {
  /** Unique id, wired to the heading for aria-labelledby */
  id: string;
  heading: string;
  children: React.ReactNode;
}

export function LegalSection({ id, heading, children }: LegalSectionProps) {
  return (
    <section className="component-legal-section" aria-labelledby={id}>
      <h2 id={id} className="component-legal-section-title">
        {heading}
      </h2>
      <div className="component-legal-prose">{children}</div>
    </section>
  );
}
