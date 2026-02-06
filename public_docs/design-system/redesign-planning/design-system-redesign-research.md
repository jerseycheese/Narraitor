# Narraitor Design System Redesign: Research & Discovery

**Status:** Discovery Phase
**Created:** February 2026
**Purpose:** Collecting research and insights to inform the redesign of Narraitor's design system and user experience

---

## Overview

This document captures research on key topics that will inform the Narraitor redesign. The focus is on creating a stable, elegant reading experience that handles streaming AI content gracefully while learning from best‑in‑class long‑form reading platforms.

---

## Research Topics

### 1. UX Stability in Streaming AI Text Interfaces

**Why This Matters:**
Narraitor deals with streaming text generation, which creates unique UX challenges around layout stability, user attention, and content predictability. Understanding best practices here is critical for a polished experience.

**Key Questions:**
- How do we prevent jarring layout shifts as content streams in?
- What visual indicators work best for "content is generating" states?
- How do we balance smooth streaming with user reading rhythm?
- When should we buffer vs. show real‑time generation?

**Research Findings:**

To ensure the design system maintains high visual stability during AI text streaming, prioritize minimizing **Cumulative Layout Shift (CLS)**. CLS measures how much elements move while a page is rendering; a high‑quality experience targets 0.10 or lower.

#### 1. Optimized DOM Manipulation

Updating the UI for every token causes layout thrashing and high CPU usage.

- **Use incremental appending.** Avoid `textContent` and `innerHTML` updates during streaming. Prefer `Element.append()` or `insertAdjacentText('beforeend', chunk)` to add text nodes without reconstructing the entire block.
- **Buffer updates.** Batch tokens in memory and flush to the UI at a controlled interval (50–100ms) to prevent the browser from falling behind.

#### 2. Layout Space Reservation

The main cause of content jumping is that the browser doesn’t know how much space an element will occupy before rendering.

- **Narrative placeholders.** Apply a `min-height` to incoming message containers based on average response length.
- **Explicit media dimensions.** Use `aspect-ratio` on image/video containers to reserve the correct vertical space before assets load.
- **Fixed button containers.** Reserve space for action buttons like “Stop Generating” or “Regenerate” so the conversation history doesn’t shift.

#### 3. Syntax and Structural Stability

Rich text formatting can cause internal layout shifts as the AI completes markdown or math notation.

- **Streaming markdown parsers.** Use a streaming parser that buffers ambiguous characters until syntax is confirmed.
- **Synchronous math rendering.** Use KaTeX to avoid asynchronous “pop‑in” height changes.

#### 4. Advanced Scrolling and Rendering Performance

Long conversation histories degrade performance and make updates feel jumpy.

- **JavaScript scroll anchoring.** Safari lacks support for `overflow-anchor`. Use `ResizeObserver`‑based anchoring to keep the viewport pinned to bottom during streaming.
- **CSS containment.** Use `content-visibility: auto` with `contain-intrinsic-size` for off‑screen messages.
- **List virtualization.** For threads over 1,000 messages, use virtualization (e.g., React Virtuoso) so only visible messages remain in the DOM.

#### 5. Performance Metrics and Measurement

- **CLS** should remain under 0.10 to avoid jarring shifts.
- **INP** should stay under 200ms at the 75th percentile across devices.
- Prefer `transform: translate()` to moving elements with `top`/`left` to avoid layout recalculations.

#### 6. Mathematical Scoring for Planning

Use CLS event scoring for each layout shift (`impact fraction × distance fraction`). Any score above 0.25 is considered poor and requires immediate design intervention.

**Practical Considerations for Streaming Interfaces:**

- **Buffered token rendering.** Batch tokens and flush on a 50–100ms timer using `insertAdjacentText('beforeend', chunk)`.
- **Reserved layout spaces.** Fix heights for action buttons, result panels, and input zones; apply `min-height` to narrative containers based on typical response length.
- **Streaming markdown strategy.** Buffer ambiguous syntax to prevent flicker while streaming formatted text.
- **Scroll anchoring implementation.** Auto‑scroll only if the user is already at the bottom; preserve position otherwise.
- **Performance targets.** Maintain CLS below 0.10, limit expensive DOM updates, and virtualize long histories.
- **Visual streaming indicators.** Use subtle skeletons that reserve vertical space before the first tokens arrive.

---

### 2. High‑End Long‑Form Reading Platforms

