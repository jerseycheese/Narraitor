/**
 * What the world can take. The character's current conditions are state the
 * story has to carry, and a world-clock thread that lands has to leave a
 * mark the game can record: an item in itemsLost, or a condition the
 * post-segment extraction writes to the character. Rendered only when the
 * WORLD_COST flag is on (see enhancePromptWithWorldCost), so every other
 * prompt path is unchanged.
 */
export const worldCostBlock = (conditions: string[]): string => {
  const carried = conditions.length > 0 ? conditions.join('; ') : '(nothing yet)';

  return `
WHAT THE WORLD CAN TAKE:
The character currently carries: ${carried}
- Those hold until the story changes them. Write the character as someone carrying them; do not heal, clear or forget one unless this passage shows it ending.
- When a WORLD CLOCK thread lands on the character, the landing costs them something recordable: an item they hold (name it in itemsLost with lossReason "stolen" or "destroyed"), or a wound or lasting state the character now carries, stated plainly in the prose in the character's terms. A threat that has arrived and takes nothing has not landed.
`;
};
