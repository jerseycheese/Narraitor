/**
 * Which character a play session in a world runs as.
 *
 * The current character when it belongs to the world, otherwise the world's
 * first character. The play screen and the world card both ask this, and they
 * must agree, or the card reports a saved session the play screen won't resume.
 *
 * @param characters - Every character, keyed by id.
 * @param currentCharacterId - The globally selected character, if any.
 * @param worldId - The world being played.
 * @returns The character id, or null when the world has no characters.
 */
export function resolveSessionCharacterId(
  characters: Record<string, { id: string; worldId: string }>,
  currentCharacterId: string | null | undefined,
  worldId: string
): string | null {
  if (currentCharacterId && characters[currentCharacterId]?.worldId === worldId) {
    return currentCharacterId;
  }

  return Object.values(characters).find((char) => char.worldId === worldId)?.id ?? null;
}
