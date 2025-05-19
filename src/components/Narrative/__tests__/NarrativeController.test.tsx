import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NarrativeController } from '../NarrativeController';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useWorldStore } from '@/state/worldStore';
import { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';

jest.mock('@/state/narrativeStore');
jest.mock('@/state/worldStore');
jest.mock('@/lib/ai/narrativeGenerator');

const mockWorld = {
  id: 'world-123',
  name: 'Fantasy World',
  description: 'A magical realm',
  genre: 'fantasy',
  tone: 'epic'
};

describe('NarrativeController', () => {
  let mockNarrativeGenerator: jest.Mocked<NarrativeGenerator>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNarrativeGenerator = new NarrativeGenerator() as jest.Mocked<NarrativeGenerator>;
    
    (useWorldStore as unknown as jest.Mock).mockReturnValue({
      worlds: { 'world-123': mockWorld },
      currentWorldId: 'world-123'
    });

    (useNarrativeStore as unknown as jest.Mock).mockReturnValue({
      segments: [],
      addSegment: jest.fn(),
      setError: jest.fn(),
      setLoading: jest.fn()
    });
  });

  it('generates initial narrative on mount', async () => {
    const mockSegment = {
      content: 'Welcome to the Fantasy World...',
      segmentType: 'scene' as const,
      metadata: { mood: 'epic' as const }
    };

    mockNarrativeGenerator.generateInitialScene.mockResolvedValue(mockSegment);

    render(<NarrativeController worldId="world-123" sessionId="session-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome to the Fantasy World/)).toBeInTheDocument();
    });
  });

  it('generates new narrative segments on user action', async () => {
    const mockInitialSegment = {
      content: 'Initial scene...',
      segmentType: 'scene' as const,
      metadata: { mood: 'neutral' as const }
    };

    const mockNewSegment = {
      content: 'The story continues...',
      segmentType: 'scene' as const,
      metadata: { mood: 'exciting' as const }
    };

    mockNarrativeGenerator.generateInitialScene.mockResolvedValue(mockInitialSegment);
    mockNarrativeGenerator.generateSegment.mockResolvedValue(mockNewSegment);

    render(<NarrativeController worldId="world-123" sessionId="session-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Initial scene/)).toBeInTheDocument();
    });

    const continueButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText(/The story continues/)).toBeInTheDocument();
    });
  });

  it('handles errors during narrative generation', async () => {
    mockNarrativeGenerator.generateInitialScene.mockRejectedValue(new Error('Generation failed'));

    render(<NarrativeController worldId="world-123" sessionId="session-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to generate narrative/)).toBeInTheDocument();
    });
  });

  it('displays loading state during generation', async () => {
    mockNarrativeGenerator.generateInitialScene.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<NarrativeController worldId="world-123" sessionId="session-123" />);

    expect(screen.getByText(/Generating narrative/i)).toBeInTheDocument();
  });
});