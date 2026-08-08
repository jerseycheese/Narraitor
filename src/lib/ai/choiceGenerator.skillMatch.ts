import type { World } from '@/types/world.types';

type WorldSkill = World['skills'][number];

/**
 * Words that appear in almost any option or skill description, so sharing one
 * says nothing about whether the option is about the skill.
 */
const STOP_WORDS = new Set([
  'ability',
  'about',
  'able',
  'also',
  'been',
  'check',
  'from',
  'have',
  'here',
  'into',
  'make',
  'making',
  'more',
  'most',
  'only',
  'other',
  'over',
  'skill',
  'some',
  'take',
  'taking',
  'than',
  'that',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'through',
  'under',
  'used',
  'using',
  'what',
  'when',
  'which',
  'while',
  'with',
  'without',
  'your',
]);

const MIN_TOKEN_LENGTH = 4;

/** The option repeats the skill's name outright. */
const FULL_NAME_SCORE = 6;
/** The option shares a word with the skill's name. */
const NAME_TOKEN_SCORE = 2;
/** The option shares a word with the skill's description. */
const DESCRIPTION_TOKEN_SCORE = 1;
/**
 * One name word, or two description words. Below this the overlap is thin
 * enough that the check would be a guess wearing a skill's name.
 */
const MIN_SCORE = 2;

const singularize = (token: string): string =>
  token.length > MIN_TOKEN_LENGTH && token.endsWith('s') && !token.endsWith('ss')
    ? token.slice(0, -1)
    : token;

const tokenize = (text: string): Set<string> =>
  new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= MIN_TOKEN_LENGTH && !STOP_WORDS.has(token))
      .map(singularize)
  );

const escapeForRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Whether the option says the skill's name outright.
 *
 * Matched on word boundaries rather than by length, so a short name like "Chi"
 * or "Aim" still counts when the option names it - the token threshold below
 * would throw those away - while "Aim" stays out of "claim".
 */
const mentionsFullName = (skillName: string, optionText: string): boolean => {
  const name = skillName.trim().toLowerCase();
  if (name === '') {
    return false;
  }
  return new RegExp(`(^|[^a-z0-9])${escapeForRegExp(name)}([^a-z0-9]|$)`).test(optionText);
};

const countOverlap = (candidates: Set<string>, optionTokens: Set<string>): number => {
  let matches = 0;
  candidates.forEach((token) => {
    if (optionTokens.has(token)) {
      matches += 1;
    }
  });
  return matches;
};

const scoreSkill = (
  skill: WorldSkill,
  optionText: string,
  optionTokens: Set<string>
): number => {
  if (mentionsFullName(skill.name, optionText)) {
    return FULL_NAME_SCORE;
  }

  const nameTokens = tokenize(skill.name);
  const descriptionTokens = tokenize(skill.description ?? '');
  nameTokens.forEach((token) => descriptionTokens.delete(token));

  return (
    countOverlap(nameTokens, optionTokens) * NAME_TOKEN_SCORE +
    countOverlap(descriptionTokens, optionTokens) * DESCRIPTION_TOKEN_SCORE
  );
};

/**
 * The world skill an option is actually about, or null when its own words
 * don't point at one.
 *
 * Null is a real answer, not a failure to decide. A check the player is told
 * they failed has to be the thing the action asked of them, so when the text
 * points nowhere - or points at two skills equally well - the option is better
 * off carrying no check than an arbitrary named one.
 */
export const matchSkillToOption = (
  optionText: string,
  optionHint: string | undefined,
  worldSkills: WorldSkill[]
): WorldSkill | null => {
  if (worldSkills.length === 0) {
    return null;
  }

  const combinedText = `${optionText} ${optionHint ?? ''}`.toLowerCase();
  const optionTokens = tokenize(combinedText);

  const ranked = worldSkills
    .map((skill) => ({ skill, score: scoreSkill(skill, combinedText, optionTokens) }))
    .sort((a, b) => b.score - a.score);

  const [best, runnerUp] = ranked;
  if (best.score < MIN_SCORE) {
    return null;
  }
  if (runnerUp && runnerUp.score === best.score) {
    return null;
  }

  return best.skill;
};
