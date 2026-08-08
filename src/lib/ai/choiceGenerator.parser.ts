import { generateUniqueId } from '@/lib/utils/generateId';
import { truncate, safeTrim } from '@/lib/utils';
import { normalizeText, NORM_NAME, NORM_DESC } from '@/lib/utils/textNormalization';
import type {
  Decision,
  DecisionOption,
  NarrativeContext,
  ChoiceAlignment,
  Consequence,
} from '@/types/narrative.types';
import type { World } from '@/types/world.types';
import { logger } from '@/lib/utils/logger';
type ParsedSkillRequirement = {
  type: 'skill';
  targetId: string;
  operator: 'gte';
  value: number;
};

/** NPC roster entry used to resolve consequence targets by name. */
export type KnownNpc = {
  id: string;
  name: string;
};

const MAX_TRUST_DELTA = 20;

export const parseChoiceResponse = (
  content: string,
  narrativeContext: NarrativeContext,
  world: World,
  knownNpcs: KnownNpc[] = []
): Decision => {
  const decisionId = generateUniqueId('decision');

  try {
    const cleanedContent = content.replace(
      /Decision Weight:?\s*\[?[^\]\n]+\]?\s*\n?/i,
      ''
    );

    let decisionWeight: 'minor' | 'major' | 'critical' = 'minor';
    const weightMatch = content.match(/Decision Weight:?\s*\[?([^\]\n]+)\]?/i);

    if (weightMatch && weightMatch[1]) {
      const weightText = safeTrim(weightMatch[1]).toLowerCase();
      if (weightText === 'major') {
        decisionWeight = 'major';
      } else if (weightText === 'critical') {
        decisionWeight = 'critical';
      }
    }

    let contextSummary = '';
    const contextMatch = content.match(/Context Summary:?\s*([^\n]+)/i);
    if (contextMatch && contextMatch[1]) {
      contextSummary = safeTrim(contextMatch[1]);
    }

    let prompt = '';
    const promptMatch = cleanedContent.match(/^Decision:?\s*(.+)$/im);
    if (promptMatch && promptMatch[1]) {
      prompt = safeTrim(promptMatch[1]);
      if (!prompt || prompt.length < 3) {
        prompt = 'What will you do?';
      }
    } else {
      prompt = 'What will you do?';
    }

    const options: DecisionOption[] = [];
    const lines = cleanedContent.split('\n');
    let currentOption:
      | (Partial<DecisionOption> & {
          hint?: string;
          requirements?: {
            type: string;
            targetId: string;
            operator: string;
            value: number;
          }[];
        })
      | null = null;

    for (const line of lines) {
      const trimmed = safeTrim(line);
      const optionMatch = trimmed.match(/^(\d+)\.\s*(.+)$/);
      if (optionMatch) {
        if (currentOption) {
          options.push(finalizeOption(currentOption));
        }

        const optionText = safeTrim(optionMatch[2]);
        const alignmentMatch = optionText.match(/^\[([^\]]+)\]\s*(.+)$/);
        let alignment: ChoiceAlignment = 'neutral';
        let text = optionText;

        if (alignmentMatch) {
          const alignmentText = safeTrim(alignmentMatch[1]).toLowerCase();
          if (alignmentText === 'lawful') {
            alignment = 'lawful';
          } else if (alignmentText === 'chaos' || alignmentText === 'chaotic') {
            alignment = 'chaotic';
          }
          text = safeTrim(alignmentMatch[2]);
        }

        const inlineRequirement = extractInlineSkillRequirement(text);
        text = inlineRequirement.cleanedText;

        currentOption = {
          id: generateUniqueId('option'),
          text,
          alignment,
          hint: undefined,
          requirements: [],
        };

        if (inlineRequirement.requirementText) {
          const parsedRequirement = parseSkillRequirementText(
            inlineRequirement.requirementText,
            world
          );
          if (parsedRequirement) {
            addSkillRequirement(currentOption, parsedRequirement);
          }
        }
        continue;
      }

      const hintMatch = trimmed.match(/^Hint:\s*(.+)$/i);
      if (hintMatch) {
        if (currentOption) {
          currentOption.hint = safeTrim(hintMatch[1]);
        }
        continue;
      }

      const reqMatch = trimmed.match(/^Requirements?:\s*(.+)$/i);
      if (reqMatch) {
        if (currentOption) {
          const parsedRequirement = parseSkillRequirementText(reqMatch[1], world);
          if (parsedRequirement) {
            addSkillRequirement(currentOption, parsedRequirement);
          }
        }
        continue;
      }

      const consMatch = trimmed.match(/^Consequences?:\s*(.+)$/i);
      if (consMatch && currentOption) {
        const consequences = parseConsequencesText(consMatch[1], knownNpcs);
        if (consequences.length > 0) {
          currentOption.consequences = consequences;
        }
      }
    }

    if (currentOption) {
      options.push(finalizeOption(currentOption));
    }

    return {
      id: decisionId,
      prompt,
      options: options.length > 0 ? options : createDefaultOptions(),
      decisionWeight,
      contextSummary:
        contextSummary || createFallbackContextSummary(narrativeContext),
    };
  } catch (error) {
    logger.error('Error parsing choice response:', error);
    return {
      id: decisionId,
      prompt: 'What will you do?',
      options: createDefaultOptions(),
    };
  }
};

