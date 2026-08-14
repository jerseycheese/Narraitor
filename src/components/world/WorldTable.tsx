/**
 * WorldTable - Table view for world management
 * Displays worlds with sorting, filtering, and actions
 */

import * as React from 'react';
import Image from 'next/image';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Pencil, Trash2, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCharacterStore } from '@/state/characterStore';
import type { World } from '@/types/world.types';
import type { EntityID } from '@/types/common.types';
import { formatDate } from '@/lib/utils';
import { getGenreLabel } from '@/lib/constants/genres';

interface WorldTableProps {
  worlds: World[];
  onDeleteWorld: (worldId: EntityID, e: React.MouseEvent) => void;
}

// Row wrapper renders the world image as a thumbnail in the Name cell rather
// than as a full-row backdrop, and carries the table-row class for styling.
const WorldTableRow = React.memo(
  ({ cells }: { cells: React.ReactNode }) => (
    <tr className="component-world-table-row">{cells}</tr>
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
 * WorldTable - A data table component for managing multiple worlds
 *
 * Displays worlds in a row-based format with columns for key metrics like
 * attribute counts, skill counts, and character counts, plus action buttons
 * for CRUD operations.
 *
 * @param props - Component properties
 * @param props.worlds - Array of World objects to display in the table
 * @param props.onDeleteWorld - Callback for deleting a world from the list
 */
export function WorldTable({
  worlds,
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

  const columns: ColumnDef<World>[] = React.useMemo(
    () => [
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
    [onDeleteWorld, worldCharacterIds, handleViewWorld, handleEditWorld]
  );

  if (worlds.length === 0) {
    return (
      <div>
        <p>No worlds yet. Create one to get started.</p>
      </div>
    );
  }

  const customRowRenderer = (
    row: { original: World; id: string },
    cells: React.ReactNode
  ) => <WorldTableRow key={row.id} cells={cells} />;

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
      ariaLabel="Worlds table"
      customRowRenderer={customRowRenderer}
    />
  );
}
