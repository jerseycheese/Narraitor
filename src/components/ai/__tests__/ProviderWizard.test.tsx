import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

// crypto.subtle isn't available in jsdom — mock the encryption layer so the
// store's addProvider can run.
jest.mock('@/lib/storage/encryption', () => ({
  encryptSecret: jest.fn(async (plaintext: string) => ({ ciphertext: `ct:${plaintext}`, iv: 'iv' })),
  decryptSecret: jest.fn(async (p: { ciphertext: string }) => p.ciphertext.replace(/^ct:/, '')),
  clearEncryptionKey: jest.fn(async () => {}),
}));

jest.mock('@/lib/ai/validateProviderClient', () => ({
  validateProviderKey: jest.fn(),
}));

/**
 * Ollama ships available: false, because that flag is a claim that somebody
 * drove a real streamed turn through a real server and nothing in CI can. The
 * wizard wiring underneath it is a separate question, and this is what lets the
 * tests ask it: the real preset, with only that one claim overridden.
 */
jest.mock('@/lib/ai/presets', () => {
  const actual = jest.requireActual('@/lib/ai/presets');
  const presets = actual.PROVIDER_PRESETS.map((preset: { id: string }) =>
    preset.id === 'ollama' ? { ...preset, available: true } : preset
  );
  return {
    ...actual,
    PROVIDER_PRESETS: presets,
    getPresetById: (id: string) => presets.find((preset: { id: string }) => preset.id === id),
  };
});

import { ProviderWizard } from '../ProviderWizard';
import { useProviderStore } from '@/state/providerStore';
import { validateProviderKey } from '@/lib/ai/validateProviderClient';
import { KEYLESS_PROVIDER_KEY } from '@/lib/ai/providerKeyHeader';

const mockValidate = validateProviderKey as jest.MockedFunction<typeof validateProviderKey>;

beforeEach(() => {
  localStorage.clear();
  useProviderStore.getState().reset();
  jest.clearAllMocks();
});

