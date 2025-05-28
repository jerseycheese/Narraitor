import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumbs } from './Breadcrumbs';

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Narraitor/Common/Breadcrumbs',
  component: Breadcrumbs,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Navigation breadcrumbs showing the current page hierarchy'
      }
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/worlds'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    separator: {
      control: 'text',
      description: 'Character or element to separate breadcrumb items'
    },
    maxItems: {
      control: 'number',
      description: 'Maximum number of breadcrumb items to show (for mobile)'
    }
  }
};

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/characters'
      }
    }
  }
};



export const DeepNesting: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/characters/char-456'
      }
    },
    docs: {
      description: {
        story: 'Breadcrumbs with deep nesting (character detail page)'
      }
    }
  }
};

export const MobileTruncation: Story = {
  args: {
    maxItems: 2
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/characters/char-456'
      }
    },
    docs: {
      description: {
        story: 'Breadcrumbs truncated for mobile display'
      }
    }
  }
};



export const LoadingState: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/world/123'
      }
    },
    docs: {
      description: {
        story: 'Breadcrumbs with loading entity name (simulated by empty store)'
      }
    }
  }
};
