import { Meta, StoryObj } from '@storybook/react';
import { SectionWrapper } from '@/components/shared/SectionWrapper';

const meta: Meta<typeof SectionWrapper> = {
  title: '02-Molecules/layout/SectionWrapper',
  component: SectionWrapper,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SectionWrapper>;

export const Default: Story = {
  args: {
    title: 'Attributes',
    children: <p>Strength, Intelligence, Charisma…</p>,
  },
};
