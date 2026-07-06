# Diagram Zoom Levels - Quick Reference

The dependency diagrams come at several zoom levels, because one diagram can't be both a
readable overview and a complete file-by-file map. Pick the level that matches what you're
trying to do.

## Choose your view

| Zoom level | File | Format | Notes |
|------------|------|--------|-------|
| Interactive | `*-interactive.html` | HTML | Best for exploring; hover/click relationships |
| Folders | `*-folders.svg` | SVG | Directory-to-directory dependencies only |
| Domains | `*-domains.mmd` | Mermaid | Start here; ~54 lines, renders in VS Code |
| Components | `component-*.mmd` | Mermaid | ~112 lines, renders in VS Code |
| Stores | `stores-*.mmd` | Mermaid | ~275 lines, renders in VS Code |
| All files | `*-detailed.mmd` | Mermaid | 5000+ lines; use Mermaid Live, not VS Code |

## Interactive HTML

The most useful way to explore dependencies:

```bash
npm run deps:diagram:interactive
open public_docs/architecture/dependency-graph-interactive.html
```

Hover to highlight a module's connections, click to pin a relationship, and press ESC to clear.
It's self-contained, works offline, and has no size limit.

## What each level shows

### Folder level (dependency-graph-folders.svg)

Directory-to-directory dependencies — for instance, `src/state/` depending on `src/lib/`,
`src/components/` depending on `src/state/`, and `src/app/` depending on `src/components/`. Use
it when you're checking module boundaries or hunting architectural issues.

### Domain level (dependency-graph-domains.mmd)

The highest-level view of the architecture: `state/` (domain stores), `components/` (UI),
`lib/` (domain logic), `types/`, `utils/`, and `app/` (Next.js routes). Use it to get oriented
or to explain the architecture to someone.

### Component level (component-dependencies.mmd)

Major component folders and how they relate — `GameSession/`, `WorldCreationWizard/`,
`CharacterEditor/`, `shared/`, `ui/`, and so on. Use it when understanding component
relationships or planning a UI refactor.

### Store level (stores-dependencies.mmd)

All the Zustand stores and their connections: `worldStore`, `characterStore`, `npcStore`,
`sessionStore`, `narrativeStore`, `journalStore`, `inventoryStore`, `goalStore`,
`navigationStore`, `aiContextStore`, and `loreStore`. Use it when debugging state issues or
tracing data flow — this is also where the known store-to-store circular dependencies show up.

### Full detail (dependency-graph-detailed.mmd)

Every file and import, including tests and mocks. Use it only when tracking down a specific
circular dependency. It's too big for VS Code (1000+ edges), so paste it into the Mermaid Live
Editor at https://mermaid.live.

## Quick commands

```bash
# View domains in VS Code
code public_docs/architecture/dependency-graph-domains.mmd

# Copy detailed for Mermaid Live
cat public_docs/architecture/dependency-graph-detailed.mmd | pbcopy

# Regenerate all levels
npm run deps:diagram:all
```

## When VS Code shows errors

An "edge limit exceeded" or "Cannot set properties" error means the diagram is too complex —
use the Mermaid Live Editor instead. A "syntax error in text" usually means you should drop to a
higher-level zoom (domains rather than detailed). As a rule of thumb, diagrams under ~100 lines
are fast in VS Code, 100-500 lines work but can be slow, and anything past ~500 lines belongs in
Mermaid Live.
