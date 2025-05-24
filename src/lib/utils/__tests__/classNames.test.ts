import { cn, clsx } from '../classNames';

describe('cn utility', () => {
  test('combines multiple class names', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
  });

  test('filters out falsy values', () => {
    expect(cn('foo', null, undefined, false, '', 'bar')).toBe('foo bar');
  });

  test('handles empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(null, undefined)).toBe('');
  });

  test('handles single class', () => {
    expect(cn('foo')).toBe('foo');
  });
});

describe('clsx utility', () => {
  test('combines strings', () => {
    expect(clsx('foo', 'bar')).toBe('foo bar');
  });

  test('handles objects', () => {
    expect(clsx({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  test('handles arrays', () => {
    expect(clsx(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  test('handles mixed inputs', () => {
    expect(clsx('foo', { bar: true, baz: false }, ['qux', null], undefined)).toBe('foo bar qux');
  });

  test('handles nested arrays', () => {
    expect(clsx(['foo', ['bar', 'baz']])).toBe('foo bar baz');
  });
});