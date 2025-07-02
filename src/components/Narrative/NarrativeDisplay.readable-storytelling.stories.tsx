// src/components/Narrative/NarrativeDisplay.readable-storytelling.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { NarrativeDisplay } from './NarrativeDisplay';
import { NarrativeSegment } from '@/types/narrative.types';

const meta = {
  title: 'Narraitor/Narrative/Display/ReadableStorytelling',
  component: NarrativeDisplay,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Demonstrates text formatting for readable storytelling as specified in Issue #231. Shows proper paragraph breaks, dialogue formatting, emphasis, and visual organization.',
      },
    },
  },
  argTypes: {
    segment: {
      description: 'The narrative segment to display with readable formatting',
    },
  },
} satisfies Meta<typeof NarrativeDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to create mock segments
const createStorySegment = (
  content: string,
  type: NarrativeSegment['type'] = 'scene',
  metadata?: Partial<NarrativeSegment['metadata']>
): NarrativeSegment => ({
  id: 'story-seg',
  content,
  type,
  sessionId: 'story-session',
  worldId: 'story-world',
  timestamp: new Date(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {
    characterIds: [],
    tags: [],
    mood: 'neutral',
    ...metadata,
  },
});

// Formatted Paragraphs - Shows proper paragraph break formatting
export const FormattedParagraphs: Story = {
  name: 'Formatted Paragraphs',
  args: {
    segment: createStorySegment(
      `The ancient castle loomed against the stormy sky, its towers piercing the dark clouds like accusing fingers. Lightning illuminated the weathered stone walls, revealing centuries of battle scars and forgotten histories.

As they approached the massive iron gates, the wind howled through the battlements above, carrying with it the whispers of long-dead guardians. The very air seemed thick with ancient magic and untold secrets.

Their horses shifted nervously beneath them, sensing the otherworldly presence that dwelt within those walls. This was no ordinary fortress – this was a place where legends were born and heroes were tested.`,
      'scene',
      {
        location: 'Castle Shadowmere',
        mood: 'mysterious',
        tags: ['castle', 'atmosphere', 'foreboding'],
      }
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how narrative text is formatted with proper paragraph breaks for easy reading. Each paragraph is clearly separated with consistent spacing.',
      },
    },
  },
};

// Dialogue Formatting - Shows proper dialogue formatting with quotation marks
export const DialogueFormatting: Story = {
  name: 'Dialogue Formatting',
  args: {
    segment: createStorySegment(
      `"Welcome, travelers," said the innkeeper, wiping his hands on a stained apron. "The road has been treacherous of late."

"We seek passage to the northern kingdoms," replied the knight, removing her helmet to reveal battle-worn features. "Have you word of the mountain passes?"

The innkeeper's expression grew grave. "Aye, I have word," he whispered, glancing nervously at the other patrons. "But it's not word you'll want to hear."`,
      'dialogue',
      {
        characterIds: ['innkeeper', 'knight'],
        mood: 'tense',
        location: 'The Crossroads Inn',
        tags: ['conversation', 'information', 'tension'],
      }
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates proper dialogue formatting with quotation marks and clear attribution. Dialogue segments receive special visual styling for enhanced readability.',
      },
    },
  },
};

// Action with Emphasis - Shows emphasis formatting for important elements
export const ActionWithEmphasis: Story = {
  name: 'Action with Emphasis',
  args: {
    segment: createStorySegment(
      `The battle raged across the courtyard as steel clashed against steel. The knight's *legendary blade* sang through the air, its *ancient enchantments* glowing with ethereal light.

With a mighty roar, she unleashed the *Crimson Strike* technique, a devastating attack that had been passed down through generations of her order. The very ground trembled beneath the force of her assault.

Her opponent staggered back, recognizing the *mark of true mastery* in her movements. This was no ordinary warrior – this was a champion worthy of the old legends.`,
      'action',
      {
        characterIds: ['knight-champion'],
        mood: 'action',
        location: 'Castle Courtyard',
        tags: ['combat', 'skill', 'legendary', 'technique'],
      }
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how emphasis formatting highlights important story elements. Text wrapped in asterisks (*) would be converted to italic emphasis in the actual implementation.',
      },
    },
  },
};

