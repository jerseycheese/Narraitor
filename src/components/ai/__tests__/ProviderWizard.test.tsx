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

import { ProviderWizard } from '../ProviderWizard';
import { useProviderStore } from '@/state/providerStore';
import { validateProviderKey } from '@/lib/ai/validateProviderClient';

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
});
