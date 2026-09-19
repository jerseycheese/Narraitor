/**
 * A world without its art, for AI request bodies.
 *
 * World art can be an inline data URL megabytes long. No AI route reads it, and
 * sending it pushes requests past the platform's body limit, which answers 413.
 *
 * @param world - The world to send, or nothing.
 * @returns The same world minus `image`; anything else passes through.
 */
export function withoutWorldImage<T>(world: T): T {
  if (!world || typeof world !== 'object' || !('image' in world)) return world;

  const { image: _image, ...rest } = world as Record<string, unknown>;
  return rest as T;
}
