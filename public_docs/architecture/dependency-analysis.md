# Dependency Analysis & Architecture Visualization

This document explains how to use dependency-cruiser to analyze and visualize Narraitor's codebase architecture.

## Quick Start

**Interactive exploration (recommended):**
```bash
npm run deps:diagram:interactive
open public_docs/architecture/dependency-graph-interactive.html
```

**Generate all diagram formats:**
```bash
npm run deps:diagram:all  # Mermaid + folder SVG
npm run deps:diagram:folders  # Folder-level SVG only
```

**Validate architecture rules:**
```bash
npm run deps:validate
```

> **Note:** Dependency-cruiser v13+ auto-finds `.dependency-cruiser.cjs` - no `--config` flag needed!

> **Looking for a live, click-through graph?** dependency-cruiser produces the static diagrams here; for interactive exploration ("what imports `characterStore`?", "how does this cycle actually loop?"), use [skott](using-skott.md). New circular dependencies are blocked at CI by the `skott:check` budget — `using-skott.md` covers what to do when that fails.

## Generated Diagrams

Diagrams are generated at **multiple zoom levels** for optimal viewing:

### Interactive HTML (dependency-graph-interactive.html)
**Best for:** Exploring and understanding the codebase
- **Hover** over modules to highlight dependencies
- **Click** to "pin" relationships (ESC to clear)
- Self-contained offline file
- Handles any codebase size

### Folder-Level SVG (dependency-graph-folders.svg)
**Best for:** High-level architecture overview
- Shows directory-to-directory dependencies
- Cleaner than module-level view
- Great for identifying module boundaries

### Architecture Diagram (high-level.svg)
**Best for:** Executive summary and onboarding
- Ultra-high-level collapsed view
- Shows major architectural layers
- Generated with `archi` reporter
- SVG format (opens in browser)

### 1. Domain-Level Overview (dependency-graph-domains.mmd)
**Best for:** Understanding high-level architecture
- Shows: state, components, lib, types, utils, etc.
- ~54 lines, under 100 edges
- Works in VS Code

### 2. Component Relationships (component-dependencies.mmd)
**Best for:** Understanding component structure
- Shows: Major component folders and their dependencies
- ~112 lines
- Works in VS Code

### 3. Store Dependencies (stores-dependencies.mmd)
**Best for:** Analyzing state management
- Shows: All Zustand stores and their relationships
- ~275 lines
- Works in VS Code

### 4. Full Detail (dependency-graph-detailed.mmd)
**Best for:** Deep investigation with Mermaid Live Editor
- Shows: Every file and import
- 5000+ lines, 1000+ edges
- Too complex for VS Code, use https://mermaid.live instead

These diagrams are regenerated automatically via npm scripts and can be viewed in any Mermaid-compatible viewer.

## Quick Start

```bash
# Validate architecture against rules
npm run deps:validate

# Generate all diagrams
npm run deps:diagram:all

# Run full analysis (validate + diagrams)
npm run analyze
```

## What We Discovered

### Violation Management

The project uses **ignore-known violations** to manage the existing violations while preventing new ones:

- **Baseline File:** `.dependency-cruiser-known-violations.json`, tracked in git
- **Known Violations:** 17 total, as of 2026-08-04: 8 circular dependencies, 7 components importing lib/ai directly, 2 dev-dependency imports
- **Strategy:** a two-way ratchet. `deps:validate` stops new violations landing; `deps:check` stops fixed ones lingering as dead suppressions, so the number can only go down.

**Daily Workflow:**
```bash
npm run deps:validate         # Pass/fail on NEW violations only
npm run deps:validate:strict  # Show all violations (for reference)
npm run deps:baseline         # Update after fixes (tracks progress)
npm run deps:check            # Fail if any baseline entry no longer reproduces
```

### Violation Categories

**Circular Dependencies (8 in the baseline)**

Mostly barrel-file self-reference: `src/lib/utils/index.ts` re-exporting modules that import it
back, same shape in `src/types/index.ts` and `src/lib/theme/index.ts`. Plus a couple of
component-to-module loops in the world-creation wizard and the tutorial provider. Run
`npm run deps:validate:strict` for the current list.

**Resolution Strategy:**
1. Extract shared logic to `lib/` utilities
2. Use dependency inversion (interfaces in types)
3. Apply pub-sub patterns for cross-store communication — this is what `storeEvents` in `src/lib/state/storePubSub.ts` already does for cascade deletes
4. Break apart monolithic stores (the `loreStore` split into its `loreStore.*` family is an example of this)

**Components importing lib/ai directly (7 in the baseline)**

The world-creation wizard, the world image form, and the provider setup components reach
`src/lib/ai/` without going through `lib/api` or a hook. Resolution is the `worldApi` pattern:
put the call behind a service or a colocated `use*` hook.

**Dev Dependency Issues (2 in the baseline)**