describe('ProviderWizard', () => {
  test('discloses the privacy cost before the player pastes a key', async () => {
    const user = userEvent.setup();
    render(<ProviderWizard />);

    // Nothing chosen yet — nothing to disclose.
    expect(screen.queryByText(/human raters/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /google gemini/i }));

    expect(screen.getByText(/human raters/i)).toBeInTheDocument();
    expect(screen.getByText(/safety-filter setting/i)).toBeInTheDocument();
  });

  test('walks preset -> connect -> verify -> save and stores the provider', async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      capabilities: { text: true, images: true, streaming: true },
      model: 'gemini-2.5-flash',
    });
    const onComplete = jest.fn();
    const user = userEvent.setup();

    render(<ProviderWizard onComplete={onComplete} />);

    // Step 0: pick Gemini.
    await user.click(screen.getByRole('button', { name: /google gemini/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    // Step 1: enter the key (name + model are prefilled from the preset).
    await user.type(screen.getByLabelText(/api key/i), 'AIza-test-key');
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    // Step 2: verify, then save.
    await user.click(screen.getByRole('button', { name: /test connection/i }));
    await screen.findByText(/connected/i);

    expect(mockValidate).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'AIza-test-key', type: 'gemini' })
    );

    await user.click(screen.getByRole('button', { name: /save provider/i }));

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    const providers = Object.values(useProviderStore.getState().providers);
    expect(providers).toHaveLength(1);
    expect(providers[0].type).toBe('gemini');
    expect(providers[0].encryptedApiKey).toBeTruthy();
  });

  test('surfaces a friendly error when validation fails', async () => {
    mockValidate.mockResolvedValue({ valid: false, error: 'INVALID_KEY' });
    const user = userEvent.setup();

    render(<ProviderWizard />);

    await user.click(screen.getByRole('button', { name: /google gemini/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.type(screen.getByLabelText(/api key/i), 'bad-key');
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /test connection/i }));

    expect(await screen.findByText(/that key was rejected/i)).toBeInTheDocument();
    // Save stays disabled until a successful check.
    expect(screen.getByRole('button', { name: /save provider/i })).toBeDisabled();
  });

  test('masks the key by default and reveals it only while toggled on', async () => {
    const user = userEvent.setup();

    render(<ProviderWizard />);

    await user.click(screen.getByRole('button', { name: /google gemini/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    const keyField = screen.getByLabelText(/api key/i);
    await user.type(keyField, 'AIza-test-key');
    expect(keyField).toHaveAttribute('type', 'password');

    const toggle = screen.getByRole('button', { name: /show key/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    // Must not double as the wizard's submit control.
    expect(toggle).toHaveAttribute('type', 'button');

    await user.click(toggle);
    expect(keyField).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /hide key/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await user.click(screen.getByRole('button', { name: /hide key/i }));
    expect(keyField).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /show key/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );

    // Leaving the step re-masks, so a revealed key never survives navigation.
    await user.click(screen.getByRole('button', { name: /show key/i }));
    expect(keyField).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: /^back$/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    expect(screen.getByLabelText(/api key/i)).toHaveAttribute('type', 'password');
  });

  /**
   * A preset that lists no models is saying only the player knows what this
   * server can serve, so both the address and the model have to be theirs to
   * type. The menu a normal preset gets would be an empty one.
   */
  test('hands the endpoint and the model back to the player when a preset lists no models', async () => {
    const user = userEvent.setup();

    render(<ProviderWizard />);

    await user.click(screen.getByRole('button', { name: /ollama/i }));

    // The address is the player's, so it starts blank rather than pre-filled
    // with an example they might leave in place.
    const endpoint = screen.getByLabelText(/endpoint url/i);
    expect(endpoint).toHaveValue('');
    await user.type(endpoint, 'https://ollama.example.net/v1/chat/completions');

    await user.click(screen.getByRole('button', { name: /^next$/i }));

    // A text field, not a menu — a menu here would offer nothing.
    const model = screen.getByLabelText(/^model$/i);
    expect(model.tagName).toBe('INPUT');
    expect(model).toHaveValue('llama3.2');
  });

  test('lets a keyless provider through without a key and saves the placeholder', async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      capabilities: { text: true, images: false, streaming: true },
      model: 'llama3.2',
    });
    const onComplete = jest.fn();
    const user = userEvent.setup();

    render(<ProviderWizard onComplete={onComplete} />);

    await user.click(screen.getByRole('button', { name: /ollama/i }));
    await user.type(
      screen.getByLabelText(/endpoint url/i),
      'https://ollama.example.net/v1/chat/completions'
    );
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    // The key field is still there for a protected tunnel, but leaving it empty
    // must not block the step the way it does for a hosted service.
    expect(screen.getByRole('button', { name: /^next$/i })).not.toBeDisabled();
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    await user.click(screen.getByRole('button', { name: /test connection/i }));
    await screen.findByText(/connected/i);

    expect(mockValidate).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: KEYLESS_PROVIDER_KEY, type: 'ollama' })
    );

    await user.click(screen.getByRole('button', { name: /save provider/i }));

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    const providers = Object.values(useProviderStore.getState().providers);
    expect(providers).toHaveLength(1);
    expect(providers[0].type).toBe('ollama');
    // Stored, not omitted: the server reads a missing key as "use the env
    // Gemini key", which would silently generate on the wrong provider.
    expect(providers[0].encryptedApiKey).toBeTruthy();
  });

  test('tells a self-hoster what to fix on their own machine', async () => {
    mockValidate.mockResolvedValue({ valid: false, error: 'INVALID_MODEL' });
    const user = userEvent.setup();

    render(<ProviderWizard />);

    await user.click(screen.getByRole('button', { name: /ollama/i }));
    await user.type(
      screen.getByLabelText(/endpoint url/i),
      'https://ollama.example.net/v1/chat/completions'
    );
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /test connection/i }));

    // Not the hosted wording, which would send them looking at a dashboard
    // that does not exist.
    expect(await screen.findByText(/install it there/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /setup guide/i })).toBeInTheDocument();
  });

  /**
   * The upstream 403 maps to INVALID_KEY, which is correct for a hosted service
   * and absurd for a provider that has no key. Found by pointing the real check
   * at a real Ollama through a tunnel, which refused the foreign Host header.
   */
  test('does not blame a key that does not exist when a self-hosted server refuses', async () => {
    mockValidate.mockResolvedValue({ valid: false, error: 'INVALID_KEY' });
    const user = userEvent.setup();

    render(<ProviderWizard />);

    await user.click(screen.getByRole('button', { name: /ollama/i }));
    await user.type(
      screen.getByLabelText(/endpoint url/i),
      'https://ollama.example.net/v1/chat/completions'
    );
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /test connection/i }));

    expect(await screen.findByText(/refused the request/i)).toBeInTheDocument();
    expect(screen.queryByText(/that key was rejected/i)).not.toBeInTheDocument();
  });

  test('still demands a key for a hosted preset', async () => {
    const user = userEvent.setup();

    render(<ProviderWizard />);

    await user.click(screen.getByRole('button', { name: /google gemini/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled();
  });
});
