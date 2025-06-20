// src/stories/ThemeSelector.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ThemeSelector } from '@/components/shared/ThemeSelector';

const meta: Meta<typeof ThemeSelector> = {
  title: 'Narraitor/Shared/ThemeSelector',
  component: ThemeSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Reusable theme selection component for world creation and template generation.'
      }
    }
  },
  argTypes: {
    onToggleTheme: { action: 'theme-toggled' },
    maxSelections: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Maximum number of themes that can be selected'
    },
    disabled: {
      control: 'boolean',
      description: 'Disable all theme selection'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to handle state for stories
const ThemeSelectorWrapper = (args: { 
  selectedThemes?: string[]; 
  maxSelections?: number; 
  disabled?: boolean;
  onToggleTheme?: (theme: string) => void;
}) => {
  const [selectedThemes, setSelectedThemes] = useState<string[]>(args.selectedThemes || []);

  const handleToggleTheme = (theme: string) => {
    setSelectedThemes(prev => 
      prev.includes(theme) 
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    );
    args.onToggleTheme?.(theme);
  };

  return (
    <div className="max-w-2xl p-4">
      <ThemeSelector
        {...args}
        selectedThemes={selectedThemes}
        onToggleTheme={handleToggleTheme}
      />
      <div className="mt-4 text-sm text-gray-600">
        Selected: {selectedThemes.length > 0 ? selectedThemes.join(', ') : 'None'}
      </div>
    </div>
  );
};

export const MultipleSelections: Story = {
  render: ThemeSelectorWrapper,
  args: {
    selectedThemes: ['Fantasy', 'Sci-Fi', 'Cyberpunk'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates multiple theme selection for genre mixing functionality'
      }
    }
  }
};

export const MaxSelectionsLimit: Story = {
  render: ThemeSelectorWrapper,
  args: {
    selectedThemes: ['Fantasy', 'Sci-Fi'],
    maxSelections: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows selection limit behavior - additional selections are disabled when limit is reached.'
      }
    }
  }
};