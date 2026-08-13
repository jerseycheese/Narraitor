// src/lib/ai/resolveModel.ts

import type { NextRequest } from 'next/server';
import { resolveProvider } from './resolveApiKey';
import { DEFAULT_TEXT_MODEL } from './config';

/**
 * The Gemini model for a request.
 *
 * A narrow view of `resolveProvider`, kept for the routes that still build a
 * Gemini client directly (summarize, ending, story-checkpoint, the generators).
 * Non-Gemini providers report the default here because those callers cannot use
 * another provider's model id anyway — the descriptor from `resolveProvider` is
 * what carries it.
 *
 * SECURITY and fallback behaviour (model only counts alongside the caller's own
 * key; only Google's model-id shape gets through) live in `resolveProvider`, so
 * there is one implementation of both rules rather than two that can drift.
 */
export function resolveModel(request?: NextRequest): string {
  const resolution = resolveProvider(request);
  if (!resolution.ok || resolution.descriptor.type !== 'gemini') return DEFAULT_TEXT_MODEL;
  return resolution.descriptor.model;
}
