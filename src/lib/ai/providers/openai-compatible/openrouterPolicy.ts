// src/lib/ai/providers/openai-compatible/openrouterPolicy.ts

import Logger from '@/lib/utils/logger';

const logger = new Logger('OpenRouterPolicy');

export const OPENROUTER_CHAT_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_MODELS_ENDPOINT = 'https://openrouter.ai/api/v1/models';

export interface OpenRouterReasoningSettings {
  mandatory?: boolean;
  default_enabled?: boolean;
  supported_efforts?: string[];
  default_effort?: string;
}

export interface OpenRouterModelMetadata {
  id: string;
  supported_parameters?: string[];
  reasoning?: OpenRouterReasoningSettings;
}

export interface OpenRouterReasoningBodyParam {
  enabled?: boolean;
  effort?: string;
}

export const OPENROUTER_EFFORT_HIERARCHY = [
  'none',
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
] as const;

const modelMetadataCache = new Map<string, OpenRouterModelMetadata>();
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export function clearOpenRouterModelCache(): void {
  modelMetadataCache.clear();
  cacheTimestamp = 0;
}

export function isOpenRouterChatEndpoint(endpoint: string | undefined): boolean {
  return endpoint === OPENROUTER_CHAT_ENDPOINT;
}

export function supportsReasoning(metadata: OpenRouterModelMetadata): boolean {
  const supported = metadata.supported_parameters ?? [];
  return supported.includes('reasoning') || Boolean(metadata.reasoning);
}

export function determineOpenRouterReasoning(
  metadata?: OpenRouterModelMetadata
): OpenRouterReasoningBodyParam | undefined {
  if (!metadata || !supportsReasoning(metadata)) {
    return undefined;
  }

  if (!metadata.reasoning?.mandatory) {
    return { enabled: false };
  }

  const supportedEfforts = metadata.reasoning.supported_efforts;
  if (Array.isArray(supportedEfforts) && supportedEfforts.length > 0) {
    const leastEffort = OPENROUTER_EFFORT_HIERARCHY.find((effort) =>
      supportedEfforts.includes(effort)
    );
    if (leastEffort) {
      return { effort: leastEffort };
    }
    return { effort: supportedEfforts[0] };
  }

  if (metadata.reasoning.default_effort) {
    return { effort: metadata.reasoning.default_effort };
  }

  return { effort: 'low' };
}

export async function getOpenRouterModelMetadata(
  modelId: string,
  apiKey?: string | null
): Promise<OpenRouterModelMetadata | undefined> {
  const now = Date.now();
  if (modelMetadataCache.has(modelId) && now - cacheTimestamp < CACHE_TTL_MS) {
    return modelMetadataCache.get(modelId);
  }

  try {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(OPENROUTER_MODELS_ENDPOINT, {
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    if (!response.ok) {
      logger.warn(`Failed to fetch OpenRouter model metadata: ${response.status}`);
      return undefined;
    }

    const json = (await response.json()) as { data?: OpenRouterModelMetadata[] };
    if (Array.isArray(json.data)) {
      for (const item of json.data) {
        if (item && typeof item.id === 'string') {
          modelMetadataCache.set(item.id, item);
        }
      }
      cacheTimestamp = now;
      return modelMetadataCache.get(modelId);
    }
  } catch (error) {
    logger.warn('Error fetching OpenRouter model metadata', error);
  }

  return undefined;
}
