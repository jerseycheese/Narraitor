// src/components/CharacterCreationWizard/steps/PortraitStep.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { PortraitStep } from './PortraitStep';
import { WizardContainer, WizardProgress } from '@/components/shared/wizard';

const meta: Meta<typeof PortraitStep> = {
  title: 'Narraitor/Character/Creation/PortraitStep',
  component: PortraitStep,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <WizardContainer title="Create Character in Storybook Test World">
          <WizardProgress 
            steps={[
              { id: 'basic-info', label: 'Basic Info' },
              { id: 'attributes', label: 'Attributes' },
              { id: 'skills', label: 'Skills' },
              { id: 'background', label: 'Background' },
              { id: 'portrait', label: 'Portrait' }
            ]} 
            currentStep={4} 
            className="mb-6"
          />
          <div className="p-6 bg-white rounded-lg shadow">
            <Story />
          </div>
        </WizardContainer>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultData = {
  characterData: {
    name: 'Elara Moonshadow',
    portrait: {
      type: 'placeholder' as const,
      url: null,
    },
    attributes: [
      { attributeId: 'strength', value: 8 },
      { attributeId: 'intelligence', value: 15 },
    ],
    skills: [
      { skillId: 'magic', level: 10, isSelected: true },
    ],
    background: {
      history: 'A skilled mage from the northern kingdoms',
      personality: 'Wise and mysterious',
      goals: ['Master the ancient arts'],
    },
  },
  worldId: 'world-1',
};

const mockWorldConfig = {
  theme: 'High Fantasy',
  name: 'Test World',
};

export const Default: Story = {
  args: {
    data: defaultData,
    onUpdate: () => {},
    worldConfig: mockWorldConfig,
  },
};

export const WithGeneratedPortrait: Story = {
  args: {
    data: {
      ...defaultData,
      characterData: {
        ...defaultData.characterData,
        portrait: {
          type: 'ai-generated' as const,
          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZCIgeDI9IjEiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzY2NjZmZiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM5OTMzZmYiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSJ1cmwoI2dyYWQpIi8+CiAgPGNpcmNsZSBjeD0iNjQiIGN5PSI1MCIgcj0iMjAiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuOCIvPgogIDxlbGxpcHNlIGN4PSI2NCIgY3k9IjkwIiByeD0iMjUiIHJ5PSIyMCIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC44Ii8+Cjwvc3ZnPg==',
          generatedAt: new Date().toISOString(),
        },
      },
    },
    onUpdate: () => {},
    worldConfig: mockWorldConfig,
  },
};
