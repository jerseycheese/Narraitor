---
name: narraitor-parallel-lane-orchestration
description: Run a batch of Narraitor issues as parallel worktree lanes, with a Fable orchestrator picking the batch and delegating each issue to a subagent whose model matches the issue's model-power label. Use when asked to "work the top N issues in parallel", "fan out the backlog", "kick off a parallel batch", "orchestrate lanes", or when planning a multi-issue push that should run concurrently rather than serially. Covers batch selection, collision avoidance against work already in motion, model tiering, and the lane failure modes that have actually bitten this repo.
---

# Parallel lane orchestration (Fable orchestrator, tiered lane agents)

## 1. What this is

One Fable-model session acts as orchestrator. It picks N issues off the backlog, pre-builds a
git worktree per issue, and spawns one Agent-tool subagent per lane — each lane's model chosen
from that issue's `model-power:*` label, so cheap work runs cheap. The orchestrator never
implements; it selects, partitions, dispatches, unblocks, and reports.

The mechanism that works here is the **in-harness Agent tool**, not `claude -p` children
(host-held OAuth 401s) and not a paste-block of terminal commands.

## 2. When to use

- "Work the next N most important issues in parallel."
- A backlog push where serial execution would waste hours of wall clock.
- Any time a batch is big enough that batch *selection* is itself a real decision.

Do not use for a single issue (`ship-issue` / `tdd-implement` are cheaper), or when the batch
would all touch the same file (see collision rules — that batch is serial by nature).

## 3. Model tiering

`model-power:*` is the delegation axis (`complexity:*` is time/scope, not reasoning difficulty).
Definitions live in `.github/labels.md`.

| Label | Lane model |
|---|---|
| `model-power:light` | `haiku` |
| `model-power:standard` | `sonnet` |
| `model-power:advanced` | `opus` |
| `model-power:frontier` | keep out of the batch, or run it in the orchestrator session |

An unlabeled issue is not automatically `standard` — read the body and assign a tier, saying so.
The labels were applied in a single retroactive pass, so treat a tier that fights the body as
wrong and score the body.

## 4. Batch selection

Run the `prioritize-issues` skill for the ranking, then subtract everything that cannot safely
run right now:

- **Already in motion.** Any issue with an open PR, or an existing worktree/branch matching its
  number. A pre-existing worktree is not proof of abandonment — ask before touching it.
- **Explicitly held.** A draft PR on a HOLD, an issue whose body says it lands with or after
  another PR, an issue waiting on a spending or design decision.
- **Collision.** Predict each candidate's file set. Intersect the sets pairwise. Overlapping
  candidates either get one named sole owner for the shared file (the other is told in writing
  not to touch it) or one of them drops out of the batch. Shared prompt templates
  (`sceneTemplate.ts` and friends) and shared CSS are the repeat offenders.

All-lanes-mergeable proves nothing about collisions: three lanes once trial-merged clean against
`develop` and the conflict only appeared after the first merge landed.

## 5. Lane setup the orchestrator owns

Lanes start faster and cleaner when the orchestrator does this work up front rather than making
each lane do it:

```bash
git worktree add -b claude/issue-<n> \
  /Users/jackhaas/Projects/personal/narraitor/.claude/worktrees/issue-<n> origin/develop
git -C <worktree> branch --unset-upstream    # else a bare git push targets develop
( cd <worktree> && npm ci )                  # node_modules is per-worktree
```

Do **not** run `install-worktree-port.sh` — it modifies tracked files (`scripts/dev.sh`,
`scripts/kill-port.sh`) and drops an untracked `scripts/worktree-port.cjs`, so every lane starts
dirty and a lane reaching for `git add -A` sweeps them into its PR.

Hand each lane its absolute worktree path.

## 6. The traps that have actually cost time here

- **Lanes stall on `Monitor`.** A subagent that uses `Monitor` to watch CI ends its turn waiting
  for a notification that wakes only the orchestrator. Every lane prompt must carry the blocking
  poll snippet and the explicit "do not use Monitor" clause, from the first prompt — a corrective
  message later works but costs a stall-detect round trip per lane, and lanes relapse.
- **`gh pr checks` shows only the newest run per name.** `no checks reported` means pending, not
  failing. Never `gh pr edit` a PR body while CI is in flight — it fires a second run whose
  skipped jobs own the display.
- **Squash merges break ancestry.** Verify a merge by content
  (`git show origin/develop:<file> | grep <symbol>`), not `git merge-base --is-ancestor`.
