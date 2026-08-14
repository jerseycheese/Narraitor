/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PortraitDebugSection } from '../PortraitDebugSection';
import { generatePortrait } from '@/lib/api/generatePortrait';

jest.mock('@/lib/api/generatePortrait', () => ({
  generatePortrait: jest.fn(),
}));

jest.mock('@/state/characterStore', () => {
  const state = { characters: {} };
  return {
    useCharacterStore: (selector: (s: typeof state) => unknown) =>
      selector(state),
  };
});

jest.mock('@/state/worldStore', () => {
  const state = { worlds: {} };
  return {
    useWorldStore: (selector: (s: typeof state) => unknown) => selector(state),
  };
});

const mockGeneratePortrait = generatePortrait as jest.MockedFunction<
  typeof generatePortrait
>;

const characterData = {
  name: 'Vasquez',
  worldId: 'world-1',
  background: {
    history: '',
    personality: '',
    goals: [],
    fears: [],
    relationships: [],
    physicalDescription: 'weathered, close-cropped hair',
  },
};

// The panel ships collapsed, and collapsed content is aria-hidden, so every
// case starts by opening it the way a developer would.
const renderPanel = async () => {
  render(
    <PortraitDebugSection
      characterData={characterData}
      worldConfig={{ genre: 'western' }}
    />
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Expand Portrait Generation Debug' })
  );
};

describe('PortraitDebugSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates a portrait through the API wrapper and shows the result', async () => {
    mockGeneratePortrait.mockResolvedValue({
      portrait: {
        type: 'ai-generated',
        url: 'https://example.test/portrait.png',
        generatedAt: '2026-01-01T00:00:00.000Z',
        prompt: 'A weathered gunslinger',
      },
    });

    await renderPanel();
    await userEvent.click(
      screen.getByRole('button', { name: 'Test Full Generation' })
    );

    await waitFor(() =>
      expect(screen.getByText('A weathered gunslinger')).toBeInTheDocument()
    );

    const request = mockGeneratePortrait.mock.calls[0][0];
    expect(request.promptOnly).toBeUndefined();
    expect(request.customDescription).toBe('weathered, close-cropped hair');
    expect(screen.getByAltText('Generated portrait')).toBeInTheDocument();
  });

  it('reports the failure instead of the prompt when the request fails', async () => {
    mockGeneratePortrait.mockRejectedValue(new Error('Provider key rejected'));

    await renderPanel();
    await userEvent.click(
      screen.getByRole('button', { name: 'Test Full Generation' })
    );

    await waitFor(() =>
      expect(
        screen.getByText('Generation failed: Provider key rejected')
      ).toBeInTheDocument()
    );
    expect(screen.queryByAltText('Generated portrait')).not.toBeInTheDocument();
  });

  it('asks for the prompt only when previewing', async () => {
    mockGeneratePortrait.mockResolvedValue({ prompt: 'Preview prompt' });

    await renderPanel();
    await userEvent.click(
      screen.getByRole('button', { name: 'Generate Prompt Preview' })
    );

    await waitFor(() =>
      expect(screen.getByText('Preview prompt')).toBeInTheDocument()
    );
    expect(mockGeneratePortrait.mock.calls[0][0].promptOnly).toBe(true);
  });
});
