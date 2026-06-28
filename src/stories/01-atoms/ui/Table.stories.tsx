import { Meta, StoryObj } from '@storybook/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

const meta: Meta<typeof Table> = {
  title: '01-Atoms/ui/Table',
  component: Table,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  render: () => (
    <Table className="story-table">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Class</TableHead>
          <TableHead>Level</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Aria Starweaver</TableCell>
          <TableCell>Swordmage</TableCell>
          <TableCell>5</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Vex</TableCell>
          <TableCell>Operative</TableCell>
          <TableCell>3</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
