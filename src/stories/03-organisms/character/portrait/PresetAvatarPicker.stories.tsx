import { Meta, StoryObj } from '@storybook/react';
import { PresetAvatarPicker } from '@/components/CharacterPortrait/PresetAvatarPicker';
import { PRESET_AVATARS } from '@/lib/portraits/presetAvatars';

const meta: Meta<typeof PresetAvatarPicker> = {
  title: '03-Organisms/character/portrait/PresetAvatarPicker',
  component: PresetAvatarPicker,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    onPreview: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof PresetAvatarPicker>;

export const Default: Story = {};

export const WithSelection: Story = {
  args: {
    selectedUrl: PRESET_AVATARS[0].url,
  },
};
