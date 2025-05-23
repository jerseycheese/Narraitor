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
      { id: 'combat', name: 'Combat', value: 0, minValue: 0, maxValue: 5 },
      { id: 'stealth', name: 'Stealth', value: 0, minValue: 0, maxValue: 5 },
      { id: 'magic', name: 'Magic', value: 0, minValue: 0, maxValue: 5 },
      { id: 'social', name: 'Social', value: 0, minValue: 0, maxValue: 5 },
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

export const OverAllocated: Story = {
  render: () => {
    const initialAllocations: PointAllocation[] = [
      { id: 'health', name: 'Health', value: 30, minValue: 10, maxValue: 40 },
      { id: 'stamina', name: 'Stamina', value: 35, minValue: 10, maxValue: 40 },
      { id: 'mana', name: 'Mana', value: 40, minValue: 10, maxValue: 40 },
    ];

    const poolConfig: PointPoolConfig = {
      total: 100,
      label: 'Resource Points',
    };

    return <InteractivePointPoolManager 
      allocations={initialAllocations} 
      poolConfig={poolConfig}
      onChange={() => {}} 
    />;
  },
};

export const Disabled: Story = {
  render: () => {
    const initialAllocations: PointAllocation[] = [
      { id: 'str', name: 'Strength', value: 12, minValue: 8, maxValue: 18 },
      { id: 'int', name: 'Intelligence', value: 14, minValue: 8, maxValue: 18 },
      { id: 'dex', name: 'Dexterity', value: 10, minValue: 8, maxValue: 18 },
    ];

    const poolConfig: PointPoolConfig = {
      total: 40,
      label: 'Locked Points',
    };

    return (
      <InteractivePointPoolManager 
        allocations={initialAllocations} 
        poolConfig={poolConfig} 
        onChange={() => {}}
        disabled={true}
      />
    );
  },
};

export const WithoutLabels: Story = {
  render: () => {
    const initialAllocations: PointAllocation[] = [
      { id: 'a', name: 'Attribute A', value: 3, minValue: 1, maxValue: 10 },
      { id: 'b', name: 'Attribute B', value: 5, minValue: 1, maxValue: 10 },
      { id: 'c', name: 'Attribute C', value: 7, minValue: 1, maxValue: 10 },
    ];

    const poolConfig: PointPoolConfig = {
      total: 20,
    };

    return (
      <InteractivePointPoolManager 
        allocations={initialAllocations} 
        poolConfig={poolConfig}
        onChange={() => {}}
        showLabels={false}
      />
    );
  },
};