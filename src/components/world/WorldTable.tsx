/**
 * WorldTable - Table view for world management
 * Displays worlds with sorting, filtering, selection, and actions
 */

import * as React from 'react';
import { type ColumnDef, type RowSelectionState } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCharacterStore } from '@/state/characterStore';
import type { World } from '@/types/world.types';
import type { EntityID } from '@/types/common.types';
import { formatDate } from '@/lib/utils';
import { semanticColors } from '@/lib/design-tokens';

interface WorldTableProps {
  worlds: World[];
  selectedWorldIds: EntityID[];
  onToggleSelect: (worldId: EntityID) => void;
  onDeleteWorld: (worldId: EntityID, e: React.MouseEvent) => void;
}

/**
 * WorldTable - A data table component for comparing and managing multiple worlds
 * 
 * Displays worlds in a row-based format with columns for key metrics like
 * attribute counts, skill counts, and character counts. Includes selection
 * checkboxes for side-by-side comparison and action buttons for CRUD operations.
 * 
 * @param props - Component properties
 * @param props.worlds - Array of World objects to display in the table
 * @param props.selectedWorldIds - Array of IDs for currently selected worlds
 * @param props.onToggleSelect - Callback to toggle a world's selection for comparison
 * @param props.onDeleteWorld - Callback for deleting a world from the list
 */
export function WorldTable({
  worlds,
  selectedWorldIds,
  onToggleSelect,
  onDeleteWorld,
}: WorldTableProps) {
  const router = useRouter();
  const worldCharacterIds = useCharacterStore((state) => state.worldCharacterIds);

  const handleViewWorld = React.useCallback((worldId: EntityID) => {
    router.push(`/worlds/${worldId}`);
  }, [router]);

  const handleEditWorld = React.useCallback((worldId: EntityID, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/worlds/${worldId}/edit`);
  }, [router]);

  // Convert selectedWorldIds to TanStack RowSelectionState
  const rowSelection = React.useMemo(() => {
    const selection: RowSelectionState = {};
    selectedWorldIds.forEach((id) => {
      selection[id] = true;
    });
    return selection;
  }, [selectedWorldIds]);

  const columns: ColumnDef<World>[] = React.useMemo(
    () => [
      {
        id: 'select',
        header: () => {
          const allSelected = worlds.length > 0 && selectedWorldIds.length === Math.min(worlds.length, 5);

          return (
            <Checkbox
              checked={allSelected}
              onChange={() => {
                if (selectedWorldIds.length > 0) {
                  // Clear all selections
                  selectedWorldIds.forEach(id => onToggleSelect(id));
                } else {
                  // Select up to 5 worlds
                  worlds.slice(0, 5).forEach(w => {
                    if (!selectedWorldIds.includes(w.id)) {
                      onToggleSelect(w.id);
                    }
                  });
                }
              }}
              aria-label={`Select up to ${Math.min(worlds.length, 5)} worlds`}
            />
          );
        },
        cell: ({ row }) => (
          <Checkbox
            checked={selectedWorldIds.includes(row.original.id)}
            onChange={() => onToggleSelect(row.original.id)}
            aria-label={`Select ${row.original.name} for comparison`}
            disabled={!selectedWorldIds.includes(row.original.id) && selectedWorldIds.length >= 5}
          />
        ),
        enableSorting: false,
        size: 40,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="font-medium cursor-pointer hover:underline" onClick={() => handleViewWorld(row.original.id)}>
            {row.getValue('name')}
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'genre',
        header: 'Genre',
        cell: ({ row }) => {
          const genre = row.getValue('genre') as string;
          return (
            <Badge variant="secondary" className="capitalize">
              {genre.replace('_', ' ')}
            </Badge>
          );
        },
        enableSorting: true,
      },
      {
        id: 'attributes',
        header: 'Attributes',
        accessorFn: (row) => row.attributes?.length || 0,
        cell: ({ row }) => (
          <div className="text-center">{row.original.attributes?.length || 0}</div>
        ),
        enableSorting: true,
      },
      {
        id: 'skills',
        header: 'Skills',
        accessorFn: (row) => row.skills?.length || 0,
        cell: ({ row }) => (
          <div className="text-center">{row.original.skills?.length || 0}</div>
        ),
        enableSorting: true,
      },
      {
        id: 'characters',
        header: 'Characters',
        accessorFn: (row) => worldCharacterIds[row.id]?.length || 0,
        cell: ({ row }) => (
          <div className="text-center">
            {worldCharacterIds[row.original.id]?.length || 0}
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <div className="text-sm whitespace-nowrap">
            {formatDate(row.getValue('createdAt'))}
          </div>
        ),
        enableSorting: true,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewWorld(row.original.id)}
              aria-label={`View ${row.original.name}`}
              title="View world"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => handleEditWorld(row.original.id, e)}
              aria-label={`Edit ${row.original.name}`}
              title="Edit world"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => onDeleteWorld(row.original.id, e)}
              aria-label={`Delete ${row.original.name}`}
              title="Delete world"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [worlds, selectedWorldIds, onToggleSelect, onDeleteWorld, worldCharacterIds, handleViewWorld, handleEditWorld]
  );

  if (worlds.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No worlds found. Create your first world to get started!</p>
      </div>
    );
  }

  // Custom row renderer with background images
  const customRowRenderer = (row: { original: World; id: string }, cells: React.ReactNode) => {
    const world = row.original;
    const isSelected = selectedWorldIds.includes(world.id);

    const rowStyle: React.CSSProperties = world.image?.url
      ? {
          backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.70), rgba(0, 0, 0, 0.65)), url(${world.image.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          color: semanticColors.text.inverse,
        }
      : {};

    return (
      <tr
        key={row.id}
        data-state={isSelected ? 'selected' : undefined}
        className="border-b transition-colors hover:bg-black/10 data-[state=selected]:bg-primary/20 data-[state=selected]:border-primary data-[state=selected]:hover:bg-primary/25"
        style={rowStyle}
      >
        {cells}
      </tr>
    );
  };

  return (
    <DataTable
      columns={columns}
      data={worlds}
      pagination={{
        pageSize: 10,
        showPagination: true,
      }}
      searchable={{
        enabled: true,
        placeholder: 'Search worlds...',
      }}
      rowSelection={rowSelection}
      ariaLabel="Worlds table"
      customRowRenderer={customRowRenderer}
    />
  );
}
