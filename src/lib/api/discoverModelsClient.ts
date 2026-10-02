// src/lib/api/discoverModelsClient.ts

import { PROVIDER_API_KEY_HEADER } from '@/lib/ai/providerKeyHeader';
import type { DiscoveredModel, ProviderType } from '@/types/provider.types';

export interface DiscoverModelsResult {
  models: DiscoveredModel[];
  error?: string;
}

export interface DiscoverModelsParams {
  apiKey?: string | null;
  type: ProviderType;
  endpoint?: string;
  signal?: AbortSignal;
}

/**
 * Fetch live available models for a provider candidate configuration.
 * Candidate credentials travel ONLY in the x-provider-api-key header and stay request-scoped.
 */
export async function discoverProviderModels(
  params: DiscoverModelsParams
): Promise<DiscoverModelsResult> {
  try {
    const response = await fetch('/api/ai/models', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(params.apiKey ? { [PROVIDER_API_KEY_HEADER]: params.apiKey } : {}),
      },
      body: JSON.stringify({
        type: params.type,
        endpoint: params.endpoint,
      }),
      signal: params.signal,
    });

    if (!response.ok) {
      return { models: [], error: 'DISCOVERY_FAILED' };
    }

    return (await response.json()) as DiscoverModelsResult;
  } catch {
    if (params.signal?.aborted) {
      return { models: [], error: 'ABORTED' };
    }
    return { models: [], error: 'NETWORK' };
  }
}
