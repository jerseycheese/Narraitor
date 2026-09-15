---
version: 1
slug: "route-wizards"
primary_target: "route:/worlds/create"
related_targets: ["route:/characters/create"]
---

# Surface brief: World and character creation wizards (`/worlds/create`, `/characters/create`)

**Mode: Operate.** This brief covers the creation wizards for worlds and characters.

## 1. Job and audience

A player is defining the source material for a long story. They need to understand the current step, make one set of decisions, and move forward without the interface feeling like a stack of admin forms.

## 2. Outcome and proof

Each view has one clear heading, one focused work area, a compact sense of progress, and one emphasized next action. World-specific context and point totals remain visible without repeating themselves.

## 3. Selected direction

Treat the wizard like one manuscript workbench. Use a compact shared progress ledger, one content surface, and a consistent bottom action rail. Selection state uses tint, marks, or text; the filled ink-blue accent belongs to Next or Create.

## 4. Scope and boundaries

Preserve both five-step flows, validation, URL step handling, auto-save and recovery, tutorial sequencing, generation behavior, field data, and navigation destinations. No new application chrome or state architecture.

## 5. States and ranges

Cover new, partially completed, recovered, invalid, generating, generation-error, empty-suggestion, and final-review states. Support 320px mobile, long world names, six attributes, twelve world skills, and the character skill-allocation range.

## 6. Interaction and layout

- **Responsive behavior:** Desktop shows all five steps in one compact row. Mobile shows the current step and "Step X of 5" with a five-segment indicator, avoiding horizontal scrolling and five stacked rows.
- **Accessibility:** Progress uses ordered-list semantics and `aria-current="step"`. Error and save states retain live-region behavior. Controls keep 44px touch targets, visible focus, and native keyboard behavior.
- **Hierarchy:** Borderless heading and progress region, one main content boundary, section grouping through spacing and dotted rules, consistent bottom action rail, no nested decorative borders. Form-control borders remain valid affordances.
