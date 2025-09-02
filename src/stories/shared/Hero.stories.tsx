import type { Meta, StoryObj } from '@storybook/react';
import { Hero } from '@/components/shared/Hero';

const meta = {
  title: 'Shared/Hero',
  component: Hero,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'The main title to display over the image'
    },
    subtitle: {
      control: 'text',
      description: 'Optional subtitle to display under the title'
    },
    height: {
      control: 'text',
      description: 'CSS height class for the hero section'
    }
  },
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleImage = {
  url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop',
  alt: 'Fantasy landscape'
};

export const Default: Story = {
  args: {
    title: 'The Enchanted Realm',
    image: sampleImage,
  },
};

export const WithSubtitle: Story = {
  args: {
    title: 'The Enchanted Realm',
    subtitle: 'High Fantasy Adventure',
    image: sampleImage,
  },
};

export const WithBadge: Story = {
  args: {
    title: 'Cyberpunk 2077',
    subtitle: 'Dystopian Future',
    image: {
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop',
      alt: 'Cyberpunk cityscape'
    },
    badge: (
      <span className="px-2 py-1 text-xs font-medium text-blue-200 bg-blue-900/70 rounded-full backdrop-blur-sm">
        Sci-Fi
      </span>
    ),
  },
};

export const Tall: Story = {
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

export const Short: Story = {
  args: {
    title: 'Quick Adventure',
    image: sampleImage,
    height: 'h-48',
  },
};

// Themed background variants (no image)
export const FantasyTheme: Story = {
  args: {
    title: 'The Mystical Kingdoms',
    subtitle: 'A realm of magic and wonder',
    theme: 'fantasy',
    badge: (
      <span className="px-2 py-1 text-xs font-medium text-purple-200 bg-purple-900/70 rounded-full backdrop-blur-sm">
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
      <span className="px-2 py-1 text-xs font-medium text-cyan-200 bg-cyan-900/70 rounded-full backdrop-blur-sm">
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
      <span className="px-2 py-1 text-xs font-medium text-orange-200 bg-orange-900/70 rounded-full backdrop-blur-sm">
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
      <span className="px-2 py-1 text-xs font-medium text-red-200 bg-red-900/70 rounded-full backdrop-blur-sm">
        Horror
      </span>
    ),
  },
};