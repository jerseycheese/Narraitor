// src/lib/ai/modelDiscovery.ts

import type { DiscoveredModel, ProviderType } from '@/types/provider.types';
import {
  readBoundedJson,
  sendProviderRequest,
} from './providers/core/request';
import { isSafeProviderEndpoint } from './providers/endpointGuard';
import { presetHeadersForEndpoint } from './presets';
import { OPENROUTER_MODELS_ENDPOINT } from './providers/openai-compatible/openrouterPolicy';
import Logger from '@/lib/utils/logger';

const logger = new Logger('ModelDiscovery');

const GEMINI_MODELS_API = 'https://generativelanguage.googleapis.com/v1beta/models';
const DISCOVERY_TIMEOUT_MS = 10000;
const MAX_PAGES = 10;

export type DiscoveryError =
  | 'NO_KEY'
  | 'UNSUPPORTED_PROVIDER'
  | 'INVALID_ENDPOINT'
  | 'INVALID_KEY'
  | 'RATE_LIMITED'
  | 'DISCOVERY_FAILED'
  | 'NETWORK';

export interface DiscoverModelsParams {
  type: ProviderType;
  endpoint?: string;
  key?: string | null;
  signal?: AbortSignal;
}

export interface DiscoverModelsResult {
  models: DiscoveredModel[];
  error?: DiscoveryError;
}

/** Check if an endpoint points to OpenRouter. */
export function isOpenRouterEndpoint(endpoint: string | undefined): boolean {
  if (!endpoint) return false;
  try {
    const url = new URL(endpoint);
    return url.hostname === 'openrouter.ai' || url.hostname.endsWith('.openrouter.ai');
  } catch {
    return false;
  }
}

/**
 * Replace completions path segment with /models while preserving path prefixes (e.g. /v1, /router/v1).
 */
export function resolveCompatibleModelsEndpoint(endpoint: string): string {
  const url = new URL(endpoint);
  const pathname = url.pathname;

  if (pathname.endsWith('/chat/completions')) {
    url.pathname = pathname.slice(0, -'/chat/completions'.length) + '/models';
  } else if (pathname.endsWith('/completions')) {
    url.pathname = pathname.slice(0, -'/completions'.length) + '/models';
  } else if (pathname.endsWith('/models')) {
    // Already ending in /models
  } else {
    url.pathname = pathname.replace(/\/+$/, '') + '/models';
  }

  return url.toString();
}

/** Non-text pattern heuristics for OpenAI-compatible models. */
const NON_TEXT_ID_PATTERNS = [
  /embedding/i,
  /^text-embedding/i,
  /^bge-/i,
  /^dall-e/i,
  /^whisper/i,
  /^tts-/i,
  /^moderation/i,
  /:embedding$/i,
];

export interface OpenRouterRawModel {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  architecture?: {
    modality?: string;
    instruct_type?: string | null;
  };
  endpoints?: Array<{ name?: string }>;
  supported_parameters?: string[];
  reasoning?: {
    mandatory?: boolean;
    default_enabled?: boolean;
    supported_efforts?: string[];
    default_effort?: string;
  };
}

/**
 * Filter and normalize OpenRouter models.
 * Rule: endpoints: [] means unservable; missing/undefined endpoints does NOT.
 * Preserves alias IDs exactly.
 */
export function filterOpenRouterModels(raw: OpenRouterRawModel[]): DiscoveredModel[] {
  const seen = new Set<string>();
  const models: DiscoveredModel[] = [];

  for (const item of raw) {
    if (!item || typeof item.id !== 'string') continue;
    const id = item.id.trim();
    if (!id || seen.has(id)) continue;

    // IMPORTANT: endpoints: [] means unservable; missing endpoints does NOT.
    if (Array.isArray(item.endpoints) && item.endpoints.length === 0) {
      continue;
    }

    // Filter explicit non-text modalities
    const modality = item.architecture?.modality?.toLowerCase();
    if (modality) {
      // Modality examples: "text->text", "text+image->text", "image->image", "text->image"
      // If modality does not end with 'text', it is not a text generation model
      if (!modality.endsWith('text')) {
        continue;
      }
    }

    // Filter embedding IDs
    if (id.includes(':embedding') || id.includes('text-embedding')) {
      continue;
    }

    const supportsReasoningParam =
      (item.supported_parameters ?? []).includes('reasoning') || Boolean(item.reasoning);

    seen.add(id);
    models.push({
      id,
      name: item.name?.trim() || id,
      description: item.description?.trim(),
      contextLength: item.context_length,
      reasoning: supportsReasoningParam,
    });
  }

  return models;
}

