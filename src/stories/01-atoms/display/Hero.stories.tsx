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

// Same-origin art only. A cross-origin image taints the canvas, no plate can
// be read back, and the hero falls back to the art untreated.
const sampleImage = {
  url: '/visual-assets/worlds/normandy.webp',
  alt: 'A hedgerow lane in Normandy'
};

// Image-based variants
export const WithImage: Story = {
  args: {
    title: 'Normandy',
    image: sampleImage,
  },
};

export const WithImageAndSubtitle: Story = {
  args: {
    title: 'Normandy',
    subtitle: 'Historical',
    image: sampleImage,
  },
};

export const WithImageAndBadge: Story = {
  args: {
    title: 'Cyberpunk 2077',
    subtitle: 'Dystopian Future',
    image: {
      url: '/visual-assets/world-cyberpunk.png',
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
 * The colour treatment: the art as generated. Reserved for the world detail
 * hero; everywhere else world art prints in ink, which is the default and what
 * every other story here shows. Check both themes with the toolbar switcher.
 */
export const ColourTreatment: Story = {
  args: {
    image: sampleImage,
    treatment: 'colour',
  },
};
