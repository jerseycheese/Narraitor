import React from 'react';
import Link from 'next/link';

/**
 * About — the marketing/explainer page for Narraitor. Token-driven, server
 * component. Per-theme structural treatment lives in src/app/about.css under
 * [data-theme="dsN"] .component-about* selectors (mirrors the dashboard pattern).
 */

const STEPS: { title: string; description: string }[] = [
  {
    title: 'Build a world',
    description:
      'Define a setting — Middle Earth, a noir city, a space opera, the beaches of Normandy. Real or invented, the world is yours to describe.',
  },
  {
    title: 'Create characters',
    description:
      'Shape who you play: their traits, their history, what they want. The story leans on the details you give them.',
  },
  {
    title: 'Play the story',
    description:
      'Step in and make choices. The narrative responds to what you do, so no two playthroughs unfold the same way.',
  },
];

export default function About() {
  return (
    <>
      <main className="component-about">
        <section className="component-about-hero" aria-labelledby="about-hero-heading">
          <h1 id="about-hero-heading" className="component-about-title">
            About Narraitor
          </h1>
          <p className="component-about-lead">
            Narraitor is a narrative RPG you play on your own, in any world you can
            describe. Pick a setting, create a character, and make the choices that
            steer the story — one that adapts to you as you go.
          </p>
        </section>

        <section className="component-about-section" aria-labelledby="about-what-heading">
          <h2 id="about-what-heading" className="component-about-section-title">
            What it is
          </h2>
          <div className="component-about-prose">
            <p>
              It is a solo role-playing experience for any world — fictional or
              real. Want to walk the streets of a rain-soaked detective city,
              command a starship at the edge of known space, or live a quiet story
              somewhere entirely of your own making? You set the stage, and the
              choices you make shape where the story goes.
            </p>
            <p>
              There is no fixed script. Every decision matters, and the narrative
              bends around the path you take.
            </p>
          </div>
        </section>

        <section className="component-about-section" aria-labelledby="about-how-heading">
          <h2 id="about-how-heading" className="component-about-section-title">
            How it works
          </h2>
          <ol className="component-about-steps">
            {STEPS.map((step, index) => (
              <li key={step.title} className="component-about-step">
                <span className="component-about-step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <h3 className="component-about-step-title">{step.title}</h3>
                <p className="component-about-step-description">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="component-about-section" aria-labelledby="about-privacy-heading">
          <h2 id="about-privacy-heading" className="component-about-section-title">
            Your stories stay with you
          </h2>
          <div className="component-about-prose">
            <p>
              Your worlds, characters, and saved stories live right in your
              browser — kept on your own device, with no account to sign up for.
              Come back any time and pick up where you left off.
            </p>
          </div>
        </section>

        <section className="component-about-section" aria-labelledby="about-credit-heading">
          <h2 id="about-credit-heading" className="component-about-section-title">
            Who made it
          </h2>
          <div className="component-about-prose component-about-credit">
            <p>
              Narraitor was created by Jack as a personal project, and it is
              open-source. You can read the code, file an issue, or help shape where
              it goes next on{' '}
              <a
                href="https://github.com/jerseycheese/Narraitor"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              .
            </p>
          </div>
        </section>

        <section className="component-about-cta" aria-labelledby="about-cta-heading">
          <h2 id="about-cta-heading" className="component-about-section-title">
            Ready to begin?
          </h2>
          <Link href="/worlds" className="component-about-cta-link">
            Create your first world
          </Link>
        </section>
      </main>

      <nav className="component-about-footer" aria-label="Site information">
        <Link href="/privacy" className="component-about-footer-link">
          Privacy
        </Link>
        <Link href="/terms" className="component-about-footer-link">
          Terms
        </Link>
      </nav>
    </>
  );
}
