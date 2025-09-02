import type { Meta, StoryObj } from '@storybook/react';
import { Hero } from '@/components/shared/Hero';

const meta = {
  title: '01-Atoms/Display/Hero',
  component: Hero,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'The main title to display over the image or gradient background'
    },
    subtitle: {
      control: 'text',
      description: 'Optional subtitle to display under the title'
    },
    height: {
      control: 'text',
      description: 'CSS height class for the hero section'
    },
    theme: {
      control: 'select',
      options: ['fantasy', 'sci-fi', 'modern', 'historical', 'horror', 'mystery', 'western', 'cyberpunk', 'other', 'default'],
      description: 'Genre theme for gradient background (when no image provided)'
    },
    borderRadius: {
      control: 'select',
      options: ['all', 'top', 'none'],
      description: 'Border radius application - useful for card integration'
    }
  },
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleImage = {
  url: 'https://picsum.photos/800/400?random=1',
  alt: 'Fantasy landscape'
};

// Image-based variants
export const WithImage: Story = {
  args: {
    title: 'The Enchanted Realm',
    image: sampleImage,
  },
};

export const WithImageAndSubtitle: Story = {
  args: {
    title: 'The Enchanted Realm',
    subtitle: 'High Fantasy Adventure',
    image: sampleImage,
  },
};

export const WithImageAndBadge: Story = {
  args: {
    title: 'Cyberpunk 2077',
    subtitle: 'Dystopian Future',
    image: {
      url: 'https://picsum.photos/800/400?random=2',
      alt: 'Cyberpunk cityscape'
    },
    badge: (
      <span className="px-2 py-1 text-xs font-medium text-blue-200 bg-blue-900/70 rounded-full backdrop-blur-sm">
        Sci-Fi
      </span>
    ),
  },
};

// Size variants
export const TallHero: Story = {
  args: {
    title: 'Middle-earth',
    subtitle: 'Epic Fantasy',
    image: sampleImage,
    height: 'h-80 md:h-[500px]',
    badge: (
      <span className="px-2 py-1 text-xs font-medium text-green-200 bg-green-900/70 rounded-full backdrop-blur-sm">
        Set in Tolkien Universe
      </span>
    ),
  },
};

export const ShortHero: Story = {
  args: {
    title: 'Quick Adventure',
    image: sampleImage,
    height: 'h-48',
  },
};

export const ExtraShortHero: Story = {
  args: {
    title: 'Character Name',
    subtitle: 'Level 5 • Fantasy World • Fantasy',
    image: sampleImage,
    height: 'h-20 sm:h-24',
  },
};

// Theme-based gradient variants (design system compliant)
export const FantasyTheme: Story = {
  args: {
    title: 'The Mystical Kingdoms',
    subtitle: 'A realm of magic and wonder',
    theme: 'fantasy',
    badge: (
      <span className="px-2 py-1 text-xs font-medium text-white bg-black/50 rounded-full backdrop-blur-sm">
        Fantasy
      </span>
    ),
  },
};

export const SciFiTheme: Story = {
  args: {
    title: 'Neo Tokyo 2185',
    subtitle: 'Advanced civilization among the stars',
    theme: 'sci-fi',
    badge: (
      <span className="px-2 py-1 text-xs font-medium text-white bg-black/50 rounded-full backdrop-blur-sm">
        Sci-Fi
      </span>
    ),
  },
};

export const WesternTheme: Story = {
  args: {
    title: 'Dusty Trails',
    subtitle: 'Life on the frontier',
    theme: 'western',
    badge: (
      <span className="px-2 py-1 text-xs font-medium text-white bg-black/50 rounded-full backdrop-blur-sm">
        Western
      </span>
    ),
  },
};

export const HorrorTheme: Story = {
  args: {
    title: 'The Shadows Within',
    subtitle: 'Where nightmares become reality',
    theme: 'horror',
    badge: (
      <span className="px-2 py-1 text-xs font-medium text-white bg-black/50 rounded-full backdrop-blur-sm">
        Horror
      </span>
    ),
  },
};

export const ModernTheme: Story = {
  args: {
    title: 'Metropolitan Life',
    subtitle: 'Urban stories and contemporary drama',
    theme: 'modern',
    badge: (
      <span className="px-2 py-1 text-xs font-medium text-white bg-black/50 rounded-full backdrop-blur-sm">
        Modern
      </span>
    ),
  },
};

export const MysteryTheme: Story = {
  args: {
    title: 'The Noir Investigation',
    subtitle: 'Unraveling secrets in the shadows',
    theme: 'mystery',
    badge: (
      <span className="px-2 py-1 text-xs font-medium text-white bg-black/50 rounded-full backdrop-blur-sm">
        Mystery
      </span>
    ),
  },
};

export const HistoricalTheme: Story = {
  args: {
    title: 'Ancient Civilizations',
    subtitle: 'Stories from the past',
    theme: 'historical',
    badge: (
      <span className="px-2 py-1 text-xs font-medium text-white bg-black/50 rounded-full backdrop-blur-sm">
        Historical
      </span>
    ),
  },
};

export const CyberpunkTheme: Story = {
  args: {
    title: 'Digital Underground',
    subtitle: 'High tech, low life',
    theme: 'cyberpunk',
    badge: (
      <span className="px-2 py-1 text-xs font-medium text-white bg-black/50 rounded-full backdrop-blur-sm">
        Cyberpunk
      </span>
    ),
  },
};

// Border radius variants (for card integration)
export const CardTopOnly: Story = {
  args: {
    title: 'World Card Hero',
    subtitle: 'Integrated with card layout',
    theme: 'fantasy',
    borderRadius: 'top',
    height: 'h-48',
  },
};

export const NoBorderRadius: Story = {
  args: {
    title: 'Full Width Hero',
    subtitle: 'No border radius applied',
    theme: 'sci-fi',
    borderRadius: 'none',
    height: 'h-48',
  },
};

export const AllBorderRadius: Story = {
  args: {
    title: 'Standalone Hero',
    subtitle: 'Full border radius',
    theme: 'western',
    borderRadius: 'all',
    height: 'h-48',
  },
};

// Extra short themed variant (for character pages, breadcrumbs, etc.)
export const ExtraShortThemed: Story = {
  args: {
    title: 'Character Name',
    subtitle: 'Level 5 • Fantasy World',
    theme: 'fantasy',
    height: 'h-20 sm:h-24',
    borderRadius: 'all',
  },
};