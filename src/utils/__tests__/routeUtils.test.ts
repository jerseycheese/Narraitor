import { parseRoute, buildBreadcrumbSegments } from '../routeUtils';

describe('routeUtils', () => {
  describe('parseRoute', () => {
    it('should parse root path', () => {
      const result = parseRoute('/');
      expect(result.segments).toEqual([]);
    });

    it('should parse single segment path', () => {
      const result = parseRoute('/worlds');
      expect(result.segments).toEqual([
        { path: 'worlds', param: undefined, value: undefined }
      ]);
    });

    it('should parse path with ID parameter', () => {
      const result = parseRoute('/world/123');
      expect(result.segments).toEqual([
        { path: 'world', param: 'id', value: '123' }
      ]);
    });

    it('should parse nested paths', () => {
      const result = parseRoute('/characters/char-456/edit');
      expect(result.segments).toEqual([
        { path: 'characters', param: undefined, value: undefined },
        { path: 'char-456', param: 'id', value: 'char-456' },
        { path: 'edit', param: undefined, value: undefined }
      ]);
    });
  });

  describe('buildBreadcrumbSegments', () => {
    const mockWorlds = {
      '123': { id: '123', name: 'Fantasy Realm' }
    };
    const mockCharacters = {
      'char-456': { id: 'char-456', name: 'Aragorn', worldId: '123' }
    };

    it('should build breadcrumbs for root path', () => {
      const segments = buildBreadcrumbSegments('/', {}, {}, null);
      expect(segments).toEqual([]);
    });

    it('should build breadcrumbs for world detail page', () => {
      const segments = buildBreadcrumbSegments(
        '/world/123',
        mockWorlds,
        mockCharacters,
        '123'
      );
      expect(segments).toEqual([
        {
          label: 'Worlds',
          href: '/worlds',
          isCurrentPage: false
        },
        {
          label: 'Fantasy Realm',
          href: '/world/123',
          isCurrentPage: true
        }
      ]);
    });

    it('should build breadcrumbs for character list', () => {
      const segments = buildBreadcrumbSegments(
        '/characters',
        mockWorlds,
        mockCharacters,
        '123'
      );
      expect(segments).toEqual([
        {
          label: 'Worlds',
          href: '/worlds',
          isCurrentPage: false
        },
        {
          label: 'Fantasy Realm',
          href: '/world/123',
          isCurrentPage: false
        },
        {
          label: 'Characters',
          href: '/characters',
          isCurrentPage: true
        }
      ]);
    });

    it('should handle missing entity names', () => {
      const segments = buildBreadcrumbSegments(
        '/world/999',
        {},  // No worlds
        {},
        '999'
      );
      expect(segments[1].label).toBe('Loading...');
    });
  });
});
