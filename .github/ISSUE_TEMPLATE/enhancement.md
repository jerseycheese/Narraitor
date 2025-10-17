name: Enhancement
about: Shape up an existing feature so it behaves better in the real world
title: ""
labels: enhancement
assignees: ''
---

## Context
Right now older save data can hydrate `characterInventories` as an object instead of the array we expect, which means runtime calls like `includes` explode before the UI can surface a friendly message. Whether you're debugging locally or players are resuming a long-running session, this regression shows up as the generic “An unexpected error occurred” banner and blocks item usage entirely.

## What hurts today
Describe the user-facing breakage, how you spotted it, and why it matters for ongoing gameplay or QA coverage. Include links to any logs, traces, or recordings that show the failure in action.

## Proposed direction
Lay out the approach you want to take. If it helps, outline it as a short checklist:
- Coerce legacy inventory payloads into plain arrays during hydration so downstream code keeps its assumptions.
- Add a defensive guard around `useItem`/`getCharacterItems` to log and recover cleanly if another odd shape slips through.
- Backfill a migration or cleanup script if we decide the IndexedDB payload itself needs nudging.

## Safeguards
Aside from the code changes, call out the tests, migration scripts, or manual smoke checks you plan to run. Mention anything that keeps IndexedDB and Zustand hydration happy during upgrades.

## Definition of done
- [ ] Players hitting `Use` on legacy inventories see the success path (no red banner, inventory updates correctly)
- [ ] Automated coverage proves both modern and legacy shapes behave (unit tests + the relevant integration harness)
- [ ] Telemetry/logging updated if we need to watch real-world recoveries
- [ ] Any docs or runbook entries touched up so future migrations follow the same pattern
