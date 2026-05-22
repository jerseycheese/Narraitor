# Prompt Template System

AI prompts for narrative, choices, and endings used to get hand-built inline at every
call site, which made them hard to keep consistent and painful to tweak. This module pulls
that work into one place: each prompt is a template that knows how to turn a typed context
object into the final prompt string. Callers grab a template by id and run it, instead of
gluing strings together themselves.

## How it works

A template is a plain object — an `id`, a `PromptType`, a `variables` list that documents
what the template expects, and a `generate(context)` function that actually builds the
prompt. The `generate` function is real code, not `{{placeholder}}` substitution, which
means a template can branch on context (skip an empty inventory, format recent events,
acknowledge a skill check) and stay type-checked against the context shape it declares.

Templates live under `templates/`. The narrative ones are defined per-file in
`templates/narrative/` (base, action, scene, transition, player choice, and so on) and
collected in `templates/narrative/index.ts`; endings live in `templates/endingTemplates.ts`.
The shared types — `PromptType` and the `PromptTemplate` interface — are in `types.ts`.

## Looking up a template

`narrativeTemplateManager.ts` builds a map of every narrative template's `generate`
function keyed by id, and exposes a single lookup:

```typescript
import { getNarrativeTemplate } from '@/lib/promptTemplates/narrativeTemplateManager';

const generate = getNarrativeTemplate('narrative/scene');
const prompt = generate(narrativeContext);
```

It throws if the id doesn't exist, so a typo fails loud rather than silently producing an
empty prompt. The available narrative ids are `narrative/base`, `narrative/action`,
`narrative/initialScene`, `narrative/scene`, `narrative/transition`,
`narrative/playerChoice`, `narrative/alignedPlayerChoice`, and
`narrative/skillAcknowledgment`.

## Who uses it

The AI layer is the consumer. `src/lib/ai/narrativeGenerator.ts` and
`src/lib/ai/choiceGenerator.prompt.ts` both resolve a template key at runtime and call
`getNarrativeTemplate(...)` to get the generator, then feed it the assembled context. The
context shapes themselves are defined alongside the templates in
`templates/narrative/context.ts`, which is what keeps each `generate` function honest about
the fields it reads.
