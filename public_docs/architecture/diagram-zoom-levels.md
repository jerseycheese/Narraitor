# Diagram Zoom Levels - Quick Reference

## Choose Your View

```
┌──────────────────────────────────────────────────────────────────┐
│  ZOOM LEVEL          │  FILE                    │  FORMAT       │
├──────────────────────────────────────────────────────────────────┤
│  🎯 Interactive      │  *-interactive.html      │  HTML (BEST)  │
│  (hover/click)       │  Explore relationships   │               │
│                      │  RECOMMENDED             │               │
├──────────────────────────────────────────────────────────────────┤
│  📁 Folders          │  *-folders.svg           │  SVG          │
│  (directory deps)    │  Directory level only    │               │
├──────────────────────────────────────────────────────────────────┤
│  🌍 Domains          │  *-domains.mmd           │  Mermaid ✅   │
│  (state, lib, etc)   │  ~54 lines               │               │
│                      │  START HERE              │               │
├──────────────────────────────────────────────────────────────────┤
│  🧩 Components       │  component-*.mmd         │  Mermaid ✅   │
│  (GameSession, etc)  │  ~112 lines              │               │
├──────────────────────────────────────────────────────────────────┤
│  🏪 Stores           │  stores-*.mmd            │  Mermaid ✅   │
│  (sessionStore, etc) │  ~275 lines              │               │
├──────────────────────────────────────────────────────────────────┤
│  📄 All Files        │  *-detailed.mmd          │  Mermaid ❌   │
│  (every .ts/.tsx)    │  5000+ lines             │  Use Live     │
└──────────────────────────────────────────────────────────────────┘
```

## ⭐ New: Interactive HTML

**The best way to explore dependencies:**

```bash
npm run deps:diagram:interactive
open public_docs/architecture/dependency-graph-interactive.html
```

- Hover to highlight connections
- Click to "pin" relationships
- Self-contained (works offline)
- No size limitations

## What Each Level Shows

### 📁 Folder Level (dependency-graph-folders.svg)
```
Shows directory-to-directory dependencies:

src/state/ → src/lib/
src/components/ → src/state/
src/app/ → src/components/
```

**Use when:** Understanding module boundaries, finding architectural issues

### 🌍 Domain Level (dependency-graph-domains.mmd)
```
Shows your architecture at the highest level:

src/
├── state/          ← Domain stores
├── components/     ← UI layer
├── lib/            ← Business logic
├── types/          ← Type definitions
├── utils/          ← Pure functions
└── app/            ← Next.js routes
```

**Use when:** Getting oriented, explaining architecture to others

### 🧩 Component Level (component-dependencies.mmd)
```
Shows major component folders:

components/
├── GameSession/
├── WorldCreationWizard/
├── CharacterEditor/
├── shared/
└── ui/
```

**Use when:** Understanding component relationships, refactoring UI

### 🏪 Store Level (stores-dependencies.mmd)
```
Shows all Zustand stores and their connections:

state/
├── worldStore
├── characterStore
├── sessionStore
├── narrativeStore
├── journalStore
├── inventoryStore
├── goalStore
└── loreStore
```

**Use when:** Debugging state issues, understanding data flow

### 📄 Full Detail (dependency-graph-detailed.mmd)
```
Shows EVERY file and import:

state/
├── worldStore.ts
├── worldStore.test.ts
├── __mocks__/
│   └── worldStore.ts
└── persistence.ts
```

**Use when:** Tracking down specific circular dependencies

**⚠️ Warning:** Too complex for VS Code (1000+ edges limit)
Use Mermaid Live Editor: https://mermaid.live

## Quick Commands

```bash
# View domains in VS Code
code public_docs/architecture/dependency-graph-domains.mmd

# Copy detailed for Mermaid Live
cat public_docs/architecture/dependency-graph-detailed.mmd | pbcopy

# Regenerate all levels
npm run deps:diagram:all
```

## When VS Code Shows Errors

**"Edge limit exceeded" or "Cannot set properties"**
→ Diagram too complex, use Mermaid Live Editor instead

**"Syntax error in text"**
→ Try a higher-level zoom (domains instead of detailed)

**General rule:**
- <100 lines = Fast in VS Code ✅
- 100-500 lines = Works in VS Code ⚠️
- 500+ lines = Use Mermaid Live ❌
