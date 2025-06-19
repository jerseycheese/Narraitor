import type { Meta, StoryObj } from '@storybook/react';
import TemplateSelector from './TemplateSelector';

const meta: Meta<typeof TemplateSelector> = {
  title: 'Narraitor/World/Creation/TemplateSelector',
  component: TemplateSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Component for selecting pre-defined world templates (Western, Sitcom, Fantasy)'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onSelect: { action: 'template selected' },
  },
};

export default meta;
type Story = StoryObj<typeof TemplateSelector>;

// Default story
export const Default: Story = {
  args: {
    onSelect: (templateId: string) => console.log(`Selected template: ${templateId}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default state with no template selected'
      }
    }
  }
};

// Story with pre-selected template
export const PreSelected: Story = {
  args: {
    selectedTemplateId: 'western',
    onSelect: (templateId: string) => console.log(`Selected template: ${templateId}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'Template selector with a pre-selected template'
      }
    }
  },
};
