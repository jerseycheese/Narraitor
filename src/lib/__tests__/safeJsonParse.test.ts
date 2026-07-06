import { safeJsonParse } from '../safeJsonParse';

describe('safeJsonParse', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('parses valid JSON', () => {
    expect(safeJsonParse<{ a: number }>('{"a":1}', { a: 0 })).toEqual({ a: 1 });
    expect(safeJsonParse<number[]>('[1,2,3]', [])).toEqual([1, 2, 3]);
  });

  it('returns the fallback for malformed JSON and logs an error', () => {
    expect(safeJsonParse<number[]>('{not json', [])).toEqual([]);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('returns the fallback for null without logging', () => {
    expect(safeJsonParse<string[]>(null, ['default'])).toEqual(['default']);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('returns the fallback for undefined without logging', () => {
    expect(safeJsonParse<string[]>(undefined, [])).toEqual([]);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
