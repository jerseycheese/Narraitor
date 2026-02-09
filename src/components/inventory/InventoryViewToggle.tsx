/**
 * InventoryViewToggle - Toggle between grid and table views
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Grid3x3, Table } from 'lucide-react';

export type InventoryViewMode = '' | '';

interface InventoryViewToggleProps {
  mode: InventoryViewMode;
  onModeChange: (mode: InventoryViewMode) => void;
}

export function InventoryViewToggle({
  mode,
  onModeChange,
}: InventoryViewToggleProps) {
  return (
    <div  role="group" aria-label="View mode toggle">
      <Button
        variant={mode === '' ? 'default' : ''}
        size="sm"
        onClick={() => onModeChange('')}
        aria-label="Grid view"
        aria-pressed={mode === ''}
      >
        <Grid3x3  />
      </Button>
      <Button
        variant={mode === '' ? 'default' : ''}
        size="sm"
        onClick={() => onModeChange('')}
        aria-label="Table view"
        aria-pressed={mode === ''}
      >
        <Table  />
      </Button>
    </div>
  );
}
