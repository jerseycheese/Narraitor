# Cross-theme audit (#1129)

Tooling for the design-system migration audit on `1020-design-system-integration`.
Captures component-level screenshots across `develop` + `DS1`/`DS2`/`DS3` integration
themes and produces a per-route review UI for side-by-side comparison and triage.

## Layout

```
scripts/audit/
  build-seed.ts             # Emits per-state IDB+localStorage seed JSON
  playwright-crawl.ts       # Primary crawler (replaces bdg-based bash scripts)
  build-review-html.py      # Generates review/ from captures/
  run-parallel.sh           # 3-worker parallel runner (one worker per state)
  component-crawl.sh        # Desktop bdg crawl (deprecated; kept as fallback)
  component-crawl-mobile.sh # Mobile bdg crawl (deprecated; kept as fallback)
  review/
    index.html              # Route index with live mark counts
    <route>.html            # Per-route review page (x14)
  review.html               # Legacy redirect stub -> review/index.html
  seeds/                    # Generated seed JSON (gitignored)
  captures/                 # PNG output (gitignored)
    comp-<branch>/
      <viewport>/           # desktop | mobile
        <state>/            # empty | seeded | mid-session
          <route>__<component>.png
```

## Running a capture pass

### Serial (single state)

Runs all 14 routes for one branch × viewport × state sequentially:

```sh
npx tsx scripts/audit/playwright-crawl.ts \
  --theme ds3 --mode light --state seeded \
  --branch integration-ds3-light --viewport desktop
```

Key flags:
- `--branch <label>` — used as the capture subdir suffix (`comp-<label>`). Required.
- `--theme <ds1|ds2|ds3|default>` — sets `narraitor-theme` in localStorage.
- `--mode <light|dark>` — sets `narraitor-color-scheme` in localStorage.
- `--state <empty|seeded|mid-session>` — which fixture seed to inject.
- `--viewport <desktop|mobile>` — desktop=1320×900, mobile=390×844.
- `--base-url <url>` — defaults to `http://localhost:3000`.
- `--route <slug>` — capture a single route only (e.g. `--route worlds-create`).
  Only that route's PNGs are written; other captures in the dir are untouched.

For `develop` (no theme switch), use `--theme default --branch develop-default`.
Run develop from its worktree on a different port so it doesn't kill the integration server:

```sh
# From /tmp/narraitor-develop-1129 (the develop worktree)
npx next dev -p 3001

# In another terminal:
npx tsx scripts/audit/playwright-crawl.ts \
  --theme default --mode light --state seeded \
  --branch develop-default --viewport desktop \
  --base-url http://localhost:3001
```

### Parallel (3 states concurrently against one server)

`run-parallel.sh` spawns one worker per state (empty / seeded / mid-session) sharing
a single dev server. This cuts wall time to ~1/3 of a serial 3-state pass.

```sh
# Integration branch (server already on :3000):
bash scripts/audit/run-parallel.sh \
  --branch integration-ds3-light \
  --viewport desktop \
  --theme ds3 \
  --mode light \
  --skip-server

# Develop branch (spawns its own server on :3001):
bash scripts/audit/run-parallel.sh \
  --branch develop-default \
  --viewport desktop \
  --theme default \
  --mode light \
  --worktree /tmp/narraitor-develop-1129
```

Key flags:
- `--worktree <path>` — directory to `cd` into when starting the dev server.
  Defaults to the repo root.
- `--base-url <url>` — skip port selection; use this URL directly.
- `--skip-server` — don't start/stop a dev server (use when one is already running).

**Collision safety:** each worker writes to `captures/comp-<branch>/<viewport>/<state>/`
— state segments are disjoint, so no file conflicts. Seeds are regenerated once
before workers start and are read-only during the crawl.

**Why not cross-branch parallel?** Running 4 dev servers simultaneously multiplies
cold-compile cost (each server JIT-compiles all 14 routes on first nav). Cross-state
parallelism amortizes the compile cost because all 3 workers hit the same warm server.
Run this script once per branch to parallelize; loop over branches yourself.

## Generating / refreshing the review pages

```sh
python3 scripts/audit/build-review-html.py
# writes scripts/audit/review/index.html + one page per route
```

Serve with any static HTTP server so relative paths resolve:

```sh
python3 -m http.server 8765 --directory scripts/audit
# open http://localhost:8765/review/index.html
```

## Review UI

The review lives in `scripts/audit/review/`:
- **`index.html`** — route list table with live mark counts, total/unresolved per
  route, and category breakdowns. Refreshes counts on window focus (when another
  tab sets marks) and on the `storage` event.
- **`<route>.html`** — per-route grid (all branches × states × viewports). Includes
  prev/next route navigation and a Back to Index link.

### Marks and triage

Cells have a **Mark** button. When marked, a toolbar expands with:
- **Category** chips: `bug` / `tooling` / `intentional` / `unclear`
- **Why** — one-line summary used for issue grouping / markdown export
- **Note** — freeform scratchpad
- **Copy re-capture command** — copies a single-route playwright-crawl.ts invocation
  to the clipboard. Run it in your terminal, then reload the page to see the fresh
  capture.

Mark state persists in localStorage (`narraitor-audit-marks-v3`). The key shape is
`route__component__viewport__state__theme` and the value shape is:

```json
{
  "marked": true,
  "note": "freeform scratchpad",
  "category": "bug",
  "why": "header overflows mobile viewport",
  "updatedAt": "2026-04-30T18:22:00.000Z"
}
```

Use **Export markdown** to produce a triage punch list grouped by route (includes
category tags and why). Use **Export JSON** / **Import JSON** to migrate marks across
browsers or machines.

### Mark schema migrations

| Source  | Destination | What happens                                                   |
|---------|-------------|----------------------------------------------------------------|
| v1 (4 segments, no state in key) | v3 | State segment `__seeded` inserted; value upgraded to v3 shape |
| v2 (5-segment key, old value)    | v3 | Key copied as-is; `category=null`, `why=""`, `updatedAt=now` added |

Migrations are lazy (on first load or import). v1 and v2 namespaces are left untouched
for rollback.

## States captured

| State         | Worlds        | Characters        | Active session | Segments / Decisions / Journal |
|---            |---            |---                |---             |---                             |
| `empty`       | none          | none              | none           | none                           |
| `seeded`      | SAMPLE_WORLDS | SAMPLE_CHARACTERS | none           | none                           |
| `mid-session` | SAMPLE_WORLDS | SAMPLE_CHARACTERS | first session  | full set                       |

`tutorialProgress` is fully completed for `seeded` / `mid-session`, and fully
incomplete for `empty`.

## Known issues (from Phase 1 captures)

- **`worlds-play-journal`**: `net::ERR_ABORTED` on both DS3 and develop — heavy lazy-load
  or redirect loop. Investigate independently of the audit.
- **`worlds-create` empty state**: world-creation tour popup fires for first-time users.
  This is real first-time UX, not a tooling artifact.
- **Mobile empty state (home, about)**: HeaderNavigation overflows 390px viewport.
  This is a real bug (see GitHub issue tracker).
