import React from 'react';
import Link from 'next/link';

/**
 * Landing — the free public front door for a first-time visitor (#1365).
 * Token-driven server component. Per-theme structural treatment lives in
 * src/app/landing.css under [data-theme="dsN"] .component-landing* selectors
 * (mirrors the About/dashboard pattern):
 *   DS1 = drafting-table (drafting grid, hairline rules, mono uppercase labels)
 *   DS2 = editorial (serif display, airy rhythm, soft surfaces)
 *   DS3 = mechanical manuscript (dot-grid, corner-bracket cards, mono labels)
 *
 * Outcome-framed copy — it leads with what you do, not the machinery.
 */

const STEPS: { title: string; description: string }[] = [
  {
    title: 'Build a world',
    description:
      'Describe a setting — a noir city, a space opera, Middle Earth, the beaches of Normandy. Real or invented, the world is yours.',
  },
  {
    title: 'Create a character',
    description:
      'Decide who you play: their traits, their history, what they are after. The story leans on the details you give it.',
  },
  {
    title: 'Play the story',
    description:
      'Make choices and watch the story bend around them. No two playthroughs unfold the same way.',
  },
];

const PROMISES: { title: string; description: string }[] = [
  {
    title: 'Free to play',
    description:
      'It runs on your own provider key, set up once — so you are never footing the bill for anyone else.',
  },
  {
    title: 'Runs in your browser',
    description:
      'Your worlds, characters, and saves stay on your device. Export them any time for a backup.',
  },
  {
    title: 'No accounts',
    description:
      'Nothing to sign up for, no profile, no email. Just open it and start.',
  },
];

export default function Landing() {
  return (
    <main className="component-landing">
      <section className="component-landing-hero" aria-labelledby="landing-hero-heading">
        <p className="component-landing-eyebrow">A solo narrative RPG</p>
        <h1 id="landing-hero-heading" className="component-landing-title">
          Play a story in any world you can imagine
        </h1>
        <p className="component-landing-lead">
          Build a world, create a character, and make the choices that shape an
          adventure that adapts to you. Free, in your browser, and yours to keep.
        </p>
        <div className="component-landing-actions">
          <Link href="/worlds/create" className="component-landing-cta">
            Start your story
          </Link>
          <Link href="/about" className="component-landing-cta-secondary">
            How it works
          </Link>
        </div>
      </section>

      <section className="component-landing-steps" aria-labelledby="landing-steps-heading">
        <h2 id="landing-steps-heading" className="component-landing-section-title">
          How a story comes together
        </h2>
        <ol className="component-landing-step-list">
          {STEPS.map((step, index) => (
            <li key={step.title} className="component-landing-step">
              <span className="component-landing-step-number" aria-hidden="true">
                {index + 1}
              </span>
              <h3 className="component-landing-step-title">{step.title}</h3>
              <p className="component-landing-step-description">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="component-landing-note" aria-labelledby="landing-note-heading">
        <h2 id="landing-note-heading" className="component-landing-section-title">
          Straight about how it works
        </h2>
        <ul className="component-landing-note-list">
          {PROMISES.map((promise) => (
            <li key={promise.title} className="component-landing-note-item">
              <h3 className="component-landing-note-title">{promise.title}</h3>
              <p className="component-landing-note-description">
                {promise.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="component-landing-footer" aria-label="Site information">
        <Link href="/about" className="component-landing-footer-link">
          About
        </Link>
        <Link href="/privacy" className="component-landing-footer-link">
          Privacy
        </Link>
        <Link href="/terms" className="component-landing-footer-link">
          Terms
        </Link>
      </footer>
    </main>
  );
}
