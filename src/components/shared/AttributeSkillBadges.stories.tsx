// src/components/shared/AttributeSkillBadges.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { TopAttributesBadges, TopSkillsBadges } from './AttributeSkillBadges';

const meta: Meta<typeof TopAttributesBadges> = {
  title: 'Narraitor/Shared/AttributeSkillBadges',
  component: TopAttributesBadges,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleAttributes = [
  { id: 'str', name: 'Strength', value: 8 },
  { id: 'int', name: 'Intelligence', value: 6 },
  { id: 'dex', name: 'Dexterity', value: 7 },
];

const sampleSkills = [
  { id: 'combat', name: 'Combat', level: 9 },
  { id: 'magic', name: 'Magic', level: 7 },
  { id: 'stealth', name: 'Stealth', level: 6 },
];

export const Attributes: Story = {
  render: () => <TopAttributesBadges items={sampleAttributes} maxItems={3} />,
};

export const Skills: Story = {
  render: () => <TopSkillsBadges items={sampleSkills} maxItems={3} />,
};