export interface GeminiRawModel {
  name: string;
  displayName?: string;
  description?: string;
  inputTokenLimit?: number;
  supportedGenerationMethods?: string[];
}

/**
 * Filter and normalize Gemini models.
 * Strips models/ prefix and requires generateContent support.
 */
export function filterGeminiModels(raw: GeminiRawModel[]): DiscoveredModel[] {
  const seen = new Set<string>();
  const models: DiscoveredModel[] = [];

  for (const item of raw) {
    if (!item || typeof item.name !== 'string') continue;

    const methods = item.supportedGenerationMethods ?? [];
    if (!methods.includes('generateContent')) {
      continue;
    }

    const normalizedId = item.name.replace(/^models\//, '').trim();
    if (!normalizedId || seen.has(normalizedId)) continue;

    seen.add(normalizedId);
    models.push({
      id: normalizedId,
      name: item.displayName?.trim() || normalizedId,
      description: item.description?.trim(),
      contextLength: item.inputTokenLimit,
      reasoning: false,
    });
  }

  return models;
}

export interface OpenAICompatibleRawModel {
  id: string;
  name?: string;
  description?: string;
}

/**
 * Filter OpenAI-compatible models removing explicit embeddings, speech, and image models.
 */
export function filterOpenAICompatibleModels(
  raw: OpenAICompatibleRawModel[]
): DiscoveredModel[] {
  const seen = new Set<string>();
  const models: DiscoveredModel[] = [];

  for (const item of raw) {
    if (!item || typeof item.id !== 'string') continue;
    const id = item.id.trim();
    if (!id || seen.has(id)) continue;

    if (NON_TEXT_ID_PATTERNS.some((pattern) => pattern.test(id))) {
      continue;
    }

    seen.add(id);
    models.push({
      id,
      name: item.name?.trim() || id,
      description: item.description?.trim(),
      reasoning: false,
    });
  }

  return models;
}

export interface OllamaRawModel {
  name: string;
  model?: string;
  details?: {
    family?: string;
    parameter_size?: string;
  };
}

/**
 * Filter and normalize Ollama models from /api/tags.
 */
export function filterOllamaModels(raw: OllamaRawModel[]): DiscoveredModel[] {
  const seen = new Set<string>();
  const models: DiscoveredModel[] = [];

  for (const item of raw) {
    if (!item) continue;
    const id = (item.name || item.model || '').trim();
    if (!id || seen.has(id)) continue;

    if (
      id.toLowerCase().includes('embed') ||
      item.details?.family?.toLowerCase().includes('embed')
    ) {
      continue;
    }

    seen.add(id);
    const detailDesc = [item.details?.family, item.details?.parameter_size]
      .filter(Boolean)
      .join(' ');

    models.push({
      id,
      name: id,
      description: detailDesc || undefined,
      reasoning: false,
    });
  }

  return models;
}

function classifyStatus(status: number): DiscoveryError {
  if (status === 401 || status === 403) return 'INVALID_KEY';
  if (status === 429) return 'RATE_LIMITED';
  return 'DISCOVERY_FAILED';
}

/**
 * Discover models live for a given provider configuration.
 * Credentials stay strictly request-scoped and are never cached or logged.
 */
export async function discoverModels(params: DiscoverModelsParams): Promise<DiscoverModelsResult> {
  const { type, endpoint, key, signal } = params;

  if (type === 'claude') {
    return { models: [], error: 'UNSUPPORTED_PROVIDER' };
  }

  if (type === 'gemini') {
    return discoverGemini(key, signal);
  }

  if (type === 'ollama') {
    return discoverOllama(endpoint, key, signal);
  }

  if (type === 'openai-compatible') {
    if (isOpenRouterEndpoint(endpoint)) {
      return discoverOpenRouter(key, signal);
    }
    return discoverOpenAICompatible(endpoint, key, signal);
  }

  return { models: [], error: 'UNSUPPORTED_PROVIDER' };
}

async function discoverGemini(
  key?: string | null,
  signal?: AbortSignal
): Promise<DiscoverModelsResult> {
  if (!key?.trim()) {
    return { models: [], error: 'NO_KEY' };
  }

  const allRawModels: GeminiRawModel[] = [];
  let pageToken: string | undefined = undefined;
  let pageCount = 0;

  try {
    do {
      pageCount++;
      const url = new URL(GEMINI_MODELS_API);
      url.searchParams.set('pageSize', '100');
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
      }

      const response = await sendProviderRequest(
        url.toString(),
        {
          'Content-Type': 'application/json',
          'x-goog-api-key': key.trim(),
        },
        null,
        {
          method: 'GET',
          timeoutMs: DISCOVERY_TIMEOUT_MS,
          playerSuppliedEndpoint: false,
          signal,
        }
      );

      if (!response.ok) {
        return { models: [], error: classifyStatus(response.status) };
      }

      const body = await readBoundedJson<{
        models?: GeminiRawModel[];
        nextPageToken?: string;
      }>(response);

      if (Array.isArray(body.models)) {
        allRawModels.push(...body.models);
      }

      pageToken = body.nextPageToken;
    } while (pageToken && pageCount < MAX_PAGES);

    return { models: filterGeminiModels(allRawModels) };
  } catch (err) {
    if (signal?.aborted) return { models: [], error: 'NETWORK' };
    logger.warn('Gemini discovery failed', err);
    return { models: [], error: 'NETWORK' };
  }
}

