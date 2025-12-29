/**
 * InventoryTable - Table view for character inventory
 * Displays inventory items with sorting, filtering, and actions
 */

import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, PackageMinus } from 'lucide-react';
import { useInventoryStore } from '@/state/inventoryStore';
import { useSessionStore } from '@/state/sessionStore';
import { processItemUsage } from '@/lib/inventory/itemUsageService';
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
  // Select items and character inventory to re-render on changes
  const items = useInventoryStore((state) => state.items);
  const characterInventories = useInventoryStore((state) => state.characterInventories);
  const removeItem = useInventoryStore((state) => state.removeItem);
  const sessionId = useSessionStore((state) => state.id);
  const [usingItemId, setUsingItemId] = React.useState<EntityID | null>(null);

  // Derive character items from selected state
  const characterItems = React.useMemo(() => {
    const itemIds = characterInventories[characterId] || [];
    return itemIds
      .map((id) => items[id])
      .filter((item): item is InventoryItem => Boolean(item));
  }, [items, characterInventories, characterId]);

  // Filter by category if specified
  const filteredItems = React.useMemo(() => {
    if (categoryFilter) {
      return characterItems.filter((item) => item.categoryId === categoryFilter);
    }
    return characterItems;
  }, [characterItems, categoryFilter]);

  // Handle item usage
  const handleUseItem = async (itemId: EntityID) => {
    setUsingItemId(itemId);
    try {
      await processItemUsage(characterId, itemId, sessionId || undefined);
    } catch (error) {
      console.error('Failed to use item:', error);
    } finally {
      setUsingItemId(null);
    }
  };

  // Define table columns
  const columns: ColumnDef<InventoryItem>[] = React.useMemo(
    () => [
      {
        id: 'image',
        header: '',
        cell: ({ row }) => {
          const image = row.original.image;
          if (!image?.url) return null;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              alt={row.original.name}
              className="w-24 h-24 object-contain rounded-md item-image"
              loading="lazy"
            />
          );
        },
        enableSorting: false,
        size: 48,
      },
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
        sortingFn: 'basic',
      },
      {
        accessorKey: 'categoryId',
        header: 'Category',
        cell: ({ row }) => {
          const categoryId = row.getValue('categoryId') as StandardInventoryCategory;
          return (
            <Badge variant="outline-static">
              {CATEGORY_NAMES[categoryId] || categoryId}
            </Badge>
          );
        },
        enableSorting: true,
      },
      {
        id: 'acquisitionMethod',
        header: 'Source',
        accessorFn: (row) => {
          const firstAcquisition = row.acquisitionHistory[0];
          return firstAcquisition?.method || 'unknown';
        },
        cell: ({ row }) => {
          const firstAcquisition = row.original.acquisitionHistory[0];
          const method = firstAcquisition?.method || 'unknown';
          return (
            <div className="text-sm capitalize">{method}</div>
          );
        },
        enableSorting: true,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const isUsing = usingItemId === row.original.id;
          return (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUseItem(row.original.id)}
                disabled={isUsing}
                aria-label={`Use ${row.original.name}`}
                title="Use item"
              >
                <PackageMinus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(characterId, row.original.id)}
                aria-label={`Drop ${row.original.name}`}
                title="Drop item"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [characterId, removeItem, handleUseItem, usingItemId]
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
