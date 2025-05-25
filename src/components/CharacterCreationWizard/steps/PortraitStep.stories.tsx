// src/components/CharacterCreationWizard/steps/PortraitStep.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { PortraitStep } from './PortraitStep';

const meta: Meta<typeof PortraitStep> = {
  title: 'Narraitor/Character/Creation/CharacterCreationWizard/Step 5 Portrait',
  component: PortraitStep,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '600px', padding: '2rem', backgroundColor: 'white' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = {
  characterData: {
    name: 'Elara Moonshadow',
    portrait: {
      type: 'placeholder' as const,
      url: null,
    },
    attributes: [
      { attributeId: 'strength', value: 8 },
      { attributeId: 'intelligence', value: 15 },
      { attributeId: 'wisdom', value: 12 },
    ],
    skills: [
      { skillId: 'magic', level: 10, isSelected: true },
      { skillId: 'arcana', level: 8, isSelected: true },
    ],
    background: {
      history: 'A skilled mage from the northern kingdoms who studied at the ancient academy of mystical arts',
      personality: 'Wise, mysterious, and deeply curious about ancient magic',
      goals: ['Master the ancient arts', 'Discover lost magical knowledge'],
    },
  },
  worldId: 'world-1',
};

const mockWorldConfig = {
  theme: 'High Fantasy',
  name: 'Arcanum Realm',
};

// Default state with placeholder
export const Default: Story = {
  args: {
    data: mockData,
    onUpdate: action('onUpdate'),
    worldConfig: mockWorldConfig,
  },
};

// With AI-generated portrait
export const WithGeneratedPortrait: Story = {
  args: {
    data: {
      ...mockData,
      characterData: {
        ...mockData.characterData,
        portrait: {
          type: 'ai-generated' as const,
          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNjY2NmZmIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzk5MzNmZiIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSI0MCIgcj0iMTUiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjgiLz4KICA8ZWxsaXBzZSBjeD0iNTAiIGN5PSI3NSIgcng9IjIwIiByeT0iMTUiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjgiLz4KICA8dGV4dCB4PSI1MCIgeT0iOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RWxhcmE8L3RleHQ+Cjwvc3ZnPgo=',
          generatedAt: new Date().toISOString(),
          prompt: 'A mystical elven mage with silver hair and wise eyes, fantasy art style',
        },
      },
    },
    onUpdate: action('onUpdate'),
    worldConfig: mockWorldConfig,
  },
};


// Known figure - real person
export const KnownRealPerson: Story = {
  args: {
    data: {
      ...mockData,
      characterData: {
        ...mockData.characterData,
        name: 'Albert Einstein',
        background: {
          history: 'Revolutionary physicist who developed the theory of relativity',
          personality: 'Curious, thoughtful, and deeply philosophical',
          goals: ['Understand the universe', 'Promote peace'],
          isKnownFigure: true,
          knownFigureType: 'historical',
        },
      },
    },
    onUpdate: action('onUpdate'),
    worldConfig: {
      theme: 'Historical',
      name: '20th Century',
    },
  },
};

// Known figure - fictional character
export const KnownFictionalCharacter: Story = {
  args: {
    data: {
      ...mockData,
      characterData: {
        ...mockData.characterData,
        name: 'Sherlock Holmes',
        background: {
          history: 'The worlds greatest consulting detective from 221B Baker Street',
          personality: 'Brilliant, observant, and occasionally arrogant',
          goals: ['Solve impossible cases', 'Defeat Moriarty'],
          isKnownFigure: true,
          knownFigureType: 'fictional',
        },
      },
    },
    onUpdate: action('onUpdate'),
    worldConfig: {
      theme: 'Victorian Mystery',
      name: 'Victorian London',
    },
  },
};

// With physical description preset
export const WithPhysicalDescription: Story = {
  args: {
    data: {
      ...mockData,
      characterData: {
        ...mockData.characterData,
        background: {
          ...mockData.characterData.background,
          physicalDescription: 'Tall and slender with flowing silver hair, piercing violet eyes, and intricate tattoos of ancient runes covering her arms',
        },
      },
    },
    onUpdate: action('onUpdate'),
    worldConfig: mockWorldConfig,
  },
};

