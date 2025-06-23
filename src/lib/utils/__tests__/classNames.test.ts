import { cn, clsx } from '../classNames';

describe('cn utility (enhanced with Tailwind merge)', () => {
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

  test('supports objects (clsx functionality)', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  test('supports arrays (clsx functionality)', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  test('merges conflicting Tailwind classes (twMerge functionality)', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    expect(cn('p-4', 'px-6')).toBe('p-4 px-6'); // px overrides horizontal padding
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  test('handles mixed complex inputs', () => {
    expect(cn('foo', { bar: true, baz: false }, ['qux', null], 'bg-red-500', 'bg-blue-500')).toBe('foo bar qux bg-blue-500');
  });
});

describe('clsx utility (legacy export)', () => {
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
