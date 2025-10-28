import type { Meta, StoryObj } from '@storybook/react';
import { FormattedNarrativeContent } from './FormattedNarrativeContent';

const meta: Meta<typeof FormattedNarrativeContent> = {
  title: 'Narrative/FormattedNarrativeContent/Progressive Disclosure',
  component: FormattedNarrativeContent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'FormattedNarrativeContent with progressive disclosure chunking feature. Shows how narrative text can be revealed gradually to improve engagement and readability.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'text',
      description: 'The narrative content to display',
    },
    enableChunking: {
      control: 'boolean',
      description: 'Enable progressive disclosure with text chunking',
    },
    revealButtonText: {
      control: 'text',
      description: 'Custom text for the reveal button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormattedNarrativeContent>;

const longNarrative = `The ancient forest stretched endlessly before you, its towering trees reaching toward the clouded sky. A thick mist clung to the ground, obscuring your path forward. The air was heavy with the scent of pine and damp earth, and somewhere in the distance, you heard the faint sound of running water.

As you ventured deeper into the woods, the trees grew closer together, their branches intertwining overhead to form a natural canopy. Shafts of pale light filtered through the leaves, creating shifting patterns on the forest floor. The path beneath your feet was barely visible, overgrown with moss and fallen leaves.

Suddenly, you noticed something glinting among the roots of an enormous oak tree. Approaching cautiously, you discovered an ornate silver pendant half-buried in the soil. Its surface was etched with strange symbols that seemed to shimmer in the dim light. As your fingers closed around the cool metal, you felt a strange tingling sensation run up your arm.

The forest around you seemed to hold its breath, waiting. Birds fell silent, and even the wind through the trees ceased its whispered song. In the eerie stillness, you heard a voice call your name from somewhere deep within the woods. It was familiar, yet impossible - a voice you hadn't heard in years, belonging to someone long gone.`;

const shortNarrative = `You entered the tavern to find it bustling with activity. Patrons laughed and argued over their drinks, while a bard in the corner strummed a lively tune. The warmth and noise were a welcome change from the cold, quiet streets outside.`;

const dialogueNarrative = `"Welcome, traveler," the innkeeper said with a warm smile. "What brings you to our humble establishment on this dark and stormy night?"

You explained that you were seeking shelter and perhaps some information about the surrounding area. The innkeeper nodded knowingly, wiping down the bar with a well-worn cloth.

"Ah, information you say? Well, you've come to the right place. I've lived in these parts all my life, and there's not much I don't know about the local happenings." He leaned in closer, his voice dropping to a conspiratorial whisper. "Though I must warn you, stranger things have been afoot lately. Best to be careful where you wander after dark."`;

export const WithChunking: Story = {
  args: {
    content: longNarrative,
    enableChunking: true,
  },
};

export const WithoutChunking: Story = {
  args: {
    content: longNarrative,
    enableChunking: false,
  },
};

export const ShortContentChunked: Story = {
  args: {
    content: shortNarrative,
    enableChunking: true,
  },
};

export const DialogueChunked: Story = {
  args: {
    content: dialogueNarrative,
    enableChunking: true,
  },
};

export const CustomButtonText: Story = {
  args: {
    content: longNarrative,
    enableChunking: true,
    revealButtonText: 'Show More Story',
  },
};

export const WithHighlighting: Story = {
  args: {
    content: longNarrative,
    enableChunking: true,
    highlightTerms: ['forest', 'pendant', 'voice'],
  },
};

export const MobileOptimized: Story = {
  args: {
    content: longNarrative,
    enableChunking: true,
    chunkingOptions: {
      isMobile: true,
      minWordsPerChunk: 15,
      maxWordsPerChunk: 80,
      targetWordsPerChunk: 40,
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const LargeChunks: Story = {
  args: {
    content: longNarrative,
    enableChunking: true,
    chunkingOptions: {
      minWordsPerChunk: 50,
      maxWordsPerChunk: 200,
      targetWordsPerChunk: 100,
    },
  },
};

export const SmallChunks: Story = {
  args: {
    content: longNarrative,
    enableChunking: true,
    chunkingOptions: {
      minWordsPerChunk: 10,
      maxWordsPerChunk: 50,
      targetWordsPerChunk: 25,
    },
  },
};
