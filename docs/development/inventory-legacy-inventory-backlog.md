# Legacy Inventory Cleanup Follow-Up

## Context
While the current bug fix hardens `processItemUsage` against legacy `characterInventories` payloads, we're clearly sitting on a mismatch between the old IndexedDB shape and what the store expects today. That mismatch is only showing up when a player dusts off an older save, but when it does the UI flashes the generic red “Unexpected error” banner and item usage stops cold until the state is rebuilt.

## What hurts right now
The hotfix filters the incoming state before we call `includes`, so gameplay continues, but we haven't actually migrated the underlying data. Anyone keeping stale IndexedDB entries will keep taking the slow path, and the fix doesn't add any observability. In other words, we solved the symptom inside the current issue but didn't clean up the reservoir of bad data or document how we want to treat future shape changes.

## Scope for this follow-up
- Decide whether we want a one-time IndexedDB migration, a destructive reset, or a toast-driven prompt that asks players to clear inventory persistence themselves.
- Add lightweight telemetry or logging so we can see how often the coercion path lights up after the fix ships.
- Update the storage resilience doc (or add a short appendix) that spells out the expected Redux/Zustand shapes going forward, so future schema bumps don't surprise us.
- Backfill test coverage that loads a crafted legacy snapshot through the persistence middleware. The unit harness is doing the work, but we don't have a clear fixture that other developers can reuse.

## Out of scope (already handled)
The current ticket already guards runtime usage and keeps the UI from crashing. We don't need to re-litigate that change here—this issue is about data hygiene, observability, and making the long-term shape explicit.

## Definition of done
- [ ] Persistence layer either migrates or drops stale entries so fresh loads get a clean array without touching the guard rails.
- [ ] Logging/telemetry proves we no longer hit the compatibility shim after rollout.
- [ ] Docs are updated so the next storage adjustment has a playbook to follow.
- [ ] QA checklist updated with guidance on how to seed and verify legacy inventory data during regression runs.
