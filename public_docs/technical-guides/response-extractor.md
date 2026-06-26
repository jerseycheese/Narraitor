# AI Response Parser

AI responses come back messy and unpredictable — sometimes clean JSON, sometimes JSON wrapped
in a markdown code fence, sometimes JSON buried in prose, and sometimes truncated mid-object
when the model runs out of tokens. The `aiResponseParser` utility (`src/lib/utils/aiResponseParser.ts`)
is the shared layer that pulls structured data out of all of that and fails with a clear error
when it can't.

> Note: this used to be a `ResponseExtractor` class. It was replaced by the plain functions
> below — there's no class to instantiate anymore.

## Parsing JSON

`parseAIJsonResponse<T>` is the workhorse. It takes an `AIResponse` (`{ content?, tokenUsage? }`)
and returns the parsed value, trying progressively looser strategies: a direct `JSON.parse`
first, then JSON inside a ` ```json ` code block, then any `{...}` object found in the content.
If that last one is truncated, it attempts a repair (closing unmatched braces/brackets,
trimming an incomplete trailing element) before giving up.

```typescript
import { parseAIJsonResponse } from '@/lib/utils/aiResponseParser';

const world = parseAIJsonResponse<GeneratedWorld>(response, 'Failed to parse world');
```

When everything fails it throws — with the supplied error message, the underlying parse error,
and the first 100 characters of the content, so a bad response is debuggable rather than a
silent `undefined`.

## Validating the result

Parsing gets you an object; it doesn't guarantee the object has the shape you expect. Two small
guards cover the common cases:

```typescript
import { validateRequiredFields, validateArrayFields } from '@/lib/utils/aiResponseParser';

validateRequiredFields(world, ['name', 'description'], 'world');
validateArrayFields(world, ['attributes', 'skills'], 'world');
```

Each throws a descriptive error naming the missing or wrong-typed field, which is what the
generators rely on to reject a malformed response instead of persisting half a world.

## Handling the whole request

`handleAIRequest<T>` wraps the call-plus-parse cycle with retry logic:

```typescript
import { handleAIRequest, parseAIJsonResponse } from '@/lib/utils/aiResponseParser';

const world = await handleAIRequest(
  () => aiClient.generate(prompt),
  (response) => parseAIJsonResponse<GeneratedWorld>(response, 'Failed to parse world'),
  2 // maxRetries
);
```

It retries on network/AI errors with exponential backoff, but deliberately does *not* retry on
parse or validation errors — if the model returned something unparseable, asking again rarely
helps, so it fails fast instead of burning quota.

## Where it's used

The world generator leans on this (`src/lib/generators/worldGenerator.ts`). It sits alongside the more specialized extractors like
`goalExtractor` (`src/lib/ai/goalExtractor.ts`) — those handle domain-specific extraction, while
`aiResponseParser` handles the generic "turn an AI response into a validated object" step.
