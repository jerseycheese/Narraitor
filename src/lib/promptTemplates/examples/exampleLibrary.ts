/**
 * @fileoverview Centralized Example Library
 *
 * This module contains all prompt examples used across the application.
 * Examples are organized by category and demonstrate desired AI output
 * patterns, formatting, and style.
 */

import { PromptExample } from './types';

/**
 * Examples for emphasis and formatting in narrative text
 */
const emphasisExamples: PromptExample[] = [
  {
    id: 'emphasis-markdown-basic',
    name: 'Markdown Emphasis for Dramatic Effect',
    description: 'Demonstrates proper use of markdown emphasis in narrative text',
    content:
      'The *Arasaka building* looms ahead, its security pulsing like a **digital heartbeat**',
    categories: ['scene', 'transition', 'initial-scene', 'all'],
    priority: 'high',
    tags: ['formatting', 'emphasis', 'markdown'],
  },
  {
    id: 'emphasis-guidelines',
    name: 'Emphasis Usage Guidelines',
    description: 'Guidelines for when and how to use emphasis',
    content: `Use *single asterisks* around important phrases, atmospheric details, or notable objects.
Use **double asterisks** around critical moments, intense emotions, or dramatic revelations.
Apply emphasis sparingly (2-4 times per paragraph) to maintain impact.`,
    categories: ['scene', 'transition', 'all'],
    priority: 'medium',
    tags: ['formatting', 'emphasis', 'guidelines'],
  },
];

/**
 * Examples for second person perspective writing
 */
const perspectiveExamples: PromptExample[] = [
  {
    id: 'second-person-correct',
    name: 'Correct Second Person Perspective',
    description: 'Demonstrates proper second person narrative voice',
    content: 'You make your way through the crowded marketplace, avoiding the merchants.',
    categories: ['scene', 'transition', 'action', 'all'],
    priority: 'critical',
    tags: ['perspective', 'second-person', 'correct'],
  },
  {
    id: 'second-person-incorrect',
    name: 'Incorrect Perspective (Avoid)',
    description: 'Shows what NOT to do - third person instead of second',
    content: 'The character travels through the marketplace. (WRONG - use "you" instead)',
    categories: ['scene', 'transition', 'action', 'all'],
    priority: 'critical',
    tags: ['perspective', 'second-person', 'incorrect', 'anti-pattern'],
  },
  {
    id: 'second-person-character-name',
    name: 'Using Character Names in Dialogue',
    description: 'Shows when it\'s appropriate to use character names',
    content: '"Alex, are you alright?" the guard asks. (CORRECT - others use your name in dialogue)',
    categories: ['scene', 'all'],
    priority: 'high',
    tags: ['perspective', 'dialogue', 'character-names'],
  },
];

/**
 * Examples for skill acknowledgment
 */
const skillAcknowledgmentExamples: PromptExample[] = [
  {
    id: 'skill-success-acknowledgment',
    name: 'Success Acknowledgment',
    description: 'How to acknowledge successful skill use naturally',
    content: 'Your training in lockpicking proves invaluable as the tumblers fall into place.',
    categories: ['skill-acknowledgment', 'scene', 'all'],
    priority: 'high',
    tags: ['skill', 'success', 'acknowledgment'],
  },
  {
    id: 'skill-failure-acknowledgment',
    name: 'Failure Acknowledgment',
    description: 'How to acknowledge failed skill attempts constructively',
    content: 'Despite your efforts with the lockpicks, the mechanism remains stubbornly locked.',
    categories: ['skill-acknowledgment', 'scene', 'all'],
    priority: 'high',
    tags: ['skill', 'failure', 'acknowledgment'],
  },
  {
    id: 'skill-expertise-shown',
    name: 'Showing Expertise Through Action',
    description: 'Demonstrate skills through character actions rather than telling',
    content: 'Years of practice show as you effortlessly identify the weak points in the structure.',
    categories: ['skill-acknowledgment', 'scene', 'all'],
    priority: 'medium',
    tags: ['skill', 'show-dont-tell', 'expertise'],
  },
];

/**
 * Examples for choice generation
 */
const choiceExamples: PromptExample[] = [
  {
    id: 'choice-context-summary-tension',
    name: 'Context Summary - Tension',
    description: 'How to write context summaries that capture tension',
    content: 'Tension builds as you must choose how to respond to the merchant\'s accusation.',
    categories: ['choice', 'all'],
    priority: 'high',
    tags: ['choice', 'context-summary', 'tension'],
  },
  {
    id: 'choice-context-summary-stakes',
    name: 'Context Summary - Stakes',
    description: 'Context summary focusing on decision stakes',
    content: 'A critical moment where your response could determine if the alliance forms.',
    categories: ['choice', 'all'],
    priority: 'high',
    tags: ['choice', 'context-summary', 'stakes'],
  },
  {
    id: 'choice-context-summary-suspicion',
    name: 'Context Summary - Suspicion',
    description: 'Context summary that hints at underlying concerns',
    content: 'The stranger\'s offer seems too good to be true.',
    categories: ['choice', 'all'],
    priority: 'medium',
    tags: ['choice', 'context-summary', 'suspicion'],
  },
  {
    id: 'choice-chaotic-creative',
    name: 'Chaotic Choice Example',
    description: 'Demonstrates wildly unexpected chaotic options',
    content: `Examples of CHAOTIC choices:
- "Throw a fireball at the ceiling to create a distraction"
- "Start singing loudly to confuse everyone"
- "Pretend to be possessed by a spirit"
- "Challenge them to a dance-off"`,
    categories: ['choice', 'all'],
    priority: 'medium',
    tags: ['choice', 'chaotic', 'creative', 'alignment'],
  },
];

/**
 * Examples for NPC metadata handling
 */
const npcMetadataExamples: PromptExample[] = [
  {
    id: 'npc-metadata-correct-usage',
    name: 'Correct NPC Metadata Usage',
    description: 'How to properly reference NPCs in metadata',
    content: `In the narrative: "Captain Sarah greets you warmly."
In metadata.characterIds: ["captain-sarah"]
In metadata.speakerId: "captain-sarah" (only when they speak directly to player)`,
    categories: ['scene', 'transition', 'all'],
    priority: 'high',
    tags: ['npc', 'metadata', 'correct'],
  },
  {
    id: 'npc-metadata-off-screen',
    name: 'Off-Screen NPC Handling',
    description: 'How to handle NPCs who are mentioned but not present',
    content: `If an NPC is mentioned but not physically present:
- Add them to metadata.characters for future continuity
- Do NOT add them to metadata.characterIds
- Only on-screen characters belong in characterIds`,
    categories: ['scene', 'all'],
    priority: 'medium',
    tags: ['npc', 'metadata', 'off-screen'],
  },
];

/**
 * Examples for sensory descriptions
 */
const sensoryExamples: PromptExample[] = [
  {
    id: 'sensory-varied-description',
    name: 'Varied Sensory Details',
    description: 'How to use multiple senses without repetition',
    content: `GOOD: "The marketplace buzzes with haggling voices. Silk fabrics brush against your arm. Spices sting your nose."
AVOID: "You smell the bread. You smell the flowers. You smell the perfume." (repetitive)`,
    categories: ['scene', 'transition', 'all'],
    priority: 'medium',
    tags: ['sensory', 'description', 'variety'],
  },
];

/**
 * All examples combined for easy access
 */
export const allExamples: PromptExample[] = [
  ...emphasisExamples,
  ...perspectiveExamples,
  ...skillAcknowledgmentExamples,
  ...choiceExamples,
  ...npcMetadataExamples,
  ...sensoryExamples,
];
