import type { Meta, StoryObj } from '@storybook/react';
import { PageLayout } from '@/components/shared/PageLayout';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';

const meta: Meta<typeof PageLayout> = {
  title: '04-Templates/layouts/PageLayout',
  component: PageLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
        A reusable page layout component that provides consistent structure across all application pages.
        
        **Features:**
        - Consistent header with title, description, and actions
        - Responsive design with proper spacing
        - Configurable container width
        - Semantic HTML structure
        - Built-in action button area
        `,
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'The main page title'
    },
    description: {
      control: 'text',
      description: 'Optional description text below the title'
    },
    maxWidth: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl', '4xl', '6xl', '7xl'],
      description: 'Maximum width of the page content'
    },
    actions: {
      control: false,
      description: 'React nodes for action buttons'
    },
    children: {
      control: false,
      description: 'Page content'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleActions = (
  <ActionButtonGroup
    actions={[
      {
        label: 'Primary Action',
        onClick: () => console.log('Primary clicked'),
        variant: 'primary'
      },
      {
        label: 'Secondary Action', 
        onClick: () => console.log('Secondary clicked'),
        variant: 'secondary'
      }
    ]}
  />
);

const sampleContent = (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map(i => (
      <div key={i} className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">Card {i}</h3>
        <p className="text-gray-700">Sample content for card {i}</p>
      </div>
    ))}
  </div>
);

export const Default: Story = {
  args: {
    title: '04-Templates/layouts/PageLayout',
    description: 'This is a sample page using the PageLayout component.',
    actions: sampleActions,
    children: sampleContent
  }
};

export const NoActions: Story = {
  args: {
    title: '04-Templates/layouts/PageLayout',
    description: 'A page without any action buttons.',
    children: sampleContent
  }
};

export const NoDescription: Story = {
  args: {
    title: '04-Templates/layouts/PageLayout',
    actions: sampleActions,
    children: sampleContent
  }
};

export const MinimalPage: Story = {
  args: {
    title: '04-Templates/layouts/PageLayout',
    children: (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Empty State</h2>
        <p className="text-gray-700">No content to display yet.</p>
      </div>
    )
  }
};

export const WorldsPageExample: Story = {
  args: {
    title: 'My Worlds',
    description: "Create unique story worlds, then manage characters and play through interactive narratives. Your currently active world appears in the navigation bar.",
    actions: (
      <ActionButtonGroup
        actions={[
          {
            label: 'Create World',
            onClick: () => console.log('Create World clicked'),
            variant: 'primary',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )
          },
          {
            label: 'Generate World',
            onClick: () => console.log('Generate World clicked'),
            variant: 'secondary',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )
          }
        ]}
      />
    ),
    children: (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Fantasy Realm', 'Cyberpunk City', 'Wild West'].map(world => (
          <div key={world} className="bg-white rounded-lg shadow p-6 border-2 border-transparent hover:border-blue-300 transition-colors">
            <h3 className="text-lg font-semibold mb-2">{world}</h3>
            <p className="text-gray-700 mb-4">A sample world description...</p>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-500">
                Make Active
              </button>
              <button className="px-3 py-1 bg-blue-700 text-white rounded text-sm hover:bg-blue-900">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }
};

export const CharactersPageExample: Story = {
  args: {
    title: 'Fantasy Realm Characters',
    description: 'Create unique characters for your interactive narrative adventures. Use the "Make Active" button on a character to set them as your current character for gameplay.',
    actions: (
      <ActionButtonGroup
        actions={[
          {
            label: 'Create Character',
            onClick: () => console.log('Create Character clicked'),
            variant: 'primary',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )
          },
          {
            label: 'Generate Character',
            onClick: () => console.log('Generate Character clicked'),
            variant: 'secondary',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )
          },
          {
            label: 'Start Playing',
            onClick: () => console.log('Start Playing clicked'),
            variant: 'success',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          }
        ]}
      />
    ),
    children: (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Aria Starweaver', 'Zane Shadowblade', 'Luna Brightforge'].map(character => (
          <div key={character} className="bg-white rounded-lg shadow p-6 border-2 border-green-500 bg-green-50 relative">
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
              Active
            </div>
            <h3 className="text-lg font-semibold mb-2">{character}</h3>
            <p className="text-gray-700 mb-4">Level 5 Warrior</p>
            <div className="flex gap-2 flex-wrap">
              <button className="px-3 py-1 bg-blue-700 text-white rounded text-sm hover:bg-blue-900">
                View
              </button>
              <button className="px-3 py-1 bg-blue-700 text-white rounded text-sm hover:bg-blue-900">
                Edit
              </button>
              <button className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-700">
                Play
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }
};

export const DifferentWidths: Story = {
  render: () => (
    <div className="space-y-8">
      <PageLayout
        title="Small Width (sm)"
        maxWidth="sm"
        description="This layout uses max-width: sm"
      >
        <div className="bg-white rounded-lg shadow p-6">
          <p>Content with small max width</p>
        </div>
      </PageLayout>
      
      <PageLayout
        title="Large Width (6xl)"
        maxWidth="6xl"
        description="This layout uses max-width: 6xl"
      >
        <div className="bg-white rounded-lg shadow p-6">
          <p>Content with large max width</p>
        </div>
      </PageLayout>
    </div>
  )
};
