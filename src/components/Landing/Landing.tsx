import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { isPlaywrightEnv } from '@/lib/utils/isPlaywrightEnv';

/**
 * Landing — the free public front door for a first-time visitor (#1365).
 * Token-driven server component. Structural treatment (dot-grid, corner-bracket
 * cards, mono labels) lives in src/app/landing.css under .component-landing*
 * selectors (mirrors the About/dashboard pattern).
 *
 * Outcome-framed copy — it leads with the wedge (a structured solo RPG with
 * real skill checks and tracked state), not the machinery.
 */

const STEPS: { title: string; description: string }[] = [
  {
    title: 'Build a world',
    description:
      'Describe a setting: a noir city, a space opera, Middle Earth, the beaches of Normandy. Real or invented, the world is yours.',
  },
  {
    title: 'Create a character',
    description:
      'Decide who you play: their traits, their history, what they’re after. They have real skills, and the story leans on them.',
  },
  {
    title: 'Play the story',
    description:
      'Make choices and watch the story bend around them. Skill checks carry real stakes, and the world keeps track of the path you took.',
  },
];

const PROMISES: { title: string; description: string }[] = [
  {
    title: 'Your own key',
    description:
      'It runs on a key you get from a model provider, set up once and kept in your browser, so the stories you generate run on your own account.',
  },
  {
    title: 'Runs in your browser',
    description:
      'Your worlds, characters, and saves stay on your device. Export them any time for a backup.',
  },
  {
    title: 'No accounts',
    description:
      'Nothing to sign up for. No profile, no email. Just open it and start.',
  },
];

export default function Landing() {
  return (
    <main className="component-landing">
      <section className="component-landing-hero" aria-labelledby="landing-hero-heading">
        <p className="component-landing-eyebrow">A solo role-playing game</p>
        <h1 id="landing-hero-heading" className="component-landing-title">
          Play a story in any world you can imagine
        </h1>
        <p className="component-landing-lead">
          Build a world, create a character, and make the choices that steer the
          story. Your decisions are tested against your character’s skills, so
          what happens next is earned. It runs in your browser, and your stories
          are yours to keep.
        </p>
        <div className="component-landing-actions">
          <Link href="/worlds/create" className="component-landing-cta">
            Start your story
          </Link>
          <Link href="/about" className="component-landing-cta-secondary">
            How it works
          </Link>
        </div>
        <div className="component-landing-visual">
          <Image
            className="component-landing-visual-image"
            src="/visual-assets/world-cyberpunk.png"
            alt="A neon-lit city skyline from one of Narraitor's worlds"
            width={1024}
            height={426}
            priority
            unoptimized={isPlaywrightEnv()}
          />
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
          What to know up front
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

      <nav className="component-landing-footer" aria-label="Site information">
        <Link href="/about" className="component-landing-footer-link">
          About
        </Link>
        <Link href="/privacy" className="component-landing-footer-link">
          Privacy
        </Link>
        <Link href="/terms" className="component-landing-footer-link">
          Terms
        </Link>
      </nav>
    </main>
  );
}
