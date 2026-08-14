/**
 * CharacterTable - Table view for character management
 * Displays characters with sorting, filtering, and actions
 */

import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  Play,
  Star,
  Plus,
} from 'lucide-react';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import type { Character } from '@/state/characterStore';
import type { EntityID } from '@/types/common.types';
import { formatDate } from '@/lib/utils';

interface CharacterTableProps {
  characters: Character[];
  currentCharacterId: EntityID | null;
  onMakeActive: (characterId: EntityID) => void;
  onView: (characterId: EntityID) => void;
  onPlay: (characterId: EntityID) => void;
  onEdit: (characterId: EntityID) => void;
  onDelete: (characterId: EntityID) => void;
}

/**
 * CharacterTable - A data table component for comparing and managing multiple characters
 *
 * Displays characters in a row-based format with columns for key metrics like
 * level, health, and type. Includes action buttons for gameplay and CRUD operations.
 *
 * @param props - Component properties
 * @param props.characters - Array of Character objects to display in the table
 * @param props.currentCharacterId - ID of the currently active character
 * @param props.onMakeActive - Callback to make a character active
 * @param props.onView - Callback to view character details
 * @param props.onPlay - Callback to start playing as character
 * @param props.onEdit - Callback to edit character
 * @param props.onDelete - Callback for deleting a character from the list
 */
export function CharacterTable({
  characters,
  currentCharacterId,
  onMakeActive,
  onView,
  onPlay,
  onEdit,
  onDelete,
}: CharacterTableProps) {
  const handleViewCharacter = React.useCallback(
    (characterId: EntityID) => {
      onView(characterId);
    },
    [onView]
  );

  const handlePlayCharacter = React.useCallback(
    (characterId: EntityID, e: React.MouseEvent) => {
      e.stopPropagation();
      onPlay(characterId);
    },
    [onPlay]
  );

  const handleEditCharacter = React.useCallback(
    (characterId: EntityID, e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(characterId);
    },
    [onEdit]
  );

  const handleDeleteCharacter = React.useCallback(
    (characterId: EntityID, e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(characterId);
    },
    [onDelete]
  );

  const handleMakeActive = React.useCallback(
    (characterId: EntityID, e: React.MouseEvent) => {
      e.stopPropagation();
      onMakeActive(characterId);
    },
    [onMakeActive]
  );

  const columns: ColumnDef<Character>[] = React.useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div
            className="component-character-table-name"
            onClick={() => handleViewCharacter(row.original.id)}
          >
            <span className="component-character-table-thumb" aria-hidden="true">
              <CharacterPortrait
                portrait={
                  row.original.portrait || { type: 'placeholder', url: null }
                }
                characterName={row.original.name}
                size="large"
              />
            </span>
            <span>{row.getValue('name') as string}</span>
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'level',
        header: 'Level',
        cell: ({ row }) => <div>Level {row.getValue('level')}</div>,
        enableSorting: true,
      },
      {
        id: 'type',
        header: 'Type',
        accessorFn: (row) =>
          row.background?.isKnownFigure ? 'known' : 'original',
        cell: ({ row }) => {
          const isKnownFigure = row.original.background?.isKnownFigure;
          return (
            <Badge
              icon={
                isKnownFigure ? (
                  <Star aria-hidden="true" />
                ) : (
                  <Plus aria-hidden="true" />
                )
              }
              variant={isKnownFigure ? 'warning-static' : 'default-static'}
            >
              {isKnownFigure ? 'Known Figure' : 'Original'}
            </Badge>
          );
        },
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
        cell: ({ row }) => {
          const isActive = currentCharacterId === row.original.id;

          return (
            <div>
              {!isActive && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleMakeActive(row.original.id, e)}
                  aria-label={`Make ${row.original.name} active`}
                  title="Make active"
                >
                  <CheckCircle />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handlePlayCharacter(row.original.id, e)}
                aria-label={`Play as ${row.original.name}`}
                title="Play"
              >
                <Play />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleViewCharacter(row.original.id)}
                aria-label={`View ${row.original.name}`}
                title="View"
              >
                <Eye />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleEditCharacter(row.original.id, e)}
                aria-label={`Edit ${row.original.name}`}
                title="Edit"
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDeleteCharacter(row.original.id, e)}
                aria-label={`Delete ${row.original.name}`}
                title="Delete"
              >
                <Trash2 />
              </Button>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [
      currentCharacterId,
      handleViewCharacter,
      handlePlayCharacter,
      handleEditCharacter,
      handleDeleteCharacter,
      handleMakeActive,
    ]
  );

  if (characters.length === 0) {
    return (
      <div>
        <p>No characters yet. Create one to get started.</p>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={characters}
      pagination={{
        pageSize: 10,
        showPagination: true,
      }}
      searchable={{
        enabled: true,
        placeholder: 'Search characters...',
      }}
      ariaLabel="Characters table"
    />
  );
}
