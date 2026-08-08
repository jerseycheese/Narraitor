import React from 'react';
import clsx from 'clsx';
import type { ShowcaseWorld } from './homepageShowcase.generated';

/**
 * One world's evidence: what someone typed, the prose that came back, the
 * decision three turns in, and what a failed check did to it.
 *
 * Everything except `typed` and `caption` is real generated output. Nothing
 * here is trimmed or tidied for length, because the point of the section is
 * that a visitor is reading what the product actually writes.
 *
 * Four of these render into the HTML and CSS shows one, so the page stays a
 * static server component and the world switcher works with JavaScript off.
 */

/**
 * Picks out the opening sentence so it can carry the accent.
 *
 * [\s\S] rather than . with the dotAll flag: the project targets ES2017 and
 * the s flag needs ES2018. Generated prose does contain newlines, so the
 * class has to match them.
 */
function splitFirstSentence(text: string): [string, string] {
  const match = text.match(/^([\s\S]*?[.!?])(\s+[\s\S]*)$/);
  return match ? [match[1], match[2]] : [text, ''];
}

export default function LandingWorldPane({ world }: { world: ShowcaseWorld }) {
  const [consequenceLead, consequenceRest] = splitFirstSentence(world.consequence);

  return (
    <section
      className="component-landing-pane"
      data-world={world.id}
      aria-label={world.caption}
    >
      <div className="component-landing-exchange">
        <h2 className="component-landing-heading">You wrote this. It wrote that.</h2>
        <div className="component-landing-exchange-grid">
          <div className="component-landing-typed">
            <p className="component-landing-label">Your world</p>
            <p className="component-landing-typed-text">{world.typed}</p>
          </div>
          <div className="component-landing-returned">
            <p className="component-landing-label">What came back</p>
            <p className="component-landing-prose">{world.opening}</p>
          </div>
        </div>
      </div>

      <div className="component-landing-decision">
        <h2 className="component-landing-heading">And then you have to decide.</h2>

        {/* world.situation is captured but not rendered. It was the passage the
            choices answer, and reading it made them make sense, but it put a
            third block of body prose on a page whose job is fifteen seconds.
            The choices carry themselves at this size. */}
        <ol className="component-landing-choices">
          {world.options.map((option) => (
            <li
              key={option.text}
              className={clsx(
                'component-landing-choice',
                option.taken && 'component-landing-choice-taken'
              )}
            >
              <span className="component-landing-choice-text">{option.text}</span>
              {option.taken && (
                <span className="component-landing-choice-mark">You chose this</span>
              )}
            </li>
          ))}
        </ol>

        <p className="component-landing-check">
          <span className="component-landing-check-skill">{world.check.skillName}</span>
          <span className="component-landing-check-verdict">Failed</span>
          <span className="component-landing-check-roll">
            rolled {world.check.total}, needed {world.check.dc}
          </span>
        </p>

        <p className="component-landing-prose component-landing-consequence">
          <span className="component-landing-consequence-lead">{consequenceLead}</span>
          {consequenceRest}
        </p>
      </div>
    </section>
  );
}
