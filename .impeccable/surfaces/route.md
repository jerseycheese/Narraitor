---
version: 1
slug: "route"
primary_target: "route:/"
related_targets: ["route:/about"]
---

# Surface brief: `/` and `/about`

**Mode: Persuade.** Chosen from the surface, not the product. Narraitor's app is an Operate
tool, but its front door has to convince a stranger this is worth their setup effort. See
`.impeccable/surfaces/route-privacy.md` (Read) and `route-dashboard.md` (Operate) for the
other two surfaces.

Baseline critique, 2026-08-07 (dual-agent, isolated):
`/` scored **20/36**, `/about` scored **18/36** (heuristic 7 `n/a` on both). Snapshots at
`.impeccable/critique/2026-08-07T05-52-39Z__src-components-landing-landing-tsx.md` and
`...__src-components-about-about-tsx.md`.

## 1. Job and audience

A first-time visitor who has never heard of Narraitor, arriving cold from a link or a search.
They're curious about solo RPGs or generated storytelling and are deciding, in about fifteen
seconds, whether this is a toy or a real thing. Visitor mode: evaluating, skeptical, unwilling
to sign up for anything.

Returning visitors are not this audience. `ReturningUserRedirect` soft-navigates them from `/`
to `/dashboard`, so the persuade surface only ever has to work on people who haven't played.

**The two pages have separate jobs, and today they don't.** Decided 2026-08-07:

- **`/` sells the premise.** A stranger's fifteen seconds. It argues that a world you author
  steers a story with real stakes.
- **`/about` proves the mechanism.** It shows what `/` asserts: a real turn, a skill check
  that fails, the story bending because of it, the world data visibly steering the prose. It
  is the evidence page, not a longer sales page.

Today `/about` is a quieter reskin of `/`: the same three steps with reworded descriptions
("Define a setting" versus "Describe a setting"), the same hero image, and a "Your own key"
section near-verbatim from the landing's promise card. Both reviews independently concluded it
does not currently earn a URL. Fixing that is in scope.

## 2. Outcome and proof

Primary action on `/`: start a world (`/worlds/create`). Secondary: read `/about`.
Primary action on `/about`: create a first world, **at `/worlds/create`, not `/worlds`**.
Success is a visitor who reaches the world wizard already knowing they'll need their own
Gemini key, and doesn't bounce when asked.

The honest proof available:

- The product runs, and the play loop works end to end. **Screenshots of a real turn are the
  strongest asset on hand and are currently unused.** Both reviews named this independently.
- It's open source at github.com/jerseycheese/Narraitor. Currently the quietest fact on
  `/about` and absent from `/` entirely.
- Nothing to sign up for. No account, no email, data stays in the browser.
- The differentiator worth showing rather than asserting: skill checks with real stakes, and a
  world the generator actually reads. "A failed roll bends the story instead of handing you a
  win" is the best sentence currently on either page, and it is pure assertion.

What must never appear: user counts, testimonials, reviews, press, awards, benchmarks, or the
word "free". None of those exist. See PRODUCT.md, "Evidence on Hand". Note that `landing.css`
carries "free" in three comments (lines 3, 6, 208); internal today, but it leaks.

## 3. Selected direction

**CHOSEN 2026-08-07.** Sketch: `.impeccable/sketches/combined.webp`. High-fidelity mockups
still pending.

The page runs in two set-pieces with a hard break between them:

**First, "what you typed, what you got."** Two wide rows. Each pairs a narrow dark block
holding the handful of words someone actually typed to describe a world against a full,
dense passage of the prose it produced, with an accent marker pointing from one to the other.
Two rows, not three: enough to show range without labouring it. This establishes the claim
nothing else can copy, that your world is the input rather than a preset.

**Then, "the choice, at scale."** A short passage of story, then three choice blocks stacked
down a narrow centred column at a size that dominates the page, one marked as the path taken.
Below them, what happened, with the sentence a failed skill check bent picked out in the
accent colour. This establishes that you play it and that decisions cost something.

The two halves survive together because they are not the same argument twice. The first is
about before you play, the second about while you play. That is a real order.

Two things keep it from turning into a muddle, and both are binding:

1. **They must run on different axes.** The first half is wide, horizontal, split, and carries
   heavy dark blocks that bleed to the page edge. The second is narrow, centred, vertical, and
   sits entirely on paper with no dark blocks at all. A thick full-width rule with generous
   space around it separates them.
