/**
 * @fileoverview Skill Acknowledgment Template
 *
 * This template guides AI to acknowledge skill usage in narrative generation,
 * making player abilities feel meaningful to the story progression.
 */

import { NarrativeContext } from '@/types/narrative.types';
import {
  SKILL_ACKNOWLEDGMENT_EXAMPLES,
  shouldIncludeExamples,
} from '../../examples';

interface SkillAcknowledgmentContext {
  worldName: string;
  genre?: string;
  narrativeContext?: NarrativeContext;
  playerCharacterName?: string;
  skillUsed?: {
    skillId: string;
    skillName: string;
    success: boolean;
    difficulty: number;
  };
  customAction?: {
    action: string;
    implicitSkills?: string[];
  };
}

/**
 * Template for generating narrative that acknowledges skill usage
 * Used when player actions involve skill checks or demonstrate character abilities
 */
export const skillAcknowledgmentTemplate = (context: SkillAcknowledgmentContext): string => {
  const { 
    worldName, 
    genre, 
    narrativeContext, 
    playerCharacterName,
    skillUsed,
    customAction
  } = context;
  
  // Extract recent narrative for context
  const recentContent = narrativeContext?.recentSegments
    ?.slice(-1)
    .map(segment => segment.content)
    .join('\n\n') || '';

  // Build skill context information
  let skillContext = '';
  if (skillUsed) {
    skillContext = `
SKILL CHECK RESULT:
- Skill Used: ${skillUsed.skillName} (${skillUsed.skillId})
- Difficulty: ${skillUsed.difficulty}
- Result: ${skillUsed.success ? 'SUCCESS' : 'FAILURE'}`;
  } else if (customAction && customAction.implicitSkills) {
    skillContext = `
CUSTOM ACTION WITH IMPLICIT SKILLS:
- Player Action: ${customAction.action}
- Relevant Skills: ${customAction.implicitSkills.join(', ')}
- Acknowledge the character's relevant abilities in performing this action`;
  }

  const baseContent = `Generate a narrative response for "${worldName}" that meaningfully acknowledges the character's skill usage.

World: ${worldName}
${genre ? `Genre: ${genre}` : ''}
Character: ${playerCharacterName || 'The protagonist'}

PREVIOUS NARRATIVE CONTEXT:
${recentContent}

${skillContext}

SKILL ACKNOWLEDGMENT GUIDELINES:
${skillUsed?.success ? `
SUCCESS ACKNOWLEDGMENT:
- Highlight the character's competence and expertise with ${skillUsed.skillName}
- Show how their skill training/experience paid off
- Reference specific techniques or knowledge they demonstrated
- Make the success feel earned and meaningful
- Other characters or the environment should react appropriately to their skillful performance
` : ''}

${skillUsed?.success === false ? `
FAILURE ACKNOWLEDGMENT:
- Acknowledge the attempt while showing why it didn't work
- Reference what the character learned or how they could improve
- Show consequences that are meaningful but not overly punishing for MVP
- Keep it constructive - focus on growth opportunities
` : ''}

${customAction ? `
CUSTOM ACTION ACKNOWLEDGMENT:
- Naturally weave in how the character's relevant skills influenced their approach
- Show their thought process or instincts based on their abilities
- Reference how their background/training guided their choice of action
- Make the action feel authentic to their skill set
` : ''}

NARRATIVE REQUIREMENTS:
1. Write in SECOND PERSON perspective (using "you")
2. Keep the response focused and concise (2-4 sentences)
3. Maintain the ${genre || 'appropriate'} tone and atmosphere
4. Ensure skill acknowledgment feels natural, not forced
5. Advance the story while acknowledging the skill usage
6. Show don't tell - demonstrate skill through action and reaction

CRITICAL: Make the character's abilities feel like they truly matter to the story outcome.`;

  // Both the success and failure examples ship regardless of what happened —
  // the model needs to see the contrast to phrase either outcome well.
  const tokenBudget = 120;
  const examplesSection = shouldIncludeExamples(tokenBudget, recentContent.length)
    ? SKILL_ACKNOWLEDGMENT_EXAMPLES
    : '';

  return `${baseContent}${examplesSection}

Response Format:
{
  "content": "The narrative response that acknowledges skill usage...",
  "metadata": {
    "skillsUsed": [
      {
        "skillId": "${skillUsed?.skillId || 'custom'}",
        "skillName": "${skillUsed?.skillName || 'general ability'}",
        "success": ${skillUsed?.success || true},
        "difficulty": ${skillUsed?.difficulty || 5}
      }
    ],
    "mood": "appropriate mood based on success/failure",
    "location": "${narrativeContext?.currentLocation || 'current location'}",
    "tags": ["skill-acknowledgment", "${skillUsed?.success ? 'skill-success' : 'skill-failure'}", "${skillUsed?.skillId || 'custom-action'}"],
    "itemsLost": []
  }
}`;
};

