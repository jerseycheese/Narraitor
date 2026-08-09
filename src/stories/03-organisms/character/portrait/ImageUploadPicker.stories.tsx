import { Meta, StoryObj } from '@storybook/react';
import { ImageUploadPicker } from '@/components/CharacterPortrait/ImageUploadPicker';

const meta: Meta<typeof ImageUploadPicker> = {
  title: '03-Organisms/character/portrait/ImageUploadPicker',
  component: ImageUploadPicker,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    onPreview: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ImageUploadPicker>;

export const Default: Story = {};
