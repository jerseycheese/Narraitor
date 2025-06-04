import type { Meta, StoryObj } from '@storybook/react';
import ImageGenerationStep from './ImageGenerationStep';
import { World } from '@/types/world.types';

const meta: Meta<typeof ImageGenerationStep> = {
  title: 'Narraitor/World/Creation/Steps/ImageGenerationStep',
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
      <div style={{ width: '800px', padding: '20px' }}>
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
  theme: 'fantasy',
  description: 'A mystical world where ancient magic flows through enchanted forests and forgotten ruins hold untold secrets.',
  attributes: [],
  skills: [],
  settings: {
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
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ic2t5IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM4N0NFRkE7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6I0ZGRTREMjtzdG9wLW9wYWNpdHk6MSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI3NreSkiLz4KICA8ZWxsaXBzZSBjeD0iNDAwIiBjeT0iMzUwIiByeD0iNDAwIiByeT0iMTAwIiBmaWxsPSIjMjI4QjIyIiBvcGFjaXR5PSIwLjgiLz4KICA8cmVjdCB4PSIxMDAiIHk9IjIwMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzY5Njk2OSIvPgogIDxyZWN0IHg9IjMwMCIgeT0iMTUwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE3MCIgZmlsbD0iIzgwODA4MCIvPgogIDxyZWN0IHg9IjU1MCIgeT0iMTgwIiB3aWR0aD0iNzAiIGhlaWdodD0iMTQwIiBmaWxsPSIjNzA3MDcwIi8+CiAgPGNpcmNsZSBjeD0iNzAwIiBjeT0iODAiIHI9IjQwIiBmaWxsPSIjRkZGRjAwIiBvcGFjaXR5PSIwLjkiLz4KICA8dGV4dCB4PSI0MDAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjM2IiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBvcGFjaXR5PSIwLjMiPkZBTlRBU1kgV09STEQ8L3RleHQ+Cjwvc3ZnPg==',
        generatedAt: new Date().toISOString(),
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