2. **Length is the real risk.** Two set-pieces make a long page, and `/about` already runs
   2661px at 375px wide. Watch the mobile height, and cut before adding.

Build note from the sketch: the three choice blocks need materially more weight than the
sketch gives them. They are meant to be the largest elements on the page and currently read
about the same as everything around them.

**Ruled out by the user, 2026-08-07, and this constraint outlives this issue:** no app UI
anywhere on the marketing surfaces. Real screenshots of features would not impress anyone yet.
That leaves the generated writing (ready now) and generated world art (producible on demand
through the Gemini key in `.env.local`) as the only material these pages may show. It also
means PRODUCT.md's "Evidence on Hand" claim that real play captures are the strongest unused
asset is true in principle but not yet actionable.

How this got here: the tool rolled a structure at random from a written list each round, so the
outcome would not just be the first thing anyone ranked highest. Four rounds ran. Rejected on
the way: story-with-margin-notes and the setup list (both too quiet), the specimen wall
(depends on app screenshots), and prose-as-design (pulled by me for failing the stated punch
requirement). The shortlist was the opening lines, the choice at scale, and what-you-typed;
the user took the last two combined.

Fixed before the roll started, and not up for reinvention:

- DS3 "Mechanical Manuscript" is the visual world. Established, inherited, not replaced.
- Newsreader / Fira Code / DM Sans. No new typefaces.
- No third chrome. This surface lives inside the existing app shell and differentiates
  through token values and page-level structure, never through new shell geometry.

The critique's framing of the current state, which the direction has to answer: DS3 is real at
component scale (corner brackets, mono eyebrows, Fira Code number chips, dot grid) and absent
at composition scale. The manuscript is applied as ornament on a layout decided independently
of the brand. A direction that only re-skins is a failed direction.

## 4. Scope and boundaries

In scope: `/` and `/about` page-level composition, their copy, the shared brand primitives
underneath them, and the token values separating this register from the product register.

Untouched: the header component and its geometry, `--content-max-width`, the DS3 type scale
(calibrated deliberately), and the text/accent contrast contracts. Overriding
`--content-max-width` would move the header on brand pages, which is the third chrome arriving
through the back door.

Anti-goals: a marketing page that looks like it came from a different product than the app;
neon or game-UI sheen; "powered by AI" framing of any kind; invented social proof.

## 5. Carried findings (Decision point 0, resolved 2026-08-07)

All six cross-cutting critique findings carry into this brief. Each was independently measured.

1. **The key requirement is unactionable and mispositioned.** Named only as "a key you get
   from a model provider" on both pages: no provider, no link, no cost, no time estimate.
   Placed fourth of six on `/about`, band three on `/`, roughly 900 to 1400px from the CTA it
   gates. On `/` it measures **4.35:1** on the accent-soft band, under the 4.5:1 AA minimum.
   The most important honesty text on the site is the only text failing contrast. Naming Google
   and Gemini is permitted; the no-AI-in-copy rule does not forbid naming the provider.
2. **The CTAs disagree.** `/` goes to `/worlds/create`, `/about` goes to `/worlds` (a
   management list headed "My Worlds" with a spinner and two indistinguishable buttons). The
   header's "Create Your First World" also competes with the hero's "Start your story" for the
   same act. One destination, one verb, across both pages.
3. **The hero image.** Both pages render the same `world-cyberpunk.png`: a neon photoreal city
   with garbled signage and a visible generator signature, on a brand that names neon and
   game-UI sheen as anti-references. Alt text claims it is "one of Narraitor's worlds", which
   implies authored evidence it is not. Replace with real play capture. Resolves at Decision
   point 5.
4. **No hierarchy below the h1.** Section `h2`s render at 13px mono secondary, smaller and
   dimmer than the 17px semibold `h3`s beneath them; `/about` has six equal-weight blocks on a
   measured 24/16/12px gap ladder that cannot separate groups at 1.5:1. **Fix scoped to brand
   pages only** (decided 2026-08-07): add a real heading beneath the mono eyebrow on `/` and
   `/about`, and leave the app's convention untouched. The app keeps the label style where
   density matters more than scannability.
