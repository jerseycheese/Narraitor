import { generateUniqueId } from './generateId';

describe('generateUniqueId', () => {
  // Test case 1: Basic UUID generation
  test('should generate a valid UUID v4 string', () => {
    const uuid = generateUniqueId();
    // UUID v4 regex: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // where x is any hexadecimal digit and y is one of 8, 9, A, or B.
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toEqual(expect.any(String));
    expect(uuid).toMatch(uuidV4Regex);
  });

  // Test case 2: Uniqueness (probabilistic test)
  test('should generate unique IDs on subsequent calls', () => {
    const ids = new Set();
    const numberOfIdsToGenerate = 100; // A reasonable number for a probabilistic test

    for (let i = 0; i < numberOfIdsToGenerate; i++) {
      ids.add(generateUniqueId());
    }

    expect(ids.size).toBe(numberOfIdsToGenerate);
  });

  // Test case 3: Prefixing with a non-empty prefix
  test('should prepend the prefix followed by an underscore when a non-empty prefix is provided', () => {
    const prefix = 'entity';
    const id = generateUniqueId(prefix);
    expect(id).toEqual(expect.any(String));
    expect(id.startsWith(`${prefix}_`)).toBe(true);
    const uuidPart = id.substring(prefix.length + 1);
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidPart).toMatch(uuidV4Regex);
  });

  // Test case 4: Prefixing with an empty string prefix
  test('should generate a UUID without a prefix when an empty string prefix is provided', () => {
    const id = generateUniqueId('');
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toEqual(expect.any(String));
    expect(id).toMatch(uuidV4Regex);
  });

  // Test case 5: Prefixing with undefined prefix
  test('should generate a UUID without a prefix when undefined prefix is provided', () => {
    const id = generateUniqueId(undefined);
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toEqual(expect.any(String));
    expect(id).toMatch(uuidV4Regex);
  });
});