export const createFallbackContextSummary = (
  narrativeContext: NarrativeContext
): string => {
  const location = narrativeContext.currentLocation || 'an unknown location';
  const recentSegments =
    narrativeContext.recentSegments || narrativeContext.previousSegments || [];
  if (recentSegments.length > 0) {
    const latestSegment = recentSegments[recentSegments.length - 1];
    if (latestSegment && latestSegment.content) {
      const firstSentence = latestSegment.content.split('.')[0];
      const contextText =
        firstSentence.length > 100
          ? truncate(firstSentence, 100)
          : `${firstSentence}.`;

      return contextText;
    }
  }

  if (narrativeContext.currentSituation) {
    return narrativeContext.currentSituation;
  }

  return `You find yourself at ${location}, considering your next move.`;
};

const createDefaultOptions = (): DecisionOption[] => [
  { id: generateUniqueId('option'), text: 'Continue', alignment: 'neutral' },
  { id: generateUniqueId('option'), text: 'Look around', alignment: 'neutral' },
  { id: generateUniqueId('option'), text: 'Wait', alignment: 'neutral' },
];

const finalizeOption = (
  option: Partial<DecisionOption> & {
    hint?: string;
    requirements?: {
      type: string;
      targetId: string;
      operator: string;
      value: number;
    }[];
  }
): DecisionOption => {
  const normalizedText = normalizeText(option.text || 'Unknown option', NORM_NAME);

  const finalOption: DecisionOption = {
    id: option.id || generateUniqueId('option'),
    text: normalizedText,
    alignment: option.alignment || 'neutral',
  };

  if (option.hint && safeTrim(option.hint)) {
    finalOption.hint = normalizeText(safeTrim(option.hint), NORM_DESC);
  }

  if (option.requirements && option.requirements.length > 0) {
    finalOption.requirements = option.requirements;
  }

  if (option.consequences && option.consequences.length > 0) {
    finalOption.consequences = option.consequences;
  }

  return finalOption;
};

/**
 * Parses a per-option "Consequences:" line into structured relationship
 * consequences, e.g. "Marta trust -15, Guild Master trust +5". Names are
 * resolved case-insensitively against the world's NPC roster; unknown names
 * are dropped with a warning (mirrors skill-requirement handling). The
 * emitted value shape ({ trustDelta }) is exactly what narrativeStore's
 * extractWorldStateImpacts already consumes.
 */
const parseConsequencesText = (
  text: string,
  knownNpcs: KnownNpc[]
): Consequence[] => {
  const consequences: Consequence[] = [];

  for (const clause of text.split(/[,;]/)) {
    const trimmedClause = safeTrim(clause);
    if (!trimmedClause) continue;

    const match = trimmedClause.match(/^(.+?)\s+trust\s+([+-]?\d+)$/i);
    if (!match) continue;

    const name = safeTrim(match[1]).replace(/\s+/g, ' ');
    const npc = knownNpcs.find(
      (candidate) => safeTrim(candidate.name).toLowerCase() === name.toLowerCase()
    );

    if (!npc) {
      logger.warn(
        `[ChoiceGenerator] Unknown character "${name}" in consequence - skipping`
      );
      continue;
    }

    const rawDelta = parseInt(match[2], 10);
    if (!Number.isFinite(rawDelta) || rawDelta === 0) continue;
    const trustDelta = Math.max(-MAX_TRUST_DELTA, Math.min(MAX_TRUST_DELTA, rawDelta));

    consequences.push({
      type: 'relationship',
      action: 'modify',
      targetId: npc.id,
      value: { trustDelta },
    });
  }

  return consequences;
};

