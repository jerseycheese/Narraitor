/**
 * WorldTable - Table view for world management
 * Displays worlds with sorting, filtering, selection, and actions
 */

import * as React from 'react';
import Image from 'next/image';
import { type ColumnDef, type RowSelectionState } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Pencil, Trash2, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCharacterStore } from '@/state/characterStore';
import type { World } from '@/types/world.types';
import type { EntityID } from '@/types/common.types';
import { formatDate } from '@/lib/utils';
import { getGenreLabel } from '@/lib/constants/genres';

interface WorldTableProps {
  worlds: World[];
  selectedWorldIds: EntityID[];
  onToggleSelect: (worldId: EntityID) => void;
  onDeleteWorld: (worldId: EntityID, e: React.MouseEvent) => void;
}

interface WorldTableRowProps {
  isSelected: boolean;
  cells: React.ReactNode;
}

// Row wrapper keeps the selection state hook in one place; the world image
// now renders as a thumbnail in the Name cell rather than as a full-row
// backdrop (the old gradient overlay drowned the image and gave selected
// rows inverse-color text inconsistent with the rest of the table).
const WorldTableRow = React.memo(
  ({ isSelected, cells }: WorldTableRowProps) => (
    <tr
      data-state={isSelected ? 'selected' : undefined}
      className="component-world-table-row"
    >
      {cells}
    </tr>
  )
);

WorldTableRow.displayName = 'WorldTableRow';

interface WorldThumbnailProps {
  url?: string | null;
}

const WorldThumbnail: React.FC<WorldThumbnailProps> = ({ url }) => (
  <span className="component-world-table-thumb" aria-hidden="true">
    {url ? (
      <Image src={url} alt="" width={32} height={32} unoptimized />
    ) : (
      <Globe />
    )}
  </span>
);

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
  const worldCharacterIds = useCharacterStore(
    (state) => state.worldCharacterIds
  );

  const handleViewWorld = React.useCallback(
    (worldId: EntityID) => {
      router.push(`/worlds/${worldId}`);
    },
    [router]
  );

  const handleEditWorld = React.useCallback(
    (worldId: EntityID, e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/worlds/${worldId}/edit`);
    },
    [router]
  );

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
          const allSelected =
            worlds.length > 0 &&
            selectedWorldIds.length === Math.min(worlds.length, 5);

          return (
            <Checkbox
              checked={allSelected}
              onChange={() => {
                if (selectedWorldIds.length > 0) {
                  // Clear all selections
                  selectedWorldIds.forEach((id) => onToggleSelect(id));
                } else {
                  // Select up to 5 worlds
                  worlds.slice(0, 5).forEach((w) => {
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
            disabled={
              !selectedWorldIds.includes(row.original.id) &&
              selectedWorldIds.length >= 5
            }
          />
        ),
        enableSorting: false,
        size: 40,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div
            className="component-world-table-name"
            onClick={() => handleViewWorld(row.original.id)}
          >
            <WorldThumbnail url={row.original.image?.url} />
            <span>{row.getValue('name') as string}</span>
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'genre',
        header: 'Genre',
        cell: ({ row }) => {
          const genre = row.getValue('genre') as string;
          return <Badge variant="secondary">{getGenreLabel(genre)}</Badge>;
        },
        enableSorting: true,
      },
      {
        id: 'attributes',
        header: 'Attributes',
        accessorFn: (row) => row.attributes?.length || 0,
        cell: ({ row }) => <div>{row.original.attributes?.length || 0}</div>,
        enableSorting: true,
      },
      {
        id: 'skills',
        header: 'Skills',
        accessorFn: (row) => row.skills?.length || 0,
        cell: ({ row }) => <div>{row.original.skills?.length || 0}</div>,
        enableSorting: true,
      },
      {
        id: 'characters',
        header: 'Characters',
        accessorFn: (row) => worldCharacterIds[row.id]?.length || 0,
        cell: ({ row }) => (
          <div>{worldCharacterIds[row.original.id]?.length || 0}</div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => <div>{formatDate(row.getValue('createdAt'))}</div>,
        enableSorting: true,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewWorld(row.original.id)}
              aria-label={`View ${row.original.name}`}
              title="View world"
            >
              <Eye />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => handleEditWorld(row.original.id, e)}
              aria-label={`Edit ${row.original.name}`}
              title="Edit world"
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => onDeleteWorld(row.original.id, e)}
              aria-label={`Delete ${row.original.name}`}
              title="Delete world"
            >
              <Trash2 />
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [
      worlds,
      selectedWorldIds,
      onToggleSelect,
      onDeleteWorld,
      worldCharacterIds,
      handleViewWorld,
      handleEditWorld,
    ]
  );

  if (worlds.length === 0) {
    return (
      <div>
        <p>No worlds found. Create your first world to get started!</p>
      </div>
    );
  }

  const customRowRenderer = (
    row: { original: World; id: string },
    cells: React.ReactNode
  ) => {
    const isSelected = selectedWorldIds.includes(row.original.id);

    return (
      <WorldTableRow
        key={row.id}
        isSelected={isSelected}
        cells={cells}
      />
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
