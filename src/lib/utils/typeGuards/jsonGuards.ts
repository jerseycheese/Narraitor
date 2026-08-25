// src/lib/utils/typeGuards/jsonGuards.ts

// Narrowing helpers for reading an AI response's parsed JSON, where every
// field is `unknown` until checked. Shared by the extraction parsers under
// `src/lib/ai/` and `src/lib/lore/` so a bad or missing field is dropped
// rather than thrown on.

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const asTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
