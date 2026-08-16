import { DecisionOption } from '@/types/narrative.types';
import { safeTrim } from '@/lib/utils';

/**
 * An offered option is a verb phrase, so it reads as "You choose to <option>".
 */
const formatOfferedOption = (text: string): string => {
  const trimmed = safeTrim(text);
  if (!trimmed) return '';

  const withoutYou = trimmed.replace(/^you\b\s*/i, '');
  const withoutChoose = withoutYou.replace(/^(choose|decide|decided|chose)\s+to\s+/i, '');
  const withoutTo = withoutChoose.replace(/^to\s+/i, '');
  const firstChar = withoutTo.charAt(0);
  const normalized = /[A-Z]/.test(firstChar)
    ? `${firstChar.toLowerCase()}${withoutTo.slice(1)}`
    : withoutTo;

  return `You choose to ${normalized}`.trim();
};

/**
 * A typed action is already a complete first-person sentence, and prefixing one
 * shifts person as well as case ("You choose to i walk over to the mill"), so it
 * renders as the player wrote it.
 */
const formatTypedAction = (option: DecisionOption): string => {
  const typed = safeTrim(option.customText || option.text);
  if (!typed) return '';

  const firstChar = typed.charAt(0);
  return /[a-z]/.test(firstChar)
    ? `${firstChar.toUpperCase()}${typed.slice(1)}`
    : typed;
};

/**
 * Renders a selected decision option as the sentence shown on the consequence
 * card. The display layer re-derives it from the option rather than trusting
 * the persisted `causedByDecisionText`, so sessions saved before this existed
 * render correctly too.
 */
export const formatDecisionText = (option: DecisionOption): string =>
  option.isCustomInput ? formatTypedAction(option) : formatOfferedOption(option.text);
