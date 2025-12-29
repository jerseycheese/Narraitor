/**
 * CharacterTable - Table view for character management
 * Displays characters with sorting, filtering, and actions
 */

import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Pencil, Trash2, CheckCircle, Play, Star, Plus } from 'lucide-react';
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
  const handleViewCharacter = React.useCallback((characterId: EntityID) => {
    onView(characterId);
  }, [onView]);

  const handlePlayCharacter = React.useCallback((characterId: EntityID, e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay(characterId);
  }, [onPlay]);

  const handleEditCharacter = React.useCallback((characterId: EntityID, e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(characterId);
  }, [onEdit]);

  const handleDeleteCharacter = React.useCallback((characterId: EntityID, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(characterId);
  }, [onDelete]);

  const handleMakeActive = React.useCallback((characterId: EntityID, e: React.MouseEvent) => {
    e.stopPropagation();
    onMakeActive(characterId);
  }, [onMakeActive]);

  const columns: ColumnDef<Character>[] = React.useMemo(
    () => [
      {
        id: 'portrait',
        header: '',
        cell: ({ row }) => (
          <div
            className="cursor-pointer"
            onClick={() => handleViewCharacter(row.original.id)}
          >
            <CharacterPortrait
              portrait={row.original.portrait || { type: 'placeholder', url: null }}
              characterName={row.original.name}
              size="small"
            />
          </div>
        ),
        enableSorting: false,
        size: 64,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div
            className="font-medium cursor-pointer hover:underline"
            onClick={() => handleViewCharacter(row.original.id)}
          >
            {row.getValue('name')}
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'level',
        header: 'Level',
        cell: ({ row }) => (
          <div className="text-center">Level {row.getValue('level')}</div>
        ),
        enableSorting: true,
      },
      {
        id: 'type',
        header: 'Type',
        accessorFn: (row) => row.background?.isKnownFigure ? 'known' : 'original',
        cell: ({ row }) => {
          const isKnownFigure = row.original.background?.isKnownFigure;
          return (
            <Badge
              icon={
                isKnownFigure ? (
                  <Star className="w-3 h-3 text-white" aria-hidden="true" />
                ) : (
                  <Plus className="w-3 h-3 text-white" aria-hidden="true" />
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
        cell: ({ row }) => {
          const isActive = currentCharacterId === row.original.id;

          return (
            <div className="flex items-center space-x-2">
              {!isActive && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleMakeActive(row.original.id, e)}
                  aria-label={`Make ${row.original.name} active`}
                  title="Make active"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handlePlayCharacter(row.original.id, e)}
                aria-label={`Play as ${row.original.name}`}
                title="Play"
              >
                <Play className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleViewCharacter(row.original.id)}
                aria-label={`View ${row.original.name}`}
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleEditCharacter(row.original.id, e)}
                aria-label={`Edit ${row.original.name}`}
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDeleteCharacter(row.original.id, e)}
                aria-label={`Delete ${row.original.name}`}
                title="Delete"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
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
      <div className="text-center py-12 text-muted-foreground">
        <p>No characters found. Create your first character to get started!</p>
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