/** Alignment shift magnitude per decision weight. */
const ALIGNMENT_SHIFT_BY_WEIGHT: Record<'minor' | 'major' | 'critical', number> = {
  minor: 4,
  major: 8,
  critical: 12,
};

/**
 * Composes a deterministic alignment consequence onto every lawful/chaotic
 * option, scaled by the decision weight. This is client-side composition
 * from the option's existing alignment tag — the choice contract carries a
 * structured alignment shift even when the model emits nothing extra.
 * Neutral options get no alignment consequence.
 */
export const applyAlignmentConsequences = (decision: Decision): Decision => {
  const magnitude = ALIGNMENT_SHIFT_BY_WEIGHT[decision.decisionWeight ?? 'minor'];

  decision.options = decision.options.map((option) => {
    if (option.alignment !== 'lawful' && option.alignment !== 'chaotic') {
      return option;
    }
    if (option.consequences?.some((consequence) => consequence.type === 'alignment')) {
      return option;
    }

    const alignmentConsequence: Consequence = {
      type: 'alignment',
      action: 'add',
      targetId: 'player-alignment',
      value: option.alignment === 'lawful' ? magnitude : -magnitude,
    };

    return {
      ...option,
      consequences: [...(option.consequences ?? []), alignmentConsequence],
    };
  });

  return decision;
};

const parseSkillRequirementText = (
  reqText: string,
  world: World
): ParsedSkillRequirement | null => {
  const normalizedReqText = safeTrim(reqText);
  const skillMatch = normalizedReqText.match(/^\[?\s*(.+?)\s+(\d+)\+?\s*\]?$/);
  if (!skillMatch) {
    return null;
  }

  const skillName = safeTrim(skillMatch[1]).replace(/\s+/g, ' ');
  const normalizedSkillName = skillName.toLowerCase();
  const level = parseInt(skillMatch[2]);
  const worldSkill = world.skills?.find(
    (ws) => safeTrim(ws.name).toLowerCase() === normalizedSkillName
  );

  if (!worldSkill) {
    logger.warn(
      `[ChoiceGenerator] Unknown skill "${skillName}" in AI response - skipping requirement`
    );
    return null;
  }

  return {
    type: 'skill',
    targetId: worldSkill.id,
    operator: 'gte',
    value: level,
  };
};

const extractInlineSkillRequirement = (
  optionText: string
): { cleanedText: string; requirementText?: string } => {
  const text = safeTrim(optionText);
  const inlinePatterns = [
    /\s*\[\s*([^\]]*?\d+\+?)\s*\]\s*$/i,
    /\s*\(\s*([^)]*?\d+\+?)\s*\)\s*$/i,
    // "Requirements?" comes first: alternation takes the first match, so
    // `requires?` would otherwise consume "Require" out of "Requirements" and
    // then fail on the trailing "ments:", leaving the whole phrase in the
    // option text for the player to read.
    /\s*(?:-|\u2013|\u2014)?\s*(?:requirements?|requires?|req\.?)\s*[:\-]?\s*([a-z][a-z\s/-]*\s+\d+\+?)\s*$/i,
  ];

  for (const pattern of inlinePatterns) {
    const match = text.match(pattern);
    if (match) {
      const cleanedText = safeTrim(text.replace(pattern, ''));
      return {
        cleanedText,
        requirementText: safeTrim(match[1]),
      };
    }
  }

  return { cleanedText: text };
};

const addSkillRequirement = (
  option: Partial<DecisionOption> & {
    requirements?: {
      type: string;
      targetId: string;
      operator: string;
      value: number;
    }[];
  },
  requirement: ParsedSkillRequirement
): void => {
  if (!option.requirements) {
    option.requirements = [];
  }

  const exists = option.requirements.some(
    (req) =>
      req.type === requirement.type &&
      req.targetId === requirement.targetId &&
      req.operator === requirement.operator &&
      req.value === requirement.value
  );

  if (!exists) {
    option.requirements.push(requirement);
  }
};
