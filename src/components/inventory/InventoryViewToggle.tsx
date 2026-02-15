/**
 * InventoryViewToggle - Toggle between grid and table views
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';

export type InventoryViewMode = 'grid' | 'table';

interface InventoryViewToggleProps {
  mode: InventoryViewMode;
  onModeChange: (mode: InventoryViewMode) => void;
}

export function InventoryViewToggle({
  mode,
  onModeChange,
}: InventoryViewToggleProps) {
  return (
    <div role="group" aria-label="View mode toggle" className="flex items-center gap-2 mb-4">
      <Button
        variant={mode === 'grid' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onModeChange('grid')}
        aria-label="Grid view"
        aria-pressed={mode === 'grid'}
      >
        Grid
      </Button>
      <Button
        variant={mode === 'table' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onModeChange('table')}
        aria-label="Table view"
        aria-pressed={mode === 'table'}
      >
        Table
      </Button>
    </div>
  );
}
