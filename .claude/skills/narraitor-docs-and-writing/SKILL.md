---
name: narraitor-docs-and-writing
description: Maintaining Narraitor's docs of record - status language, marking stale claims, append-only corrections, doc templates, and the project voice for all generated prose (PRs, issues, comments, code comments, user-facing copy, docs). Use when WRITING or FIXING any documentation or prose, when marking/correcting a doc that contradicts the code, when recording a correction to an earlier wrong claim, or when drafting PR/issue text. (Deciding whether the claim is true -> narraitor-change-control; which docs to trust -> narraitor-repo-orientation.)
---

# Docs & writing

## 1. Purpose
Keep the written record honest and in-voice: docs describe verified state, stale claims get marked not deleted-silently, and corrections append rather than rewrite.

## 2. When to use
Any doc edit; any PR/issue/comment prose; discovering doc-vs-code contradictions; recording corrections.

## 3. When not to use
- Deciding WHETHER a claim is true → `narraitor-change-control` / `narraitor-validation-and-qa`. This skill is how to WRITE it.
- Don't proactively create new doc files — update existing docs of record (house rule).

## 4. Inputs required
The doc, the code evidence for every claim you'll write, and (for corrections) the original wrong claim verbatim.

## 5. Procedure

**Where docs live:** committed record = `public_docs/` (ADRs, guides, roadmap), `README.md`, `DESIGN.md`; templates at `public_docs/templates/` (architecture-decision, feature-implementation, technical-guide, pr-content). `docs/` is a gitignored personal planning vault — never cite it as record. Skills (`.claude/skills/`) are procedures, not status docs — project status lives in issues/roadmap.

**Status language (forbidden without evidence):** "done / fixed / verified / validated / integrated / reliable / complete" follow the change-control table — each needs a named artifact. Absent evidence, write what is true: "implemented, unit-green, not yet app-verified".

**Evidence labels for doc claims:** `known` (verified on a stated date), `observed`, `candidate`, `unverified`, `stale-risk`, `owner-confirmation-needed`. Date volatile claims: "as of 2026-07-04 (develop @ 4bec88e6)".

**Marking stale content:** when you find a stale claim you can't immediately fix, mark it in place — `> STALE-RISK (2026-07-04): X below contradicts <file/evidence>; verify before use.` — and flag it (issue or PR note). Known standing stale spots: DESIGN.md's `/dev/design-system*` canon refs; `public_docs/features/ai-systems.md` model name; ADR-007 (correctly historical).

**Append-only corrections** (template: [templates/correction-append.md](templates/correction-append.md)): never rewrite a wrong claim to look like it was always right. Append the correction with date, why it was wrong, actual state, evidence. History of being wrong is data.

**ADRs:** decisions that change architecture get an ADR via the template, numbered sequentially after ADR-012, superseding rather than editing old ones (ADR-007 shows the "historical" pattern).

**Voice (all generated prose, not just docs):** conversational-professional; contractions; no corporate speak, no overenthusiasm, no academic transitions; context first, then the point; acknowledge trade-offs plainly. No emojis. In USER-FACING app copy additionally: never mention "AI" (commits/PRs/comments may). Code comments: WHY not WHAT — design rationale, constraints, external quirks, actionable TODOs with issue numbers; never archaeology ("moved from X"), never commented-out code.

## 6. Evidence required
Every factual claim written maps to something you verified this session or carries an honest label.

## 7. Output artifact
The doc diff, with stale-markers/corrections visible in review; PR/issue prose in voice with the repo template filled truthfully.

## 8. Common traps
- Bad behavior this prevents: "tidying" a doc by silently deleting its wrong claim about streaming middleware — the next session, primed by memory, re-adds it; an appended correction would have immunized them.
- Propagating a stale doc's claim into new docs (always verify against the tree before citing another doc).
- Writing docs for the reviewer ("this change correctly handles…") instead of the next reader.
- Creating README variants / new .md files instead of updating the doc of record.

## 9. Related skills
`narraitor-change-control` (evidence bar, Step 5 corrections) · `narraitor-repo-orientation` (docs of record + do-not-trust list) · `narraitor-failure-archaeology` (append-only entry format).

## 10. Provenance and maintenance

Re-verify volatile claims with:
- `ls public_docs/templates/` (template inventory)
- `grep -rn "dev/design-system" DESIGN.md public_docs/design-system/README.md | head -3` (standing stale refs fixed yet?)

Last generated: 2026-07-04 (develop @ 4bec88e6)
Known uncertainty:
- The full writing-voice profile is an owner-personal file not in this repo; the rules here are the durable subset. When producing high-stakes prose for the owner, ask or match recent PR prose.
