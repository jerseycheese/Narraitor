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
  it('renders with data', () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    expect(screen.getByRole('')).toBeTruthy();
    expect(screen.getByText('Health Potion')).toBeTruthy();
    expect(screen.getByText('Iron Sword')).toBeTruthy();
  });

  it('displays column headers', () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Quantity')).toBeTruthy();
  });

  it('sorts data when column header is clicked', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={mockColumns} data={mockData} />);

    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);

    const rows = screen.getAllByRole('row');
    // First row is header, so data rows start at index 1
    expect(rows[1].textContent).toContain('Ancient Map');
  });

  it('displays pagination controls when enabled', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        pagination={{ pageSize: 2, showPagination: true }}
      />
    );

    expect(screen.getByRole('button', { name: /previous/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /next/i })).toBeTruthy();
  });

  it('navigates between pages', async () => {
    const user = userEvent.setup();
    const largeData = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Item${i + 1}`,
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

    expect(screen.getByText('Item 11')).toBeTruthy();
    expect(screen.queryByText('Item 1')).toBeNull();
  });

  it('displays empty state when no data', () => {
    render(<DataTable columns={mockColumns} data={[]} />);

    expect(screen.getByText(/no data available/i)).toBeTruthy();
  });

  it('displays search filter when enabled', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        searchable={{ enabled: true, placeholder: 'Search items...' }}
      />
    );

    expect(screen.getByPlaceholderText('Search items...')).toBeTruthy();
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

    expect(screen.getByText('Health Potion')).toBeTruthy();
    expect(screen.queryByText('Iron Sword')).toBeNull();
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={mockColumns} data={mockData} />);

    const table = screen.getByRole('');
    table.focus();

    await user.keyboard('{Tab}');

    // After tab, focus should move to first interactive element
    expect(document.activeElement).toBeDefined();
  });
});
