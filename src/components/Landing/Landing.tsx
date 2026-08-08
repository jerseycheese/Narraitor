import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LandingWorldPane from './LandingWorldPane';
import { HOMEPAGE_SHOWCASE } from './homepageShowcase.generated';

/**
 * Landing — the front door for someone who has never heard of Narraitor and is
 * deciding, in about fifteen seconds, whether this is a toy or a real thing.
 *
 * The argument is made with the product's own output rather than claims about
 * it: pick a world and the page becomes that world, down to the prose. See
 * .impeccable/surfaces/route.md for the direction and what it rules out.
 *
 * Server component, deliberately. The world switcher is native radios plus
 * sibling and :has() selectors in landing.css, so it needs no JavaScript and
 * all four worlds ship in the HTML. Structural treatment lives under
 * .component-landing* there.
 */

const GEMINI_KEY_URL = 'https://aistudio.google.com/apikey';
const START_HREF = '/worlds/create';
const START_LABEL = 'Start your story';

export default function Landing() {
  return (
    <div className="component-landing">
      <section
        className="component-landing-band component-landing-hero"
        aria-labelledby="landing-hero-heading"
      >
        {HOMEPAGE_SHOWCASE.map((world, index) => (
          <Image
            key={world.id}
            className="component-landing-hero-art"
            data-world={world.id}
            src={`/visual-assets/worlds/${world.id}.webp`}
            /* Decorative: the plate strip below names each world in text, and
               four alt strings on stacked images would be read out as four
               unrelated descriptions with no way to tell which is showing. */
            alt=""
            fill
            sizes="(max-width: 1296px) 100vw, 1200px"
            priority={index === 0}
          />
        ))}
        <div className="component-landing-hero-scrim" aria-hidden="true" />

        <div className="component-landing-band-inner component-landing-hero-copy">
          <h1 id="landing-hero-heading" className="component-landing-title">
            Play a story in any world you can imagine
          </h1>
          <p className="component-landing-lead">
            You describe the world. What comes back is written for that world,
            and the choices you make get tested against skills that can fail.
          </p>
          <div className="component-landing-actions">
            <Link href={START_HREF} className="component-landing-cta">
              {START_LABEL}
            </Link>
            <Link href="/about" className="component-landing-cta-secondary">
              How it works
            </Link>
          </div>
        </div>
      </section>

      <div className="component-landing-selector">
        {HOMEPAGE_SHOWCASE.map((world) => (
          <p
            key={world.id}
            className="component-landing-showing"
            data-world={world.id}
          >
            <span className="component-landing-label">Now showing</span>
            {world.caption}
          </p>
        ))}

        <fieldset className="component-landing-plates">
          <legend className="sr-only">Choose a world to preview</legend>
          {HOMEPAGE_SHOWCASE.map((world, index) => (
            <div key={world.id} className="component-landing-plate">
              <input
                type="radio"
                name="landing-world"
                id={`landing-world-${world.id}`}
                className="component-landing-plate-input"
                defaultChecked={index === 0}
              />
              <label
                htmlFor={`landing-world-${world.id}`}
                className="component-landing-plate-label"
              >
                <span className="component-landing-plate-thumb">
                  <Image
                    src={`/visual-assets/worlds/${world.id}.webp`}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 45vw, 280px"
                  />
                </span>
                <span className="component-landing-plate-caption">
                  {world.caption}
                </span>
              </label>
            </div>
          ))}
        </fieldset>
      </div>

      {HOMEPAGE_SHOWCASE.map((world) => (
        <LandingWorldPane key={world.id} world={world} />
      ))}

      <section
        className="component-landing-band component-landing-closing"
        aria-labelledby="landing-closing-heading"
      >
        <div className="component-landing-band-inner component-landing-closing-inner">
          <h2 id="landing-closing-heading" className="component-landing-closing-text">
            Bring your own Google Gemini key. It takes about two minutes to set
            up, it stays in your browser, and there is no account to make.
          </h2>
          <div className="component-landing-actions">
            <Link href={START_HREF} className="component-landing-cta">
              {START_LABEL}
            </Link>
            <a
              href={GEMINI_KEY_URL}
              className="component-landing-cta-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get a Gemini key
            </a>
          </div>
        </div>
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
    </div>
  );
}
