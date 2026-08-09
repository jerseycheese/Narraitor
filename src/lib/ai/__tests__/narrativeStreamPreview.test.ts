import { extractStreamingContentPreview } from '../narrativeStreamPreview';

describe('extractStreamingContentPreview', () => {
  it('returns nothing before the "content" field key has arrived', () => {
    expect(extractStreamingContentPreview('')).toBe('');
    expect(extractStreamingContentPreview('{')).toBe('');
    expect(extractStreamingContentPreview('{\n  "con')).toBe('');
  });

  it('grows the visible prefix as the content value streams in', () => {
    expect(
      extractStreamingContentPreview('{"content": "Once upon a ti')
    ).toBe('Once upon a ti');
    expect(
      extractStreamingContentPreview('{"content": "Once upon a time, the')
    ).toBe('Once upon a time, the');
  });

  it('stops at the closing quote and ignores trailing fields', () => {
    const buffer =
      '{"content": "The door creaks open.", "type": "scene", "metadata": {"mood": "tense"';
    expect(extractStreamingContentPreview(buffer)).toBe(
      'The door creaks open.'
    );
  });

  it('unescapes quotes and newlines within the streamed value', () => {
    const buffer = '{"content": "She said \\"run\\"\\nand did not look back';
    expect(extractStreamingContentPreview(buffer)).toBe(
      'She said "run"\nand did not look back'
    );
  });

  it('does not emit a mangled trailing char when a chunk cuts mid-escape', () => {
    // Buffer ends right after a bare backslash — the escape target hasn't
    // arrived yet, so the partial escape must not appear in the output.
    const buffer = '{"content": "The rope snapped\\';
    expect(extractStreamingContentPreview(buffer)).toBe('The rope snapped');
  });

  it('strips a markdown JSON fence before scanning for the field', () => {
    const buffer = '```json\n{"content": "Grounded in the ruins';
    expect(extractStreamingContentPreview(buffer)).toBe('Grounded in the ruins');
  });

  it('withholds output for a fence-only buffer', () => {
    expect(extractStreamingContentPreview('`')).toBe('');
    expect(extractStreamingContentPreview('``')).toBe('');
    expect(extractStreamingContentPreview('```json')).toBe('');
  });

  it('withholds output for an in-progress fence word, not just an exact-length prefix', () => {
    // Regression: a naive "backticks, then the whole word or nothing" check
    // let a partially-typed fence word ("```j", "```js", "```jso") leak
    // through as prose for a chunk or two before the fence resolved.
    expect(extractStreamingContentPreview('```j')).toBe('');
    expect(extractStreamingContentPreview('```js')).toBe('');
    expect(extractStreamingContentPreview('```jso')).toBe('');
  });

  it('returns the full value once the JSON object is complete', () => {
    const buffer = JSON.stringify({
      content: 'A complete beat.',
      type: 'scene',
      metadata: { itemsLost: [] },
    });
    expect(extractStreamingContentPreview(buffer)).toBe('A complete beat.');
  });
});
