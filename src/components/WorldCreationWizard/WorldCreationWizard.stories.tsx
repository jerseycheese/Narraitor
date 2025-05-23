import type { Meta, StoryObj } from '@storybook/react';
import WorldCreationWizard from './WorldCreationWizard';
import { SkillDifficulty } from '@/lib/constants/skillDifficultyLevels';

const meta: Meta<typeof WorldCreationWizard> = {
  title: 'Narraitor/World/WorldCreationWizard',
  component: WorldCreationWizard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Multi-step wizard for creating new worlds with AI-assisted attribute and skill suggestions'
      }
    },
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WorldCreationWizard>;

// Default wizard state
export const Default: Story = {
  args: {},
};

// Story showing the template selection step
export const TemplateSelectionStep: Story = {
  args: {
    initialStep: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the first step of the wizard where users choose a world template'
      }
    }
  }
};

// Story showing the basic info step
export const BasicInfoStep: Story = {
  args: {
    initialStep: 1,
    initialData: {
      worldData: {
        settings: {
          maxAttributes: 10,
          maxSkills: 10,
          attributePointPool: 20,
          skillPointPool: 20
        }
      },
      selectedTemplateId: "fantasy"
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the step where users enter basic world information'
      }
    }
  }
};

// Story showing the description step
export const DescriptionStep: Story = {
  args: {
    initialStep: 2,
    initialData: {
      worldData: {
        name: 'Fantasy Kingdom',
        theme: 'fantasy',
        settings: {
          maxAttributes: 10,
          maxSkills: 10,
          attributePointPool: 20,
          skillPointPool: 20
        }
      }
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the step where users provide a detailed world description for AI analysis'
      }
    }
  }
};

// Story showing the attribute review step
export const AttributeReviewStep: Story = {
  args: {
    initialStep: 3,
    initialData: {
      worldData: {
        name: 'Fantasy Kingdom',
        theme: 'fantasy',
        description: 'A magical world filled with wizards and warriors',
        settings: {
          maxAttributes: 10,
          maxSkills: 10,
          attributePointPool: 20,
          skillPointPool: 20
        }
      },
      aiSuggestions: {
        attributes: [
          { name: 'Strength', description: 'Physical power and endurance', minValue: 1, maxValue: 10, baseValue: 5, category: 'Physical', accepted: true },
          { name: 'Intelligence', description: 'Mental acuity and reasoning', minValue: 1, maxValue: 10, baseValue: 7, category: 'Mental', accepted: true },
          { name: 'Agility', description: 'Speed and dexterity', minValue: 1, maxValue: 10, baseValue: 6, category: 'Physical', accepted: true },
          { name: 'Charisma', description: 'Social influence and charm', minValue: 1, maxValue: 10, baseValue: 4, category: 'Social', accepted: true },
          { name: 'Dexterity', description: 'Hand-eye coordination and precision', minValue: 1, maxValue: 10, baseValue: 5, category: 'Physical', accepted: true },
          { name: 'Constitution', description: 'Health and stamina', minValue: 1, maxValue: 10, baseValue: 6, category: 'Physical', accepted: true },
        ],
        skills: []
      }
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the attribute review step where users can select and modify suggested attributes'
      }
    }
  }
};

// Story showing the skill review step
export const SkillReviewStep: Story = {
  args: {
    initialStep: 4,
    initialData: {
      worldData: {
        name: 'Fantasy Kingdom',
        theme: 'fantasy',
        description: 'A magical world filled with wizards and warriors',
        attributes: [
          { id: 'attr1', worldId: '', name: 'Strength', description: 'Physical power', baseValue: 5, minValue: 1, maxValue: 10 },
          { id: 'attr2', worldId: '', name: 'Intelligence', description: 'Mental acuity', baseValue: 5, minValue: 1, maxValue: 10 },
        ],
        settings: {
          maxAttributes: 10,
          maxSkills: 10,
          attributePointPool: 20,
          skillPointPool: 20
        }
      },
      aiSuggestions: {
        attributes: [],
        skills: [
          { name: 'Combat', description: 'Ability to fight effectively', difficulty: 'medium' as SkillDifficulty, category: 'Combat', linkedAttributeName: 'Strength', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
          { name: 'Stealth', description: 'Moving unseen and unheard', difficulty: 'hard' as SkillDifficulty, category: 'Physical', linkedAttributeName: 'Agility', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
          { name: 'Perception', description: 'Noticing details and dangers', difficulty: 'easy' as SkillDifficulty, category: 'Mental', linkedAttributeName: 'Intelligence', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
          { name: 'Persuasion', description: 'Convincing others to agree', difficulty: 'medium' as SkillDifficulty, category: 'Social', linkedAttributeName: 'Charisma', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
          { name: 'Investigation', description: 'Finding clues and solving mysteries', difficulty: 'medium' as SkillDifficulty, category: 'Mental', linkedAttributeName: 'Intelligence', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
          { name: 'Athletics', description: 'Running, jumping, and climbing', difficulty: 'easy' as SkillDifficulty, category: 'Physical', linkedAttributeName: 'Strength', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
          { name: 'Medicine', description: 'Healing wounds and treating ailments', difficulty: 'hard' as SkillDifficulty, category: 'Mental', linkedAttributeName: 'Intelligence', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
          { name: 'Survival', description: 'Finding food and shelter in the wild', difficulty: 'medium' as SkillDifficulty, category: 'Physical', linkedAttributeName: 'Constitution', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
          { name: 'Arcana', description: 'Understanding magical theory and practice', difficulty: 'hard' as SkillDifficulty, category: 'Mental', linkedAttributeName: 'Intelligence', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
          { name: 'Deception', description: 'Lying and misleading others', difficulty: 'medium' as SkillDifficulty, category: 'Social', linkedAttributeName: 'Charisma', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
          { name: 'Intimidation', description: 'Frightening or coercing others', difficulty: 'medium' as SkillDifficulty, category: 'Social', linkedAttributeName: 'Strength', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
          { name: 'Performance', description: 'Entertainment and artistic expression', difficulty: 'easy' as SkillDifficulty, category: 'Social', linkedAttributeName: 'Charisma', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        ]
      }
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the skill review step where users can select and modify suggested skills'
      }
    }
  }
};

// Story showing the finalize step
export const FinalizeStep: Story = {
  args: {
    initialStep: 5,
    initialData: {
      worldData: {
        name: 'Fantasy Kingdom',
        theme: 'fantasy',
        description: 'A magical world filled with wizards and warriors',
        attributes: [
          { id: 'attr1', worldId: '', name: 'Strength', description: 'Physical power', baseValue: 5, minValue: 1, maxValue: 10 },
          { id: 'attr2', worldId: '', name: 'Intelligence', description: 'Mental acuity', baseValue: 5, minValue: 1, maxValue: 10 },
        ],
        skills: [
          { id: 'skill1', worldId: '', name: 'Combat', description: 'Fighting ability', difficulty: 'medium' as SkillDifficulty, baseValue: 5, minValue: 1, maxValue: 10 },
          { id: 'skill2', worldId: '', name: 'Magic', description: 'Spellcasting prowess', difficulty: 'hard' as SkillDifficulty, baseValue: 5, minValue: 1, maxValue: 10 },
        ],
        settings: {
          maxAttributes: 10,
          maxSkills: 10,
          attributePointPool: 20,
          skillPointPool: 20
        }
      }
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the final step where users review and confirm their world before creation'
      }
    }
  }
};