**Focus Platforms:**
- The New York Times “Snow Fall” and similar immersive stories
- Medium’s reading experience
- Other premium long‑form content platforms

**Why This Matters:**
These platforms solve the challenge of making long‑form text engaging and readable on screens. Their design systems balance typography, whitespace, and progressive enhancement in ways that can inform Narraitor.

**Key Questions:**
- What typographic systems do they use (font pairing, sizing, line height)?
- How do they handle content hierarchy and navigation?
- What’s their approach to whitespace and content width?
- How do they integrate media without disrupting reading flow?
- What interaction patterns keep readers engaged?

**Research Findings:**

#### 1. Strategic Typography and Pairing

To reduce cognitive load, distinguish between **narrative immersion** (reading) and **functional precision** (data entry/scanning).

- **Dual‑type paradigm.** Use a high‑quality serif for long‑form content and a monospace font for technical data, code, or tabular figures.
- **Recommended pairings.** IBM Plex Serif + IBM Plex Mono, Editorial New + Right Serif Mono, and Source Serif 4 + JetBrains Mono.
- **Implementation note.** Ensure both fonts share similar x‑heights to avoid a “bumpy” inline experience.

#### 2. Vertical Rhythm and Layout Dynamics

- **Optimal measure.** Limit body text to 45–90 characters per line to reduce eye strain and track‑back issues.
- **Line height.** Use unitless `1.5` for body text and tighten headings to 1.1–1.2.
- **Baseline grid.** Align typography to a 4px or 8px baseline grid, with line heights divisible by 4.
- **Whitespace logic.** Use at least 1.5x more whitespace above a heading than below to associate it with the following content.

#### 3. Tonal Ergonomics and Contrast

