/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EndingImageDebugSection } from '../EndingImageDebugSection';
import { generateEndingImage, generateEndingImagePrompt } from '@/lib/api/endingImageApi';

jest.mock('@/lib/api/endingImageApi', () => ({
  generateEndingImage: jest.fn(),
  generateEndingImagePrompt: jest.fn(),
}));

jest.mock('@/state/narrativeStore', () => ({
  useNarrativeStore: () => ({
    currentEnding: null,
    getSessionSegments: jest.fn(() => []),
  }),
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: (selector: (state: { characters: Record<string, unknown> }) => unknown) =>
    selector({ characters: {} }),
}));

jest.mock('@/state/worldStore', () => ({
  useWorldStore: (selector: (state: { worlds: Record<string, unknown> }) => unknown) =>
    selector({ worlds: {} }),
}));

const mockGenerateEndingImage = generateEndingImage as jest.Mock;
const mockGenerateEndingImagePrompt = generateEndingImagePrompt as jest.Mock;

/** The panel ships collapsed, and a collapsed section is aria-hidden. */
const renderExpanded = () => {
  render(<EndingImageDebugSection />);
  fireEvent.click(screen.getByTestId('collapsible-section-toggle'));
};

describe('EndingImageDebugSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the prompt the wrapper returns', async () => {
    mockGenerateEndingImagePrompt.mockResolvedValue({ prompt: 'A hopeful vista at dawn' });

    renderExpanded();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Prompt Preview' }));

    expect(await screen.findByText('A hopeful vista at dawn')).toBeInTheDocument();
    expect(mockGenerateEndingImagePrompt).toHaveBeenCalledTimes(1);
    expect(mockGenerateEndingImage).not.toHaveBeenCalled();
  });

  it('surfaces a failed prompt preview and re-enables the buttons', async () => {
    mockGenerateEndingImagePrompt.mockRejectedValue(new Error('prompt route down'));

    renderExpanded();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Prompt Preview' }));

    expect(await screen.findByText(/Error generating prompt: prompt route down/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate Prompt Preview' })).toBeEnabled();
  });

  it('surfaces a failed full generation and re-enables the buttons', async () => {
    mockGenerateEndingImage.mockRejectedValue(new Error('image route down'));

    renderExpanded();
    fireEvent.click(screen.getByRole('button', { name: 'Test Full Generation' }));

    expect(await screen.findByText(/Generation failed: image route down/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Test Full Generation' })).toBeEnabled();
  });
});
