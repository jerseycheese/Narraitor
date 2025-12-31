import type { Meta, StoryObj } from '@storybook/react';
import ImageGenerationStep from '@/components/WorldCreationWizard/steps/ImageGenerationStep';
import { World } from '@/types/world.types';
import { getTimestamp } from '@/lib/utils';

const meta: Meta<typeof ImageGenerationStep> = {
  title: '04-Templates/wizards/game/ImageGenerationStep',
  component: ImageGenerationStep,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Step for generating AI world images during world creation. Displays a preview area and allows users to generate, regenerate, or skip image creation.'
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="w-[800px] p-5">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ImageGenerationStep>;

const mockWorldData: Partial<World> = {
  name: 'The Forgotten Realm',
  genre: 'fantasy',
  description: 'A mystical world where ancient magic flows through enchanted forests and forgotten ruins hold untold secrets.',
  attributes: [],
    skills: [],
    derivedStats: [],  settings: {
    maxAttributes: 10,
    maxSkills: 10,
    attributePointPool: 20,
    skillPointPool: 20
  }
};

// Default state - no image yet
export const Default: Story = {
  args: {
    worldData: mockWorldData,
    onUpdate: (updates) => console.log('World updates:', updates),
    onComplete: () => console.log('Step completed'),
    onBack: () => console.log('Go back'),
    onCancel: () => console.log('Cancel'),
  },
};

// With existing generated image
export const WithExistingImage: Story = {
  args: {
    worldData: {
      ...mockWorldData,
      image: {
        type: 'ai-generated',
        url: 'https://picsum.photos/800/400?random=100',
        generatedAt: getTimestamp(),
        prompt: 'Photorealistic landscape photograph, fantasy themed environment, featuring enchanted forests, magical atmosphere, epic fantasy vista, fantasy art inspiration, ultra high resolution, 8K quality, professional photography, cinematic composition, dramatic lighting, depth of field, wide angle lens, landscape photography, environmental storytelling, no people or characters visible, establishing shot'
      }
    },
    onUpdate: (updates) => console.log('World updates:', updates),
    onComplete: () => console.log('Step completed'),
    onBack: () => console.log('Go back'),
    onCancel: () => console.log('Cancel'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the step with an already generated image, allowing users to regenerate or continue'
      }
    }
  }
};

// Generating state
export const Generating: Story = {
  args: {
    worldData: mockWorldData,
    onUpdate: (updates) => console.log('World updates:', updates),
    onComplete: () => console.log('Step completed'),
    onBack: () => console.log('Go back'),
    onCancel: () => console.log('Cancel'),
  },
  play: async ({ canvasElement }) => {
    // Simulate clicking generate button immediately
    const button = canvasElement.querySelector('button');
    if (button && button.textContent?.includes('Generate')) {
      // This would trigger generation in real usage
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the loading state while an image is being generated'
      }
    }
  }
};

// Error state
export const WithError: Story = {
  args: {
    worldData: mockWorldData,
    onUpdate: (updates) => console.log('World updates:', updates),
    onComplete: () => console.log('Step completed'),
    onBack: () => console.log('Go back'),
    onCancel: () => console.log('Cancel'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the error state when image generation fails'
      }
    }
  }
};

// Skip generation mode
export const SkipGeneration: Story = {
  args: {
    worldData: mockWorldData,
    onUpdate: (updates) => console.log('World updates:', updates),
    onComplete: () => console.log('Step completed'),
    onBack: () => console.log('Go back'),
    onCancel: () => console.log('Cancel'),
    skipGeneration: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the step in skip mode where image generation is not automatically triggered'
      }
    }
  }
};
