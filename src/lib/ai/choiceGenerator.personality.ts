import { safeTrim } from '@/lib/utils';
import type { StoreCharacter } from '@/state/characterStore';

type PersonalityContext = {
  personality: string;
  goals: string[];
  fears: string[];
  history: string;
};

const trimList = (items: string[] | undefined): string[] =>
  (items ?? []).map((item) => safeTrim(item)).filter(Boolean);

export const extractPersonalityContext = (
  character: StoreCharacter
): PersonalityContext | null => {
  const background = character.background;
  if (!background) {
    return null;
  }

  const personality = safeTrim(background.personality);
  const history = safeTrim(background.history);
  const goals = trimList(background.goals);
  const fears = trimList(background.fears);

  if (!personality && !history && goals.length === 0 && fears.length === 0) {
    return null;
  }

  return {
    personality,
    goals,
    fears,
    history,
  };
};

export const formatPersonalityForChoices = (
  character: StoreCharacter,
  includeAlignmentHints: boolean = true
): string | null => {
  const context = extractPersonalityContext(character);
  if (!context) {
    return null;
  }

  const sections: string[] = ['\n\nCHARACTER PERSONALITY CONTEXT:'];

  if (context.personality) {
    sections.push(`Personality: ${context.personality}`);
  }

  if (context.goals.length > 0) {
    sections.push(`Active Goals:\n${context.goals.map((goal) => `- ${goal}`).join('\n')}`);
  }

  if (context.fears.length > 0) {
    sections.push(`Fears: ${context.fears.join(', ')}`);
  }

  if (context.history) {
    sections.push(`History: ${context.history}`);
  }

  const guidanceLines = [
    'PERSONALITY-ALIGNED CHOICE GUIDANCE:',
    "- Create options that reflect the character's personality traits",
    '- Reference active goals when choices can advance or challenge them',
    '- Consider fears when appropriate (avoidance or confrontation options)',
    '- Balance personality-consistent choices with growth opportunities',
  ];

  if (includeAlignmentHints) {
    guidanceLines.push(
      '- Lawful/neutral/chaotic alignment should consider personality:',
      '  * "cautious" + "diplomatic" traits lean toward lawful',
      '  * "curious" + "independent" traits may favor neutral/chaotic',
      "- Don't force personality alignment if it limits meaningful variety"
    );
  } else {
    // The aligned template carries its own alignment guidance, so this branch
    // only clarifies personality's role. It must not reassert a distribution:
    // the template no longer mandates one, and this section is appended after
    // it, so a contradiction here is the last thing the model reads.
    guidanceLines.push(
      '- Personality guides HOW an alignment is expressed, not which alignments appear'
    );
  }

  return `${sections.join('\n')}\n\n${guidanceLines.join('\n')}`;
};
