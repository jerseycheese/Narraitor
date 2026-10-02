// src/lib/ai/modelSyntax.ts

/**
 * Gemini model ids are interpolated into a REST URL path, so an arbitrary
 * value could steer a request to another path. Only Google's own model-id
 * shape (alphanumeric start, bounded length, no slashes or colons) is permitted.
 */
const MAX_GEMINI_MODEL_LENGTH = 64;
const GEMINI_MODEL_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9.\-_]{0,63}$/;

/**
 * Other providers carry the model in the request body, not the URL, so
 * vendor-prefixed ids (`meta-llama/Llama-3.3-70B-Instruct-Turbo`,
 * `google/gemini-2.5-flash:free`) and leading-`~` version aliases (like
 * OpenRouter's `~deepseek/deepseek-flash-latest`) are permitted.
 * Whitespace, control characters, and unanchored `~` symbols are rejected,
 * and the total length is capped at 128 to prevent unbounded headers.
 */
const MAX_BODY_MODEL_LENGTH = 128;
const BODY_MODEL_PATTERN = /^~?[a-zA-Z0-9][a-zA-Z0-9.\-_/:]{0,127}$/;

export function isValidGeminiModel(model: unknown): model is string {
  return (
    typeof model === 'string' &&
    model.length > 0 &&
    model.length <= MAX_GEMINI_MODEL_LENGTH &&
    GEMINI_MODEL_PATTERN.test(model)
  );
}

export function isValidBodyModel(model: unknown): model is string {
  return (
    typeof model === 'string' &&
    model.length > 0 &&
    model.length <= MAX_BODY_MODEL_LENGTH &&
    BODY_MODEL_PATTERN.test(model)
  );
}
