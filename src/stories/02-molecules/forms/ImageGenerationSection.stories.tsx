import { Meta, StoryObj } from '@storybook/react';
import { ImageGenerationSection } from '@/components/shared/ImageGenerationSection';

const placeholder = (
  <div
    className="story-image-placeholder"
    style={{
      width: '160px',
      height: '160px',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md, 0.5rem)',
    }}
  />
);

const meta: Meta<typeof ImageGenerationSection> = {
  title: '02-Molecules/forms/ImageGenerationSection',
  component: ImageGenerationSection,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    title: 'Portrait',
    description: 'Generate a portrait for your character.',
    isGenerating: false,
    onGenerate: () => {},
    onRemove: () => {},
    imageComponent: placeholder,
  },
};

export default meta;
type Story = StoryObj<typeof ImageGenerationSection>;

export const Idle: Story = {};
export const Generating: Story = { args: { isGenerating: true } };
export const WithError: Story = {
  args: { error: 'Generation failed. Check your provider key and try again.' },
};
