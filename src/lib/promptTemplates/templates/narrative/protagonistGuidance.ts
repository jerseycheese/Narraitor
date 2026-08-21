/**
 * The one place a choice prompt learns who the player is.
 *
 * Choice prompts carry a roster of named characters and a slab of narrative
 * prose, and the player's name turns up in both - other characters address
 * them by name, so it is in the passage whether or not it is in the roster.
 * Without this block nothing marks which of those names belongs to the person
 * making the choice, and the model writes options that question, negotiate
 * with, or demand answers from the player themselves.
 */
export const protagonistGuidance = (playerCharacterName?: string): string => {
  const name = playerCharacterName?.trim();
  if (!name) return '';

  return `

PROTAGONIST: The player is ${name}. Every option is an action they take, so ${name} is never the person an option targets, questions, or bargains with. Any other name in the context belongs to someone else in the scene.`;
};