async function discoverOpenRouter(
  key?: string | null,
  signal?: AbortSignal
): Promise<DiscoverModelsResult> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (key?.trim()) {
      headers['Authorization'] = `Bearer ${key.trim()}`;
    }

    const response = await sendProviderRequest(
      OPENROUTER_MODELS_ENDPOINT,
      headers,
      null,
      {
        method: 'GET',
        timeoutMs: DISCOVERY_TIMEOUT_MS,
        playerSuppliedEndpoint: false,
        signal,
      }
    );

    if (!response.ok) {
      return { models: [], error: classifyStatus(response.status) };
    }

    const body = await readBoundedJson<{ data?: OpenRouterRawModel[] }>(response);
    if (!Array.isArray(body.data)) {
      return { models: [], error: 'DISCOVERY_FAILED' };
    }

    return { models: filterOpenRouterModels(body.data) };
  } catch (err) {
    if (signal?.aborted) return { models: [], error: 'NETWORK' };
    logger.warn('OpenRouter discovery failed', err);
    return { models: [], error: 'NETWORK' };
  }
}

async function discoverOpenAICompatible(
  endpoint?: string,
  key?: string | null,
  signal?: AbortSignal
): Promise<DiscoverModelsResult> {
  if (!endpoint || !isSafeProviderEndpoint(endpoint)) {
    return { models: [], error: 'INVALID_ENDPOINT' };
  }

  try {
    const modelsUrl = resolveCompatibleModelsEndpoint(endpoint);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (key?.trim()) {
      headers['Authorization'] = `Bearer ${key.trim()}`;
    }

    const response = await sendProviderRequest(modelsUrl, headers, null, {
      method: 'GET',
      timeoutMs: DISCOVERY_TIMEOUT_MS,
      playerSuppliedEndpoint: true,
      customHeaders: presetHeadersForEndpoint(endpoint),
      signal,
    });

    if (!response.ok) {
      return { models: [], error: classifyStatus(response.status) };
    }

    const body = await readBoundedJson<{
      data?: OpenAICompatibleRawModel[];
      models?: OpenAICompatibleRawModel[];
    }>(response);

    const rawList = Array.isArray(body.data)
      ? body.data
      : Array.isArray(body.models)
        ? body.models
        : Array.isArray(body)
          ? (body as OpenAICompatibleRawModel[])
          : [];

    return { models: filterOpenAICompatibleModels(rawList) };
  } catch (err) {
    if (signal?.aborted) return { models: [], error: 'NETWORK' };
    logger.warn('OpenAI-compatible discovery failed', err);
    return { models: [], error: 'NETWORK' };
  }
}

async function discoverOllama(
  endpoint?: string,
  key?: string | null,
  signal?: AbortSignal
): Promise<DiscoverModelsResult> {
  if (!endpoint || !isSafeProviderEndpoint(endpoint)) {
    return { models: [], error: 'INVALID_ENDPOINT' };
  }

  try {
    const url = new URL(endpoint);
    const tagsUrl = `${url.protocol}//${url.host}/api/tags`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (key?.trim()) {
      headers['Authorization'] = `Bearer ${key.trim()}`;
    }

    const response = await sendProviderRequest(tagsUrl, headers, null, {
      method: 'GET',
      timeoutMs: DISCOVERY_TIMEOUT_MS,
      playerSuppliedEndpoint: true,
      signal,
    });

    if (!response.ok) {
      return { models: [], error: classifyStatus(response.status) };
    }

    const body = await readBoundedJson<{ models?: OllamaRawModel[] }>(response);
    const rawList = Array.isArray(body.models) ? body.models : [];

    return { models: filterOllamaModels(rawList) };
  } catch (err) {
    if (signal?.aborted) return { models: [], error: 'NETWORK' };
    logger.warn('Ollama discovery failed', err);
    return { models: [], error: 'NETWORK' };
  }
}
