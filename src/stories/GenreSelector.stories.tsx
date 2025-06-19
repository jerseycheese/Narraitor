// src/stories/GenreSelector.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { GenreSelector } from '@/components/shared/GenreSelector';

const meta: Meta<typeof GenreSelector> = {
  title: 'Shared/GenreSelector',
  component: GenreSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Reusable genre selection component for world creation and template generation.'
      }
    }
  },
  argTypes: {
    onToggleGenre: { action: 'genre-toggled' },
    maxSelections: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Maximum number of genres that can be selected'
    },
    disabled: {
      control: 'boolean',
      description: 'Disable all genre selection'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to handle state for stories
const GenreSelectorWrapper = (args: any) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>(args.selectedGenres || []);

  const handleToggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
    args.onToggleGenre(genre);
  };

  return (
    <div className="max-w-2xl p-4">
      <GenreSelector
        {...args}
        selectedGenres={selectedGenres}
        onToggleGenre={handleToggleGenre}
      />
      <div className="mt-4 text-sm text-gray-600">
        Selected: {selectedGenres.length > 0 ? selectedGenres.join(', ') : 'None'}
      </div>
    </div>
  );
};

export const Default: Story = {
  render: GenreSelectorWrapper,
  args: {
    selectedGenres: [],
  }
};

export const WithSelection: Story = {
  render: GenreSelectorWrapper,
  args: {
    selectedGenres: ['Fantasy', 'Sci-Fi', 'Cyberpunk'],
  }
};

export const WithMaxSelections: Story = {
  render: GenreSelectorWrapper,
  args: {
    selectedGenres: ['Fantasy', 'Sci-Fi'],
    maxSelections: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Limits the number of genres that can be selected. Additional selections are disabled.'
      }
    }
  }
};

export const Disabled: Story = {
  render: GenreSelectorWrapper,
  args: {
    selectedGenres: ['Fantasy', 'Horror'],
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'All genre selection is disabled.'
      }
    }
  }
};

export const Mobile: Story = {
  render: GenreSelectorWrapper,
  args: {
    selectedGenres: [],
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Mobile-responsive layout with proper grid adjustments.'
      }
    }
  }
};