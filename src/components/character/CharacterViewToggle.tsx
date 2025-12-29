/**
 * CharacterViewToggle - Toggle between grid and table views
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Grid3x3, Table } from 'lucide-react';

export type CharacterViewMode = 'grid' | 'table';

interface CharacterViewToggleProps {
  mode: CharacterViewMode;
  onModeChange: (mode: CharacterViewMode) => void;
}

/**
 * CharacterViewToggle - Toggle between grid and table views for character management
 *
 * Provides two buttons to switch the display mode of characters between
 * a grid of cards and a searchable, sortable table.
 *
 * @param props - Component properties
 * @param props.mode - The current active view mode ('grid' or 'table')
 * @param props.onModeChange - Callback function triggered when a new mode is selected
 */
export function CharacterViewToggle({
  mode,
  onModeChange,
}: CharacterViewToggleProps) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label="View mode toggle">
      <Button
        variant={mode === 'grid' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onModeChange('grid')}
        aria-label="Grid view"
        aria-pressed={mode === 'grid'}
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>
      <Button
        variant={mode === 'table' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onModeChange('table')}
        aria-label="Table view"
        aria-pressed={mode === 'table'}
      >
        <Table className="h-4 w-4" />
      </Button>
    </div>
  );
}