- **Avoid extremes.** Pure black on pure white causes halation and eye strain.
- **Preferred values.** Use off‑white backgrounds (e.g., #FFFFF8) with off‑black or deep charcoal text (e.g., #111111).
- **Accessibility standards.** Maintain a minimum contrast ratio of 4.5:1 for standard text and 3:1 for large text/UI components.

#### 4. Practical Implementation Checklist

- **Semantic tokens.** Define roles like `body-standard`, `data-technical`, and `heading-primary` instead of hard‑coding values.
- **Left alignment.** Avoid justified text to prevent “rivers” of whitespace.
- **Resizing support.** Support 200% zoom using `rem` units to honor user preferences.

#### Additional Guidelines for Digital Typography and Layout

- **Typography role assignment.** Serif for narrative, monospace for numeric/technical data, and sans‑serif for navigation/interface labels.
- **Measure and layout.** Aim for 65–75 characters per line for immersive reading, allow up to ~90 characters for form‑heavy layouts.
- **Unitless line height.** Use 1.5x for body text and 1.1–1.2x for headings to scale with font size and accessibility settings.
- **Contrast implementation.** Use off‑black text on off‑white backgrounds and meet WCAG AA contrast requirements.
- **Semantic token structure.** Map typography and color roles to CSS variables to enable global updates.
- **Responsive typography.** Use `rem` units and support 200% zoom without layout breakage; tighten line height slightly on mobile to reduce scroll depth without sacrificing legibility.
- **Modular scale breakpoints.** Example scale: base 16px with ratio 1.2 on small screens (<36em), base 18px with ratio 1.2 on medium screens (36–48em), base 18px with ratio 1.414 on large screens.

---

### 3. Progressive Disclosure in Narrative‑Heavy Interfaces

**Focus Areas:**
- Narrative‑heavy game UIs (visual novels, story‑driven games)
- Reading apps with layered content
- Interactive storytelling platforms

**Why This Matters:**
Narraitor is fundamentally about storytelling. Understanding how games and reading apps reveal information progressively helps design better content‑revelation patterns while AI generates responses.

**Key Questions:**
- How do narrative games reveal UI without overwhelming players?
- What patterns exist for “unlocking” content or features progressively?
- How do they balance mystery and discovery with usability?
- What visual language indicates “more content available”?
- How do they handle user agency in content revelation?

**Research Findings:**

#### Information Stratification

The design system must minimize extraneous cognitive load while supporting germane load that helps users build mental models.

#### Core Implementation Principles

- **The 80/20 prioritization.** Surface only the 20% of features used in 80% of interactions.
- **Cognitive mapping.** Create consistent spatial anchors so users know where information lives even when hidden.
- **Interaction‑triggered visibility.** Keep the HUD minimal during focused reading; reveal UI only on specific triggers.

#### Practical Design Patterns

- **Marginalia.** Use gutters for glossaries, footnotes, and metadata with inline underlines and margin reveal.
- **Contextual drawers.** Slide‑out panels for settings, stats, or logs that maintain context without blocking the narrative.
- **Mind maps.** Use node‑and‑link layouts for relational data and world‑building.
- **Hidden headers.** Auto‑hide navigation on scroll down and reveal on scroll up or tap.
- **Expandable sections.** Borrow patterns like accordions and expandable groups from systems like PatternFly to hide advanced options.

#### World‑Agnostic Aesthetic Standards

- **Typographic hierarchy.** Sans‑serif for high‑utility stats; serif for narrative content to reduce fatigue.
- **Functional color.** Limit the palette to 2–3 colors, each with a specific functional meaning.
- **Internalized UI.** Turn data into narrative when possible so systems feel like part of the story.

#### Strategic Checklist for Design System Planning

- **Map scanning patterns.** Align critical CTAs with the F‑pattern and use a layer‑cake heading structure for scanning.
- **Define disclosure triggers.** Clarify what reveals on hover, click, or environmental change.
- **Prototype balance bikes, not training wheels.** Avoid oversimplified UI that users must later unlearn.
- **Test for grok‑ability.** Run playtests focused on how quickly users parse information from a minimal HUD.

#### Design Implications for Narraitor Game Sessions

- **80/20 surface layer.** Always visible: narrative text, input field, core character stats. Progressive disclosure: inventory, full character sheet, world lore, session history, settings.
- **Spatial anchoring.** Top corners for session metadata, side margins for contextual data, bottom dock for input, center column for pure narrative.
- **Disclosure pattern implementation.** Use marginalia for terms, contextual drawers for inventory/character sheet/world info, and hidden headers for navigation.
- **Interaction‑triggered visibility.** Suggested actions should appear only after a response completes, not while streaming.
- **Functional color system.** Ink Blue for active/in‑progress states, Warm Paper/Zinc neutrals for structure; avoid decorative color use.
- **Internalized UI.** Deliver feedback through narrative (“Your keen perception reveals…”) and show dice results as marginalia.
- **Progressive complexity.** Start with a minimal HUD and unlock advanced features through natural discovery.
- **Disclosure trigger rules.** Hover for quick help, click for deep dives, environmental changes for critical pulses, never auto‑reveal during active streaming.

---

## Visual Aesthetic: The Mechanical Manuscript

### 1. Design Philosophy

The concept fuses long‑form digital journalism (Snow Fall) with architectural drafting. The app is the drafting table; the story is the manuscript. The goal is a neutral, premium “blank canvas” that frames any genre without competing with it.

### 2. Visual Foundation (Style Guide)

- **Canvas.** Warm Paper (#fdfbf7) in light mode or Zinc‑950 in dark mode.
- **Grid.** Subtle dot grid fixed to the background so the manuscript scrolls over it.
- **Spacing.** Use a 24px or 32px grid unit to keep everything aligned to a technical scale.
- **Typography.** Serif (Lora) for story text, monospace (IBM Plex Mono) for system data, sans‑serif (IBM Plex Sans) for interface chrome.
- **Chrome.** Minimal modules with backdrop blur and thin Zinc‑200 borders.
- **Icons.** Lucide icons with a consistent 1.5px stroke weight.

### 3. Page Audit & Layout Archetypes

- **The Workshop (Library, World/Character Wizards).** Multi‑column, high‑utility layout for active creation and data management.
- **The Manuscript (Game Session Page).** Single‑column, center‑focused layout for narrative immersion, with a floating HUD, bottom‑docked input zone, and contextual margins.

---

## UX & Interaction Strategy

### The “No‑Jitter” Scroll Policy

- **Fixed viewport input.** The decision field remains docked at the bottom and never moves during streaming.
- **Scroll‑to‑bottom (opt‑in).** Auto‑scroll only if the user is already at the bottom; otherwise preserve their reading position.
- **Skeleton loading.** Use subtle drafting‑line skeletons so layout doesn’t pop on first token.

### Suggested Actions & Input Relationship

- **Marginalia approach.** Suggested actions live in the margins or just after the last paragraph.
- **Action‑to‑input.** Clicking a suggestion populates the text field for refinement instead of auto‑submitting.

---

## Technical Implementation Notes

- **CSS variables.** Map all colors and fonts to variables (`--color-bg`, `--font-narrative`) for future world theming.
- **Tailwind cleanup.** Replace utility‑heavy classes (e.g., `bg-blue-500`, `rounded-xl`) with semantic tokens (`bg-primary`, `rounded-sm`).
- **Z‑index management.** Dot grid at `z-0`, manuscript at `z-10`, HUD and input at `z-20`.

---

## Cross‑Cutting Themes

### 1. The Stability‑Performance Paradigm

Streaming AI, long‑form reading, and progressive disclosure all emphasize preventing layout shifts. The unified principle is a stable “stage” where content appears predictably and reading position is never lost.

### 2. The Dual‑Nature Typography System

Research consistently distinguishes narrative content from technical data. A three‑font system (serif/mono/sans) signals “story” versus “system” versus “UI” before reading begins, reducing cognitive load and supporting rapid scanning.

### 3. Whitespace as Functional Architecture

Whitespace is structural, not decorative. A 24px grid and generous spacing create breathing room, maintain comprehension, and provide predictable zones for disclosure.

### 4. Progressive Enhancement Over Progressive Disclosure

Start minimal but complete. Advanced features should be discoverable through natural use rather than hidden complexity or training‑wheel UI that must be unlearned.

### 5. Performance as a Design Constraint

Every visual decision must consider streaming performance. Beautiful but janky is a failed design.

### 6. Context Preservation

UI interactions must preserve narrative context. Anything that breaks the mental model of “where the player is in the story” is a critical failure.

---

## Accessibility Foundations

Accessibility is a baseline requirement. The redesign targets WCAG 2.1 AA at minimum, with AAA where feasible.

### Core Requirements

**Color Contrast**
- Standard text (<18pt): 4.5:1 minimum
- Large text (≥18pt or bold ≥14pt): 3.0:1 minimum
- UI components and graphics: 3.0:1 minimum
- Target pairing: Zinc‑900 on Zinc‑50 (16.1:1), verify accent colors meet 4.5:1 for interactive elements

**Keyboard Navigation**
- Logical tab order (top‑to‑bottom, left‑to‑right)
- Visible focus indicators
- No keyboard traps, with Escape to close drawers/modals
- Skip links for bypassing navigation
- Game session input maintains focus during streaming
- Suggested actions accessible via Tab and Enter

**Screen Reader Support**
- Semantic headings with proper hierarchy
- Landmark regions (`<nav>`, `<main>`, `<aside>`)
- `aria-live="polite"` for narrative text, announcing completion rather than every token
- `aria-label` for icon‑only buttons
- `aria-expanded` and `aria-controls` for disclosure widgets
- Announce dice results and status changes with context

**Motion and Animation**
- Respect `prefers-reduced-motion` and disable auto‑scrolling for reduced‑motion users
- Use subtle transitions (200–500ms) and avoid parallax or continuous animation
- Provide non‑motion cues for state changes

**Responsive and Zoom Support**
- Use `rem` units so text scales with user preferences
- Maintain 1.5x minimum line height for body text
- Touch targets at least 44×44px
- Avoid horizontal scrolling except when necessary (e.g., data tables)
- Breakpoints: mobile (<768px), tablet (768–1024px), desktop (>1024px)

**Form Accessibility**
- Proper `<label>` associations for all controls
- Error messages linked with `aria-describedby`
- Clear validation feedback near fields
- Inline validation where possible
- Confirmation for destructive actions

### Testing Checklist

- All interactive elements are keyboard accessible
- Color contrast verified with tooling (WebAIM, Stark)
- Screen reader tested (NVDA, VoiceOver)
- Page structure validated with WAVE or axe
- 200% zoom without layout breakage
- `prefers-reduced-motion` respected
- Focus indicators visible on all controls
- No ARIA errors in automated testing

---

## Implementation Priorities

### Phase 1: Stability & Typography Foundation (Weeks 1–3)

**Goal:** Establish the stable “stage” and reading experience.

**Deliverables:**
- Typography system with CSS variables (`--font-narrative`, `--font-system`, `--font-interface`)
- Semantic tokens (`text-narrative`, `text-technical`, `text-ui`)
- Responsive font scaling and 24px baseline grid
- Buffered token rendering (50–100ms)
- Scroll anchoring with `ResizeObserver`
- Reserved layout spaces and CLS monitoring
- Zinc/Slate neutral palette with orange accent
- Focus indicators and keyboard navigation

**Success Metrics:**
- CLS < 0.10 during AI streaming
- All text meets WCAG AA contrast minimums
- Typography system applied across 3+ page types

### Phase 2: Component Library & Layout Archetypes (Weeks 4–6)

**Goal:** Build reusable patterns that implement research findings.

**Deliverables:**
- Core components (buttons, inputs, badges, alerts, cards, panels)
- Loading states and skeletons
- Drawer and modal patterns
- Layout archetypes: Workshop and Manuscript
- Navigation patterns: hamburger menu, skip links, landmarks
- Mechanical Manuscript aesthetic and mobile optimization

**Success Metrics:**
- 80%+ of UI built from design system components
- Layouts responsive without horizontal scroll
- Keyboard navigation works on all interactive patterns

### Phase 3: Progressive Disclosure & Game‑Specific UX (Weeks 7–9)

**Goal:** Implement sophisticated information architecture.

**Deliverables:**
- Marginalia system for term definitions and footnotes
- Contextual drawers for character sheet, inventory, world info
- Floating HUD with collapsible stat panels
- Hidden header with scroll‑based reveal
- Suggested actions in margins with action‑to‑input behavior
- Dice roll annotations and “no‑jitter” scroll policy
- Streaming markdown enhancement and inline game notation

**Success Metrics:**
- User testing shows improved discoverability
- Zero layout shifts when suggested actions appear or disappear
- Reading position maintained during disclosure interactions

### Phase 4: Polish & Optimization (Weeks 10–12)

**Goal:** Refine based on real‑world usage.

**Deliverables:**
- Virtualization for sessions exceeding 100 turns
- CSS containment for off‑screen content
- Bundle size optimization
- Accessibility audit and screen reader refinement
- `prefers-reduced-motion` implementation
- CSS variable architecture validated for future theming
- Component API supports theme overrides
- Design system documentation complete

**Success Metrics:**
- WCAG 2.1 AA compliance verified
- Performance budget met (<100ms interaction latency)
- Design system documentation complete

---

## Cross‑Phase Principles

- Build incrementally; each phase should be shippable.
- Test with real AI‑generated narratives, not lorem ipsum.
- Validate with users at the end of each phase.
- Maintain backwards compatibility with existing features.
- Document patterns as they are established.

**Risk Mitigation:**
- Phase 1 stability work prevents compounding issues.
- Phase 2 component library enables rapid iteration.
- Early accessibility work avoids costly retrofits.
- Performance monitoring from Phase 1 prevents late‑stage optimization crises.

---

## Theming and Customization

### CSS Variable Strategy

Centralize design tokens (color, typography, spacing, breakpoints) as CSS custom properties. Define defaults at the root theme and allow child themes to override them without touching component code.

### Theme Overrides

Document which variables are safe to override (neutrals, accent colors, font families). Provide examples for creating a new theme by overwriting a small set of variables (e.g., `--color-accent`, `--font-narrative`). This supports future world‑specific theming without altering component logic.

---

## Next Steps

- [x] Complete research gathering for each topic
- [x] Synthesize findings into design principles
- [x] Document design implications for Narraitor’s specific use cases
- [x] Identify cross‑cutting themes across research areas
- [x] Establish accessibility foundations and requirements
- [x] Define implementation priorities and phasing strategy
- [ ] Validate research synthesis with stakeholders
- [ ] Begin Phase 1 implementation (Stability & Typography Foundation)
- [ ] Create component migration strategy from existing app
- [ ] Establish performance monitoring baseline

---

## Related Documents

**Planning & Research**
This document (Research & Discovery). Component Migration Strategy (to be created). Performance Monitoring Plan (to be created). User Testing Protocol (to be created).

**Implementation Outputs**
Design System Reference (living documentation). Component Library (Storybook or similar). Accessibility Audit Reports (ongoing).

**Project Context**
Narraitor Architecture Overview (existing project docs). Current Design System Audit (to be created). Phase 1 Implementation Plan (to be created after validation).

---

## References

- https://web.dev/articles/cls
- https://web.dev/articles/optimize-inp
- https://stevenloria.com/responsive-typography/
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-height
- https://www.patternfly.org/design-foundations/usage-and-behavior/
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
- https://educationalvoice.co.uk/accessibility-animation/
- https://wwnorton.github.io/design-system/docs/foundations/motion/
- https://www.w3.org/WAI/tutorials/forms/notifications/
- https://chromatichq.com/insights/scoped-theming-css-variables/
