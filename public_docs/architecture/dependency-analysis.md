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

> **Looking for a live, click-through graph?** dependency-cruiser is great for validation and static diagrams; for interactive exploration ("what imports `characterStore`?", "how does this cycle actually loop?"), use [skott](using-skott.md) (`npm run skott:analyze` / `skott:circular`). Run `skott:circular` before cross-domain refactors and during code-health audits to catch new cycles early.

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

The project uses **ignore-known violations** to manage 82 existing violations while preventing new ones:

- **Baseline File:** `.dependency-cruiser-known-violations.json` (3340 lines, tracked in git)
- **Known Violations:** 82 total (23 type imports, 59 circular dependencies)
- **Strategy:** Fix incrementally while preventing new violations

**Daily Workflow:**
```bash
npm run deps:validate         # Pass/fail on NEW violations only
npm run deps:validate:strict  # Show all violations (for reference)
npm run deps:baseline         # Update after fixes (tracks progress)
```

### Violation Categories

**Critical Issues: Circular Dependencies (59 warnings)**

Store-to-store circles cause unpredictable initialization. The known ones are between
`sessionStore` and `worldStore`; across `sessionStore`, `inventoryStore`, and
`characterStore`; and across `narrativeStore`, `sessionStore`, and `goalStore`.

**Resolution Strategy:**
1. Extract shared logic to `lib/` utilities
2. Use dependency inversion (interfaces in types)
3. Apply pub-sub patterns for cross-store communication — this is what `storeEvents` in `src/lib/state/storePubSub.ts` already does for cascade deletes
4. Break apart monolithic stores (the `loreStore` split into its `loreStore.*` family is an example of this)

**Type Violations (23 errors)**

Type files importing implementation:
- Constants in type files
- Type guards importing utils
- Store types importing store implementations

**Resolution:** Move or duplicate constants; relocate guards to utils.

**Dev Dependency Issues (Expected)**

Storybook/test files import dev dependencies - these are safe as they never reach production. Already ignored in baseline.

### Progress Tracking

Monitor baseline file size over time:
```bash
wc -l .dependency-cruiser-known-violations.json
# Current: 3340 lines (82 violations)
# Target: < 1000 lines (reduce by 60%)
```

Each fix shrinks the file, providing visible metrics.

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
Type definitions should not import implementation code.

## Available Commands

```bash
# Validation
npm run deps:validate              # Check for NEW violations only (ignores known)
npm run deps:validate:strict       # Show ALL violations including known ones
npm run deps:baseline              # Regenerate baseline after fixing violations

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
1. **High:** Fix type import violations (blocks clean architecture)
2. **Medium:** Break circular dependencies (one store pair at a time)
3. **Low:** Document expected dev-dependency violations
4. **Ongoing:** Use `npm run deps:validate` to prevent new violations

**Progress Tracking:**
- Monitor baseline file line count over time
- Celebrate when violations drop below thresholds (60, 40, 20)
- Regenerate baseline after each fix: `npm run deps:baseline`

## Integration with CI

Dependency validation isn't wired into CI yet — the GitHub Actions pipeline currently runs
type-check, lint (ESLint + Stylelint + layout usage), knip, tests, and build, but not
`deps:validate`. Adding it would be a one-liner if the baseline is kept current:

```yaml
- name: Validate Architecture
  run: npm run deps:validate
```

That would fail the build on any NEW boundary violation while still tolerating the known ones
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