5. **Ragged right edge.** Prose caps at `--page-width-prose` (768px) while section bands run
   1104 to 1200px, so the right edge jumps four times down `/about` and the hero image on `/`
   stops 386px short of the cards below it. Commit to one measure or give the outer column a
   deliberate job (a marginalia rail is in the DS3 spirit).
6. **`--color-accent-soft` is not an accent.** At 10% over paper it resolves to
   `rgb(228, 227, 225)`, neutral gray, in both themes. Both consumers (the note band on `/`,
   the CTA band on `/about`) lose the accent identity, so the one band on each page that
   signals "read this" carries no signal.

Also carried, smaller: `.component-landing-cta-secondary` measures 101 x 22.5px and
`.component-about-footer-link` 20px tall, both against the stated 44px minimum; `/` has no
closing CTA, ending on "About Privacy Terms" after ~1900px of argument; `/about` prose runs
~96 characters per line at 768px on a product whose first principle is that legibility wins.

Explicitly NOT carried: `cream-palette`, `kicker-above-heading`, and the 12 `landing.css`
font-size detector findings, all rejected as false positives (the first two fight the design
system on purpose, the third reads a stale DS1 ramp out of DESIGN.md). The nested `<main>`
defect is real but app-shell-wide (confirmed on `/worlds` too) and is filed separately. The
"DevTools in tab order" observation was a dev-server artifact; `ClientOnlyDevTools` gates on
`NODE_ENV !== 'development'`.

## 6. Copy

Copy is in scope for both pages and gets its own pass, not a smuggled-in edit during the
visual work. Run `/impeccable clarify` per surface after the direction lands.

Guardrails, all from PRODUCT.md:

- "AI" never appears in player-facing copy. Not in labels, not in marketing text. Naming
  **Google Gemini** as the key provider is allowed and required by finding 1; that is a
  provider name, not an AI mention.
- Never the word "free". No user counts, testimonials, press, reviews, or benchmarks.
- The provider-key ask gets handled honestly. Burying it is a worse surface, not a better one.
- Voice: no em dashes. Contractions. No corporate speak.

Named copy targets: the duplicated three steps (one page should stop repeating the other), the
CTA verb disagreement, and the copy-pasted key sentence, which is the highest-stakes sentence
on the site and currently reads as a footnote on both pages.

## 7. States and ranges

Both pages are static server components with hardcoded content. No empty, loading, or error
states. The one dynamic behavior is the returning-user redirect off `/`.

Content is fixed and small: `/` has one hero, three steps, three promises, a three-link footer.
`/about` has one hero, six sections, one CTA, a two-link footer. Any direction that needs long
or variable content to work is the wrong direction.

## 8. Interaction and layout

Hierarchy on `/`: headline, then lead, then the primary CTA, then the visual. Steps and
promises are scannable secondary bands. The footer is the quiet exit to legal.

Responsive down to 320px. `tests/visual/mobile-overflow.spec.ts` already asserts header
collapse at 320 and 375 on `/about`; don't break it. Note that at 375px `/about` is 2661px
tall with its CTA at y=2264, and the header's create button collapses into the hamburger, so
there is currently no reachable CTA above the fold on mobile at all.

## 9. Constraints and open decisions

- Plain CSS with design tokens. No Tailwind, no `cva`/`cn()`. Stylelint rejects raw hex, named
  colors, and `rgb()` in product CSS.
- WCAG 2.1 AA: 4.5:1 text contrast in both light and dark, visible focus, keyboard operable,
  200% text resize, 44px touch targets, honor reduced-motion.
- Every token this register overrides must define both a light and a dark value. The register
  block sets tokens on a descendant of `<html>`, so a missing dark value silently falls back to
  the light one.
- Measured baseline for the register work: `--page-gutter` is responsive (1rem narrow, 1.5rem
  at 1280), `--color-canvas` is `rgb(247 243 237)` light and `rgb(23 19 16)` dark,
  `--content-max-width` is 1200px in both, and `.breadcrumbs-container` is absent on `/` but
  present on `/about` (the bug Phase 2d fixes).
- `landing.css`, `about.css`, and `legal.css` each carry their own copy of the footer nav, the
  mono-label section title, the corner-bracket card marks, the step card, the image frame, and
  the accent CTA. Several are byte-for-byte identical. Collapse them into shared
  `component-brand-*` primitives rather than restyling the same thing three times.
- A builder must not invent: pricing, licensing, availability claims, or any evidence not
  listed in section 2.
