/**
 * JournalTable - Table view for journal entries
 * Displays entries with sorting, entry-type filtering, and a view action
 */

import * as React from 'react';
import { clsx } from 'clsx';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Eye } from 'lucide-react';
import { JournalEntry, JournalEntryType } from '@/types/journal.types';
import { EntityID } from '@/types/common.types';
import { capitalize, formatDate, titleCase, truncate } from '@/lib/utils';
import { getSignificanceBadgeVariant } from './journalUtils';

interface JournalTableProps {
  entries: JournalEntry[];
  selectedEntryId: EntityID | null;
  onEntrySelect: (entry: JournalEntry) => void;
}

const entryTypeLabel = (type: JournalEntryType) => titleCase(type.replace('_', ' '));

// Row wrapper carries the table-row class for styling and highlights the
// entry that's currently open in the detail pane.
const JournalTableRow = React.memo(
  ({ cells, isSelected }: { cells: React.ReactNode; isSelected: boolean }) => (
    <tr
      className={clsx(
        'component-journal-table-row',
        isSelected && 'component-journal-table-row-selected'
      )}
    >
      {cells}
    </tr>
  )
);
JournalTableRow.displayName = 'JournalTableRow';

/**
 * JournalTable - A data table component for browsing journal entries
 *
 * Displays entries in a row-based format with sortable date, title, entry
 * type, and significance columns, plus a filter for narrowing to one entry
 * type. Selecting a row opens that entry in the detail pane.
 *
 * @param props - Component properties
 * @param props.entries - Array of JournalEntry objects to display in the table
 * @param props.selectedEntryId - ID of the entry currently shown in the detail pane
 * @param props.onEntrySelect - Callback fired when a row (or its view action) is chosen
 */
export function JournalTable({
  entries,
  selectedEntryId,
  onEntrySelect,
}: JournalTableProps) {
  const [typeFilter, setTypeFilter] = React.useState<JournalEntryType | 'all'>(
    'all'
  );

  const availableTypes = React.useMemo(
    () =>
      Array.from(new Set(entries.map((entry) => entry.type))).sort((a, b) =>
        entryTypeLabel(a).localeCompare(entryTypeLabel(b))
      ),
    [entries]
  );

  const filteredEntries = React.useMemo(
    () =>
      typeFilter === 'all'
        ? entries
        : entries.filter((entry) => entry.type === typeFilter),
    [entries, typeFilter]
  );

  const handleSelect = React.useCallback(
    (entry: JournalEntry) => onEntrySelect(entry),
    [onEntrySelect]
  );

  const columns: ColumnDef<JournalEntry>[] = React.useMemo(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => <div>{formatDate(row.getValue('createdAt'))}</div>,
        enableSorting: true,
      },
      {
        accessorFn: (row) => row.title || entryTypeLabel(row.type),
        id: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <div
            className="component-journal-table-title"
            onClick={() => handleSelect(row.original)}
          >
            {row.getValue('title') as string}
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorFn: (row) => entryTypeLabel(row.type),
        id: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <Badge variant="default-static">{row.getValue('type') as string}</Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'significance',
        header: 'Significance',
        cell: ({ row }) => (
          <Badge
            variant={getSignificanceBadgeVariant(row.original.significance)}
            size="sm"
          >
            {capitalize(row.original.significance)}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'content',
        header: 'Summary',
        cell: ({ row }) => <div>{truncate(row.original.content, 80)}</div>,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(row.original);
            }}
            aria-label={`View ${row.original.title || entryTypeLabel(row.original.type)}`}
            title="View entry"
          >
            <Eye />
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [handleSelect]
  );

  const customRowRenderer = (
    row: { original: JournalEntry; id: string },
    cells: React.ReactNode
  ) => (
    <JournalTableRow
      key={row.id}
      cells={cells}
      isSelected={row.original.id === selectedEntryId}
    />
  );

  return (
    <div className="component-journal-table">
      <div className="component-journal-table-toolbar">
        <label htmlFor="journal-table-type-filter">Entry type</label>
        <Select
          id="journal-table-type-filter"
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value as JournalEntryType | 'all')
          }
          aria-label="Filter by entry type"
        >
          <option value="all">All types</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {entryTypeLabel(type)}
            </option>
          ))}
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={filteredEntries}
        pagination={{
          pageSize: 10,
          showPagination: true,
        }}
        searchable={{
          enabled: true,
          placeholder: 'Search entries...',
        }}
        ariaLabel="Journal entries table"
        customRowRenderer={customRowRenderer}
      />
    </div>
  );
}
