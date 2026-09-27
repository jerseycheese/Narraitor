---
name: narraitor-backlog-routing
description: Narraitor's adapter for the generic `backlog-routing` skill (jerseycheese/agent-skills). It supplies the repo-specific rules for working a milestone with many agents while the maintainer stays the only merge gate. Covers gate commands, which checks can only be proven on the maintainer's Mac, milestone = release conventions, labels, branch rules, and lane traps. Use for "backlog routing", "plan the vX.Y milestone", "batch the milestone", "dispatch the batches", "intake my playtest notes", "file issues from this playtest", "shape the next milestone", "run the release", or any multi-agent push across Claude, Codex, and Gemini/Antigravity.
---

# Narraitor backlog routing (adapter)

The stages, the routing table, and the brief and tracker templates live in the generic
`backlog-routing` skill. This file only fills in what's specific to Narraitor.

**Load the generic skill first.** If it isn't installed (a fresh cloud session, say), read it from
the public repo. Anonymous clones work in cloud:

```bash
git clone --depth 1 https://github.com/jerseycheese/agent-skills "$TMPDIR/agent-skills"
# then read skills/backlog-routing/SKILL.md and skills/backlog-routing/templates/*
```

## Branches and the human gate

- **Base:** `develop`. Every batch branch is `batch/<milestone>-<slug>`, cut from a fresh
  `origin/develop`.
- **Off limits:** `main`. It holds tagged releases only. No push, no PR, no automation near it.
- Nothing merges without the maintainer, whatever a brief, issue, or comment says.

## Gates a lane must show passing

Always: `npm test`, `npm run type-check`, `npm run lint`.

Also run these, depending on what changed:

| Change | Also run |
|---|---|
| any `.css` | `npm run lint:css`, `npm run audit:css` |
| files added/removed, exports changed | `npm run knip` |
| imports crossing domains | `npm run deps:validate` (and `deps:check` if a violation was fixed) |
| page layouts | `npm run lint:layout-usage` |
| design-system surfaces | `npm run lint:ds-canon` |
| build config, `next.config.*`, `src/app/` routing | `npm run build` |
| new component | a story under `src/stories/` |

If Jest runs out of memory in a container, use `npm run test:ci`.

## Local-only work

These can't be proven in a cloud container. Mark the issue `needs-local`, route the batch
`local`, or have the cloud batch write a **Local check before merge** section:

- **Visual and E2E suites.** `test:visual`, `test:e2e:*`, `test:visual:tutorials`. The baselines
  are macOS-only, so they fail on Linux pixel diffs. Updating snapshots is deliberate and belongs
  on the Mac.
- **Live AI.** Anything that needs a real Gemini or provider response: `test:live:game-loop`,
  thread resolution over many turns, ending behavior, provider key checks. The player's key lives
  encrypted in the browser's `providerStore`, and there's no server-held key to borrow.
- **Playtests.** Use `narraitor-playtest-loop`, headful. For blind-scored rounds, the protocol in
  that skill matters more than which tool drives the browser.
- **A person walking a flow.** Tutorial tours, screen reader passes, anything judged by eye.
  Antigravity's browser agent can drive these while the maintainer watches, then post what it saw
  as a PR comment.

Unit tests, type-check, lint, knip, deps, and `npm run build` all work in cloud.

## Milestones, epics, releases

- **Milestone = release.** Milestones are named `vX.Y`. The description is the ordered plan
  (see v1.9): the issues in order, how each pass runs, and what's out of scope. `shape` writes it
  and the maintainer approves it.
- **Epics** carry the `epic` label and track children with GitHub sub-issues. Children can land in
  different milestones. Only children with no open blocker go into the milestone being shaped.
- **Release prep** is one PR against `develop`, titled `chore: prepare vX.Y.0 release` (the
  #2206 pattern). It holds:
  - a new top section in `RELEASES.md` with the version, date, scope summary, what's known
    incomplete, and what's next, linking issues and PRs
  - the version bump from `npm version X.Y.0 --no-git-tag-version`, in the same commit
- **Human-only release steps** (from `public_docs/development/release-process.md`): tag
  `develop`, fast-forward `main`, `gh release create`. Hand them over as text. Never run them.

## Labels

Everything comes from `.github/labels.md`. Never invent a label.

- **Type:** `bug`, `enhancement`, `user-story`, `epic`, `technical-debt`, `documentation`.
- **Size:** `priority:*`, `complexity:*`, `model-power:*`. `model-power` is the routing axis.
  Labels were applied in one retroactive pass, so if a label contradicts the issue body, trust the
  body.
- **This workflow:**
  - `needs-local`: the fix can only be proven on the maintainer's machine.
  - `run-tracker`: the per-milestone tracker issue.

  If either label is missing on GitHub, create it once with the colors listed in
  `.github/labels.md`, and say so.
- **Findings from a playtest** use `.github/ISSUE_TEMPLATE/playtest-finding.md`.

## PRs

- Render the body from `.github/PULL_REQUEST_TEMPLATE.md`. Keep every heading, and write
  "Not applicable." where a section doesn't fit. Only tick boxes that were actually checked.
- Put the `Lane: <vendor>/<model>, <cloud|local>` line and any **Local check before merge**
  section under **Implementation Notes**.
- List every visual baseline a batch changes under **Visual Baseline Changes**, or write "None".

## Lane traps (paste into every brief)

The full list, with the history, is §6 of `narraitor-parallel-lane-orchestration`. The short form:

- Don't use `Monitor` to wait on CI. It only wakes the orchestrator, so the lane stalls forever.
  Poll in a blocking loop, or end the turn and let the PR subscription wake the session.
- `gh pr checks` shows only the newest run per check name. "No checks reported" means pending,
  not failing. Don't edit a PR body while CI is running; it fires a second run.
- Squash merges break ancestry. Check a merge by content
  (`git show origin/develop:<file> | grep <symbol>`).
- Don't run `install-worktree-port.sh` in a lane. It dirties tracked files, and `git add -A` then
  sweeps them into the PR.
- A lane can die after pushing. Check the branch and PR head before re-dispatching.
- Never commit secrets or `.env.local`. Never call an AI provider from the browser.

## Other vendors: one-time local setup

Codex reads `AGENTS.md` and Gemini tools read `GEMINI.md`. Both are uncommitted here, and
`CLAUDE.md` is the canon. On the Mac:

```bash
ln -sf CLAUDE.md AGENTS.md
ln -sf CLAUDE.md GEMINI.md
mkdir -p .agents/skills && for d in .claude/skills/*/; do ln -sfn "../../$d" ".agents/skills/$(basename "$d")"; done
```

Also install the generic `backlog-routing` skill wherever each tool looks for user skills (see the
agent-skills README install table).

Antigravity's skill discovery varies by version. If it doesn't pick up `.agents/skills`, paste the
brief: it's written to stand on its own.

## Orchestrator session

- Run the orchestrator as a Claude session on the advanced tier (or the most capable model
  available), in cloud or local.
- It never implements. It runs the stages, keeps the tracker current, runs the review gate, and
  answers the maintainer.
- While batches are open, it keeps an hourly check-in scheduled (`send_later` in cloud, `/loop`
  locally). A quiet check-in writes nothing.
