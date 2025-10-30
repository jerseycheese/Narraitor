/**
 * InventoryTable - Table view for character inventory
 * Displays inventory items with sorting, filtering, and actions
 */

import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { useInventoryStore } from '@/state/inventoryStore';
import { formatTableDate } from '@/lib/utils/table-utils';
import type { InventoryItem, StandardInventoryCategory } from '@/types/inventory.types';
import type { EntityID } from '@/types/common.types';

interface InventoryTableProps {
  characterId: EntityID;
  categoryFilter?: StandardInventoryCategory;
}

// Category display names
const CATEGORY_NAMES: Record<StandardInventoryCategory, string> = {
  equipment: 'Equipment',
  valuables: 'Valuables',
  consumables: 'Consumables',
  documents: 'Documents',
  personal: 'Personal',
  'quest-items': 'Quest Items',
  miscellaneous: 'Miscellaneous',
};

export function InventoryTable({
  characterId,
  categoryFilter,
}: InventoryTableProps) {
  const { items, removeItem } = useInventoryStore((state) => ({
    items: Object.values(state.items),
    removeItem: state.removeItem,
  }));

  // Filter items by character and optional category
  const filteredItems = React.useMemo(() => {
    let filtered = items;

    if (categoryFilter) {
      filtered = filtered.filter((item) => item.categoryId === categoryFilter);
    }

    return filtered;
  }, [items, categoryFilter]);

  // Define table columns
  const columns: ColumnDef<InventoryItem>[] = React.useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('name')}</div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => (
          <div className="text-center">{row.getValue('quantity')}</div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'categoryId',
        header: 'Category',
        cell: ({ row }) => {
          const categoryId = row.getValue('categoryId') as StandardInventoryCategory;
          return (
            <Badge variant="outline">
              {CATEGORY_NAMES[categoryId] || categoryId}
            </Badge>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: 'maxStack',
        header: 'Max Stack',
        cell: ({ row }) => {
          const maxStack = row.original.maxStack;
          return (
            <div className="text-center">
              {maxStack !== undefined ? maxStack : '—'}
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: 'acquired',
        header: 'Acquired',
        accessorFn: (row) => {
          const firstAcquisition = row.acquisitionHistory[0];
          return firstAcquisition?.acquiredAt || row.createdAt;
        },
        cell: ({ row }) => {
          const firstAcquisition = row.original.acquisitionHistory[0];
          const date = firstAcquisition?.acquiredAt || row.original.createdAt;
          const method = firstAcquisition?.method || 'unknown';
          return (
            <div className="text-sm">
              <div>{formatTableDate(date)}</div>
              <div className="text-muted-foreground capitalize">{method}</div>
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(characterId, row.original.id)}
              aria-label={`Delete ${row.original.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [characterId, removeItem]
  );

  // Handle empty state
  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No items in inventory.</p>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={filteredItems}
      pagination={{
        pageSize: 10,
        showPagination: true,
      }}
      searchable={{
        enabled: true,
        placeholder: 'Search items...',
      }}
      ariaLabel={`Inventory table for character ${characterId}`}
    />
  );
}
