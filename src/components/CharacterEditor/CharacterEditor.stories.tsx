import type { Meta, StoryObj } from '@storybook/react';
import CharacterEditor from './CharacterEditor';
import { characterStore } from '@/state/characterStore';
import { worldStore } from '@/state/worldStore';
import { LoadingState as LoadingStateComponent } from '@/components/ui/LoadingState';
import { PageError } from '@/components/ui/ErrorDisplay';

const meta = {
  title: 'Narraitor/Character/CharacterEditor',
  component: CharacterEditor,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      navigation: {
        push: () => {},
      },
    },
  },
  decorators: [
    (Story) => {
      // Reset stores before each story
      characterStore.getState().reset();
      worldStore.getState().reset();
      
      // Set up test world
      const testWorldId = 'test-world-id';
      worldStore.getState().createWorld({
        name: 'Test World',
        theme: 'Fantasy',
        description: 'A fantasy world for testing',
        attributes: [
          {
            id: 'attr1',
            name: 'Strength',
            description: 'Physical power',
            worldId: testWorldId,
            baseValue: 5,
            minValue: 1,
            maxValue: 10
          },
          {
            id: 'attr2',
            name: 'Intelligence',
            description: 'Mental capacity',
            worldId: testWorldId,
            baseValue: 5,
            minValue: 1,
            maxValue: 10
          }
        ],
        skills: [
          {
            id: 'skill1',
            name: 'Swordsmanship',
            description: 'Skill with bladed weapons',
            worldId: testWorldId,
            difficulty: 'medium' as const,
            linkedAttributeId: 'attr1',
            baseValue: 5,
            minValue: 0,
            maxValue: 10
          },
          {
            id: 'skill2',
            name: 'Magic',
            description: 'Arcane knowledge',
            worldId: testWorldId,
            difficulty: 'hard' as const,
            linkedAttributeId: 'attr2',
            baseValue: 3,
            minValue: 0,
            maxValue: 10
          }
        ],
        settings: {
          maxAttributes: 2,
          maxSkills: 2,
          attributePointPool: 20,
          skillPointPool: 30
        }
      });
      
      return (
        <div className="min-h-screen bg-gray-100 p-4">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof CharacterEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewCharacter: Story = {
  args: {
    characterId: 'new-character-id'
  },
  decorators: [
    (Story) => {
      // Create a test character
      const { worlds } = worldStore.getState();
      const worldId = Object.keys(worlds)[0];
      const world = worlds[worldId];
      
      const characterId = characterStore.getState().createCharacter({
        name: 'Test Character',
        worldId: worldId,
        level: 3,
        attributes: world.attributes.map((attr, index) => ({
          id: `char-attr-${index}`,
          characterId: 'new-character-id',
          name: attr.name,
          baseValue: attr.baseValue,
          modifiedValue: attr.baseValue
        })),
        skills: world.skills.map((skill, index) => ({
          id: `char-skill-${index}`,
          characterId: 'new-character-id',
          name: skill.name,
          level: 5
        })),
        background: {
          history: 'A brave adventurer who started their journey in a small village',
          personality: 'Courageous and kind',
          goals: ['Seeking glory and treasure', 'Protecting the innocent'],
          fears: ['Losing loved ones', 'Failing their quest'],
          physicalDescription: 'Tall and athletic with distinctive scars'
        },
        isPlayer: true,
        status: {
          hp: 100,
          mp: 50,
          stamina: 75
        }
      });
      
      return <Story args={{ characterId }} />;
    }
  ]
};

export const WithPortrait: Story = {
  args: {
    characterId: 'character-with-portrait'
  },
  decorators: [
    (Story) => {
      // Create a test character with portrait
      const { worlds } = worldStore.getState();
      const worldId = Object.keys(worlds)[0];
      const world = worlds[worldId];
      
      const characterId = characterStore.getState().createCharacter({
        name: 'Hero with Portrait',
        worldId: worldId,
        level: 5,
        attributes: world.attributes.map((attr, index) => ({
          id: `char-attr-${index}`,
          characterId: 'character-with-portrait',
          name: attr.name,
          baseValue: attr.baseValue,
          modifiedValue: attr.baseValue + 2
        })),
        skills: world.skills.map((skill, index) => ({
          id: `char-skill-${index}`,
          characterId: 'character-with-portrait',
          name: skill.name,
          level: 7
        })),
        background: {
          history: 'A legendary warrior from the northern kingdoms',
          personality: 'Stoic and honorable, with a hidden sense of humor',
          goals: ['Protecting the innocent and upholding justice'],
          fears: ['Dishonor', 'Failing in duty'],
          physicalDescription: 'Battle-scarred warrior with piercing eyes'
        },
        isPlayer: true,
        status: {
          hp: 150,
          mp: 30,
          stamina: 100
        },
        portrait: {
          type: 'ai-generated',
          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNEY0NkU1Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI0MCIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTEwMCAxMjBDNzAgMTIwIDUwIDE0MCA1MCAxNjBWMjAwSDE1MFYxNjBDMTUwIDE0MCAxMzAgMTIwIDEwMCAxMjBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
          generatedAt: new Date().toISOString(),
          prompt: 'A legendary warrior with noble bearing'
        }
      });
      
      return <Story args={{ characterId }} />;
    }
  ]
};

export const LoadingState: Story = {
  args: {
    characterId: 'loading-character'
  },
  decorators: [
    () => {
      // Simply show the loading state component without character setup
      return (
        <div className="min-h-screen bg-gray-100 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <h1 className="text-2xl font-bold">Character Editor - Loading State</h1>
              <p className="text-gray-600">Demonstrating the LoadingState component</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <LoadingStateComponent message="Loading character data..." />
            </div>
          </div>
        </div>
      );
    }
  ]
};

export const ErrorState: Story = {
  args: {
    characterId: 'non-existent-character'
  }
};

export const ErrorWithRetry: Story = {
  args: {
    characterId: 'error-with-retry-character'
  },
  decorators: [
    () => (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Character Editor - Error State</h1>
            <p className="text-gray-600">Demonstrating the PageError component</p>
          </div>
          <PageError
            title="Character Loading Failed"
            message="We couldn't load the character data. This might be due to a network issue or the character may no longer exist."
            showRetry={true}
            onRetry={() => alert('Retrying character load...')}
          />
        </div>
      </div>
    )
  ]
};