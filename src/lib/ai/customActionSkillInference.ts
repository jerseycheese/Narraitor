// Infers d20 skill checks for free-text custom actions so typed actions get the
// same mechanical depth as predefined choices (issue #918). Builds on PR #915:
// the returned DecisionRequirement[] feeds the existing skill-check evaluation
// in NarrativeController unchanged.

import { AIClient } from './types';
import { createDefaultGeminiClient } from './defaultGeminiClient';
import type { World, WorldSkill } from '@/types/world.types';
import type { StoreCharacter } from '@/state/characterStore';
import type { DecisionRequirement, NarrativeSegment } from '@/types/narrative.types';
import { safeTrim } from '@/lib/utils';
import { extractFencedJson } from './parseJSON';

import Logger from '@/lib/utils/logger';
const logger = new Logger('CustomActionSkillInference');

export interface CustomActionSkillInferenceParams {
  /** The free-text action the player typed. */
  actionText: string;
  character: StoreCharacter;
  world: World;
  /** Recent narrative for situational fit; only the last couple are used. */
  recentSegments?: NarrativeSegment[];
}

/**
 * Ask the AI whether a typed action needs a skill check, which skill(s) apply,
 * and at what difficulty. Returns skill-type DecisionRequirements ready for the
 * existing evaluator. Returns [] when no check fits, or on any failure (graceful
 * degradation - a typed action may legitimately need no roll).
 */
export async function inferCustomActionSkillChecks(
  params: CustomActionSkillInferenceParams,
  aiClient: AIClient = createDefaultGeminiClient()
): Promise<DecisionRequirement[]> {
  const { actionText, world } = params;
  const worldSkills = world.skills ?? [];

  if (!safeTrim(actionText) || worldSkills.length === 0) {
    return [];
  }

  try {
    const prompt = buildInferencePrompt(params, worldSkills);
    const response = await aiClient.generateContent(prompt);

    if (!response?.content) {
      return [];
    }

    return parseInferenceResponse(response.content, worldSkills);
  } catch (error) {
    logger.warn('Skill inference failed - proceeding without a check', error);
    return [];
  }
}

function buildInferencePrompt(
  params: CustomActionSkillInferenceParams,
  worldSkills: WorldSkill[]
): string {
  const { actionText, character, recentSegments } = params;

  const skillLines = worldSkills
    .map((skill) => {
      const characterSkill = character.skills.find(
        (cs) => (cs.worldSkillId || cs.id) === skill.id
      );
      const level = characterSkill?.level ?? 0;
      const description = skill.description ? ` | ${skill.description}` : '';
      return `- id: "${skill.id}" | name: "${skill.name}" | difficulty range: ${skill.minValue}-${skill.maxValue} | character level: ${level}${description}`;
    })
    .join('\n');

  const recent = (recentSegments ?? [])
    .slice(-2)
    .map((segment) => segment.content)
    .filter(Boolean)
    .join('\n\n');
  const recentContext = recent ? `\n\nRECENT NARRATIVE:\n${recent}` : '';

  return `You are a tabletop RPG game master deciding whether a player's freeform action requires a d20 skill check.

PLAYER ACTION:
"${actionText}"

AVAILABLE SKILLS (use the exact id when referencing a skill):
${skillLines}${recentContext}

Decide:
1. Does this action have a meaningful chance of failure that warrants a skill check? Routine or purely narrative actions (looking around, talking casually, walking somewhere safe) need NO check.
2. If a check is warranted, which skill(s) apply? Usually exactly one; at most two when the action genuinely spans two skills.
3. What difficulty fits? Pick an integer within the skill's listed difficulty range, higher for harder feats.

Respond with ONLY a JSON block in this exact format:

\`\`\`json
{
  "skillCheckNeeded": true,
  "checks": [
    { "skillId": "exact-skill-id-from-the-list", "difficulty": 3 }
  ]
}
\`\`\`

If no check is needed, return { "skillCheckNeeded": false, "checks": [] }.`;
}

function parseInferenceResponse(
  content: string,
  worldSkills: WorldSkill[]
): DecisionRequirement[] {
  const fenced = extractFencedJson(content);
  if (!fenced) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fenced);
  } catch {
    return [];
  }

  const result = parsed as { skillCheckNeeded?: unknown; checks?: unknown };
  if (result.skillCheckNeeded === false || !Array.isArray(result.checks)) {
    return [];
  }

  const requirements: DecisionRequirement[] = [];
  for (const raw of result.checks as Array<Record<string, unknown>>) {
    const skillId = typeof raw.skillId === 'string' ? raw.skillId : undefined;
    if (!skillId) {
      continue;
    }

    const worldSkill = worldSkills.find((ws) => ws.id === skillId);
    if (!worldSkill) {
      logger.warn(`Inferred skill "${skillId}" not found in world - dropping`);
      continue;
    }

    requirements.push({
      type: 'skill',
      targetId: skillId,
      operator: 'gte',
      value: clampDifficulty(Number(raw.difficulty), worldSkill),
    });
  }

  return requirements;
}

// Keep difficulty inside the skill's own range so DC (difficulty * 2) stays sane.
function clampDifficulty(value: number, skill: WorldSkill): number {
  const min = Number.isFinite(skill.minValue) ? skill.minValue : 1;
  const max = Number.isFinite(skill.maxValue) ? skill.maxValue : 10;
  const fallback = Number.isFinite(skill.baseValue) ? skill.baseValue : min;
  const candidate = Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, Math.round(candidate)));
}
