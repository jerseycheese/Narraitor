# Releases

Narraitor is pre-1.0, so releases get tagged manually from `develop` and fast-forwarded to `main`. Each entry below covers what's in the tag, what's known to still be in flight, and what's lined up next. The full release process lives in [release-process.md](public_docs/development/release-process.md).

---

## v0.4.0-pre-design-system — 2026-05-10

This is the baseline tag, cut right before the multi-theme design system migration lands publicly. The idea is to give anyone who's pinned to a SHA today a stable point they can keep using while the design work plays out on `develop`.

**What's in this release**

- World creation wizard with AI-assisted attributes and skills
- Character creation, journal, and the AI-driven narrative engine (Gemini-backed, all calls routed server-side)
- IndexedDB persistence so sessions survive a refresh
- Three template worlds out of the box: Western, Sitcom, Adventure
- Secure API key handling and per-IP rate limiting (#478)

**Known incomplete**

The design system migration is mid-flight on `develop`. Phases 0–2 already merged via #1081, the structural differentiation piece is tracked in #1165, and #1020 is the umbrella epic that ties the whole thing together. A few smaller items are also still open — AI-inferred skill checks (#918, with #1207 as related context) and a stale `narraitor-character-store` localStorage cleanup that hasn't gotten its own issue yet.

**What's next**

- `v0.5.0-design-system` — cuts as soon as the #1020 epic closes out, brings the multi-theme tokens public
- `v0.6.0-theme-differentiation` — structural differentiation work from #1165 follows that
