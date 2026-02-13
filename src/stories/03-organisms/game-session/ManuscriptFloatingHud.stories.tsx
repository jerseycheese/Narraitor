import type { Meta, StoryObj } from '@storybook/react';
import { ManuscriptFloatingHud } from '@/components/GameSession/ManuscriptFloatingHud';
import { Button } from '@/components/ui/button';
import { Book, Package, ArrowLeft, RefreshCw } from 'lucide-react';
import React from 'react';

const meta: Meta<typeof ManuscriptFloatingHud> = {
  title: '03-Organisms/Game Session/ManuscriptFloatingHud',
  component: ManuscriptFloatingHud,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="manuscript-viewport-layer bg-zinc-100 p-4">
        <header className="manuscript-overlay-header">
          <Story />
        </header>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ManuscriptFloatingHud>;

export const Default: Story = {
  args: {
    onToggleCharacterSummary: () => {},
    isCharacterSummaryExpanded: false,
    leftContent: (
      <Button variant="outline" size="icon" className="rounded-full shadow-md bg-background/80 backdrop-blur-sm">
        <ArrowLeft className="h-5 w-5" />
      </Button>
    ),
    rightContent: (
      <div className="flex items-center gap-2">
        <div className="text-xs font-system text-muted-foreground mr-2">SAVED</div>
        <Button variant="outline" size="icon" className="rounded-full shadow-md bg-background/80 backdrop-blur-sm">
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>
    ),
    drawerTriggers: (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" title="Character Sheet" className="rounded-full shadow-md bg-background/80 backdrop-blur-sm">
          <Book className="h-5 w-5" />
        </Button>
        <Button variant="outline" size="icon" title="Inventory" className="rounded-full shadow-md bg-background/80 backdrop-blur-sm">
          <Package className="h-5 w-5" />
        </Button>
      </div>
    ),
  },
};

export const Expanded: Story = {
  args: {
    ...Default.args,
    isCharacterSummaryExpanded: true,
    characterSummaryPanel: (
      <div className="p-4 bg-background border rounded-lg shadow-xl">
        <h4 className="font-serif font-bold mb-2">The Archivist</h4>
        <div className="text-sm text-muted-foreground">Level 4 Scholar</div>
      </div>
    ),
  },
};