// Mixed Content - Shows combination of all formatting features
export const MixedContentFormatting: Story = {
  name: 'Mixed Content Formatting',
  args: {
    segment: createStorySegment(
      `The *Arcane Council* chamber fell silent as the ancient doors creaked open. Elder Magistrix stepped forward, her staff pulsing with *primal energy*.

"The time of reckoning has come," she announced, her voice echoing through the crystalline halls. "The *Void Prophecy* speaks of a chosen one who will either save our realm or doom it to eternal darkness."

The gathered mages exchanged worried glances. They had studied the prophecy for centuries, but none had expected it to unfold in their lifetime.

"Who among us has the courage to seek this champion?" she asked, her piercing gaze sweeping across the assembly. "Who will venture into the *Cursed Borderlands* where even angels fear to tread?"`,
      'scene',
      {
        characterIds: ['elder-magistrix', 'council-mages'],
        mood: 'tense',
        location: 'Arcane Council Chamber',
        tags: ['prophecy', 'council', 'destiny', 'magic'],
      }
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the combination of paragraph formatting, dialogue, and emphasis in a single narrative segment. Shows how all formatting features work together for optimal readability.',
      },
    },
  },
};

// Long Form Narrative - Shows consistency across longer content
export const LongFormNarrative: Story = {
  name: 'Long Form Narrative',
  args: {
    segment: createStorySegment(
      `The journey through the *Whispering Woods* had taken longer than expected. Ancient trees towered overhead, their gnarled branches forming a canopy so thick that only scattered beams of sunlight reached the forest floor.

"Stay close," warned their guide, a weathered ranger who knew these paths better than anyone. "The forest spirits are restless today. I can feel their *ancient magic* stirring in the very air we breathe."

As if summoned by his words, a ethereal voice drifted through the trees. "Mortals," it whispered, seeming to come from everywhere and nowhere at once. "Why do you trespass in our sacred grove?"

The party halted, weapons half-drawn, unsure whether they faced friend or foe. The ranger stepped forward, bowing respectfully to the unseen presence.

"We seek passage to the *Crystal Caverns*, great spirit," he said, his voice steady despite the obvious tension. "Our quest is one of dire necessity – the fate of the realm hangs in the balance."

Silence stretched between them, broken only by the gentle rustling of leaves and the distant call of forest creatures. Then, slowly, a figure began to materialize from the dappled shadows – tall, graceful, with eyes that held the wisdom of countless centuries.

"The *Guardian of the Grove* will allow your passage," the spirit said, its voice like wind through silver bells. "But know this – the path ahead is fraught with perils that will test not only your strength, but the very nature of your souls."`,
      'scene',
      {
        characterIds: ['party', 'ranger-guide', 'forest-spirit', 'grove-guardian'],
        mood: 'mysterious',
        location: 'The Whispering Woods',
        tags: ['journey', 'forest', 'spirits', 'magic', 'guidance'],
      }
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how formatting remains consistent and readable across longer narrative segments. Demonstrates proper paragraph structure, dialogue attribution, and emphasis throughout extended content.',
      },
    },
  },
};

// Transition Formatting - Shows how transition segments maintain readability
export const TransitionFormatting: Story = {
  name: 'Transition Formatting',
  args: {
    segment: createStorySegment(
      `Three days passed as they traveled deeper into the *Shadowlands*. The landscape grew increasingly desolate, and the very air seemed to drain the warmth from their bones.

By nightfall of the third day, they had reached the edge of the *Cursed Valley*, where no living thing was said to thrive...`,
      'transition',
      {
        mood: 'mysterious',
        location: 'Shadowlands Border',
        tags: ['time-passage', 'journey', 'atmosphere'],
      }
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how transition segments receive special formatting that maintains readability while indicating passage of time or change of scene.',
      },
    },
  },
};
