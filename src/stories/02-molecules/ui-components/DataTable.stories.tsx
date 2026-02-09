/**
 * DataTable Storybook Stories
 * Demonstrates the reusable DataTable component with sorting, filtering, and pagination
 */

import type { Meta, StoryObj } from '@storybook/react';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';

interface SampleData {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
}

const sampleData: SampleData[] = [
  { id: '1', name: 'Health Potion', category: 'Consumables', quantity: 5, price: 50 },
  { id: '2', name: 'Iron Sword', category: 'Equipment', quantity: 1, price: 150 },
  { id: '3', name: 'Ancient Map', category: 'Documents', quantity: 1, price: 200 },
  { id: '4', name: 'Gold Coin', category: 'Valuables', quantity: 100, price: 1 },
  { id: '5', name: 'Leather Armor', category: 'Equipment', quantity: 1, price: 200 },
  { id: '6', name: 'Mana Potion', category: 'Consumables', quantity: 3, price: 75 },
  { id: '7', name: 'Steel Dagger', category: 'Equipment', quantity: 2, price: 100 },
  { id: '8', name: 'Magic Scroll', category: 'Documents', quantity: 1, price: 300 },
  { id: '9', name: 'Ruby Gem', category: 'Valuables', quantity: 5, price: 500 },
  { id: '10', name: 'Bread Loaf', category: 'Consumables', quantity: 10, price: 5 },
  { id: '11', name: 'Diamond Ring', category: 'Valuables', quantity: 1, price: 1000 },
  { id: '12', name: 'Elven Bow', category: 'Equipment', quantity: 1, price: 450 },
];

const columns: ColumnDef<SampleData>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
  },
  {
    accessorKey: 'category',
    header: 'Category',
    enableSorting: true,
  },
  {
    accessorKey: 'quantity',
    header: 'Quantity',
    enableSorting: true,
  },
  {
    accessorKey: 'price',
    header: 'Price (Gold)',
    enableSorting: true,
  },
];

interface DataTableProps {
  columns: ColumnDef<SampleData>[];
  data: SampleData[];
  pagination?: {
    pageSize?: number;
    showPagination?: boolean;
  };
  searchable?: {
    enabled?: boolean;
    placeholder?: string;
  };
  ariaLabel?: string;
}

const meta: Meta<DataTableProps> = {
  title: '02-molecules/ui-components/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<DataTableProps>;

/**
 * Basic table with sortable columns
 */
export const Default: Story = {
  args: {
    columns,
    data: sampleData.slice(0, 5),
    ariaLabel: 'Sample data',
  },
};

/**
 * Full-featured table with search and pagination
 */
export const WithSearchAndPagination: Story = {
  args: {
    columns,
    data: sampleData,
    pagination: {
      pageSize: 5,
      showPagination: true,
    },
    searchable: {
      enabled: true,
      placeholder: 'Search items...',
    },
    ariaLabel: 'Full-featured data',
  },
};

/**
 * Large dataset with pagination
 */
export const LargeDataset: Story = {
  args: {
    columns,
    data: Array.from({ length: 50 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Item${i + 1}`,
      category: ['Consumables', 'Equipment', 'Documents', 'Valuables'][i % 4],
      quantity: Math.floor(Math.random() * 100) + 1,
      price: Math.floor(Math.random() * 1000) + 10,
    })),
    pagination: {
      pageSize: 10,
      showPagination: true,
    },
    searchable: {
      enabled: true,
      placeholder: 'Search large dataset...',
    },
    ariaLabel: 'Large dataset',
  },
};
