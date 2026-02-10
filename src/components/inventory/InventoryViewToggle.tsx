/**
 * InventoryViewToggle - Toggle between grid and table views
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Grid3x3, Table } from 'lucide-react';

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
    <div role="group" aria-label="View mode toggle">
      <Button
        variant={mode === 'grid' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onModeChange('grid')}
        aria-label="Grid view"
        aria-pressed={mode === 'grid'}
      >
        <Grid3x3 />
      </Button>
      <Button
        variant={mode === 'table' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onModeChange('table')}
        aria-label="Table view"
        aria-pressed={mode === 'table'}
      >
        <Table />
      </Button>
    </div>
  );
}
