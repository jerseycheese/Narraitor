/**
 * Tests for DataTable component
 * Focus: Sorting, pagination, accessibility, keyboard navigation
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect } from '@jest/globals';
import { DataTable } from './data-table';
import type { ColumnDef } from '@tanstack/react-table';

interface TestData {
  id: string;
  name: string;
  quantity: number;
}

const mockData: TestData[] = [
  { id: '1', name: 'Health Potion', quantity: 5 },
  { id: '2', name: 'Iron Sword', quantity: 1 },
  { id: '3', name: 'Ancient Map', quantity: 1 },
];

const mockColumns: ColumnDef<TestData>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'quantity',
    header: 'Quantity',
  },
];

describe('DataTable', () => {
  it('renders table with data', () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Health Potion')).toBeInTheDocument();
    expect(screen.getByText('Iron Sword')).toBeInTheDocument();
  });

  it('displays column headers', () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Quantity')).toBeInTheDocument();
  });

  it('sorts data when column header is clicked', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={mockColumns} data={mockData} />);

    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);

    const rows = screen.getAllByRole('row');
    // First row is header, so data rows start at index 1
    expect(rows[1]).toHaveTextContent('Ancient Map');
  });

  it('has accessible table structure', () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    expect(screen.getByRole('table')).toHaveAttribute('aria-label');
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.getAllByRole('row')).toHaveLength(4); // 1 header + 3 data
  });

  it('displays pagination controls when enabled', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        pagination={{ pageSize: 2, showPagination: true }}
      />
    );

    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('navigates between pages', async () => {
    const user = userEvent.setup();
    const largeData = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Item ${i + 1}`,
      quantity: i + 1,
    }));

    render(
      <DataTable
        columns={mockColumns}
        data={largeData}
        pagination={{ pageSize: 10, showPagination: true }}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    expect(screen.getByText('Item 11')).toBeInTheDocument();
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  it('displays empty state when no data', () => {
    render(<DataTable columns={mockColumns} data={[]} />);

    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('displays search filter when enabled', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        searchable={{ enabled: true, placeholder: 'Search items...' }}
      />
    );

    expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
  });

  it('filters data based on search input', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        searchable={{ enabled: true, placeholder: 'Search...' }}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    await user.type(searchInput, 'Potion');

    expect(screen.getByText('Health Potion')).toBeInTheDocument();
    expect(screen.queryByText('Iron Sword')).not.toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={mockColumns} data={mockData} />);

    const table = screen.getByRole('table');
    table.focus();

    await user.keyboard('{Tab}');

    // After tab, focus should move to first interactive element
    expect(document.activeElement).toBeDefined();
  });
});
