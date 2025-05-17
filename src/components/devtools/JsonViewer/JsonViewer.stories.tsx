import type { Meta, StoryObj } from '@storybook/react';
import { JsonViewer } from './JsonViewer';

const meta: Meta<typeof JsonViewer> = {
  title: 'Narraitor/DevTools/JsonViewer',
  component: JsonViewer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A component for displaying JSON data in a formatted way'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'The data to display'
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names'
    }
  }
};

export default meta;
type Story = StoryObj<typeof JsonViewer>;

export const Default: Story = {
  args: {
    data: {
      name: 'Example Object',
      number: 42,
      boolean: true,
      null: null,
      nested: {
        property: 'value',
        array: [1, 2, 3]
      }
    }
  }
};

export const SimpleData: Story = {
  args: {
    data: {
      id: 'simple-1',
      value: 'Simple Value'
    }
  }
};

export const ComplexNestedData: Story = {
  args: {
    data: {
      id: 'complex-1',
      user: {
        name: 'John Doe',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'Exampleville',
          zipCode: '12345'
        }
      },
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ],
      metadata: {
        created: '2025-01-01T00:00:00Z',
        modified: '2025-05-15T14:30:00Z',
        tags: ['example', 'test', 'demo']
      }
    }
  }
};

export const ArrayData: Story = {
  args: {
    data: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ]
  }
};

export const EmptyData: Story = {
  args: {
    data: {}
  }
};