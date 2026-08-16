---
title: "ADR-014: Narraitor stays browser-local until a named trigger fires"
tags: [architecture, decision, adr, persistence, accounts, roadmap]
created: 2026-08-15
updated: 2026-08-15
---

# ADR-014: Narraitor stays browser-local until a named trigger fires

**Status**: Accepted
**Date**: 2026-08-15

Extends [ADR-002](ADR-002-client-side-only-architecture.md) rather than superseding it. ADR-002's decision stands exactly as written: no user accounts, no application database, all player data in the browser. What this adds is the reopen condition ADR-002 left blank.

## The Situation

ADR-002 accepted a real trade-off back in 2025-04-28. Data lives in one browser profile, so there's no cross-device sync and no cloud backup. It called that "an accepted trade-off for now," and said anything genuinely multi-user "would require revisiting this from the ground up." Both are fair. Neither says what would cause the revisit.

That blank turned into drift. Two epics parked themselves behind a prerequisite with no scope, no issue, and no owner. #1370 (multiplayer and shared worlds) sat from the 2026-06-04 backlog reorg until it was closed on 2026-08-10. #495 (commercialization) still assumes a hosted service with subscription billing. Neither was ever scheduled and neither was ever ruled out, so both kept their place in the backlog on the strength of a question nobody had answered.

#1744 was filed to force that answer, on the argument that any answer beats the limbo. It's right about the limbo and wrong on one detail: it says nobody ever made the decision, but ADR-002 made it. The decision just had no expiry condition attached, which is why it kept feeling open.

## What We Decided

Narraitor stays browser-local. ADR-002 is unchanged and still governs.

Three conditions reopen it, and any one is enough:

1. **Storage loss stops being hypothetical.** More than one recorded case of a lost world, character, or session from a cleared browser profile or from IndexedDB eviction. The ADR-002 downside actually biting is the strongest argument for sync there is, and it's observable rather than speculative.
2. **A paying player asks to play on a second device.** This needs a paid product to exist first, so it depends on how #495 resolves.
3. **Shared worlds come back as a product goal.** One player hands a world to another to play in. That was #1370's territory, and closing it retired the goal, so reviving it has to be a deliberate act.

Until one fires, accounts and server persistence are off the roadmap. No issue may assume them.

## Why This Made Sense

The usual reason to build accounts is billing, and bring-your-own-key removes it. The player configures a provider and supplies the key, so the provider bills the player direct. Narraitor pays nothing per turn. There's no per-user cost to recover and no usage worth metering, which is the exact pressure that pushes most apps toward accounts whether they want them or not.

The multiplayer reason is gone too. #1370 closed on 2026-08-10, and with it the one goal in the backlog that genuinely could not work without shared server state.

What's left is a cost comparison that isn't close. Staying browser-local costs nothing new. Building accounts costs an auth surface, a data model, a migration path off IndexedDB, conflict resolution, and a retention policy, each carrying permanent operational and privacy weight, for a product where one person owns the data and sits at one browser.

### What Else We Considered

- **Build accounts and server persistence now.** Rejected: no driver survives inspection. The epic that needed shared state is closed, and BYOK means there's nothing to bill for.
- **Say never, and close the question permanently.** Tempting, and cheaper to reason about than a conditional. Rejected because the ADR-002 downside is real: browser profiles do get cleared and IndexedDB does get evicted. A permanent no would have to be walked back in public the first time that cost somebody their saves, and the stronger claim buys nothing over a conditional one.
- **Leave ADR-002 alone and close #1744 as already answered.** Rejected. "For now" with no condition attached is what produced the drift, and closing the issue without filling that gap would just produce it again.

## What This Means Going Forward

### Upsides

ADR-002's privacy story holds. Player data never reaches a server, the routes under `src/app/api/` stay stateless proxies, and the key stays out of server storage.

Feature scoping gets a rule it can apply. If a proposal needs server state, the answer is a named trigger that hasn't fired yet. That check is quick, and it doesn't reopen the argument every time.

#495 can be scoped against the product that exists rather than a foundation that isn't coming.

### Downsides

Cross-device play still doesn't exist. Starting a session on a laptop and continuing it on a phone isn't possible, and this decision doesn't move that any closer.

Losing the browser profile still loses the saves. The storage-resilience work lowers the odds without removing the failure mode, and trigger 1 exists precisely because that risk is accepted rather than solved.

## Implementation Notes

No code changes. This is a scoping decision.

Backlog follow-through:

- **#1370** - closed 2026-08-10. Nothing to do.
- **#495** - needs rescoping, and that rescope is its own call. Its checklist assumes a hosted subscription: choose a payment provider, implement a payment flow, manage subscriptions, track conversion. A browser-local BYOK app has no per-user cost to recover, so a recurring subscription is a hard sell. The launch-prep half of that epic applies either way, since a landing page, user documentation, terms of service, a privacy policy, and a feedback route are all things a browser-local product still needs.
- **#1744** - closes once #495 has been updated to match.

For whoever reopens this later: reopening means a new ADR that supersedes ADR-002, not an edit to ADR-002 in place. Name which trigger fired and what it was observed as.

## Related Decisions

- [ADR-002: Client-side-only architecture](ADR-002-client-side-only-architecture.md) - the decision this extends.
- [ADR-004: IndexedDB persistence](ADR-004-indexeddb-persistence.md) - the storage layer, and where the per-browser-profile trade-off is documented.
- [ADR-006: Gemini behind server-side API routes](ADR-006-gemini-server-side-api.md) - why a thin server exists at all.
