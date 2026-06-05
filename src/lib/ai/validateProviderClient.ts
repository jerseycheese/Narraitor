// src/lib/ai/validateProviderClient.ts

import { PROVIDER_API_KEY_HEADER } from './providerKeyHeader';
import type { ProviderCapabilities, ProviderType } from '@/types/provider.types';

export interface ValidationResult {
  valid: boolean;
  capabilities?: ProviderCapabilities;
  model?: string;
  error?: string;
}

/**
 * Ask the server to validate a provider config. The key rides the header (never
 * the body) and is never persisted server-side. Used by both the setup wizard
 * (validating a typed key before saving) and the provider store (re-checking a
 * saved provider).
 */
export async function validateProviderKey(params: {
  apiKey?: string | null;
  type: ProviderType;
  endpoint?: string;
  model: string;
  checkImage?: boolean;
}): Promise<ValidationResult> {
  const response = await fetch('/api/ai/validate-provider', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(params.apiKey ? { [PROVIDER_API_KEY_HEADER]: params.apiKey } : {}),
    },
    body: JSON.stringify({
      type: params.type,
      endpoint: params.endpoint,
      model: params.model,
      checkImage: params.checkImage,
    }),
  });

  return response.json();
}
