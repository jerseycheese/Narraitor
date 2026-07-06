import { stripMarkdownFences, extractJsonObject } from '../parseJSON';

describe('stripMarkdownFences', () => {
  it('returns clean JSON unchanged (trimmed)', () => {
    expect(stripMarkdownFences('  {"a":1}  ')).toBe('{"a":1}');
  });

  it('strips ```json fences', () => {
    expect(stripMarkdownFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('strips plain ``` fences', () => {
    expect(stripMarkdownFences('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('leaves fence-free prose intact', () => {
    expect(stripMarkdownFences('no fences here')).toBe('no fences here');
  });
});

describe('extractJsonObject', () => {
  it('returns a clean object as-is', () => {
    expect(extractJsonObject('{"a":1}')).toBe('{"a":1}');
  });

  it('extracts an object embedded in prose', () => {
    expect(extractJsonObject('Here it is: {"a":1}. Done.')).toBe('{"a":1}');
  });

  it('spans from first { to last }', () => {
    expect(extractJsonObject('{"a":{"b":2}}')).toBe('{"a":{"b":2}}');
  });

  it('returns null when no braces are present', () => {
    expect(extractJsonObject('no json here')).toBeNull();
  });

  it('returns null when only an opening brace is present', () => {
    expect(extractJsonObject('{ incomplete')).toBeNull();
  });
});
