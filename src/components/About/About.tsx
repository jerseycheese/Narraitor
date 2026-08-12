import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { isPlaywrightEnv } from '@/lib/utils/isPlaywrightEnv';

/**
 * About — the marketing/explainer page for Narraitor. Token-driven, server
 * component. Structural treatment lives in src/app/about.css under
 * .component-about* selectors (mirrors the dashboard pattern).
 *
 * Copy leads with the wedge (a structured solo RPG with real skill checks and
 * tracked state), explains the provider key in plain terms, and stays
 * outcome-framed.
 */

const STEPS: { title: string; description: string }[] = [
  {
    title: 'Build a world',
    description:
      'Define a setting: Middle Earth, a noir city, a space opera, the beaches of Normandy. Real or invented, the world is yours to describe.',
  },
  {
    title: 'Create characters',
    description:
      'Shape who you play: their traits, their history, what they want. They have real skills, and the story leans on them.',
  },
  {
    title: 'Play the story',
    description:
      'Step in and make choices. The story responds to what you do, so no two playthroughs unfold the same way.',
  },
];

export default function About() {
  return (
    <main className="component-about">
      <section className="component-about-hero" aria-labelledby="about-hero-heading">
        <h1 id="about-hero-heading" className="component-about-title">
          About Narraitor
        </h1>
        <p className="component-about-lead">
          Narraitor is a solo role-playing game where the story answers to the
          world you built. Define a setting, create a character with real
          strengths and weaknesses, and make the choices that steer the story.
          It adapts to what you do, and your character’s skills decide how far
          you get.
        </p>
        <div className="component-about-hero-visual">
          <Image
            className="component-about-hero-image"
            src="/visual-assets/world-cyberpunk.png"
            alt="A neon-lit city skyline from one of Narraitor's worlds"
            width={1024}
            height={426}
            priority
            unoptimized={isPlaywrightEnv()}
          />
        </div>
      </section>

      <section className="component-about-section" aria-labelledby="about-what-heading">
        <h2 id="about-what-heading" className="component-about-section-title">
          What it is
        </h2>
        <div className="component-about-prose">
          <p>
            It’s a structured RPG, not a chat. You set the world and your
            character, then play through a story that keeps track of what
            you’ve done and what it cost you. Walk a rain-soaked detective
            city, command a starship at the edge of known space, or live a
            quiet story somewhere of your own making. You set the stage, and
            the choices you make shape where it goes.
          </p>
          <p>
            Skill checks carry real stakes. Some choices ask more of your
            character than others, and a failed roll bends the story instead
            of handing you a win. There’s no fixed script, and the world
            remembers the path you took.
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

      <section className="component-about-section" aria-labelledby="about-free-heading">
        <h2 id="about-free-heading" className="component-about-section-title">
          Your own key
        </h2>
        <div className="component-about-prose">
          <p>
            Narraitor runs on a key you get from a model provider, set up once
            and kept in your browser, so the stories you generate run on your
            own account.
          </p>
        </div>
      </section>

      <section className="component-about-section" aria-labelledby="about-privacy-heading">
        <h2 id="about-privacy-heading" className="component-about-section-title">
          Your stories stay with you
        </h2>
        <div className="component-about-prose">
          <p>
            Your worlds, characters, and saved stories live right in your
            browser, on your own device, with no account to sign up for. Come
            back any time and pick up where you left off.
          </p>
        </div>
      </section>

      <section className="component-about-section" aria-labelledby="about-credit-heading">
        <h2 id="about-credit-heading" className="component-about-section-title">
          Who made it
        </h2>
        <div className="component-about-prose component-about-credit">
          <p>
            Narraitor is an open-source project. You can read the code, file an
            issue, or help shape where it goes next on{' '}
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

      <nav className="component-about-footer" aria-label="Site information">
        <Link href="/about" className="component-about-footer-link">
          About
        </Link>
        <Link href="/faq" className="component-about-footer-link">
          FAQ
        </Link>
        <Link href="/privacy" className="component-about-footer-link">
          Privacy
        </Link>
        <Link href="/terms" className="component-about-footer-link">
          Terms
        </Link>
      </nav>
    </main>
  );
}
