# Using skott

`skott` is an interactive web app for exploring the codebase's import/export graph live. It complements `dependency-cruiser` rather than replacing it.

- **dependency-cruiser** — PR-blocking validation, static diagrams in `public_docs/architecture/`, architecture rules. See [dependency-analysis.md](dependency-analysis.md).
- **skott** — daily debugging: "what depends on `characterStore`?", "how does this circular dep actually loop?", "show me everything in the narrative domain."

## How it's integrated

CI runs `npm run skott:check` (the `Skott circular-dep budget` job in `ci.yml`). That script invokes skott and fails the build if the count of circular dependencies reachable from `src/app/layout.tsx` is higher than the baseline in `.skott-baseline.json`. So new cycles can't sneak in without you noticing.

When CI fails:

1. Run `npm run skott:circular` locally — you get the file-tree view of every cycle, top-down.
2. Diff against what was there before to find the new one. The list is small enough to eyeball; the budget in `.skott-baseline.json` is currently 6.
3. Either fix the cycle, or — if it's deliberate, like the `StoreEventBus` pattern — bump the integer in `.skott-baseline.json` and note the reason in the commit message.

If a refactor *removes* cycles, `skott:check` prints a "consider lowering the baseline" notice but still passes. Tightening is on the next refactor.

## Quick start

Open the interactive webapp (default — opens a browser):

```bash
npm run skott:analyze
```

Walk circular dependencies in a file-tree view:

```bash
npm run skott:circular
```

Render a static graph (browser opens):

```bash
npm run skott:graph
```

Watch mode — re-runs the analysis when you save a file:

```bash
npm run skott:watch
```

All four scripts use `src/app/layout.tsx` as the entrypoint (so only code reachable from the running app is in the graph), `tsconfig.json` for path-alias resolution, exclude tests/stories/`__tests__/`, and set `--exitCodeOnCircularDependencies=0` so the process doesn't fail when it finds real circulars (which exist — `StoreEventBus` was built specifically to handle one of them).

## When to reach for skott vs dependency-cruiser

| Task | Tool |
|---|---|
| "Will my PR pass CI architecture checks?" | `npm run deps:validate` |
| "What's the architecture look like at a glance?" | `public_docs/architecture/dependency-graph-folders.svg` |
| "Why is this file importing that one?" | `npm run skott:analyze`, click to navigate |
| "Show me every importer of this module" | `npm run skott:analyze`, click the module |
| "What circular deps exist and how do they loop?" | `npm run skott:circular` |
| "Live update as I refactor" | `npm run skott:watch` |

## Tips

- The webapp displays at `http://localhost:<port>` — port is logged on start.
- Search by file path or name in the webapp's top bar.
- To explore from a different entrypoint, call skott directly: `npx skott --displayMode=webapp src/state/characterStore.ts`.
- The `--ignorePattern` flags in the npm scripts exclude tests and stories; pass `--ignorePattern=...` on the CLI to add more.

## Adding skott CLI flags

The npm scripts are intentionally one-liners — if you want a different display mode or to track third-party dependencies, run `npx skott --help` and call skott directly. The wrappers cover the common cases; they're not a config layer.
