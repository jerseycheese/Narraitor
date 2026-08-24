import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProviderAdvancedSettings } from '../ProviderAdvancedSettings';
import type { AdvancedSettings } from '@/types/provider.types';

function renderPanel(
  value: AdvancedSettings | undefined = undefined,
  onChange: (settings: AdvancedSettings | undefined) => void = jest.fn(),
  samplingControlsFixed = false
) {
  render(
    <ProviderAdvancedSettings
      providerId="p1"
      value={value}
      onChange={onChange}
      samplingControlsFixed={samplingControlsFixed}
    />
  );
}

async function expand(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /expand advanced/i }));
}

describe('ProviderAdvancedSettings', () => {
  test('is collapsed by default', () => {
    renderPanel();

    const content = screen.getByTestId('collapsible-section-content');
    expect(content).toHaveAttribute('aria-hidden', 'true');
  });

  test('temperature and top-p sliders carry help text and update on change', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    renderPanel(undefined, onChange);
    await expand(user);

    expect(screen.getByText(/more creative and random/i)).toBeInTheDocument();
    expect(screen.getByText(/nucleus sampling/i)).toBeInTheDocument();

    const temperature = screen.getByRole('slider', { name: /temperature/i });
    fireEvent.change(temperature, { target: { value: '1.5' } });
    expect(onChange).toHaveBeenCalledWith({ temperature: 1.5 });
  });

  test('max_tokens is a number input with help text, and persists the typed value', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    renderPanel(undefined, onChange);
    await expand(user);

    const maxTokens = screen.getByLabelText(/max response length/i);
    expect(maxTokens).toHaveAttribute('type', 'number');
    expect(screen.getByText(/caps how long one generated response can be/i)).toBeInTheDocument();

    fireEvent.change(maxTokens, { target: { value: '4096' } });
    expect(onChange).toHaveBeenCalledWith({ maxTokens: 4096 });
  });

  test('custom safety guidance carries a warning about provider policy', async () => {
    const user = userEvent.setup();
    renderPanel();
    await expand(user);

    const alert = screen.getByRole('alert');
    expect(within(alert).getByText(/provider.s own safety filtering/i)).toBeInTheDocument();
  });

  test('rate limiting starts off, and reveals the requests-per-hour field once enabled', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    renderPanel(undefined, onChange);
    await expand(user);

    expect(screen.queryByLabelText(/max requests per hour/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /limit requests per hour/i }));
    expect(onChange).toHaveBeenCalledWith({ rateLimitEnabled: true });
  });

  test('shows the requests-per-hour field once rate limiting is already on, and updates it', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    renderPanel({ rateLimitEnabled: true, maxRequestsPerHour: 30 }, onChange);
    await expand(user);

    const perHour = screen.getByLabelText(/max requests per hour/i);
    fireEvent.change(perHour, { target: { value: '10' } });
    expect(onChange).toHaveBeenCalledWith({ rateLimitEnabled: true, maxRequestsPerHour: 10 });
  });

  test('disables temperature and top-p when the provider fixes its sampling controls', async () => {
    const user = userEvent.setup();
    renderPanel(undefined, jest.fn(), true);
    await expand(user);

    expect(screen.getByRole('slider', { name: /temperature/i })).toBeDisabled();
    expect(screen.getByRole('slider', { name: /top-p/i })).toBeDisabled();
    expect(screen.getByText(/rejects requests that set temperature or top-p/i)).toBeInTheDocument();
  });

  test('Reset to defaults clears every override back to unset', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    renderPanel(
      { temperature: 1.9, topP: 0.2, maxTokens: 100, rateLimitEnabled: true, maxRequestsPerHour: 5 },
      onChange
    );
    await expand(user);

    await user.click(screen.getByRole('button', { name: /reset to defaults/i }));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});

