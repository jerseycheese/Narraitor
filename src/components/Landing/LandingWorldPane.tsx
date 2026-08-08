import React from 'react';
import clsx from 'clsx';
import type { ShowcaseWorld } from './homepageShowcase.generated';

/**
 * One world's evidence: what someone typed, the attributes and skills that got
 * built from it, the prose that came back, the decision three turns in, and
 * what a failed check did to it.
 *
 * The attribute and skill lists are load-bearing, not decoration. Describing a
 * world is one step of five in the creation wizard; the other four turn that
 * description into reviewable data, and that data is what the generator reads
 * every turn. Without it on the page, the skill check at the bottom reads as a
 * generic dice roll instead of a world the visitor watched get built, and the
 * copy has to gesture at a mechanism it never shows.
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
        <h2 className="component-landing-heading">
          You wrote this. Everything else came from it.
        </h2>
        <div className="component-landing-exchange-grid">
          <div className="component-landing-authored">
            <div className="component-landing-typed">
              <p className="component-landing-label">What you wrote</p>
              <p className="component-landing-typed-text">{world.typed}</p>
            </div>

            {/* The bridge the page used to skip. The skill named in the failed
                check below is one of these, so a visitor meets it here first. */}
            <div className="component-landing-built">
              <p className="component-landing-label">What it built</p>
              <dl className="component-landing-traits">
                <dt className="component-landing-trait-term">Attributes</dt>
                <dd className="component-landing-trait-list">
                  {world.attributeNames.map((name) => (
                    <span key={name} className="component-landing-trait">
                      {name}
                    </span>
                  ))}
                </dd>
                <dt className="component-landing-trait-term">Skills</dt>
                <dd className="component-landing-trait-list">
                  {/* The skill that fails below is deliberately NOT marked here.
                      A highlight the visitor can't explain yet is worse than the
                      connection it buys, and the check block makes it anyway by
                      naming a skill they've already read. */}
                  {world.skillNames.map((name) => (
                    <span key={name} className="component-landing-trait">
                      {name}
                    </span>
                  ))}
                </dd>
              </dl>
            </div>
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
