import React from 'react';
import clsx from 'clsx';
import { ArrowDown, ArrowRight } from 'lucide-react';
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
 * The player's side of the exchange is authored: `typed`, `caption`, `genre`,
 * and the character the prose was generated against. Everything else came back
 * from the model, and none of it is trimmed or tidied for length, because the
 * point of the section is that a visitor is reading what the product writes.
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
          From a single sentence to a living world.
        </h2>
        <div className="component-landing-pipeline">
          {/* Workbench: Setting + Rules */}
          <div className="component-landing-workbench">
            <div className="component-landing-stage-block">
              <span className="component-landing-stage-label">Your Premise</span>
              <div className="component-landing-typed">
                <p className="component-landing-typed-text">{world.typed}</p>
              </div>
            </div>

            <div className="component-landing-flow-divider-split" aria-hidden="true">
              <span className="component-landing-flow-split-line" />
              <div className="component-landing-flow-split-badge">
                <ArrowDown className="component-landing-flow-icon" size={14} strokeWidth={2} />
                <span>Generates</span>
              </div>
              <span className="component-landing-flow-split-line" />
            </div>

            <div className="component-landing-stage-block">
              <span className="component-landing-stage-label">World Rules</span>
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
                  {world.skillNames.map((name) => (
                    <span key={name} className="component-landing-trait">
                      {name}
                    </span>
                  ))}
                </dd>
              </dl>
            </div>
          </div>

          {/* Mechanical Arrow Divider */}
          <div className="component-landing-pipeline-arrow" aria-hidden="true">
            <ArrowRight className="component-landing-pipeline-arrow-icon" size={24} strokeWidth={2} />
          </div>

          {/* Manuscript Stage */}
          <div className="component-landing-manuscript-stage">
            <span className="component-landing-stage-label">The Opening Scene</span>
            <p className="component-landing-prose component-landing-prose-illuminated">{world.opening}</p>
          </div>
        </div>
      </div>


      <div className="component-landing-decision">
        <h2 className="component-landing-heading">And then you have to decide.</h2>

        {/* The block below is four options, a stat line, and prose that answers
            a check the visitor never saw start. Naming the sequence first is
            what makes the stat line legible as a verdict rather than a dice
            roll the page never explains. It stays one line: the exchange above
            narrates itself with labels, and this is the same device in prose
            because there are three beats to connect, not one to name. */}
        <p className="component-landing-decision-note">
          The option you take is checked against one of those skills. Miss the
          number, and the story bends to the failure instead of ignoring it.
        </p>

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
        </p>

        <p className="component-landing-prose component-landing-consequence">
          <span className="component-landing-consequence-lead">{consequenceLead}</span>
          {consequenceRest}
        </p>
      </div>
    </section>
  );
}
