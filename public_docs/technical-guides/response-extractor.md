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

There's no wrapper that owns the call-plus-parse-plus-retry cycle. A `handleAIRequest<T>` helper
used to live here, but it went out with the world-templates system in
[#1454](https://github.com/jerseycheese/Narraitor/pull/1454). Callers now run their own retry loop
and use the parser and validators directly.

`worldGenerator` (`src/lib/generators/worldGenerator.ts`) is the reference shape:

```typescript
import { parseAIJsonResponse, validateRequiredFields, validateArrayFields } from '@/lib/utils/aiResponseParser';

const MAX_RETRIES = 3;
let lastError: Error | null = null;

for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  try {
    // On a retry, tell the model why the last attempt failed
    const retryPrompt = attempt > 1
      ? `${prompt}\n\nIMPORTANT: This is retry attempt ${attempt}/${MAX_RETRIES}. The previous attempt failed due to malformed JSON...`
      : prompt;

    const response = await client.generateContent(retryPrompt);
    const parsed = parseAIJsonResponse<Record<string, unknown>>({ content: response.content }, 'Failed to generate world configuration');

    validateRequiredFields(parsed, ['name', 'genre', 'description', 'attributes', 'skills'], 'world generation response');
    validateArrayFields(parsed, ['attributes', 'skills'], 'world generation response');

    lastError = null;
    // ...build the world from `parsed`
  } catch (error) {
    lastError = error as Error;
    if (attempt < MAX_RETRIES) continue;
  }
}
```

Note the retry policy is the opposite of what a generic wrapper would do: malformed JSON is
exactly what it retries on, and the retry prompt names that failure so the model can correct
itself. Since the parse and the validators both throw, they land in the same `catch` and get
another attempt.

## Where it's used

The world generator leans on this (`src/lib/generators/worldGenerator.ts`). It sits alongside the more specialized extractors like
`goalExtractor` (`src/lib/ai/goalExtractor.ts`) — those handle domain-specific extraction, while
`aiResponseParser` handles the generic "turn an AI response into a validated object" step.
