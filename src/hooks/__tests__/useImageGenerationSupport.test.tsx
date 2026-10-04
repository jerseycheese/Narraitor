import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/storage/encryption', () => ({
  encryptSecret: jest.fn(async (plaintext: string) => ({ ciphertext: `ct:${plaintext}`, iv: 'iv' })),
  decryptSecret: jest.fn(async (p: { ciphertext: string }) => p.ciphertext.replace(/^ct:/, '')),
  clearEncryptionKey: jest.fn(async () => {}),
}));

import { useImageGenerationSupport } from '../useImageGenerationSupport';
import { useProviderStore } from '@/state/providerStore';
import type { ProviderType } from '@/types/provider.types';

function Probe() {
  const { supported, reason } = useImageGenerationSupport();
  return <p>{supported ? 'supported' : reason}</p>;
}

async function activateProvider(type: ProviderType) {
  const id = await useProviderStore.getState().addProvider({
    type,
    name: `${type} provider`,
    endpoint: 'https://example.com/v1/chat/completions',
    model: 'some-model',
    apiKey: 'key',
    capabilities: { text: true, images: type === 'gemini', streaming: true },
  });
  useProviderStore.getState().setActiveProvider(id);
}

beforeEach(() => {
  localStorage.clear();
  useProviderStore.getState().reset();
});

describe('useImageGenerationSupport', () => {
  test('says images are supported when nothing is configured, since the server key is Gemini', () => {
    render(<Probe />);

    expect(screen.getByText('supported')).toBeInTheDocument();
  });

  test('says images are supported on Gemini', async () => {
    await activateProvider('gemini');

    render(<Probe />);

    expect(screen.getByText('supported')).toBeInTheDocument();
  });

  /**
   * The fallback itself already worked - the routes return a placeholder rather
   * than an error. What was missing is any account of why, which is what turns
   * a provider's limit into what looks like a broken screen.
   */
  test('explains the gap on a provider that only writes text', async () => {
    await activateProvider('ollama');

    render(<Probe />);

    expect(screen.getByText(/does not generate images/i)).toBeInTheDocument();
  });
});
