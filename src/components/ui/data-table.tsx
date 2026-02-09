/**
 * DataTable - Reusable sortable, filterable, paginated table component
 * Built on TanStack Table and shadcn/ui table primitives
 */

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Button } from './button';
import { Input } from './input';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination?: {
    pageSize?: number;
    showPagination?: boolean;
  };
  searchable?: {
    enabled?: boolean;
    placeholder?: string;
    column?: string;
  };
  rowSelection?: RowSelectionState;
  ariaLabel?: string;
  customRowRenderer?: (row: { original: TData; id: string }, cells: React.ReactNode) => React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination = { pageSize: 10, showPagination: false },
  searchable = { enabled: false },
  rowSelection,
  ariaLabel = 'Data',
  customRowRenderer,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: pagination.showPagination
      ? getPaginationRowModel()
      : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getRowId: (row) => (row as { id?: string; _id?: string }).id || (row as { id?: string; _id?: string })._id || '',
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection: rowSelection || {},
    },
    initialState: {
      pagination: {
        pageSize: pagination.pageSize || 10,
      },
    },
  });

  return (
    <div className="data-table">
      {/* Search Filter */}
      {searchable.enabled && (
        <div >
          <Input
            placeholder={searchable.placeholder || 'Search...'}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            
            aria-label={searchable.placeholder || 'Search'}
          />
        </div>
      )}

      {/* Table */}
      <div >
        <Table aria-label={ariaLabel}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();

                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            canSort
                              ? ''
                              : ''
                          }
                          onClick={
                            canSort
                              ? header.column.getToggleSortingHandler()
                              : undefined
                          }
                          onKeyDown={(e) => {
                            if (canSort && (e.key === 'Enter' || e.key === '')) {
                              e.preventDefault();
                              header.column.getToggleSortingHandler()?.(e);
                            }
                          }}
                          role={canSort ? 'button' : undefined}
                          tabIndex={canSort ? 0 : undefined}
                          aria-sort={
                            isSorted === 'asc'
                              ? 'ascending'
                              : isSorted === 'desc'
                              ? 'descending'
                              : undefined
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {canSort && isSorted && (
                            <span aria-hidden="true">
                              {isSorted === 'asc' ? (
                                <ChevronUp  />
                              ) : (
                                <ChevronDown  />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const cells = row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ));

                // Use custom row renderer if provided
                if (customRowRenderer) {
                  return customRowRenderer(
                    { original: row.original, id: row.id },
                    cells
                  );
                }

                // Default row rendering
                const isSelected = rowSelection && rowSelection[row.id];
                return (
                  <TableRow
                    key={row.id}
                    data-state={isSelected ? 'selected' : undefined}
                  >
                    {cells}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  
                >
                  No data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.showPagination && (
        <div >
          <div >
            Page {table.getState().pagination.pageIndex + 1} of{''}
            {table.getPageCount()}
          </div>
          <div >
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft  />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              Next
              <ChevronRight  />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
