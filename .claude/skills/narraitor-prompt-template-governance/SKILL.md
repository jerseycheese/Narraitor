---
name: narraitor-prompt-template-governance
description: The governed lifecycle for AI prompt templates in Narraitor - registry, input contract, context-leakage gate, evaluation, regression, cost, and integration gates. Use when adding or editing any prompt template, when tempted to inline a prompt string into a generator or route, when reviewing a prompt change, or when asked "where do prompts live" / "can I just tweak the prompt".
---

# Narraitor prompt template governance

## 1. Purpose
Keep every prompt findable, typed, evaluated, and reversible. A prompt is production behavior: it ships through a registry and gates, not as a string edit.

## 2. When to use
Any create/edit/delete of prompt text; any change to what context a prompt receives; reviewing a PR that touches `src/lib/promptTemplates/` or `src/lib/promptContext/`.

## 3. When not to use
- Judging output quality of an existing template → `narraitor-ai-quality-discipline` (this skill consumes its protocol as the eval gate).
- Generation config (temperature/tokens/model) → that's `src/lib/ai/config.ts` + change-control, not template governance.

## 4. Inputs required
The template diff; the context fields it reads; the eval log (or a plan to produce one).

## 5. Procedure

**The registry (where prompts live — nothing lives elsewhere):**
- Narrative templates: `src/lib/promptTemplates/templates/narrative/*` (scene, initial scene, action, transition, player-choice, choice-type, skill-acknowledgment, major-event guidelines), registered by id through `src/lib/promptTemplates/narrativeTemplateManager.ts` → `getNarrativeTemplate(id)` (throws on unknown id).
- Ending templates: `src/lib/promptTemplates/templates/endingTemplates.ts`.
- Context assembly + token measurement: `src/lib/promptContext/` (`tokenUtils.ts` estimates a string, `promptCalibration.ts` builds the DevTools snapshot, `inventoryContextBuilder.ts` trims inventory to a caller-supplied `tokenLimit`). Nothing here budgets or trims the assembled prompt.
- Reference examples: `src/lib/promptTemplates/examples/`.

**HARD RULE:** Prompt experiments may output registered, evaluated templates only. They may not hardcode one-off prompt strings into narrative-generation code paths (generators, routes, components). If you see an inline prompt string outside the registry, that is a defect — file it.

**The gates, in order:**
```text
G1 INPUT CONTRACT — the template reads only fields of NarrativeTemplateContext
   (src/lib/promptTemplates/templates/narrative/context.ts). Need a new field?
   Extend the type deliberately; never smuggle data through an existing string field.
G2 LEAKAGE — no feeding the prompt state the narrative shouldn't know:
   other characters' hidden info, meta/system state, raw store internals, player-secret
   data. toneSettings is opaque to templates (forwarded, never field-accessed) — keep it so.
G3 DETERMINISM EXPECTATIONS — state what varies (prose) vs what must be stable
   (structure the parser relies on: headings, JSON shape, choice markers). Changing
   stable structure means checking every parser in src/lib/ai/*parse*/*normalize*.
G4 EVAL — run the narraitor-ai-quality-discipline evaluation protocol (its section 5
   is the single home of the matrix minimums — cite it, don't restate numbers).
   Record in the eval log.
G5 REGRESSION — compare against excerpts saved in earlier eval logs. Old strengths
   must survive. WARNING: src/lib/promptTemplates/examples/ is a few-shot library
   injected INTO prompts (exampleLibrary.ts) — it is NOT a regression corpus, and
   editing it changes live generation behavior.
G6 COST/LATENCY — measure the delta yourself. Nothing enforces a prompt budget, and
   no allocator will trim your template back. Components are bounded only where they
   are assembled (the caller slices the segment window, getLoreContext defaults to 20
   facts, buildInventoryContext trims to a tokenLimit); the assembled whole is never
   trimmed. Estimate with estimateTokenCount (src/lib/promptContext/tokenUtils.ts),
   then check a real request in the DevTools calibration panel, which
   recordRequestCalibration (src/lib/ai/narrativeGenerator.calibration.ts) feeds with
   estimated vs provider-reported prompt size. DEFAULT_TOTAL_BUDGET (80000) is that
   panel's yardstick, not a ceiling. Put the before/after in the eval log — a template
   that grows context grows every turn's cost and the 5-8s prose wait.
G7 INTEGRATION — at least one eval cell through the real /worlds/[id]/play loop and
   unit tests green (template __tests__ pin assembly, not prose).
```

**Retiring a template:** remove it from the registry AND its callers in one change; `getNarrativeTemplate` throws at runtime on dangling ids — grep call sites for the id string before deleting.

## 6. Evidence required
The eval log (G4/G5), the context-field diff (G1/G2), and parser-impact statement (G3). A prompt PR without these is not reviewable.

## 7. Output artifact
Eval log per `.claude/skills/narraitor-prompt-template-governance/templates/eval-log.md` (this skill's folder — NOT under src/), linked from the PR. Registry diff limited to template files + deliberate context-type changes.

## 8. Common traps
- Bad behavior this prevents: an experiment adds `"IMPORTANT: always mention the weather"` directly inside `narrativeGenerator.prompt.ts` to fix one world's flat scenes; it ships unevaluated, unfindable, and rains on every world forever.
- `scripts/validate-prompt-templates.js` is a standalone DEMO with its own toy manager — it does NOT validate the real registry. Do not cite it as a gate (candidate for deletion/replacement).
- Every `NarrativeTemplateContext` field is optional — templates must render sensibly with fields absent; never assume presence because YOUR test world populates it.
- Editing shared fragments (`baseNarrativeTemplate.ts`, `majorEventGuidelines.ts`) multiplies the eval surface — the matrix must cover every template type that composes them.
- Docs describing prompt behavior (`public_docs/features/ai-systems.md`) carry stale-risk (it still names gemini-2.0-flash); the registry is truth.

## 9. Related skills
`narraitor-ai-quality-discipline` (the eval protocol) · `narraitor-architecture-contract` (I5: prompts live in the registry) · `narraitor-change-control` (status language for prompt changes) · `narraitor-feature-experiment-lifecycle` (prompt experiments are experiments).

## 10. Provenance and maintenance

Re-verify volatile claims with:
- `ls src/lib/promptTemplates/templates/narrative/` (template inventory)
- `head -25 src/lib/promptTemplates/narrativeTemplateManager.ts` (registry mechanism unchanged?)
- `grep -rn "toneSettings" src/lib/promptTemplates/templates/narrative/context.ts` (opacity contract)

Last generated: 2026-07-04 (develop @ 4bec88e6)
Known uncertainty:
- Whether ending templates share the same context contract was not verified field-by-field (check `endingTemplates.ts` before editing it).
- G4 matrix minimums live in narraitor-ai-quality-discipline and are BINDING until the owner explicitly relaxes them — pending ratification is not an exemption.
