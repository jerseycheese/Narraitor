import { getNestedValue, hasNestedProperty, getNestedPaths } from '../objectAccess';

describe('objectAccess', () => {
  // Test data for comprehensive scenarios
  const testObject = {
    user: {
      profile: {
        name: 'John Doe',
        email: 'john@example.com',
        settings: {
          theme: 'dark',
          notifications: true,
          preferences: {
            language: 'en',
            timezone: 'UTC'
          }
        }
      },
      metadata: {
        createdAt: '2023-01-01',
        lastLogin: null,
        roles: ['user', 'admin']
      }
    },
    items: [
      { id: 1, title: 'First Item', active: true },
      { id: 2, title: 'Second Item', active: false },
      { id: 3, title: 'Third Item', active: true, nested: { deep: 'value' } }
    ],
    stats: {
      count: 42,
      percentage: 85.5,
      enabled: false
    },
    emptyObject: {},
    nullValue: null,
    undefinedValue: undefined,
    falseValue: false,
    zeroValue: 0,
    emptyString: ''
  };

  describe('getNestedValue', () => {
    describe('basic nested property access', () => {
      it('should access shallow properties', () => {
        expect(getNestedValue(testObject, 'stats')).toEqual(testObject.stats);
      });

      it('should access nested properties using dot notation', () => {
        expect(getNestedValue(testObject, 'user.profile.name')).toBe('John Doe');
        expect(getNestedValue(testObject, 'user.profile.settings.theme')).toBe('dark');
        expect(getNestedValue(testObject, 'user.profile.settings.preferences.language')).toBe('en');
      });

      it('should access nested properties using array notation', () => {
        expect(getNestedValue(testObject, ['user', 'profile', 'name'])).toBe('John Doe');
        expect(getNestedValue(testObject, ['user', 'profile', 'settings', 'theme'])).toBe('dark');
        expect(getNestedValue(testObject, ['user', 'profile', 'settings', 'preferences', 'language'])).toBe('en');
      });
    });

    describe('array and complex structure support', () => {
      it('should access array elements by index', () => {
        expect(getNestedValue(testObject, 'items[0]')).toEqual(testObject.items[0]);
        expect(getNestedValue(testObject, 'items[1].title')).toBe('Second Item');
        expect(getNestedValue(testObject, 'items[2].nested.deep')).toBe('value');
      });

      it('should access array elements using array notation', () => {
        expect(getNestedValue(testObject, ['items', 0])).toEqual(testObject.items[0]);
        expect(getNestedValue(testObject, ['items', 1, 'title'])).toBe('Second Item');
        expect(getNestedValue(testObject, ['items', 2, 'nested', 'deep'])).toBe('value');
      });

      it('should handle mixed path notations', () => {
        expect(getNestedValue(testObject, 'user.metadata.roles[0]')).toBe('user');
        expect(getNestedValue(testObject, 'user.metadata.roles[1]')).toBe('admin');
      });
    });

    describe('default value support', () => {
      it('should return default values for non-existent properties', () => {
        expect(getNestedValue(testObject, 'nonexistent', 'default')).toBe('default');
        expect(getNestedValue(testObject, 'user.nonexistent', 'default')).toBe('default');
        expect(getNestedValue(testObject, 'user.profile.nonexistent.deep', 'default')).toBe('default');
      });

      it('should return default values for out-of-bounds array access', () => {
        expect(getNestedValue(testObject, 'items[10]', 'default')).toBe('default');
        expect(getNestedValue(testObject, 'items[10].title', 'default')).toBe('default');
      });

      it('should return undefined when no default value is provided', () => {
        expect(getNestedValue(testObject, 'nonexistent')).toBeUndefined();
        expect(getNestedValue(testObject, 'user.nonexistent')).toBeUndefined();
        expect(getNestedValue(testObject, 'items[10]')).toBeUndefined();
      });

      it('should distinguish between false/null/undefined/0 values and missing properties', () => {
        expect(getNestedValue(testObject, 'nullValue', 'default')).toBeNull();
        expect(getNestedValue(testObject, 'undefinedValue', 'default')).toBeUndefined();
        expect(getNestedValue(testObject, 'falseValue', 'default')).toBe(false);
        expect(getNestedValue(testObject, 'zeroValue', 'default')).toBe(0);
        expect(getNestedValue(testObject, 'emptyString', 'default')).toBe('');
      });
    });

    describe('error handling', () => {
      it('should handle null/undefined objects gracefully', () => {
        expect(getNestedValue(null, 'any.path', 'default')).toBe('default');
        expect(getNestedValue(undefined, 'any.path', 'default')).toBe('default');
        expect(getNestedValue(null, 'any.path')).toBeUndefined();
      });

      it('should handle primitive values gracefully', () => {
        expect(getNestedValue('string', 'property', 'default')).toBe('default');
        expect(getNestedValue(42, 'property', 'default')).toBe('default');
        expect(getNestedValue(true, 'property', 'default')).toBe('default');
      });

      it('should handle empty paths gracefully', () => {
        expect(getNestedValue(testObject, '', 'default')).toBe('default');
        expect(getNestedValue(testObject, [])).toEqual(testObject);
      });

      it('should handle invalid path formats gracefully', () => {
        expect(getNestedValue(testObject, 'user..profile', 'default')).toBe('default');
        expect(getNestedValue(testObject, 'user.profile.', 'default')).toBe('default');
        expect(getNestedValue(testObject, '.user.profile', 'default')).toBe('default');
      });
    });

    describe('type safety', () => {
      it('should preserve type information with generics', () => {
        const stringValue = getNestedValue<string>(testObject, 'user.profile.name', 'default');
        expect(typeof stringValue).toBe('string');
        expect(stringValue).toBe('John Doe');

        const numberValue = getNestedValue<number>(testObject, 'stats.count', 0);
        expect(typeof numberValue).toBe('number');
        expect(numberValue).toBe(42);

        const booleanValue = getNestedValue<boolean>(testObject, 'stats.enabled', true);
        expect(typeof booleanValue).toBe('boolean');
        expect(booleanValue).toBe(false);
      });
    });
  });

  describe('hasNestedProperty', () => {
    describe('property existence checking', () => {
      it('should return true for existing shallow properties', () => {
        expect(hasNestedProperty(testObject, 'user')).toBe(true);
        expect(hasNestedProperty(testObject, 'stats')).toBe(true);
        expect(hasNestedProperty(testObject, 'items')).toBe(true);
      });

      it('should return true for existing nested properties', () => {
        expect(hasNestedProperty(testObject, 'user.profile.name')).toBe(true);
        expect(hasNestedProperty(testObject, 'user.profile.settings.theme')).toBe(true);
        expect(hasNestedProperty(testObject, 'user.profile.settings.preferences.language')).toBe(true);
      });

      it('should return false for non-existent properties', () => {
        expect(hasNestedProperty(testObject, 'nonexistent')).toBe(false);
        expect(hasNestedProperty(testObject, 'user.nonexistent')).toBe(false);
        expect(hasNestedProperty(testObject, 'user.profile.nonexistent.deep')).toBe(false);
      });
    });

    describe('array property existence', () => {
      it('should return true for existing array indices', () => {
        expect(hasNestedProperty(testObject, 'items[0]')).toBe(true);
        expect(hasNestedProperty(testObject, 'items[1]')).toBe(true);
        expect(hasNestedProperty(testObject, 'items[2]')).toBe(true);
      });

      it('should return true for properties within array elements', () => {
        expect(hasNestedProperty(testObject, 'items[0].title')).toBe(true);
        expect(hasNestedProperty(testObject, 'items[2].nested.deep')).toBe(true);
      });

      it('should return false for out-of-bounds array indices', () => {
        expect(hasNestedProperty(testObject, 'items[10]')).toBe(false);
        expect(hasNestedProperty(testObject, 'items[10].title')).toBe(false);
      });

      it('should work with array path notation', () => {
        expect(hasNestedProperty(testObject, ['items', 0])).toBe(true);
        expect(hasNestedProperty(testObject, ['items', 0, 'title'])).toBe(true);
        expect(hasNestedProperty(testObject, ['items', 10])).toBe(false);
      });
    });

    describe('falsy vs non-existent values', () => {
      it('should return true for properties with falsy values', () => {
        expect(hasNestedProperty(testObject, 'nullValue')).toBe(true);
        expect(hasNestedProperty(testObject, 'undefinedValue')).toBe(true);
        expect(hasNestedProperty(testObject, 'falseValue')).toBe(true);
        expect(hasNestedProperty(testObject, 'zeroValue')).toBe(true);
        expect(hasNestedProperty(testObject, 'emptyString')).toBe(true);
      });

      it('should return false for truly non-existent properties', () => {
        expect(hasNestedProperty(testObject, 'propertyThatDoesNotExist')).toBe(false);
        expect(hasNestedProperty(testObject, 'user.propertyThatDoesNotExist')).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle null/undefined objects gracefully', () => {
        expect(hasNestedProperty(null, 'any.path')).toBe(false);
        expect(hasNestedProperty(undefined, 'any.path')).toBe(false);
      });

      it('should handle primitive values gracefully', () => {
        expect(hasNestedProperty('string', 'property')).toBe(false);
        expect(hasNestedProperty(42, 'property')).toBe(false);
        expect(hasNestedProperty(true, 'property')).toBe(false);
      });

      it('should handle empty paths gracefully', () => {
        expect(hasNestedProperty(testObject, '')).toBe(false);
        expect(hasNestedProperty(testObject, [])).toBe(true);
      });
    });
  });

  describe('getNestedPaths', () => {
    const simpleObject = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3,
          f: 4
        }
      },
      g: [1, 2, { h: 5 }]
    };

    describe('path discovery', () => {
      it('should discover all paths in a flat object', () => {
        const flatObject = { a: 1, b: 2, c: 3 };
        const paths = getNestedPaths(flatObject);
        expect(paths).toEqual(expect.arrayContaining(['a', 'b', 'c']));
      });

      it('should discover nested paths', () => {
        const paths = getNestedPaths(simpleObject);
        expect(paths).toEqual(expect.arrayContaining([
          'a',
          'b',
          'b.c',
          'b.d',
          'b.d.e',
          'b.d.f',
          'g'
        ]));
      });

      it('should handle arrays in path discovery', () => {
        const paths = getNestedPaths(simpleObject);
        expect(paths).toEqual(expect.arrayContaining([
          'g[0]',
          'g[1]',
          'g[2]',
          'g[2].h'
        ]));
      });
    });

    describe('configuration options', () => {
      it('should respect maxDepth parameter', () => {
        const paths = getNestedPaths(simpleObject, 2);
        expect(paths).toEqual(expect.arrayContaining([
          'a',
          'b',
          'b.c',
          'b.d',
          'g'
        ]));
        expect(paths).not.toContain('b.d.e');
        expect(paths).not.toContain('b.d.f');
      });

      it('should handle maxDepth of 1', () => {
        const paths = getNestedPaths(simpleObject, 1);
        expect(paths).toEqual(expect.arrayContaining(['a', 'b', 'g']));
        expect(paths).not.toContain('b.c');
      });

      it('should handle maxDepth of 0', () => {
        const paths = getNestedPaths(simpleObject, 0);
        expect(paths).toEqual([]);
      });
    });

    describe('edge cases', () => {
      it('should handle empty objects', () => {
        const paths = getNestedPaths({});
        expect(paths).toEqual([]);
      });

      it('should handle null/undefined objects', () => {
        expect(getNestedPaths(null)).toEqual([]);
        expect(getNestedPaths(undefined)).toEqual([]);
      });

      it('should handle primitive arrays', () => {
        const paths = getNestedPaths({ arr: [1, 2, 3] });
        expect(paths).toEqual(expect.arrayContaining([
          'arr',
          'arr[0]',
          'arr[1]',
          'arr[2]'
        ]));
      });

      it('should handle circular references gracefully', () => {
        const circularObject: Record<string, unknown> = { a: 1 };
        circularObject.self = circularObject;
        
        const paths = getNestedPaths(circularObject);
        expect(paths).toEqual(expect.arrayContaining(['a', 'self']));
        // Should not infinite loop
      });
    });
  });

  describe('integration tests', () => {
    describe('chainable API behavior', () => {
      it('should work together for complex scenarios', () => {
        const paths = getNestedPaths(testObject, 3);
        
        // Check that discovered paths actually exist
        paths.forEach(path => {
          expect(hasNestedProperty(testObject, path)).toBe(true);
        });
      });

      it('should provide consistent results across functions', () => {
        const value = getNestedValue(testObject, 'user.profile.settings.theme');
        expect(hasNestedProperty(testObject, 'user.profile.settings.theme')).toBe(true);
        expect(value).toBe('dark');
      });
    });

    describe('batch operations', () => {
      it('should efficiently handle multiple path operations', () => {
        const pathsToCheck = [
          'user.profile.name',
          'user.profile.settings.theme',
          'items[0].title',
          'stats.count',
          'nonexistent.path'
        ];

        const values = pathsToCheck.map(path => getNestedValue(testObject, path));
        const existence = pathsToCheck.map(path => hasNestedProperty(testObject, path));

        expect(values).toEqual([
          'John Doe',
          'dark',
          'First Item',
          42,
          undefined
        ]);

        expect(existence).toEqual([
          true,
          true,
          true,
          true,
          false
        ]);
      });
    });

    describe('type safety validation', () => {
      it('should maintain type safety across operations', () => {
        const name = getNestedValue<string>(testObject, 'user.profile.name', 'Unknown');
        const count = getNestedValue<number>(testObject, 'stats.count', 0);
        const enabled = getNestedValue<boolean>(testObject, 'stats.enabled', true);

        expect(typeof name).toBe('string');
        expect(typeof count).toBe('number');
        expect(typeof enabled).toBe('boolean');
      });
    });
  });
});