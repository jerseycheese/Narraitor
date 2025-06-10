import type { Meta, StoryObj } from '@storybook/react';
import { SkillEditor } from './SkillEditor';
import { EntityID } from '@/types/common.types';
import { WorldAttribute, WorldSkill } from '@/types/world.types';
import { action } from '@storybook/addon-actions';

const meta = {
  title: 'Narraitor/World/SkillEditor',
  component: SkillEditor,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
        SkillEditor component for creating and editing skills with multiple attribute connections.
        
        Key features:
        - Multi-attribute linking via checkboxes
        - Skill difficulty selection
        - Range and value validation
        - Delete confirmation with warnings
        - Maximum skill limit enforcement (12 skills)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'radio',
      options: ['create', 'edit'],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-4xl mx-auto p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SkillEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data
const mockWorldId = 'world-123' as EntityID;
const mockSkillId = 'skill-456' as EntityID;

const mockAttributes: WorldAttribute[] = [
  {
    id: 'attr-1' as EntityID,
    worldId: mockWorldId,
    name: 'Strength',
    description: 'Physical power and endurance',
    baseValue: 10,
    minValue: 1,
    maxValue: 20,
  },
  {
    id: 'attr-2' as EntityID,
    worldId: mockWorldId,
    name: 'Intelligence',
    description: 'Mental acuity and problem-solving ability',
    baseValue: 12,
    minValue: 1,
    maxValue: 20,
  },
  {
    id: 'attr-3' as EntityID,
    worldId: mockWorldId,
    name: 'Dexterity',
    description: 'Agility and reflexes',
    baseValue: 14,
    minValue: 1,
    maxValue: 20,
  },
  {
    id: 'attr-4' as EntityID,
    worldId: mockWorldId,
    name: 'Charisma',
    description: 'Force of personality and social skills',
    baseValue: 8,
    minValue: 1,
    maxValue: 20,
  },
];

const mockExistingSkills: WorldSkill[] = [
  {
    id: 'existing-skill-1' as EntityID,
    worldId: mockWorldId,
    name: 'Athletics',
    description: 'Physical prowess and endurance activities',
    attributeIds: ['attr-1', 'attr-3'], // Strength + Dexterity
    difficulty: 'medium',
    category: 'Physical',
    baseValue: 3,
    minValue: 1,
    maxValue: 5,
  },
  {
    id: 'existing-skill-2' as EntityID,
    worldId: mockWorldId,
    name: 'Persuasion',
    description: 'Convincing others through charm and reasoning',
    attributeIds: ['attr-4'], // Charisma only
    difficulty: 'easy',
    category: 'Social',
    baseValue: 2,
    minValue: 1,
    maxValue: 5,
  },
];

export const CreateMode: Story = {
  args: {
    worldId: mockWorldId,
    mode: 'create',
    onSave: action('onSave'),
    onCancel: action('onCancel'),
    existingAttributes: mockAttributes,
    existingSkills: mockExistingSkills,
  },
  parameters: {
    docs: {
      description: {
        story: 'Create mode allows users to create a new skill with multiple attribute connections.'
      }
    }
  }
};

export const EditMode: Story = {
  args: {
    worldId: mockWorldId,
    mode: 'edit',
    skillId: mockSkillId,
    onSave: action('onSave'),
    onDelete: action('onDelete'),
    onCancel: action('onCancel'),
    existingAttributes: mockAttributes,
    existingSkills: [
      ...mockExistingSkills,
      {
        id: mockSkillId,
        worldId: mockWorldId,
        name: 'Investigation',
        description: 'Finding clues and solving mysteries through careful observation and deduction',
        attributeIds: ['attr-2', 'attr-3'], // Intelligence + Dexterity
        difficulty: 'hard',
        category: 'Mental',
        baseValue: 4,
        minValue: 1,
        maxValue: 5,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Edit mode allows users to modify existing skills, including changing attribute connections.'
      }
    }
  }
};

export const EditWithManyAttributes: Story = {
  args: {
    worldId: mockWorldId,
    mode: 'edit',
    skillId: mockSkillId,
    onSave: action('onSave'),
    onDelete: action('onDelete'),
    onCancel: action('onCancel'),
    existingAttributes: mockAttributes,
    existingSkills: [
      ...mockExistingSkills,
      {
        id: mockSkillId,
        worldId: mockWorldId,
        name: 'Leadership',
        description: 'Inspiring and guiding others in challenging situations',
        attributeIds: ['attr-1', 'attr-2', 'attr-4'], // Strength + Intelligence + Charisma
        difficulty: 'hard',
        category: 'Social',
        baseValue: 3,
        minValue: 1,
        maxValue: 5,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Skills can be linked to multiple attributes, showing how complex abilities combine different aspects.'
      }
    }
  }
};

export const NoAttributes: Story = {
  args: {
    worldId: mockWorldId,
    mode: 'create',
    onSave: action('onSave'),
    onCancel: action('onCancel'),
    existingAttributes: [],
    existingSkills: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'When no attributes exist, the skill editor shows a helpful message.'
      }
    }
  }
};

