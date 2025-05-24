import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PointPoolManager, PointAllocation, PointPoolConfig, PointPoolManagerProps } from './PointPoolManager';

const meta: Meta<typeof PointPoolManager> = {
  title: 'Shared/PointPoolManager',
  component: PointPoolManager,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper component
const InteractivePointPoolManager = (props: PointPoolManagerProps) => {
  const [allocations, setAllocations] = useState<PointAllocation[]>(props.allocations);

  const handleChange = (id: string, newValue: number) => {
    setAllocations(prev => 
      prev.map(allocation => 
        allocation.id === id 
          ? { ...allocation, value: newValue }
          : allocation
      )
    );
  };

  return (
    <PointPoolManager
      {...props}
      allocations={allocations}
      onChange={handleChange}
    />
  );
};

export const AttributePoints: Story = {
  render: () => {
    const initialAllocations: PointAllocation[] = [
      { 
        id: 'str', 
        name: 'Strength', 
        value: 10, 
        minValue: 8, 
        maxValue: 18,
        description: 'Physical power and endurance. Affects melee damage and carrying capacity.'
      },
      { 
        id: 'int', 
        name: 'Intelligence', 
        value: 12, 
        minValue: 8, 
        maxValue: 18,
        description: 'Mental acuity and reasoning. Affects spell power and skill points.'
      },
      { 
        id: 'dex', 
        name: 'Dexterity', 
        value: 10, 
        minValue: 8, 
        maxValue: 18,
        description: 'Agility and reflexes. Affects accuracy, dodge chance, and initiative.'
      },
      { 
        id: 'con', 
        name: 'Constitution', 
        value: 10, 
        minValue: 8, 
        maxValue: 18,
        description: 'Health and resilience. Affects hit points and resistance to effects.'
      },
      { 
        id: 'wis', 
        name: 'Wisdom', 
        value: 10, 
        minValue: 8, 
        maxValue: 18,
        description: 'Intuition and awareness. Affects perception and divine magic.'
      },
      { 
        id: 'cha', 
        name: 'Charisma', 
        value: 10, 
        minValue: 8, 
        maxValue: 18,
        description: 'Force of personality. Affects social interactions and leadership.'
      },
    ];

    const poolConfig: PointPoolConfig = {
      total: 75,
      label: 'Attribute Points',
    };

    return <InteractivePointPoolManager 
      allocations={initialAllocations} 
      poolConfig={poolConfig}
      onChange={() => {}} 
    />;
  },
};

export const SkillPoints: Story = {
  render: () => {
    const initialAllocations: PointAllocation[] = [
      { 
        id: 'combat', 
        name: 'Combat', 
        value: 0, 
        minValue: 0, 
        maxValue: 5,
        description: 'Proficiency with weapons and fighting techniques. Affects damage and accuracy in battle.'
      },
      { 
        id: 'stealth', 
        name: 'Stealth', 
        value: 0, 
        minValue: 0, 
        maxValue: 5,
        description: 'Ability to move unseen and avoid detection. Useful for infiltration and surprise attacks.'
      },
      { 
        id: 'magic', 
        name: 'Magic', 
        value: 0, 
        minValue: 0, 
        maxValue: 5,
        description: 'Knowledge of arcane arts and spellcasting. Determines available spells and magical power.'
      },
      { 
        id: 'social', 
        name: 'Social', 
        value: 0, 
        minValue: 0, 
        maxValue: 5,
        description: 'Charisma and interpersonal skills. Affects persuasion, negotiation, and leadership abilities.'
      },
    ];

    const poolConfig: PointPoolConfig = {
      total: 10,
      label: 'Skill Points',
    };

    return <InteractivePointPoolManager 
      allocations={initialAllocations} 
      poolConfig={poolConfig}
      onChange={() => {}} 
    />;
  },
};

