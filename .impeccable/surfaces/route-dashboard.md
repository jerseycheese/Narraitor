---
version: 1
slug: "route-dashboard"
primary_target: "route:/dashboard"
related_targets: ["route:/worlds","route:/characters"]
---

# Surface brief: the app shell (`/dashboard`, `/worlds`, `/characters`, and the rest)

**Mode: Operate.** This brief covers the product register: everything behind the front door.
It exists mainly to define what the brand register is differentiating *from*, and to fence off
what issue #1623 must not touch. See `.impeccable/surfaces/route.md` (Persuade) and
`route-privacy.md` (Read).

## 1. Job and audience

Someone who already plays. They have worlds and characters they made earlier, and they're here
to resume, manage, or create. Sessions are long and repeat over weeks.

Visitor mode: working. They know what the product is; they want fewer obstacles between them
and the story. This is also where returning visitors land, since `ReturningUserRedirect` sends
them from `/` to `/dashboard`.

## 2. Outcome and proof

Primary task varies by route: resume a session, create or edit a world, create or edit a
character, read the journal, adjust settings. Success is that none of it draws attention to
itself. The generated story is the hero, and the chrome's job is to get out of the way.

There is no persuasion to do here and no proof to present. The user has already decided.

## 3. Selected direction

SETTLED, and issue #1623 does not reopen it. DS3 "Mechanical Manuscript" as it currently
ships: aged paper canvas, drafting ink, dot-grid background on `.app-surface-app`, corner
brackets, mono labels. The `--pattern-dot-grid-image` token and the app shell's geometry are
the product register's signature.

The `#1622` and `#1677` type-scale work has already landed. DESIGN.md's type numbers are
stale (still DS1's, under an honesty-pass banner) and `#1626` rewrites that file. Read
`src/lib/theme/themes/ds3.css` and `_shared-tokens.css` as the token truth, not DESIGN.md's
prose.

## 4. Scope and boundaries

Issue #1623 touches this surface in exactly two mechanical ways and nothing else:

1. `AppSurfaceShell` gains a `data-register` attribute on the app branch. Product routes get
   `data-register="product"`, which changes no token values; the attribute exists so the brand
   register has something to hang off.
2. Breadcrumb suppression moves from a route denylist to a register check, so brand routes
   stop rendering a "Worlds" crumb. Product routes keep the breadcrumbs they have.

Untouched: every token value, the header component and its geometry, `--content-max-width`,
the DS3 type scale, and the `--color-text-*` / `--color-accent` / `--color-on-accent` contrast
contracts. If a change to this surface is visible, issue #1623 has overreached.

Manuscript mode (the chrome-free play surface) gets no `data-register` at all. It has no
register to differentiate, and adding one would invite exactly the drift DESIGN.md warns
about.

## 5. States and ranges

Rich, unlike the brand register. Empty states matter (no worlds, no characters, no journal
entries), loading and generation states matter, error and recovery states matter. Content
ranges from zero worlds to many, and narrative sessions accumulate indefinitely.

None of this is in issue #1623's scope. It's recorded so a later run doesn't mistake the
product register for a static surface.

## 6. Interaction and layout

Persistent header with navigation and theme menu, breadcrumbs on product routes, content
constrained by `--content-max-width`, dot-grid canvas behind it all. Two surfaces exist, app
and manuscript, and `getSurfaceMode()` decides which a route gets.

The register is a second, orthogonal axis on the app surface only. Two surfaces times two
registers, and the register changes token values, never chrome geometry.

## 7. Constraints and open decisions

- Plain CSS with design tokens, Zustand 5 stores persisted to IndexedDB, no backend.
- WCAG 2.1 AA in both themes.
- `getSurfaceRegister()` in `src/lib/routing/surfaceMode.ts` is the source of truth for which
  register a route is in. It ships as a sibling export of `getSurfaceMode()` deliberately, so
  the two route-classification axes can't drift into separate normalizers.
- `.component-landing .component-landing-title`'s double-class specificity is load-bearing: it
  outranks `.app-surface-app h1`. Narrowing the shell rule to a `:not([data-register="brand"])`
  form would raise it to (0,2,1) and break five later product `h2` overrides. Leave both
  alone.
- Nothing in issue #1623 may land in `app-shell.css`. That file's reach is the whole product
  register, and the repo's 110 visual baselines are the blast radius if it moves.
