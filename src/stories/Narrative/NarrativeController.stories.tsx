import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NarrativeController } from '@/components/Narrative/NarrativeController';
import { GeminiClient } from '@/lib/ai/geminiClient';
import { narrativeTemplateManager } from '@/lib/promptTemplates/narrativeTemplateManager';
import { worldStore } from '@/state/worldStore';

// Mock the dependencies
jest.mock('@/lib/ai/geminiClient');
jest.mock('@/lib/promptTemplates/narrativeTemplateManager');
jest.mock('@/state/worldStore');

const meta = {
  title: 'Narraitor/Narrative/NarrativeController',
  component: NarrativeController,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      // Mock world store for story
      const mockWorld = {
        id: 'world-story',
        name: 'Storybook World',
        description: 'A world created for testing in Storybook',
        theme: 'fantasy',
        attributes: [],
        skills: [],
        settings: { maxAttributes: 10, maxSkills: 20 },
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      };

      (worldStore.getState as jest.Mock).mockReturnValue({
        worlds: { 'world-story': mockWorld },
        currentWorldId: 'world-story',
      });

      // Mock narrative templates
      const mockTemplate = (context: any) => {
        return `Generate narrative for world: ${context.worldName}`;
      };
      (narrativeTemplateManager.getTemplate as jest.Mock).mockReturnValue(mockTemplate);

      // Mock Gemini client
      const mockGenerateContent = jest.fn().mockResolvedValue({
        content: 'A mystical narrative unfolds in the Storybook World...',
        metadata: {
          mood: 'mysterious',
          location: 'Storybook Forest',
          tags: ['story', 'test'],
        },
      });

      (GeminiClient as jest.Mock).mockImplementation(() => ({
        generateContent: mockGenerateContent,
      }));

      return <div style={{ width: '600px', minHeight: '400px' }}><Story /></div>;
    },
  ],
} satisfies Meta<typeof NarrativeController>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    worldId: 'world-story',
    sessionId: 'session-story',
  },
};

export const WithError: Story = {
  args: {
    worldId: 'world-story',
    sessionId: 'session-story',
  },
  decorators: [
    (Story) => {
      // Override the mock to simulate error
      const mockGenerateContent = jest.fn().mockRejectedValue(new Error('API Error'));
      (GeminiClient as jest.Mock).mockImplementation(() => ({
        generateContent: mockGenerateContent,
      }));
      return <Story />;
    },
  ],
};

export const SlowLoading: Story = {
  args: {
    worldId: 'world-story',
    sessionId: 'session-story',
  },
  decorators: [
    (Story) => {
      // Override the mock to simulate slow loading
      const mockGenerateContent = jest.fn().mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              content: 'After a long wait, the narrative appears...',
              metadata: {
                mood: 'relaxed',
                location: 'Patience Valley',
                tags: ['slow', 'loading'],
              },
            });
          }, 5000);
        })
      );
      
      (GeminiClient as jest.Mock).mockImplementation(() => ({
        generateContent: mockGenerateContent,
      }));
      return <Story />;
    },
  ],
};