export const NearSkillLimit: Story = {
  args: {
    worldId: mockWorldId,
    mode: 'create',
    onSave: action('onSave'),
    onCancel: action('onCancel'),
    existingAttributes: mockAttributes,
    existingSkills: Array(11).fill(null).map((_, i) => ({
      id: `skill-${i}` as EntityID,
      worldId: mockWorldId,
      name: `Skill ${i + 1}`,
      description: `Description for skill ${i + 1}`,
      attributeIds: [mockAttributes[i % mockAttributes.length].id],
      difficulty: 'medium' as const,
      category: 'Test',
      baseValue: 2,
      minValue: 1,
      maxValue: 5,
    })),
  },
  parameters: {
    docs: {
      description: {
        story: 'Creating the 12th skill (maximum allowed) - should still work.'
      }
    }
  }
};

export const AtSkillLimit: Story = {
  args: {
    worldId: mockWorldId,
    mode: 'create',
    onSave: action('onSave'),
    onCancel: action('onCancel'),
    existingAttributes: mockAttributes,
    existingSkills: Array(12).fill(null).map((_, i) => ({
      id: `skill-${i}` as EntityID,
      worldId: mockWorldId,
      name: `Skill ${i + 1}`,
      description: `Description for skill ${i + 1}`,
      attributeIds: [mockAttributes[i % mockAttributes.length].id],
      difficulty: 'medium' as const,
      category: 'Test',
      baseValue: 2,
      minValue: 1,
      maxValue: 5,
    })),
  },
  parameters: {
    docs: {
      description: {
        story: 'Attempting to create a 13th skill should show validation error about the limit.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    // Auto-fill and try to save to trigger the validation error
    const canvas = canvasElement;
    const nameInput = canvas.querySelector('#skill-name') as HTMLInputElement;
    const saveButton = canvas.querySelector('button[type="button"]') as HTMLButtonElement;
    
    if (nameInput && saveButton) {
      nameInput.value = 'Too Many Skills';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      setTimeout(() => {
        saveButton.click();
      }, 500);
    }
  },
};

export const DeleteConfirmation: Story = {
  args: {
    worldId: mockWorldId,
    mode: 'edit',
    skillId: mockSkillId,
    onSave: action('onSave'),
    onDelete: action('onDelete'),
    onCancel: action('onCancel'),
    existingAttributes: mockAttributes,
    existingSkills: [
      ...mockExistingSkills,
      {
        id: mockSkillId,
        worldId: mockWorldId,
        name: 'Dangerous Skill',
        description: 'A skill that will be deleted',
        attributeIds: ['attr-1', 'attr-2', 'attr-3'], // Linked to multiple attributes
        difficulty: 'hard',
        category: 'Test',
        baseValue: 5,
        minValue: 1,
        maxValue: 5,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Delete confirmation dialog shows warnings when skill is linked to multiple attributes.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    // Automatically open delete confirmation dialog
    const deleteButton = canvasElement.querySelector('button[aria-label*="delete"]') as HTMLButtonElement;
    if (deleteButton) {
      setTimeout(() => deleteButton.click(), 500);
    }
  },
};

export const ValidationErrors: Story = {
  args: {
    worldId: mockWorldId,
    mode: 'create',
    onSave: action('onSave'),
    onCancel: action('onCancel'),
    existingAttributes: mockAttributes,
    existingSkills: mockExistingSkills,
  },
  parameters: {
    docs: {
      description: {
        story: 'Validation errors are shown when trying to save invalid data.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    // Auto-trigger validation errors
    const canvas = canvasElement;
    const minInput = canvas.querySelector('#min-value') as HTMLInputElement;
    const maxInput = canvas.querySelector('#max-value') as HTMLInputElement;
    const saveButton = Array.from(canvas.querySelectorAll('button'))
      .find(btn => btn.textContent?.includes('Create')) as HTMLButtonElement;
    
    if (minInput && maxInput && saveButton) {
      // Set invalid range (min >= max)
      minInput.value = '5';
      minInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      maxInput.value = '3';
      maxInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      setTimeout(() => {
        saveButton.click();
      }, 500);
    }
  },
};

export const DuplicateNameValidation: Story = {
  args: {
    worldId: mockWorldId,
    mode: 'create',
    onSave: action('onSave'),
    onCancel: action('onCancel'),
    existingAttributes: mockAttributes,
    existingSkills: mockExistingSkills,
  },
  parameters: {
    docs: {
      description: {
        story: 'Validation prevents creating skills with duplicate names.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    // Auto-fill with duplicate name and try to save
    const canvas = canvasElement;
    const nameInput = canvas.querySelector('#skill-name') as HTMLInputElement;
    const saveButton = Array.from(canvas.querySelectorAll('button'))
      .find(btn => btn.textContent?.includes('Create')) as HTMLButtonElement;
    
    if (nameInput && saveButton) {
      nameInput.value = 'Athletics'; // Duplicate of existing skill
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      setTimeout(() => {
        saveButton.click();
      }, 500);
    }
  },
};

export const InteractiveDemo: Story = {
  args: {
    worldId: mockWorldId,
    mode: 'create',
    onSave: action('onSave'),
    onCancel: action('onCancel'),
    existingAttributes: mockAttributes,
    existingSkills: mockExistingSkills,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo for testing all functionality. Try creating a skill with multiple attributes!'
      }
    }
  }
};