import type { Meta, StoryObj } from '@storybook/react';
import CharacterEditor from '@/components/CharacterEditor/CharacterEditor';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { LoadingState as LoadingStateComponent } from '@/components/ui/LoadingState/LoadingState';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { getTimestamp } from '@/lib/utils';

const meta = {
  title: '03-Organisms/character/editor/CharacterEditor',
  component: CharacterEditor,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      navigation: {
        push: () => {},
      },
    },
    docs: {
      description: {
        component: `Edits an existing character. Loads the character's saved data into forms for basic info, background, attributes, skills, and portrait generation, and reuses the validation from character creation. Portrait generation takes an optional custom prompt, with an undo that drops back to the generated description.`,
      },
    },
  },
  decorators: [
    (Story) => {
      // Reset stores before each story
      useCharacterStore.getState().reset();
      useWorldStore.getState().reset();

      // Set up test world
      const testWorldId = 'test-world-id';
      useWorldStore.getState().createWorld({
        name: 'Test World',
        genre: 'fantasy',
        description: 'A fantasy world for testing',
        attributes: [
          {
            id: 'attr1',
            name: 'Strength',
            description: 'Physical power',
            worldId: testWorldId,
            baseValue: 5,
            minValue: 1,
            maxValue: 10,
          },
          {
            id: 'attr2',
            name: 'Intelligence',
            description: 'Mental capacity',
            worldId: testWorldId,
            baseValue: 5,
            minValue: 1,
            maxValue: 10,
          },
        ],
        skills: [
          {
            id: 'skill1',
            name: 'Swordsmanship',
            description: 'Skill with bladed weapons',
            worldId: testWorldId,
            difficulty: 'medium' as const,
            attributeIds: ['attr1'],
            baseValue: 5,
            minValue: 0,
            maxValue: 10,
          },
          {
            id: 'skill2',
            name: 'Magic',
            description: 'Arcane knowledge',
            worldId: testWorldId,
            difficulty: 'hard' as const,
            attributeIds: ['attr2'],
            baseValue: 3,
            minValue: 0,
            maxValue: 10,
          },
        ],
        settings: {
          maxAttributes: 2,
          maxSkills: 2,
          attributePointPool: 20,
          skillPointPool: 30,
        },
      });

      return (
        <div>
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
    characterId: 'new-character-id',
  },
  decorators: [
    (Story) => {
      // Create a test character
      const { worlds } = useWorldStore.getState();
      const worldId = Object.keys(worlds)[0];
      const world = worlds[worldId];

      const characterId = useCharacterStore.getState().createCharacter({
        name: 'Test Character',
        description:
          'A brave adventurer who started their journey in a small village',
        worldId: worldId,
        level: 3,
        attributes: world.attributes.map((attr, index) => ({
          id: `char-attr-${index}`,
          characterId: 'new-character-id',
          name: attr.name,
          baseValue: attr.baseValue,
          modifiedValue: attr.baseValue,
        })),
        skills: world.skills.map((skill, index) => ({
          id: `char-skill-${index}`,
          characterId: 'new-character-id',
          name: skill.name,
          level: 5,
        })),
        derivedStats: [],
        background: {
          history:
            'A brave adventurer who started their journey in a small village',
          personality: 'Courageous and kind',
          goals: ['Seeking glory and treasure', 'Protecting the innocent'],
          fears: ['Losing loved ones', 'Failing their quest'],
          physicalDescription: 'Tall and athletic with distinctive scars',
          relationships: [],
        },
        isPlayer: true,
        status: {
          conditions: [],
        },
        inventory: {
          characterId: '', // Will be set by the store
          items: [],
          capacity: 20,
          categories: [],
          itemOrder: [],
        },
      });

      return <Story args={{ characterId }} />;
    },
  ],
};

export const WithPortrait: Story = {
  args: {
    characterId: 'character-with-portrait',
  },
  decorators: [
    (Story) => {
      // Create a test character with portrait
      const { worlds } = useWorldStore.getState();
      const worldId = Object.keys(worlds)[0];
      const world = worlds[worldId];

      const characterId = useCharacterStore.getState().createCharacter({
        name: 'Hero with Portrait',
        description: 'A legendary warrior from the northern kingdoms',
        worldId: worldId,
        level: 5,
        attributes: world.attributes.map((attr, index) => ({
          id: `char-attr-${index}`,
          characterId: 'character-with-portrait',
          name: attr.name,
          baseValue: attr.baseValue,
          modifiedValue: attr.baseValue + 2,
        })),
        skills: world.skills.map((skill, index) => ({
          id: `char-skill-${index}`,
          characterId: 'character-with-portrait',
          name: skill.name,
          level: 7,
        })),
        derivedStats: [],
        background: {
          history: 'A legendary warrior from the northern kingdoms',
          personality: 'Stoic and honorable, with a sense of humor',
          goals: ['Protecting the innocent and upholding justice'],
          fears: ['Dishonor', 'Failing in duty'],
          physicalDescription: 'Battle-scarred warrior with piercing eyes',
          relationships: [],
        },
        isPlayer: true,
        status: {
          conditions: [],
        },
        portrait: {
          type: 'ai-generated',
          url: 'https://i.pravatar.cc/200?img=1',
          generatedAt: getTimestamp(),
          prompt: 'A legendary warrior with noble bearing',
        },
        inventory: {
          characterId: '', // Will be set by the store
          items: [],
          capacity: 20,
          categories: [],
          itemOrder: [],
        },
      });

      return <Story args={{ characterId }} />;
    },
  ],
};

export const LoadingState: Story = {
  args: {
    characterId: 'loading-character',
  },
  decorators: [
    () => {
      // Simply show the loading state component without character setup
      return (
        <div>
          <div>
            <div>
              <h1>
                Character Editor - Loading State
              </h1>
              <p>
                Demonstrating the LoadingState component
              </p>
            </div>
            <div>
              <LoadingStateComponent message="Loading character data..." />
            </div>
          </div>
        </div>
      );
    },
  ],
};

export const ErrorState: Story = {
  args: {
    characterId: 'non-existent-character',
  },
};

export const ErrorWithRetry: Story = {
  args: {
    characterId: 'error-with-retry-character',
  },
  decorators: [
    () => (
      <div>
        <div>
          <div>
            <h1>
              Character Editor - Error State
            </h1>
            <p>
              Demonstrating the ErrorDisplay page variant
            </p>
          </div>
          <ErrorDisplay
            variant="page"
            title="Character Loading Failed"
            message="We couldn't load the character data. This might be due to a network issue or the character may no longer exist."
            showRetry={true}
            onRetry={() => alert('Retrying character load...')}
          />
        </div>
      </div>
    ),
  ],
};

export const CustomPromptTesting: Story = {
  args: {
    characterId: 'custom-prompt-test-character',
  },
  decorators: [
    (Story) => {
      // Create a test character specifically for testing custom prompt functionality
      const { worlds } = useWorldStore.getState();
      const worldId = Object.keys(worlds)[0];
      const world = worlds[worldId];

      const characterId = useCharacterStore.getState().createCharacter({
        name: 'Custom Prompt Test Character',
        description: 'A character for testing the custom prompt functionality',
        worldId: worldId,
        level: 1,
        attributes: world.attributes.map((attr, index) => ({
          id: `char-attr-${index}`,
          characterId: 'custom-prompt-test-character',
          name: attr.name,
          baseValue: attr.baseValue,
          modifiedValue: attr.baseValue,
        })),
        skills: world.skills.map((skill, index) => ({
          id: `char-skill-${index}`,
          characterId: 'custom-prompt-test-character',
          name: skill.name,
          level: 3,
        })),
        derivedStats: [],
        background: {
          history:
            'A test character created to demonstrate custom prompt functionality',
          personality: 'Designed for testing UI interactions',
          goals: ['Test custom prompts', 'Demonstrate undo functionality'],
          fears: ['Broken UI components'],
          physicalDescription:
            'A basic character appearance for testing portrait generation',
          relationships: [],
        },
        isPlayer: true,
        status: {
          conditions: [],
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: [],
          itemOrder: [],
        },
      });

      return (
        <div>
          <div>
            <div>
              <h2>
                Custom Prompt Testing Instructions
              </h2>
              <ul>
                <li>
                  1. Check that &quot;Customize physical description&quot; is{' '}
                  <strong>unchecked by default</strong>
                </li>
                <li>
                  2. Check the checkbox and enter custom text in the textarea
                </li>
                <li>
                  3. Verify the &quot;Undo customizations&quot; button appears
                </li>
                <li>
                  4. Click &quot;Undo customizations&quot; to test the reset
                  functionality
                </li>
                <li>
                  5. Note that all form elements use proper shadcn/ui components
                </li>
              </ul>
            </div>
            <Story args={{ characterId }} />
          </div>
        </div>
      );
    },
  ],
};

export const UIComponentShowcase: Story = {
  args: {
    characterId: 'ui-showcase-character',
  },
  decorators: [
    (Story) => {
      // Create a character to showcase all the UI components
      const { worlds } = useWorldStore.getState();
      const worldId = Object.keys(worlds)[0];
      const world = worlds[worldId];

      const characterId = useCharacterStore.getState().createCharacter({
        name: 'UI Components Showcase',
        description: 'Demonstrating shadcn/ui component integration',
        worldId: worldId,
        level: 5,
        attributes: world.attributes.map((attr, index) => ({
          id: `char-attr-${index}`,
          characterId: 'ui-showcase-character',
          name: attr.name,
          baseValue: attr.baseValue + 2,
          modifiedValue: attr.baseValue + 2,
        })),
        skills: world.skills.map((skill, index) => ({
          id: `char-skill-${index}`,
          characterId: 'ui-showcase-character',
          name: skill.name,
          level: 6,
        })),
        derivedStats: [],
        background: {
          history:
            'This character showcases all the UI component improvements made to the character editor',
          personality: 'Well-designed and consistent with the design system',
          goals: [
            'Demonstrate proper UI patterns',
            'Show component consistency',
          ],
          fears: ['Inconsistent styling', 'Raw HTML elements'],
          physicalDescription:
            'Clean, modern appearance that follows design standards',
          relationships: [],
        },
        isPlayer: true,
        status: {
          conditions: ['Enhanced UI'],
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 25,
          categories: [],
          itemOrder: [],
        },
      });

      return (
        <div>
          <div>
            <div>
              <h2>
                shadcn/ui Component Integration
              </h2>
              <ul>
                <li>
                  ✅ <strong>Input</strong> components with proper styling and
                  focus states
                </li>
                <li>
                  ✅ <strong>Select</strong> components replacing raw select
                  elements
                </li>
                <li>
                  ✅ <strong>Textarea</strong> components with consistent
                  styling
                </li>
                <li>
                  ✅ <strong>Button</strong> components with variants (default,
                  outline, destructive, link)
                </li>
                <li>
                  ✅ <strong>Checkbox</strong> components with integrated labels
                </li>
                <li>
                  ✅ <strong>Label</strong> components with proper accessibility
                </li>
                <li>
                  ✅ <strong>NEW:</strong> RadioGroup components for better form
                  controls
                </li>
                <li>
                  ✅ <strong>NEW:</strong> Consistent styling across world
                  editor and creation wizard
                </li>
                <li>
                  ✅ <strong>NEW:</strong> Improved component reusability and
                  maintainability
                </li>
              </ul>
            </div>
            <Story args={{ characterId }} />
          </div>
        </div>
      );
    },
  ],
};
