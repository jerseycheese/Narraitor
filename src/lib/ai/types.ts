// src/lib/ai/types.ts

import { FormattingOptions } from '../utils/textFormatter';

/**
 * Configuration interface for AI service
 */
export interface AIServiceConfig {
  apiKey: string;
  modelName: string;
  maxRetries: number;
  timeout: number;
  generationConfig?: GenerationConfig;
  safetySettings?: SafetySetting[];
}

/**
 * Standard error object for AI service mocks
 */
export interface AIServiceError {
  code: string;
  message: string;
  retryable: boolean;
}

/**
 * Response from AI service
 */
export interface AIResponse {
  content: string;
  finishReason: string;
  promptTokens?: number;
  completionTokens?: number;
  formattedContent?: string;
  formattingOptions?: FormattingOptions;
}

/**
 * Generation configuration for AI model
 */
export interface GenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  /** Gemini 2.5 thinking control. thinkingBudget: 0 disables dynamic thinking. */
  thinkingConfig?: { thinkingBudget?: number };
}

/**
 * Safety settings for AI model
 */
export interface SafetySetting {
  category: string;
  threshold: string;
}

/**
 * Configuration interface for AI integration
 */
export interface AIConfig {
  geminiApiKey: string;
  modelName: string;
  imageModelName: string;
  maxRetries: number;
  timeout: number;
}

/**
 * Response from AI image generation
 */
export interface AIImageResponse {
  image: string; // Base64 encoded image data
  prompt: string;
}

/**
 * Per-call options for AI clients. `signal` lets a caller cancel the
 * underlying request (e.g. when a UI-level timeout races the generation);
 * implementations that can't cancel may ignore it. `onChunk` is an optional
 * progressive-reveal hook: implementations that stream (currently
 * ClientGeminiClient.generateContent) invoke it with each newly-visible
 * slice of narrative prose as it arrives, ahead of the final resolved
 * AIResponse. Implementations that don't stream simply never call it.
 */
export interface AIGenerateOptions {
  signal?: AbortSignal;
  onChunk?: (delta: string) => void;
}

/**
 * Streaming protocol for /api/narrative/generate: the response body is
 * newline-delimited JSON, zero or more progress events followed by exactly
 * one terminal event. The terminal `done` event carries the same fields as
 * the non-streaming GeminiTextResponse, so everything downstream of the
 * network call (parseNarrativeResponse, the continuity guardrail, lore/item
 * extraction) reads identical data regardless of which path produced it.
 */
export interface NarrativeStreamDelta {
  delta: string;
}
export interface NarrativeStreamDone {
  done: true;
  content: string;
  finishReason?: string;
  promptTokens?: number;
  completionTokens?: number;
}
export interface NarrativeStreamError {
  error: string;
}
export type NarrativeStreamEvent =
  | NarrativeStreamDelta
  | NarrativeStreamDone
  | NarrativeStreamError;

/**
 * Interface for AI clients (both real and mock)
 */
export interface AIClient {
  generateContent(prompt: string, options?: AIGenerateOptions): Promise<AIResponse>;
  // Choice generation is a distinct endpoint on the browser path; callers that
  // need it (choiceGenerator) prefer this over generateContent so routing is
  // explicit rather than inferred from prompt content.
  generateChoices?(prompt: string, options?: AIGenerateOptions): Promise<AIResponse>;
  generateImage?(prompt: string): Promise<AIImageResponse>;
  generateStructuredContent?<T = unknown>(prompt: string, schema: unknown): Promise<T>;
  isAvailable?(): Promise<boolean>;
}
