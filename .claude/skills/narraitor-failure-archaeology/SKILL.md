---
name: narraitor-failure-archaeology
description: Narraitor's memory of painful failures, reverts, dead ends, and deliberately settled decisions. Use BEFORE proposing to remove/replace something that looks wrong or overengineered (the event bus, the react-joyride pin, split store files), before re-attempting an idea that may have been tried, when a doc or memory claims HISTORY the tree contradicts ("was X removed?", "did we already try Y?"), or when asked "why is it built this way". Do not re-fight settled battles. (Which docs to trust at all -> narraitor-repo-orientation; writing the correction -> narraitor-docs-and-writing.)
---

# Failure archaeology

## 1. Purpose
Preserve the expensive lessons so future sessions inherit conclusions instead of re-running the failures. `SKILL.md` is the index; the full stories (symptom → wrong path → root cause → doctrine) live in [reference.md](reference.md).

## 2. When to use
Before deleting/"simplifying" anything that looks vestigial; before dependency bumps; before re-proposing an old idea; when explaining a surprising design choice.

## 3. When not to use
- Live debugging of a new failure → `narraitor-debugging-playbook` (it links back here when a symptom matches a settled battle).
- Product-level open problems → `narraitor-product-frontier`.

## 4. Inputs required
The thing you're about to change/propose, and a search of closed issues/PRs for it (`gh issue list --state closed --search "<term>"`).

## 5. Procedure
1. Check the settled-battle index below; read the matching entry in reference.md before acting.
2. If your proposal contradicts a doctrine entry, you need NEW evidence the constraint no longer holds — cite it, or drop the proposal.
3. If you find a fresh painful lesson (a wrong path that cost real time), append it to reference.md following its entry format (append-only; corrections per change-control).

**Settled-battle index (doctrine one-liners; details in reference.md):**
- **StoreEventBus stays** — pub-sub exists to break circular imports for cascade deletes; deleting it re-breaks WORLD_DELETED cascades.
- **react-joyride stays pinned at 3.0.0-7** — stable 3.x is a @floating-ui rewrite; bumping is a migration project, not a chore.
- **No Tailwind / cva / cn() — ever again** (#1097). Plain CSS + tokens + clsx is the settled system.
- **No wrapper services** — ExportService was deleted on purpose; don't reintroduce the layer.
- **No living style guide routes** — `/dev/design-system*` retired (ADR-012); Storybook is canon.
- **No `eval(require())` / dynamic store access** (#1206).
- **Infrastructure without a caller is dead** — streamResilience shipped unwired (#903) and was deleted; wire it or don't build it.
- **Superlative history claims demand direct verification** — a discovery agent invented a "personalizationEngine revert at #1195" during this library's own authoring; agent-mined history is `observed` at best until checked against `git log`/`gh` yourself.
- **Baseline cascades are handled wholesale** — regenerate all affected visual baselines together, macOS only.
- **Ambient `@google/genai` types shadow the SDK** — extend `src/types/@google/genai.d.ts`, don't fight tsc.
- **Split store files are deliberate** — `narrativeStore.*.ts` / `loreStore.*.ts` module splits are the pattern FOR god-files, not clutter to re-merge (inventoryStore split is pending, #1415).
- **Dev harnesses are throwaway** — test effort goes into app suites, not `/dev/*` tooling.
- **#1828 is closed unfixed; don't reopen it with a wording round** — 13 rounds each traded one named failure for another. Engagement and invention are the same reflex. A reopen needs a different mechanism, and presence-gating is not a shippable subset.
- **Split A/B flags by which build wrote the prose** before claiming a prompt-side bug exists on develop — #1926 read as a 28-to-5 win until the split showed all 28 came from treatment-build prose and 0 from control.

## 6. Evidence required
When overturning a doctrine: the original constraint, why it no longer binds, and a passing demonstration (e.g., for a joyride bump: a branch where `type-check` and the tutorial visual specs pass).

## 7. Output artifact
Either "checked archaeology — no conflict" in your work log, or a doctrine-change proposal with evidence, or a new appended entry.

## 8. Common traps
- Bad behavior this prevents: a cleanup pass flags `storePubSub.ts` as "unnecessary indirection", inlines the cascades, and reintroduces the circular-import problem plus a lore-wiping deletion bug that took #1505 to fully fix.
- Treating "I can't see why this exists" as evidence it shouldn't — absence of visible reason is a prompt to dig, not to delete.
- Reading a stale doc/memory as current state (this repo has both; the tree wins).

## 9. Related skills
`narraitor-architecture-contract` (the invariants these lessons produced) · `narraitor-change-control` (append-only corrections) · `narraitor-repo-orientation` (the do-not-trust list).

## 10. Provenance and maintenance

Re-verify volatile claims with:
- `grep '"react-joyride"' package.json` (pin intact?)
- `ls src/lib/state/storePubSub.ts src/state/storeEventWiring.ts` (bus intact?)
- `git log --oneline -30` (new arcs to archive?)

Last generated: 2026-07-04 (develop @ 4bec88e6)
Known uncertainty:
- Entries derive from git/issue history + project memory re-verified against the tree this session; per-entry evidence labels are in reference.md.
- The tsc-error count for the joyride bump (~51) is a remembered figure from the attempt, not re-reproduced (stale-risk on the number, not the doctrine).
