import type { Meta, StoryObj } from '@storybook/react';
import StyleTest from './StyleTest';

const meta: Meta<typeof StyleTest> = {
  title: 'Narraitor/Config/StyleTest',
  component: StyleTest,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Tests Tailwind CSS styling and configuration'
      }
    }
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StyleTest>;

// Basic styles story
export const DefaultStyles: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Basic Tailwind CSS classes applied to elements'
      }
    }
  },
};

// Responsive styles story
export const ResponsiveStyles: Story = {
  args: { showResponsive: true },
  parameters: {
    docs: {
      description: {
        story: 'Responsive Tailwind CSS classes for different screen sizes'
      }
    }
  },
};

// Hover states story
export const HoverStates: Story = {
  args: { showHover: true },
  parameters: {
    docs: {
      description: {
        story: 'Hover state styling with Tailwind CSS'
      }
    }
  },
};

// All elements story
export const AllElements: Story = {
  args: { 
    showResponsive: true,
    showHover: true 
  },
  parameters: {
    docs: {
      description: {
        story: 'All styling elements displayed together'
      }
    }
  },
};
