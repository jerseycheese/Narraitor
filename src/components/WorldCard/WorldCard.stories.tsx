import type { Meta, StoryObj } from '@storybook/react';
import { World } from '../../types/world.types';
import WorldCard from './WorldCard';
import React from 'react';

// Mock world data
const mockWorld: World = {
  id: '1',
  name: 'Mystical Realms of Avaloria',
  description: 'An epic fantasy world filled with magic, dragons, and ancient prophecies. Heroes must band together to face the rising darkness.',
  theme: 'Fantasy',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 10,
    maxSkills: 10,
    attributePointPool: 100,
    skillPointPool: 100,
  },
  image: {
    type: 'ai-generated',
    url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    generatedAt: '2023-01-01T10:00:00Z',
    prompt: 'A mystical fantasy landscape with floating islands and magical forests'
  },
  createdAt: '2023-01-01T10:00:00Z',
  updatedAt: '2023-12-15T14:30:00Z',
};

const sciFiWorld: World = {
  id: '2',
  name: 'Neo Tokyo 2185',
  description: 'A cyberpunk dystopia where megacorporations rule and underground hackers fight for freedom in the digital realm.',
  theme: 'Cyberpunk',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 10,
    maxSkills: 10,
    attributePointPool: 100,
    skillPointPool: 100,
  },
  image: {
    type: 'ai-generated',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    generatedAt: '2023-06-15T08:00:00Z',
    prompt: 'A futuristic cyberpunk cityscape with neon lights and towering skyscrapers'
  },
  createdAt: '2023-06-15T08:00:00Z',
  updatedAt: '2023-06-15T08:00:00Z',
};

const westernWorld: World = {
  id: '3',
  name: 'Dustbowl County',
  description: 'The lawless frontier where outlaws roam and justice comes at the end of a six-shooter.',
  theme: 'Western',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 10,
    maxSkills: 10,
    attributePointPool: 100,
    skillPointPool: 100,
  },
  image: {
    type: 'ai-generated',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    generatedAt: '2024-01-01T00:00:00Z',
    prompt: 'A wild west desert landscape with red rocks and tumbleweeds'
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-12-01T16:45:00Z',
};

// Create a wrapper component that provides both router and store mocks
const WorldCardWrapper = (args: Parameters<typeof WorldCard>[0]) => {
  const mockRouter = {
    push: (url: string) => {
      console.log(`[Storybook] Navigating to: ${url}`);
      return Promise.resolve();
    }
  };

  const mockStoreActions = {
    setCurrentWorld: (id: string) => {
      console.log(`[Storybook] Setting current world: ${id}`);
    }
  };

  // Use the component's test props to inject mocks
  return (
    <WorldCard 
      {...args}
      _router={mockRouter}
      _storeActions={mockStoreActions}
    />
  );
};

const meta: Meta<typeof WorldCard> = {
  title: 'Narraitor/World/Display/WorldCard',
  component: WorldCard,
  render: (args) => <WorldCardWrapper {...args} />,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays a world card with details and actions (Play, Edit, Delete)'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onSelect: { action: 'selected' },
    onDelete: { action: 'delete clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof WorldCard>;

// Default story
export const Default: Story = {
  args: {
    world: mockWorld,
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
};

// Story with Cyberpunk theme
export const CyberpunkWorld: Story = {
  args: {
    world: sciFiWorld,
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'A WorldCard displaying a cyberpunk-themed world'
      }
    }
  },
};

// Story with Western theme
export const WesternWorld: Story = {
  args: {
    world: westernWorld,
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'A WorldCard displaying a western-themed world'
      }
    }
  },
};


// Story showing active world state
export const ActiveWorld: Story = {
  args: {
    world: mockWorld,
    isActive: true,
    characterCount: 3,
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'A WorldCard in its active state with green header and action buttons'
      }
    }
  },
};

// Story showing inactive world with Make Active button
export const InactiveWorld: Story = {
  args: {
    world: sciFiWorld,
    isActive: false,
    characterCount: 1,
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'A WorldCard in inactive state showing the "Make Active" button overlay'
      }
    }
  },
};

// Story with empty description
export const MinimalContent: Story = {
  args: {
    world: {
      ...mockWorld,
      name: 'Minimal World',
      description: '',
      theme: '',
      image: undefined, // No image to test the fallback layout
    },
    onSelect: () => console.log('Selected minimal world'),
    onDelete: () => console.log('Delete minimal world'),
  },
  parameters: {
    docs: {
      description: {
        story: 'A WorldCard with minimal content and no image to test edge cases'
      }
    }
  },
};

// Story without image to show the alternative Make Active button position
export const NoImageInactive: Story = {
  args: {
    world: {
      ...westernWorld,
      image: undefined, // Remove image to show alternative button placement
    },
    isActive: false,
    characterCount: 0,
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'A WorldCard without an image showing the Make Active button in content area'
      }
    }
  },
};

// Story showing "Set In" world type
export const SetInWorld: Story = {
  args: {
    world: {
      ...mockWorld,
      name: 'Middle-earth Adventure',
      description: 'Journey through the Shire, visit Rivendell, and brave the paths to Mordor in this epic quest through Tolkien\'s beloved world.',
      theme: 'Fantasy',
      reference: 'Lord of the Rings',
      relationship: 'set_in'
    },
    characterCount: 5,
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'A WorldCard showing a world set within the Lord of the Rings universe with purple "Set in" badge'
      }
    }
  },
};

// Story showing "Based On" world type
export const BasedOnWorld: Story = {
  args: {
    world: {
      ...sciFiWorld,
      name: 'Chrome Shadows',
      description: 'A neon-soaked metropolis where corporate espionage and street-level hackers clash in a world inspired by classic cyberpunk themes.',
      theme: 'Cyberpunk',
      reference: 'Blade Runner',
      relationship: 'based_on'
    },
    characterCount: 2,
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'A WorldCard showing a world inspired by Blade Runner with green "Inspired by" badge'
      }
    }
  },
};

// Story showing Original world type
export const OriginalWorld: Story = {
  args: {
    world: {
      ...westernWorld,
      name: 'Dreamscape Frontier',
      description: 'A completely original world where reality bends to the will of dreamwalkers and nightmares take physical form in the waking world.',
      theme: 'Surreal Western',
      // No reference or relationship = original world
    },
    characterCount: 3,
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'A WorldCard showing a completely original world with blue "Original World" badge'
      }
    }
  },
};
