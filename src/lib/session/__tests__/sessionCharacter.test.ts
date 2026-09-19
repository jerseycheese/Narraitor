import { resolveSessionCharacterId } from '../sessionCharacter';

const characters = {
  a: { id: 'a', worldId: 'w1' },
  b: { id: 'b', worldId: 'w1' },
  c: { id: 'c', worldId: 'w2' },
};

describe('resolveSessionCharacterId', () => {
  it('plays as the current character when it belongs to the world', () => {
    expect(resolveSessionCharacterId(characters, 'b', 'w1')).toBe('b');
  });

  it("falls back to the world's first character, or null when it has none", () => {
    expect(resolveSessionCharacterId(characters, 'c', 'w1')).toBe('a');
    expect(resolveSessionCharacterId(characters, null, 'w3')).toBeNull();
  });
});
