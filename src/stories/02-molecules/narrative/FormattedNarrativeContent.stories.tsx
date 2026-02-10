import type { Meta, StoryObj } from '@storybook/react';
import { FormattedNarrativeContent } from '../../../components/Narrative/FormattedNarrativeContent';

const meta: Meta<typeof FormattedNarrativeContent> = {
  title: '02-Molecules/narrative/FormattedNarrativeContent',
  component: FormattedNarrativeContent,
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: { type: 'text', rows: 10 },
      description: 'The narrative content to format',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes for styling',
    },
    highlightTerms: {
      control: { type: 'object' },
      description: 'List of phrases to emphasize within the content (e.g., NPC names)',
    },
    highlightClassName: {
      control: { type: 'text' },
      description: 'Custom class names for highlighted phrases',
    },
  },
};

export default meta;

type Story = StoryObj<typeof FormattedNarrativeContent>;

export const Default: Story = {
  args: {
    content: `The first paragraph has some *italic text* and **bold text** to test. It demonstrates how the component handles basic formatting. This second paragraph shows how multiple paragraphs are separated. Notice the spacing between paragraphs is consistent and comfortable to read. This final paragraph contains *italic* and **bold** formatting, as well as a sentence with*malformed emphasis* to show how the component handles invalid formatting.`,
  },
};

export const EmptyContent: Story = {
  args: {
    content: '',
  },
};

export const WithCustomStyling: Story = {
  args: {
    content: `This paragraph has custom styling applied through the className prop. The text should maintain proper spacing while inheriting the custom styles.`,
  },
};

export const LongText: Story = {
  args: {
    content: `In the heart of the cyberpunk metropolis, neon lights flickered against the rain-slick streets. The air was thick with the scent of street food and ozone from overloaded power lines. Chrome-plated figures moved through the crowd, their augmented eyes scanning for opportunities. *The shadows held secrets.* Secrets that could make or break a person in this dystopian world. **Freedom was a commodity, and information was the currency.** A figure emerged from an alleyway, their coat flapping in the mechanical wind. The encounter would change everything. Will they choose to follow the mysterious stranger, or will they retreat back into the safety of the crowd? Only time would tell. The city never slept. The neon never faded. And the game was always afoot. *This paragraph demonstrates how long-form narrative text flows with proper paragraph spacing.*`,
  },
};

export const WithHighlights: Story = {
  args: {
    content: `Marge, the Waitress slides a chipped mug across the counter. Moments later, Marge's voice drops to a hush, warning you about Old Man Rivers. Old Man Rivers chuckles from the corner booth, his weathered hands wrapped around a steaming bowl of chowder. You can't tell if the glint in Old Man Rivers' eye is mischief or menace.`,
    highlightTerms: ['Marge, the Waitress', 'Old Man Rivers'],
  },
};
