import type { Meta, StoryObj } from '@storybook/react';
import { Navigation } from './Navigation';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { World } from '@/types/world.types';
// Use character interface from store for consistency

const meta: Meta<typeof Navigation> = {
  title: 'Narraitor/Navigation/Navigation',
  component: Navigation,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
        Main navigation component with world switcher and contextual actions.
        
        **Features:**
        - World switcher dropdown with character counts
        - Active world indicator (green highlight)
        - Character creation shortcut for active worlds
        - Responsive design with mobile-friendly layout
        - Auto-close dropdown on outside clicks
        `,
      },
    },
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => {
      // Reset stores before each story
      worldStore.setState({
        worlds: {},
        currentWorldId: null,
        error: null,
        loading: false,
      });
      
      characterStore.setState({
        characters: {},
        currentCharacterId: null,
        error: null,
        loading: false,
      });
      
      return (
        <div className="min-h-screen bg-gray-100">
          <Story />
          <div className="p-8">
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Page Content</h2>
              <p className="text-gray-600">
                This area represents the page content below the navigation.
                The navigation component adapts based on the current world state and user context.
              </p>
            </div>
          </div>
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock worlds and characters
const setupWorlds = () => {
  const fantasyWorld: Omit<World, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Realm of Shadows',
    description: 'A dark fantasy world',
    theme: 'Dark Fantasy',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 6,
      maxSkills: 8,
      attributePointPool: 27,
      skillPointPool: 20,
    },
  };
  
  const scifiWorld: Omit<World, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Neo-Tokyo 2185',
    description: 'Cyberpunk future',
    theme: 'Cyberpunk',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 6,
      maxSkills: 8,
      attributePointPool: 27,
      skillPointPool: 20,
    },
  };
  
  const westernWorld: Omit<World, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Dustbowl County',
    description: 'Wild west frontier',
    theme: 'Western',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 6,
      maxSkills: 8,
      attributePointPool: 27,
      skillPointPool: 20,
    },
  };
  
  const worldId1 = worldStore.getState().createWorld(fantasyWorld);
  const worldId2 = worldStore.getState().createWorld(scifiWorld);
  const worldId3 = worldStore.getState().createWorld(westernWorld);
  
  return { worldId1, worldId2, worldId3 };
};

const setupCharacters = (worldId1: string, worldId2: string) => {
  const character1 = {
    name: 'Aria Starweaver',
    worldId: worldId1,
    level: 5,
    isPlayer: true,
    attributes: [],
    skills: [],
    background: {
      history: 'A brave warrior',
      personality: 'Noble and just',
      goals: ['Protect the innocent'],
      fears: ['Failing in duty'],
      physicalDescription: 'Tall and strong',
    },
    status: {
      hp: 100,
      mp: 50,
      stamina: 75,
    },
    portrait: {
      type: 'placeholder' as const,
      url: null,
    },
  };
  
  const character2 = {
    name: 'Zara Chen',
    worldId: worldId1,
    level: 3,
    isPlayer: true,
    attributes: [],
    skills: [],
    background: {
      history: 'A skilled mage with ancient knowledge',
      personality: 'Wise and mysterious',
      goals: ['Seek ancient knowledge'],
      fears: ['Losing magical powers'],
      physicalDescription: 'Small and quick'
    },
    status: {
      hp: 80,
      mp: 120,
      stamina: 60,
    },
    portrait: {
      type: 'placeholder' as const,
      url: null,
    },
  };
  
  const character3 = {
    name: 'Jack Harrison',
    worldId: worldId2,
    level: 1,
    isPlayer: true,
    attributes: [],
    skills: [],
    background: {
      history: 'A cyber-enhanced detective investigating corruption',
      personality: 'Cynical but determined',
      goals: ['Uncover corporate conspiracy'],
      fears: ['Corporate retaliation'],
      physicalDescription: 'Scarred face, cybernetic eyes'
    },
    status: {
      hp: 90,
      mp: 30,
      stamina: 85,
    },
    portrait: {
      type: 'placeholder' as const,
      url: null,
    },
  };
  
  characterStore.getState().createCharacter(character1);
  characterStore.getState().createCharacter(character2);
  characterStore.getState().createCharacter(character3);
};

export const NoWorlds: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Navigation when no worlds exist - shows "Create Your First World" button'
      }
    }
  }
};

export const WithWorlds: Story = {
  decorators: [
    (Story) => {
      const { worldId1, worldId2 } = setupWorlds();
      setupCharacters(worldId1, worldId2);
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Navigation with multiple worlds - shows world switcher dropdown with character counts'
      }
    }
  }
};

export const WithActiveWorld: Story = {
  decorators: [
    (Story) => {
      const { worldId1, worldId2 } = setupWorlds();
      setupCharacters(worldId1, worldId2);
      worldStore.getState().setCurrentWorld(worldId1);
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Navigation with an active world - shows Characters link and New Character button'
      }
    }
  }
};

export const WorldSwitcherOpen: Story = {
  decorators: [
    (Story) => {
      const { worldId1, worldId2 } = setupWorlds();
      setupCharacters(worldId1, worldId2);
      worldStore.getState().setCurrentWorld(worldId1);
      
      // Simulate opened dropdown by adding CSS to show it
      const style = document.createElement('style');
      style.textContent = `
        [data-testid="world-switcher-dropdown"] {
          display: block !important;
        }
      `;
      document.head.appendChild(style);
      
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Navigation with world switcher dropdown open - shows all worlds with character counts and active indicator'
      }
    }
  }
};