import React from 'react';
import { render, screen, within } from '@testing-library/react';
import Landing from '../Landing';
import { HOMEPAGE_SHOWCASE } from '../homepageShowcase.generated';

/**
 * MVP coverage for the homepage. Direction and constraints:
 * .impeccable/surfaces/route.md. Four tests, one per claim the page has to
 * keep making after someone edits it:
 *
 *   1. one verb and one destination for the primary act
 *   2. all four worlds ship in the HTML behind native radios, which is the
 *      proof that the CSS-only switcher works with JavaScript off
 *   3. the key ask is actionable: named provider, live link, time estimate
 *   4. the copy rules hold
 *
 * Every assertion is on structure, ids, or the authored captions.
 * homepageShowcase.generated.ts is re-rolled by
 * scripts/generate-homepage-showcase.mjs, so asserting on the model's prose
 * would turn a regeneration into a test failure.
 *
 * next/image is deliberately not mocked. Under jsdom it renders a plain <img>
 * with alt="" (role presentation), so the eight hero and thumbnail images
 * contribute no roles and no accessible names to the queries below.
 *
 * The / entry decision lives in src/app/__tests__/page.test.tsx.
 */

const START_HREF = '/worlds/create';
const GEMINI_KEY_URL = 'https://aistudio.google.com/apikey';

describe('Landing page', () => {
  it('leads with the headline and points both CTAs at one destination', () => {
    render(<Landing />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /answers to the world you built/i,
      })
    ).toBeInTheDocument();

    // Two of them on purpose, the hero and the closing band. The CTAs used to
    // disagree about both verb and destination, so the point of the count is
    // that both now say the same thing and go the same place.
    const ctas = screen.getAllByRole('link', { name: 'Build your world' });
    expect(ctas).toHaveLength(2);
    ctas.forEach((cta) => expect(cta).toHaveAttribute('href', START_HREF));
  });

  it('ships every world in the HTML behind a native radio switcher', () => {
    const { container } = render(<Landing />);

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(HOMEPAGE_SHOWCASE.length);
    expect(radios[0]).toBeChecked();
    radios.slice(1).forEach((radio) => expect(radio).not.toBeChecked());

    // One radio and one pane per world, both keyed off the same id so the
    // :has() rules in landing.css have something to pair. All four panes are
    // in the document with no JavaScript run, which is the whole reason the
    // page can stay a server component.
    //
    // The label lookup is scoped to the fieldset because each pane carries the
    // same caption as its aria-label, so an unscoped query matches both.
    const switcher = screen.getByRole('group', {
      name: /choose a world to preview/i,
    });

    HOMEPAGE_SHOWCASE.forEach((world) => {
      expect(within(switcher).getByLabelText(world.caption)).toHaveAttribute(
        'id',
        `landing-world-${world.id}`
      );
      expect(
        container.querySelector(
          `.component-landing-pane[data-world="${world.id}"]`
        )
      ).toBeInTheDocument();
    });
  });

  it('shows the world each story was built from, and checks against it', () => {
    const { container } = render(<Landing />);

    HOMEPAGE_SHOWCASE.forEach((world) => {
      const pane = container.querySelector(
        `.component-landing-pane[data-world="${world.id}"]`
      ) as HTMLElement;

      const traits = Array.from(
        pane.querySelectorAll('.component-landing-trait')
      ).map((el) => el.textContent);

      expect(traits).toEqual([...world.attributeNames, ...world.skillNames]);

      // The connection the section exists to make: the skill that fails is one
      // the visitor already read in the list above. A regeneration that lands a
      // check outside the world's own skills breaks the argument, not just the
      // wording, so it fails here rather than shipping.
      expect(world.skillNames).toContain(world.check.skillName);
    });
  });

  it('makes the Gemini key ask actionable', () => {
    render(<Landing />);

    const keyLink = screen.getByRole('link', { name: /gemini key/i });
    expect(keyLink).toHaveAttribute('href', GEMINI_KEY_URL);
    expect(screen.getByText(/two minutes/i)).toBeInTheDocument();
  });

  it('keeps "free" and "AI" out of the rendered page', () => {
    const { container } = render(<Landing />);
    const rendered = container.textContent ?? '';

    // The guard covers the generated prose as well as the authored copy: a
    // visitor cannot tell which is which, so a re-roll that writes "free hand"
    // is a re-roll to redo, not an exception to carve out.
    expect(rendered).not.toMatch(/\bfree\b/i);
    expect(rendered).not.toMatch(/\bAI\b/i);
  });

  it('keeps tabletop jargon out of the rendered page', () => {
    const { container } = render(<Landing />);
    const rendered = container.textContent ?? '';

    expect(rendered).not.toMatch(/\brolled\b/i);
    expect(rendered).not.toMatch(/\bd20\b/i);
    expect(rendered).not.toMatch(/\bDC\b/);
  });
});
