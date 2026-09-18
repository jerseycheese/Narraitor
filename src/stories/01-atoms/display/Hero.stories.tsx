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
      <span>
        Sci-Fi
      </span>
    ),
  },
};

// No image — falls back to the themed gradient background
export const WithoutImage: Story = {
  args: {
    title: 'Standalone Hero',
    subtitle: 'Themed gradient background',
  },
};

/**
 * The ink register. The art is rendered as a normalised greyscale plate and
 * the theme supplies its two colours, so the same plate serves light and dark.
 * Check both with the toolbar switcher.
 *
 * The art has to be same-origin: a cross-origin image taints the canvas, no
 * plate can be read back, and the hero falls back to the art untreated.
 */
export const InkRegister: Story = {
  args: {
    title: 'Normandy',
    subtitle: 'Historical',
    image: {
      url: '/visual-assets/worlds/normandy.webp',
      alt: 'A hedgerow lane in Normandy',
    },
    register: 'ink',
  },
};

