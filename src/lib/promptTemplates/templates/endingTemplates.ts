// src/lib/promptTemplates/templates/endingTemplates.ts

import type { PromptTemplate } from '../types';
import { PromptType } from '../types';
import type { EndingType, EndingTone } from '../../../types/narrative.types';

// Tone descriptions for reference (currently unused but may be needed for future enhancements)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const toneDescriptions: Record<EndingTone, string> = {
  triumphant: 'victorious and celebratory, emphasizing achievements and success',
  bittersweet: 'mixed emotions combining victory with loss or sacrifice',
  mysterious: 'enigmatic and open-ended, leaving questions unanswered',
  tragic: 'sorrowful and melancholic, focusing on loss and sacrifice',
  hopeful: 'optimistic and forward-looking, emphasizing new beginnings'
};

const endingTypeDescriptions: Record<EndingType, string> = {
  'player-choice': 'The player has chosen to end their story here',
  'story-complete': 'The main quest or narrative arc has reached its natural conclusion',
  'session-limit': 'The gaming session has reached a good stopping point',
  'character-retirement': 'The character has decided to retire from adventuring'
};

export const endingTemplate: PromptTemplate = {
  id: 'ending',
  name: 'Story Ending Generator',
  type: PromptType.NARRATIVE,
  
  content: `You are a master storyteller creating a satisfying ending for an interactive narrative game session.

CONTEXT:
World: {{worldName}} - {{worldDescription}}
Character: {{characterName}}, {{characterClass}} (Level {{characterLevel}})
Character Background: {{characterBackground}}
Character Personality: {{characterPersonality}}
Character Goals: {{characterGoals}}

ENDING TYPE: {{endingType}}
{{endingTypeDescription}}

STORY SUMMARY:
Recent narrative events:
{{recentNarrative}}

Key moments from the journey:
{{journalEntries}}

Additional instructions:
{{customPrompt}}

Generate a complete story ending with the following components:

1. CHOOSE AN APPROPRIATE TONE:
   - Analyze the story context and choose the most fitting emotional tone
   - Available tones: triumphant, bittersweet, mysterious, tragic, hopeful
   - Base your choice on the character's journey and recent events

2. EPILOGUE (2-3 paragraphs):
   - Describe how the story concludes for {{characterName}}
   - Reference specific events from their journey
   - Match the chosen tone throughout
   - Provide narrative closure while respecting the ending type

3. CHARACTER LEGACY (1 paragraph):
   - How will {{characterName}} be remembered?
   - What impact did they have on others?
   - Keep it concise and meaningful

4. WORLD IMPACT (1 short paragraph):
   - How has {{worldName}} changed because of {{characterName}}'s actions?
   - What lasting effects remain from their journey?
   - Keep it brief and focused

5. ACHIEVEMENTS (3-5 specific accomplishments):
   - List concrete achievements based on the narrative
   - Make them feel earned and specific to this story
   - Avoid generic achievements

FORMAT YOUR RESPONSE AS JSON:
{
  "epilogue": "Your epilogue text here...",
  "characterLegacy": "Your character legacy text here...",
  "worldImpact": "Your world impact text here...",
  "tone": "triumphant",
  "achievements": ["Achievement 1", "Achievement 2", "Achievement 3"]
}

IMPORTANT: The "tone" field must be exactly one of these values: triumphant, bittersweet, mysterious, tragic, hopeful

Remember to:
- Choose the tone that best fits the story's context and events
- Make the ending feel earned and satisfying
- Reference specific story events, not generic fantasy tropes
- Match your chosen tone throughout all sections
- Provide closure while leaving room for imagination
- Keep the language evocative and engaging`,

  variables: [
    { name: 'worldName', type: 'string', description: 'Name of the world' },
    { name: 'worldDescription', type: 'string', description: 'Description of the world' },
    { name: 'characterName', type: 'string', description: 'Name of the character' },
    { name: 'characterClass', type: 'string', description: 'Class of the character' },
    { name: 'characterLevel', type: 'number', description: 'Level of the character' },
    { name: 'characterBackground', type: 'string', description: 'Background of the character' },
    { name: 'characterPersonality', type: 'string', description: 'Personality of the character' },
    { name: 'characterGoals', type: 'string', description: 'Goals of the character' },
    { name: 'endingType', type: 'string', description: 'Type of ending' },
    { name: 'endingTypeDescription', type: 'string', description: 'Description of ending type' },
    { name: 'recentNarrative', type: 'string', description: 'Recent narrative content' },
    { name: 'journalEntries', type: 'string', description: 'Journal entries' },
    { name: 'customPrompt', type: 'string', description: 'Custom prompt from user' }
  ]
};

// Helper function to prepare ending template variables
export function prepareEndingTemplateVariables(
  world: { name: string; description?: string },
  character: { name: string; class?: string; level?: number; background?: string; personality?: string; goals?: string },
  endingType: EndingType,
  recentNarrative: string[],
  journalEntries?: string[],
  customPrompt?: string
): Record<string, string | number> {
  return {
    worldName: world.name,
    worldDescription: world.description || 'A mysterious realm',
    characterName: character.name,
    characterClass: character.class || 'Adventurer',
    characterLevel: character.level || 1,
    characterBackground: character.background || 'A mysterious traveler',
    characterPersonality: character.personality || 'Determined and brave',
    characterGoals: character.goals || 'Seek adventure and glory',
    endingType,
    endingTypeDescription: endingTypeDescriptions[endingType],
    recentNarrative: recentNarrative.join('\n'),
    journalEntries: journalEntries?.length ? journalEntries.join('\n') : 'No significant events recorded in journal.',
    customPrompt: customPrompt || 'No additional instructions.'
  };
}