---
version: 1
slug: "route-privacy"
primary_target: "route:/privacy"
related_targets: ["route:/terms"]
---

# Surface brief: `/privacy` and `/terms`

**Mode: Read.** Comprehension and wayfinding outrank expression here. These pages sit in the
brand register (same token scope as `/` and `/about`, see
`.impeccable/surfaces/route.md`) but they are not persuasion surfaces and should not inherit
the front door's expressive weight.

## 1. Job and audience

Someone checking a specific claim before they trust the product with anything. Usually
arriving from the footer of `/`, `/about`, or each other, with a question already in mind:
where does my data go, what happens to my API key, what am I agreeing to.

A smaller second case: someone who already plays and wants to confirm what "stays in your
browser" actually means.

Visitor mode: verifying. They are scanning for one answer, not reading top to bottom.

## 2. Outcome and proof

Primary task: find the relevant clause fast and understand it without a lawyer. Success is a
visitor who gets their answer and goes back to what they were doing.

The proof is the document itself plus the "Last updated" date. There is nothing else to show
and nothing to sell. Both pages currently lead with a plain-language one-line summary under
the title, which is the right instinct and should survive any redesign.

Do not add: trust badges, compliance logos, certification claims, or any assertion the
project can't back. None exist.

**Copy scope** (decided 2026-08-07): the page titles, the one-line plain-language leads, the
"Last updated" line, and the section headings are in scope for rewriting. **The legal clauses
themselves are not.** Rewriting privacy or terms language is a liability question rather than
a design one, and issue #1623 does not open it.

The footer links (`.component-legal-footer-link`) are also a live finding: their counterparts
on `/about` measure 20px tall against the stated 44px minimum. Check these against the same
bar when the shared `component-brand-*` primitives are extracted.

## 3. Selected direction

Likely OUTCOME: mostly unchanged. Issue #1623's Decision point 6 asks explicitly how far the
brand direction carries, and Read mode is where the honest answer is often "not very". These
pages may legitimately stay plain while `/` and `/about` change substantially.

What they should inherit regardless: the register's token values (canvas, gutter, dot grid),
so they read as the same family as the rest of the brand surface, and the shared
`component-brand-*` primitives once those exist.

What they should not inherit: hero imagery, expressive type treatment, or any structural
device from `/` that costs scanning speed.

## 4. Scope and boundaries

In scope: `legal.css`'s share of the shared brand primitives (footer nav, section title,
prose block), and whatever token inheritance falls out of the register split.

Untouched: the legal copy itself. Rewriting terms or privacy language is not a design task
and is out of scope for issue #1623.

Anti-goal: making these pages interesting at the cost of making them scannable.

## 5. States and ranges

Static server components, no dynamic states. `LegalPage` is a shared shell taking title,
lead, updated date, and children; `LegalSection` wraps each clause with a heading.

`/privacy` is roughly 94 lines of page source, `/terms` roughly 77. Both are short by legal
standards, which is a feature. Section count is in the handful, not the dozens, so a
table-of-contents device would be overhead rather than help at this length. Revisit only if
either document grows past roughly ten sections.

## 6. Interaction and layout

One column, generous measure, clear heading hierarchy. Headings are the navigation. The
"Last updated" line belongs near the title where a verifier looks first.

The three-link footer (`About`, `Privacy`, `Terms`) is the only interactive element besides
in-prose links. Keep the current-page link distinguishable from the other two.

Responsive to 320px.

## 7. Constraints and open decisions

- Plain CSS with design tokens. Stylelint rejects raw hex, named colors, and `rgb()`.
- WCAG 2.1 AA, both themes. Long-form reading makes contrast and line length load-bearing
  here more than anywhere else in the brand register.
- Both routes get `data-register="brand"`, so any token this register overrides applies to
  them too. Check `--page-gutter` and `--color-canvas` changes against legal's measure
  specifically; a gutter tuned for a hero can wreck a reading column.
- Both routes currently render a nested `<main>` inside the shell's `<main id="main-content">`.
  Same landmark defect as `/` and `/about`, fix together.
- `about.css:124` has a dead `counter-reset: about-step`; the marketing stylesheets have never
  been dead-selector audited (`scripts/audit-css.mjs` doesn't list them). Worth a pass while
  the primitives are being extracted.
