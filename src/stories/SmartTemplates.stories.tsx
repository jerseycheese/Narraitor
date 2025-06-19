// src/stories/SmartTemplates.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { SmartTemplates } from '@/components/world/SmartTemplates';
import { TemplatePreview } from '@/components/world/SmartTemplates/TemplatePreview';
import { WorldTemplate } from '@/lib/ai/templateGenerator';
import { AVAILABLE_GENRES } from '@/lib/constants/genres';

// Mock session store for Storybook
jest.mock('@/state/sessionStore', () => ({
  sessionStore: {
    getState: () => ({
      templateHistory: [
        {
          template: {
            name: 'Cyber Frontier',
            theme: 'Cyberpunk Western',
            description: 'A world where high-tech meets the wild west',
            attributes: [
              { name: 'Tech Savvy', baseValue: 60, minValue: 0, maxValue: 100, category: 'Mental' },
              { name: 'Grit', baseValue: 70, minValue: 0, maxValue: 100, category: 'Social' }
            ],
            skills: [
              { name: 'Hacking', baseValue: 45, minValue: 0, maxValue: 100, difficulty: 'hard', category: 'Technical' },
              { name: 'Quick Draw', baseValue: 50, minValue: 0, maxValue: 100, difficulty: 'moderate', category: 'Combat' }
            ],
            explanation: 'This genre mix combines cyberpunk technology with western frontier themes'
          },
          generatedAt: '2023-01-01',
          generationType: 'genre-mix' as const,
          genres: [AVAILABLE_GENRES[4], AVAILABLE_GENRES[3]] // Cyberpunk, Western
        }
      ],
      addTemplateToHistory: () => {}
    })
  }
}));

// Mock AI client for Storybook
jest.mock('@/lib/ai/geminiClient', () => ({
  geminiClient: {
    generateContent: async () => ({
      content: JSON.stringify({
        name: 'Generated World',
        description: 'An AI-generated world for testing',
        theme: 'Fantasy',
        attributes: [
          { name: 'Strength', baseValue: 50, minValue: 0, maxValue: 100, category: 'Physical' },
          { name: 'Intelligence', baseValue: 60, minValue: 0, maxValue: 100, category: 'Mental' }
        ],
        skills: [
          { name: 'Swordplay', baseValue: 40, minValue: 0, maxValue: 100, difficulty: 'moderate', category: 'Combat' },
          { name: 'Magic', baseValue: 35, minValue: 0, maxValue: 100, difficulty: 'hard', category: 'Mystical' }
        ],
        explanation: 'A classic fantasy world with balanced attributes and skills'
      })
    })
  }
}));

const meta: Meta<typeof SmartTemplates> = {
  title: 'World/SmartTemplates',
  component: SmartTemplates,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Smart world template generation with AI assistance. Supports three modes: inspired-by, genre mixing, and surprise generation.'
      }
    }
  },
  argTypes: {
    onTemplateGenerated: { action: 'template-generated' }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onTemplateGenerated: (template) => console.log('Generated template:', template)
  }
};

export const WithHistory: Story = {
  args: {
    onTemplateGenerated: (template) => console.log('Generated template:', template)
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the component with existing template history for reuse'
      }
    }
  }
};

export const Loading: Story = {
  args: {
    onTemplateGenerated: (template) => console.log('Generated template:', template)
  },
  play: async ({ canvasElement }) => {
    // Simulate clicking "Surprise me" to show loading state
    const canvas = canvasElement;
    const surpriseButton = canvas.querySelector('button') as HTMLButtonElement;
    if (surpriseButton && surpriseButton.textContent?.includes('Surprise')) {
      surpriseButton.click();
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the loading state during template generation'
      }
    }
  }
};

// Template Preview Stories
const mockTemplate: WorldTemplate = {
  name: 'Neo-Victorian Skyport',
  description: 'A steampunk world of floating cities powered by steam and clockwork, where airship pirates rule the skies and Victorian sensibilities clash with mechanical marvels.',
  theme: 'Steampunk',
  attributes: [
    { name: 'Ingenuity', baseValue: 65, minValue: 0, maxValue: 100, category: 'Mental' },
    { name: 'Dexterity', baseValue: 60, minValue: 0, maxValue: 100, category: 'Physical' },
    { name: 'Social Standing', baseValue: 45, minValue: 0, maxValue: 100, category: 'Social' },
    { name: 'Steam Affinity', baseValue: 55, minValue: 0, maxValue: 100, category: 'Mystical' }
  ],
  skills: [
    { name: 'Engineering', baseValue: 50, minValue: 0, maxValue: 100, difficulty: 'moderate', category: 'Technical' },
    { name: 'Airship Piloting', baseValue: 40, minValue: 0, maxValue: 100, difficulty: 'hard', category: 'Technical' },
    { name: 'Clockwork Repair', baseValue: 45, minValue: 0, maxValue: 100, difficulty: 'moderate', category: 'Technical' },
    { name: 'Etiquette', baseValue: 35, minValue: 0, maxValue: 100, difficulty: 'easy', category: 'Social' },
    { name: 'Dueling', baseValue: 40, minValue: 0, maxValue: 100, difficulty: 'moderate', category: 'Combat' },
    { name: 'Steam Magic', baseValue: 30, minValue: 0, maxValue: 100, difficulty: 'extreme', category: 'Mystical' }
  ],
  explanation: 'Steampunk worlds emphasize mechanical ingenuity and Victorian social structures. The Steam Affinity attribute represents connection to the mystical power source, while skills balance technical expertise with social graces and combat readiness.'
};

export const TemplatePreviewStory: Story = {
  render: () => (
    <TemplatePreview
      template={mockTemplate}
      onUse={() => console.log('Using template')}
      onBack={() => console.log('Going back')}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Preview screen showing a generated world template with all details'
      }
    }
  }
};

export const MobileView: Story = {
  args: {
    onTemplateGenerated: (template) => console.log('Generated template:', template)
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Mobile-responsive view of the Smart Templates component'
      }
    }
  }
};