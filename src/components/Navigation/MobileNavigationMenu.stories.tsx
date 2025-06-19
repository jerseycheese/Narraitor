import type { Meta, StoryObj } from '@storybook/react';
import { MobileNavigationMenu } from './MobileNavigationMenu';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { World } from '@/types/world.types';

const meta: Meta<typeof MobileNavigationMenu> = {
  title: 'Narraitor/UI/Navigation/MobileNavigationMenu',
  component: MobileNavigationMenu,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
        Mobile navigation menu with full-screen overlay design optimized for touch interaction.
        
        **Features:**
        - Touch-friendly 44px minimum button sizes
        - Swipe left gesture to close menu
        - Keyboard navigation and focus management
        - World switcher with visual indicators
        - Quick actions based on current context
        - Smooth animations and transitions
        `,
      },
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the mobile menu is currently open',
    },
    onClose: {
      action: 'onClose',
      description: 'Callback fired when menu should close',
    },
    onNavigate: {
      action: 'onNavigate',
      description: 'Callback fired when navigating to a route',
    },
  },
  decorators: [
    (Story) => {
      // Reset stores before each story
      useWorldStore.setState({
        worlds: {},
        currentWorldId: null,
        error: null,
        loading: false,
      });
      
      useCharacterStore.setState({
        characters: {},
        currentCharacterId: null,
        error: null,
        loading: false,
      });
      
      return (
        <div className="relative h-screen">
          <Story />
          {/* Background content to show overlay effect */}
          <div className="absolute inset-0 bg-gray-100 p-8">
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Page Content</h2>
              <p className="text-gray-600">
                This content is behind the mobile navigation overlay when open.
                The overlay should cover the entire screen and prevent interaction with background content.
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

// Mock worlds and characters setup
const setupWorlds = () => {
  const fantasyWorld: Omit<World, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Realm of Shadows',
    description: 'A dark fantasy world filled with ancient magic and mysterious creatures',
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
    description: 'A cyberpunk future where technology and humanity collide',
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
    description: 'Wild west frontier town with outlaws and lawmen',
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
  
  const worldId1 = useWorldStore.getState().createWorld(fantasyWorld);
  const worldId2 = useWorldStore.getState().createWorld(scifiWorld);
  const worldId3 = useWorldStore.getState().createWorld(westernWorld);
  
  return { worldId1, worldId2, worldId3 };
};

const setupCharacters = (worldId1: string, worldId2: string) => {
  const character1 = {
    name: 'Aria Starweaver',
    description: 'A brave warrior from the fantasy realm',
    worldId: worldId1,
    level: 5,
    isPlayer: true,
    attributes: [],
    skills: [],
    background: {
      history: 'A brave warrior with a mysterious past',
      personality: 'Noble and just, but haunted by ancient memories',
      goals: ['Protect the innocent', 'Uncover lost magic'],
      fears: ['Failing in duty', 'Dark magic corruption'],
      physicalDescription: 'Tall and strong with silver-streaked hair',
      relationships: [],
    },
    status: {
      health: 100,
      maxHealth: 100,
      conditions: [],
    },
    inventory: {
      characterId: '',
      items: [],
      capacity: 100,
      categories: [],
    },
    portrait: {
      type: 'placeholder' as const,
      url: null,
    },
  };
  
  const character2 = {
    name: 'Zara Chen',
    description: 'A skilled mage with ancient knowledge',
    worldId: worldId1,
    level: 3,
    isPlayer: true,
    attributes: [],
    skills: [],
    background: {
      history: 'A scholar turned adventurer seeking ancient artifacts',
      personality: 'Wise and mysterious, but curious about forbidden knowledge',
      goals: ['Seek ancient knowledge', 'Master elemental magic'],
      fears: ['Losing magical powers', 'Academic rivals'],
      physicalDescription: 'Small and quick with intricate tattoos',
      relationships: [],
    },
    status: {
      health: 80,
      maxHealth: 100,
      conditions: [],
    },
    inventory: {
      characterId: '',
      items: [],
      capacity: 100,
      categories: [],
    },
    portrait: {
      type: 'placeholder' as const,
      url: null,
    },
  };
  
  const character3 = {
    name: 'Jack Harrison',
    description: 'A cyber-enhanced detective investigating corruption',
    worldId: worldId2,
    level: 1,
    isPlayer: true,
    attributes: [],
    skills: [],
    background: {
      history: 'Former cop turned private investigator with cybernetic enhancements',
      personality: 'Cynical but determined to find the truth',
      goals: ['Uncover corporate conspiracy', 'Clear his name'],
      fears: ['Corporate retaliation', 'Technology failure'],
      physicalDescription: 'Scarred face with glowing cybernetic eyes',
      relationships: [],
    },
    status: {
      health: 90,
      maxHealth: 100,
      conditions: [],
    },
    inventory: {
      characterId: '',
      items: [],
      capacity: 100,
      categories: [],
    },
    portrait: {
      type: 'placeholder' as const,
      url: null,
    },
  };
  
  useCharacterStore.getState().createCharacter(character1);
  useCharacterStore.getState().createCharacter(character2);
  useCharacterStore.getState().createCharacter(character3);
};

export const Open: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onNavigate: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Mobile menu open with no worlds - shows basic navigation and create world button'
      }
    }
  }
};

export const WithWorlds: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onNavigate: () => {},
  },
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
        story: 'Mobile menu with multiple worlds - shows world switcher section with character counts'
      }
    }
  }
};

export const WithActiveWorld: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onNavigate: () => {},
  },
  decorators: [
    (Story) => {
      const { worldId1, worldId2 } = setupWorlds();
      setupCharacters(worldId1, worldId2);
      useWorldStore.getState().setCurrentWorld(worldId1);
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Mobile menu with active world - shows current world highlighted and play button'
      }
    }
  }
};

