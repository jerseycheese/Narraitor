import { Meta, StoryObj } from '@storybook/react';
import {
  AlignmentBadge,
  SkillRequirementBadges,
} from '@/components/shared/ChoiceSelector/RequirementBadges';

const meta: Meta = {
  title: '02-Molecules/narrative/RequirementBadges',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Alignments: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
      <AlignmentBadge alignment="lawful" />
      <AlignmentBadge alignment="chaotic" />
    </div>
  ),
};

export const SkillRequirements: Story = {
  render: () => (
    <SkillRequirementBadges
      optionId="opt-1"
      requirements={[
        { skillName: 'Persuasion', met: true, dc: 12 },
        { skillName: 'Stealth', met: false, dc: 16 },
      ]}
    />
  ),
};
