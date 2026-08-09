import { Meta, StoryObj } from '@storybook/react';
import { WorldFormFields } from '@/components/shared/WorldFormFields/WorldFormFields';

const meta: Meta = {
  title: '02-Molecules/world-forms/WorldFormFields',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Fields: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: '480px' }}>
      <WorldFormFields.NameInput value="The Shattered Isles" onChange={() => {}} />
      <WorldFormFields.GenreSelect value="fantasy" onChange={() => {}} />
      <WorldFormFields.DescriptionTextArea
        value="A storm-ravaged archipelago where ancient magic stirs beneath volcanic rock."
        onChange={() => {}}
      />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div style={{ maxWidth: '480px' }}>
      <WorldFormFields.NameInput value="" onChange={() => {}} error="A name is required." />
    </div>
  ),
};
