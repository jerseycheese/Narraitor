# Dependency Analysis & Architecture Visualization

This document explains how to use dependency-cruiser to analyze and visualize Narraitor's codebase architecture.

## Quick Start

**⭐ Interactive exploration (recommended):**
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

## Generated Diagrams

Diagrams are generated at **multiple zoom levels** for optimal viewing:

### 🎯 Interactive HTML (dependency-graph-interactive.html) *NEW!*
**Best for:** Exploring and understanding the codebase
- **Hover** over modules to highlight dependencies
- **Click** to "pin" relationships (ESC to clear)
- Self-contained offline file
- Handles any codebase size

### 📁 Folder-Level SVG (dependency-graph-folders.svg) *NEW!*
**Best for:** High-level architecture overview
- Shows directory-to-directory dependencies
- Cleaner than module-level view
- Great for identifying module boundaries

### 1. Domain-Level Overview (dependency-graph-domains.mmd)
**Best for:** Understanding high-level architecture
- Shows: state, components, lib, types, utils, etc.
- ~54 lines, <100 edges
- ✅ Works in VS Code

### 2. Component Relationships (component-dependencies.mmd)
**Best for:** Understanding component structure
- Shows: Major component folders and their dependencies
- ~112 lines
- ✅ Works in VS Code

### 3. Store Dependencies (stores-dependencies.mmd)
**Best for:** Analyzing state management
- Shows: All Zustand stores and their relationships
- ~275 lines
- ✅ Works in VS Code

### 4. Full Detail (dependency-graph-detailed.mmd)
**Best for:** Deep investigation with Mermaid Live Editor
- Shows: Every file and import
- 5000+ lines, 1000+ edges
- ❌ Too complex for VS Code - use https://mermaid.live

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

Running the initial analysis on the codebase revealed:

### Critical Issues: Circular Dependencies (59 warnings)

The biggest architectural concern is circular imports, primarily between:

**Store-to-Store Circles:**
- `sessionStore` ↔ `worldStore`
- `sessionStore` ↔ `inventoryStore` ↔ `characterStore`
- `narrativeStore` ↔ `sessionStore` ↔ `goalStore`

**Type System Circles:**
- `types/index.ts` has circular dependencies through `generateId.ts`
- `characterStore.ts` imports from `types/` which imports back to stores

**Impact:** Circular dependencies can cause:
- Unpredictable initialization order
- Hard-to-debug runtime errors
- Difficult refactoring
- Performance issues

**Recommendation:** Consider these refactoring strategies:
1. Extract shared logic to `lib/` utilities
2. Use dependency inversion (interfaces in types, implementation in stores)
3. Break apart large stores into smaller, focused stores
4. Use pub-sub patterns for cross-store communication

### Type Violations (23 errors)

Type files are importing implementation code:

```
error types-no-implementation-imports: 
  src/types/world.types.ts → src/lib/constants/genres.ts
  src/types/narrative.types.ts → src/state/characterStore.ts
  src/types/type-guards.ts → src/lib/utils/index.ts
```

**Impact:** Types should be pure TypeScript - no runtime dependencies.

**Recommendation:**
- Move constants out of type files or duplicate them
- Type guards can import utils, but consider moving guards to utils
- Store types should not import store implementations

### Dev Dependency Issues (19 errors)

Storybook and test files importing dev dependencies:

```
error not-to-dev-dep: 
  src/stories/**/*.stories.tsx → @storybook/*
  src/**/*.test.ts → @testing-library/*
```

**Note:** These are expected and safe - Storybook/test files are never included in production bundles.

**Recommendation:** Add exceptions to `.dependency-cruiser.cjs` for these patterns if they create noise.

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
npm run deps:validate              # Check all architecture rules
npm run deps:circular             # Focus on circular dependencies only

# Diagram Generation
npm run deps:diagram              # Generate full project diagram
npm run deps:diagram:stores       # Generate store-only diagram
npm run deps:diagram:components   # Generate component-only diagram
npm run deps:diagram:svg          # Generate SVG (requires graphviz)
npm run deps:diagram:all          # Generate all diagrams

# HTML Reports
npm run deps:html                 # Generate interactive HTML report

# Complete Analysis
npm run analyze                   # Validate + generate all diagrams
```

## Configuration

Rules are defined in `.dependency-cruiser.cjs`. Key sections:

- `forbidden` - Architecture rules and their severity levels
- `options.doNotFollow` - Directories to ignore (node_modules)
- `options.tsConfig` - TypeScript configuration to use
- `reporterOptions` - Diagram appearance customization

## Next Steps

Based on the analysis, consider addressing issues in this order:

1. **High Priority:** Fix type import violations (prevents clean builds)
2. **Medium Priority:** Break circular dependencies between stores
3. **Low Priority:** Add exceptions for Storybook/test dev dependencies
4. **Ongoing:** Use `npm run deps:validate` in CI to prevent regressions

## Integration with CI

Add to GitHub Actions:

```yaml
- name: Validate Architecture
  run: npm run deps:validate
```

This will fail the build if critical architecture boundaries are violated.

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
