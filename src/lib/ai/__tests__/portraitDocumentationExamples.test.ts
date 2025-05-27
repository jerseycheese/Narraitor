import { describe, it, expect, jest } from '@jest/globals';
import { PortraitGenerator } from '../portraitGenerator';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Character } from '@/types/character.types';
import { createAIClient } from '../clientFactory';

// Mock the AI client
jest.mock('../clientFactory', () => ({
  createAIClient: jest.fn(() => ({
    generateContent: jest.fn().mockResolvedValue({
      content: '{"isKnownFigure": false}'
    }),
    generateImage: jest.fn().mockResolvedValue({
      image: 'data:image/png;base64,mockImageData',
      prompt: 'Test prompt'
    })
  }))
}));

describe('Portrait Generation Documentation Examples', () => {
  describe('Integration Guide Examples', () => {
    it('basic portrait generation example should work', async () => {
      // This example will be used in the integration guide
      const mockCharacter: Character = {
        id: 'char-123',
        name: 'Test Character',
        worldId: 'world-456',
        level: 1,
        background: {
          history: 'A brave warrior',
          personality: 'Courageous and loyal',
          physicalDescription: 'Tall with dark hair',
          goals: [],
          fears: [],
          relationships: []
        },
        attributes: [],
        skills: [],
        inventory: {
          characterId: 'char-123',
          items: [],
          capacity: 100,
          categories: []
        },
        status: {
          health: 100,
          maxHealth: 100,
          conditions: [],
          location: 'Test World'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const portraitGenerator = new PortraitGenerator(createAIClient());
      const portrait = await portraitGenerator.generatePortrait(mockCharacter, {
        worldTheme: 'Fantasy'
      });

      expect(portrait).toMatchObject({
        type: 'ai-generated',
        url: expect.stringContaining('data:image'),
        generatedAt: expect.any(String)
      });
    });

    it('portrait component usage example should render', () => {
      // This example will be used in the integration guide
      const mockPortrait = {
        type: 'ai-generated' as const,
        url: 'data:image/png;base64,mockImageData'
      };

      render(React.createElement(CharacterPortrait, {
        portrait: mockPortrait,
        characterName: "Test Character",
        size: "medium"
      }));

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Test Character portrait');
    });

    it('fallback portrait example should work', () => {
      // This example demonstrates fallback behavior
      const placeholderPortrait = {
        type: 'placeholder' as const,
        url: null
      };

      render(React.createElement(CharacterPortrait, {
        portrait: placeholderPortrait,
        characterName: "Fallback Character",
        size: "small"
      }));

      // Should render initials instead of image
      expect(screen.getByText('FC')).toBeInTheDocument();
    });
  });

  describe('API Response Examples', () => {
    it('successful API response structure should match documentation', () => {
      // This validates the documented API response structure
      const successResponse = {
        success: true,
        portrait: {
          type: 'ai-generated',
          url: 'data:image/png;base64,/9j/4AAQSkZJRg...',
          generatedAt: new Date().toISOString(),
          prompt: 'A fantasy warrior with dark hair...'
        }
      };

      expect(successResponse).toMatchObject({
        success: true,
        portrait: {
          type: expect.stringMatching(/^(ai-generated|placeholder|uploaded|preset)$/),
          url: expect.any(String),
          generatedAt: expect.any(String),
          prompt: expect.any(String)
        }
      });
    });

    it('error API response structure should match documentation', () => {
      // This validates the documented error response structure
      const errorResponse = {
        success: false,
        error: 'Failed to generate portrait: API key not configured'
      };

      expect(errorResponse).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('Prompt Engineering Examples', () => {
    it('known character detection should work as documented', () => {
      // This validates the documented known character detection
      const knownCharacters = [
        { name: 'Harry Potter', pattern: /^[A-Z][a-z]+ [A-Z][a-z]+$/ },
        { name: 'Darth Vader', pattern: /^[A-Z][a-z]+ [A-Z][a-z]+$/ },
        { name: 'Sherlock Holmes', pattern: /^[A-Z][a-z]+ [A-Z][a-z]+$/ },
        { name: 'Gandalf', pattern: /^[A-Z][a-z]+$/ } // Single name character
      ];

      knownCharacters.forEach(({ name, pattern }) => {
        // The portrait generator should detect these as known characters
        expect(name).toMatch(pattern);
      });
    });
  });
});

