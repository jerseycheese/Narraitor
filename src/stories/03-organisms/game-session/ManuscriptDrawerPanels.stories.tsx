import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ToolsMenuPanelContent } from '@/components/GameSession/ManuscriptDrawerPanels';

const meta = {
  title: '03-Organisms/Game Session/ToolsMenuPanelContent',
  component: ToolsMenuPanelContent,
  parameters: {
    layout: 'padded',
  },
  args: {
    activeDrawer: null,
    onOpenDrawer: fn(),
    onClosePanel: fn(),
    onOpenJournalRoute: fn(),
  },
} satisfies Meta<typeof ToolsMenuPanelContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActiveDrawer: Story = {
  args: {
    activeDrawer: 'character',
  },
};

export const WithDevActions: Story = {
  args: {
    onSimulateTurn: fn(),
    onToggleStreamingPreview: fn(),
    onToggleEndingSuggestionPreview: fn(),
  },
};