`src/types/jest.d.ts` pulls in `@testing-library/jest-dom` types, and a test helper under
`src/state/__tests__/` imports `@testing-library/react`. Neither reaches production. The 20
Storybook-file entries that used to sit here were stale: the `not-to-dev-dep` rule's own
`from.pathNot` already excludes `*.stories.tsx`.

**Not violations, by design**

Two categories were rule-scoping noise rather than debt, and the rules now exclude them:

- Jest manual mocks under `__mocks__/` are reached through bare `jest.mock('path')` calls, which
  aren't import statements, so `no-orphans` saw every one of them as stranded.
- `typeof import()` positions in `src/types/global.d.ts` erase at compile time, so
  `types-no-implementation-imports` now skips `type-only`/`type-import` edges.

### Progress Tracking

The baseline entry count is the metric, and `deps:check` enforces that it only shrinks. Fix a
violation and CI fails until you re-baseline. Current: 17.

## Architecture Rules

The configuration enforces these domain boundaries:

### Rule: `state-no-component-imports` (error)
State stores must not import from components or app. State should be pure domain logic.

### Rule: `state-no-cross-domain` (warning)
Stores should not directly depend on other stores. Use composition or extract to lib/.

### Rule: `components-no-direct-lib-imports` (info)
Components importing AI/prompt services directly may indicate business logic that belongs in a store.

### Rule: `utils-no-state-imports` (error)
Utility functions must be pure with no state dependencies.

### Rule: `types-no-implementation-imports` (error)
Type definitions should not import implementation code. Type-only edges (`import type`,
`typeof import()`) are exempt, since they erase at compile time.

### Rule: `no-orphans` (warning)
Flags modules nothing imports. Jest manual mocks under `__mocks__/` are exempt, since
`jest.mock('path')` isn't an import statement dependency-cruiser can follow.

## Available Commands

```bash
# Validation
npm run deps:validate              # Check for NEW violations only (ignores known)
npm run deps:validate:strict       # Show ALL violations including known ones
npm run deps:baseline              # Regenerate baseline after fixing violations
npm run deps:check                 # Fail on baseline entries that no longer reproduce

# Diagram Generation
npm run deps:diagram               # Domain-level overview
npm run deps:diagram:archi         # High-level architecture diagram (SVG)
npm run deps:diagram:stores        # Store dependencies only
npm run deps:diagram:components    # Component dependencies only
npm run deps:diagram:folders       # Folder-level SVG
npm run deps:diagram:interactive   # Interactive HTML explorer
npm run deps:diagram:all           # Generate all diagram formats

# HTML Reports
npm run deps:html                  # Generate interactive HTML report

# Complete Analysis
npm run analyze                    # Validate + generate all diagrams
```

## Configuration

Rules are defined in `.dependency-cruiser.cjs`. Key sections:

- `forbidden` - Architecture rules and their severity levels
- `options.doNotFollow` - Directories to ignore (node_modules)
- `options.tsConfig` - TypeScript configuration to use
- `reporterOptions` - Diagram appearance customization

## Next Steps

**Immediate Actions:**
1. Run `npm run deps:validate` to confirm no new violations
2. Review `.dependency-cruiser-known-violations.json` to understand known issues
3. Generate diagrams: `npm run deps:diagram:all`

**Resolution Priority:**
1. **Medium:** Route the 7 direct `lib/ai` imports through `lib/api` services or hooks
2. **Medium:** Break circular dependencies, starting with the barrel-file self-references
3. **Low:** The 2 dev-dependency entries are test-only and can stay
4. **Ongoing:** `npm run deps:validate` prevents new violations; `npm run deps:check` prevents stale ones

## Integration with CI

Both halves of the ratchet run in the Lint Check job in `.github/workflows/ci.yml`:

```yaml
- name: Enforce dependency boundaries (no new cycles or dev-dep leaks)
  run: npm run deps:validate
- name: Enforce a shrinking dependency baseline
  run: npm run deps:check
```

A new boundary violation fails the build. So does a baseline entry that no longer reproduces:
fix the boundary, then re-baseline with `npm run deps:baseline` and commit the smaller file.
in the baseline file.

## Viewing Diagrams

### In VS Code
Install "Markdown Preview Mermaid Support" extension, then:
1. Open any `.mmd` file
2. Click "Open Preview to the Side"

### On GitHub
GitHub renders Mermaid diagrams automatically in markdown:

````markdown
```mermaid
<!-- paste .mmd file contents -->
```
````

### Interactive Web Viewer
1. Go to https://mermaid.live
2. Paste contents of any `.mmd` file
3. Explore interactively

## Further Reading

- [dependency-cruiser documentation](https://github.com/sverweij/dependency-cruiser)
- [Mermaid diagram syntax](https://mermaid.js.org/)
- [Domain-Driven Design patterns](https://martinfowler.com/bliki/DomainDrivenDesign.html)
