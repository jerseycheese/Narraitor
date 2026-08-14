/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestDataGeneratorSection } from '../TestDataGeneratorSection';
import { worldApi } from '@/lib/api/worldApi';
import { characterApi } from '@/lib/api/characterApi';
import { generatePortrait } from '@/lib/api/generatePortrait';

jest.mock('@/lib/api/worldApi', () => ({
  worldApi: { generateWorld: jest.fn(), generateWorldImage: jest.fn() },
}));

jest.mock('@/lib/api/characterApi', () => ({
  characterApi: { generateCharacter: jest.fn() },
}));

jest.mock('@/lib/api/generatePortrait', () => ({
  generatePortrait: jest.fn(),
}));

jest.mock('@/lib/services/worldCreationService', () => ({
  ensureWorldNpcRoster: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/worlds',
  useSearchParams: () => ({ get: () => null }),
}));

const mockCreateWorld = jest.fn(() => 'world-1');
const mockUpdateWorld = jest.fn();
const mockSetCurrentWorld = jest.fn();
const mockCreateCharacter = jest.fn(() => 'char-1');
const mockUpdateCharacter = jest.fn();

const mockWorld = {
  id: 'world-1',
  name: 'Test World',
  description: 'A world for tests',
  genre: 'fantasy',
  attributes: [],
  skills: [],
};

const mockStoredCharacter = {
  id: 'char-1',
  name: 'Hero',
  worldId: 'world-1',
  background: {
    history: 'A history',
    personality: 'Brave',
    physicalDescription: 'Tall',
    goals: [],
    fears: [],
  },
  attributes: [],
  skills: [],
  status: { health: 100, maxHealth: 100, conditions: [] },
  createdAt: '2026-08-14T00:00:00Z',
  updatedAt: '2026-08-14T00:00:00Z',
};

const mockWorldStoreValue = {
  worlds: { 'world-1': mockWorld },
  currentWorldId: 'world-1',
  createWorld: mockCreateWorld,
  updateWorld: mockUpdateWorld,
  setCurrentWorld: mockSetCurrentWorld,
};

const mockCharacterStoreValue = {
  characters: { 'char-1': mockStoredCharacter },
  createCharacter: mockCreateCharacter,
  updateCharacter: mockUpdateCharacter,
};

jest.mock('@/state/worldStore', () => ({
  useWorldStore: Object.assign(jest.fn(() => mockWorldStoreValue), {
    getState: jest.fn(() => mockWorldStoreValue),
  }),
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: Object.assign(jest.fn(() => mockCharacterStoreValue), {
    getState: jest.fn(() => mockCharacterStoreValue),
  }),
}));

const mockGenerateWorld = worldApi.generateWorld as jest.Mock;
const mockGenerateWorldImage = worldApi.generateWorldImage as jest.Mock;
const mockGenerateCharacter = characterApi.generateCharacter as jest.Mock;
const mockGeneratePortrait = generatePortrait as jest.Mock;

const generatedWorld = { name: 'Test World', attributes: [], skills: [] };
const generatedCharacter = {
  name: 'Hero',
  level: 1,
  attributes: [],
  skills: [],
  background: {
    description: 'A history',
    personality: 'Brave',
    motivation: 'Glory',
    physicalDescription: 'Tall',
    fears: [],
  },
};

const clickButton = (name: string) => {
  fireEvent.click(screen.getByRole('button', { name }));
};

describe('TestDataGeneratorSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
    mockGenerateWorld.mockResolvedValue(generatedWorld);
    mockGenerateWorldImage.mockResolvedValue({ imageUrl: 'image-url', aiGenerated: true });
    mockGenerateCharacter.mockResolvedValue(generatedCharacter);
    mockGeneratePortrait.mockResolvedValue({ portrait: { url: 'portrait-url' } });
  });

  it('creates a world and its image through the api wrappers', async () => {
    render(<TestDataGeneratorSection />);
    clickButton('Generate Diverse AI World');

    await waitFor(() => expect(mockGenerateWorldImage).toHaveBeenCalledTimes(1));
    expect(mockGenerateWorld).toHaveBeenCalledTimes(1);
    expect(mockCreateWorld).toHaveBeenCalledTimes(1);
    expect(mockUpdateWorld).toHaveBeenCalledWith('world-1', {
      image: expect.objectContaining({ url: 'image-url', type: 'ai-generated' }),
    });
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('reports a failed world generation instead of creating a world', async () => {
    mockGenerateWorld.mockRejectedValue(new Error('world route down'));

    render(<TestDataGeneratorSection />);
    clickButton('Generate Diverse AI World');

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('world route down'))
    );
    expect(mockCreateWorld).not.toHaveBeenCalled();
  });

  it('keeps the world when its image generation fails', async () => {
    mockGenerateWorldImage.mockRejectedValue(new Error('image route down'));

    render(<TestDataGeneratorSection />);
    clickButton('Generate Diverse AI World');

    await waitFor(() => expect(mockGenerateWorldImage).toHaveBeenCalledTimes(1));
    expect(mockCreateWorld).toHaveBeenCalledTimes(1);
    expect(mockUpdateWorld).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('reports a failed character generation', async () => {
    mockGenerateCharacter.mockRejectedValue(new Error('character route down'));

    render(<TestDataGeneratorSection />);
    clickButton('Generate 5 AI Characters for World');

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('character route down'))
    );
    expect(mockCreateCharacter).not.toHaveBeenCalled();
  });

  it('keeps the character when its portrait generation fails', async () => {
    mockGeneratePortrait.mockRejectedValue(new Error('portrait route down'));

    render(<TestDataGeneratorSection />);
    clickButton('Generate 5 AI Characters for World');

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Successfully generated'))
    );
    expect(mockCreateCharacter).toHaveBeenCalledTimes(5);
    expect(mockUpdateCharacter).not.toHaveBeenCalled();
  });
});
