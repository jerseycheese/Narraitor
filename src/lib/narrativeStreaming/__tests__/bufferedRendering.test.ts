import { tokenizeForBufferedRendering, buildBufferedChunks } from '../bufferedRendering';

describe('tokenizeForBufferedRendering', () => {
  it('preserves whitespace tokens for stable reconstruction', () => {
    expect(tokenizeForBufferedRendering('A  B\nC')).toEqual(['A', '  ', 'B', '\n', 'C']);
  });

  it('handles empty strings', () => {
    expect(tokenizeForBufferedRendering('')).toEqual([]);
  });

  it('handles strings with only whitespace', () => {
    expect(tokenizeForBufferedRendering('   \n  ')).toEqual(['   ', '\n', '  ']);
  });

  it('handles strings with multiple words and spaces', () => {
    expect(tokenizeForBufferedRendering('New content being streamed.')).toEqual([
      'New', ' ', 'content', ' ', 'being', ' ', 'streamed.'
    ]);
  });
});

describe('buildBufferedChunks', () => {
  it('chunks tokens deterministically', () => {
    const tokens = ['A', ' ', 'B', ' ', 'C'];
    expect(buildBufferedChunks(tokens, 2)).toEqual(['A ', 'B ', 'C']);
  });

  it('handles remainder tokens in the last chunk', () => {
    const tokens = ['A', ' ', 'B', ' ', 'C', ' ', 'D'];
    expect(buildBufferedChunks(tokens, 3)).toEqual(['A B', ' C ', 'D']);
  });

  it('returns empty array for empty tokens', () => {
    expect(buildBufferedChunks([], 5)).toEqual([]);
  });
});