- **A lane can die after pushing but before reporting.** Check the worktree's `git log` and the
  PR head against the remote before concluding a dead lane left work undone.
- **Dead lanes resume.** `SendMessage` to the agent id picks up the existing transcript. Restart
  only if the transcript is gone.
- **`API Error: 529` kills a lane at launch, leaving nothing behind.** Verify the worktree is
  clean, then retry. If a round of retries plus a backoff all fail, say so plainly and fall back
  to serial — do not let "all PRs green" imply the requested parallelism happened.
- **Codex review triage earns its keep.** After each PR goes green, read
  `gh api repos/{owner}/{repo}/pulls/<n>/comments`. Verify the finding yourself before relaying
  it, and check the comment's `original_commit_id` against the PR's `headRefOid` — a lane may
  already have fixed it.
- **`main` is release-only.** PRs target `develop`. Nothing automated goes near `main`.

## 7. Evidence bar for lane completion

A lane is done when its PR is open against `develop` with the full gate green
(`npm test`, `npm run type-check`, `npm run lint`, plus `lint:css` if it touched CSS), its body
rendered from `.github/PULL_REQUEST_TEMPLATE.md` with every heading kept, and any Codex findings
answered. "Merged" is a separate authorization — the batch prompt says which.

The orchestrator reports settled results, never file dumps.

## 8. The kickoff prompt

Paste this into a Fable session at the repo root, with `{N}` filled in and the merge policy
chosen. It states the destination and the boundaries rather than a step plan — Fable's output
quality drops when a prompt enumerates steps it can derive.

---

I'm running a parallel backlog push on Narraitor and I want you orchestrating it rather than
implementing any of it. The point is throughput: {N} issues moving at once, each worked by the
cheapest model that can actually do it, with none of them stepping on each other.

Where this ends: {N} issues each have a PR open against `develop` with the full quality gate
green and a body rendered from `.github/PULL_REQUEST_TEMPLATE.md`, and you can tell me for each
one what changed and what proves it works. Do not merge anything — leave them open and green
for me. [Or: merge each on green with `gh pr merge --squash --delete-branch`, then run the
`post-merge` skill for each.]

Pick the batch with the `prioritize-issues` skill, then subtract what can't run right now:
anything with an open PR or an existing worktree or branch for its number, anything the body
says is blocked or held, and anything whose likely file set collides with another candidate's.
Read bodies before scoring — the labels went on in one retroactive pass and some of them are
wrong now. Tell me the batch and your collision reasoning before you spawn anything; if you
can't find {N} that are genuinely parallel-safe, hand me a smaller batch and say why rather
than forcing it.

Choose each lane's model from that issue's `model-power:*` label: light runs on haiku, standard
on sonnet, advanced on opus. Keep frontier issues out of the batch. Where a label fights the
body, trust the body and say you overrode it.

Set the lanes up yourself before dispatching — a worktree per issue off `origin/develop` under
`.claude/worktrees/`, upstream unset, `npm ci` done — and hand each lane its absolute path. Skip
`install-worktree-port.sh` entirely; it dirties the tree with files that belong to no issue.
Read the `narraitor-parallel-lane-orchestration` skill for the rest of what has bitten this repo
before, and treat its trap list as constraints on the lane prompts you write, especially the
CI-polling one — a lane that reaches for the Monitor tool will sit there forever.

Where a lane's work touches a file another lane needs, name one owner in writing and tell the
other to leave it alone. Where two candidates can't be separated that way, drop one.

Run the lanes asynchronously and keep working while they go — check in on them, unblock them,
relay verified review findings, and intervene when one drifts. Don't block on the slowest.
Before you tell me a lane succeeded, point at the tool result that proves it: a green gate, a
`gh pr checks` bucket, a diff. If something failed, say so with the output. If a lane dies, look
at its worktree and its PR head before assuming its work is gone, and resume it rather than
restarting it.

I'm not watching this in real time, so don't ask me whether to proceed on things that follow
from this brief. When you're done, write me a summary I can read cold: what shipped, what
didn't, and what you need from me — plain sentences, no working shorthand.

---

## 9. Related

- `prioritize-issues` — the ranking half of batch selection.
- `worktree-enhanced` — single-lane worktree setup.
- `post-merge` — after a lane's PR merges.
- `narraitor-change-control` — the evidence bar a lane's "done" claim has to clear.
