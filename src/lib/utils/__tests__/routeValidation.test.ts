/**
 * Tests for route validation utility
 */

import {
  isValidRoute,
  extractAvailableRoutes,
  extractRouteReferences,
  validateAllRoutes,
  generateValidationReport
} from '../routeValidation';
import * as fs from 'fs';
import { glob } from 'glob';

// Mock fs and glob
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn()
  }
}));
jest.mock('glob', () => ({
  glob: jest.fn()
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockGlob = glob as jest.MockedFunction<typeof glob>;

describe.skip('Route Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidRoute', () => {
    const availableRoutes = [
      '/',
      '/about',
      '/worlds',
      '/world/:id',
      '/world/:id/edit',
      '/characters',
      '/characters/:id',
      '/dev/test-page'
    ];

    it('should validate exact route matches', () => {
      expect(isValidRoute('/', availableRoutes)).toBe(true);
      expect(isValidRoute('/about', availableRoutes)).toBe(true);
      expect(isValidRoute('/worlds', availableRoutes)).toBe(true);
    });

    it('should validate dynamic routes', () => {
      expect(isValidRoute('/world/123', availableRoutes)).toBe(true);
      expect(isValidRoute('/world/abc', availableRoutes)).toBe(true);
      expect(isValidRoute('/world/test-world/edit', availableRoutes)).toBe(true);
      expect(isValidRoute('/characters/456', availableRoutes)).toBe(true);
    });

    it('should reject invalid routes', () => {
      expect(isValidRoute('/invalid', availableRoutes)).toBe(false);
      expect(isValidRoute('/world', availableRoutes)).toBe(false);
      expect(isValidRoute('/world/123/invalid', availableRoutes)).toBe(false);
    });

    it('should handle query parameters and hashes', () => {
      expect(isValidRoute('/worlds?page=1', availableRoutes)).toBe(true);
      expect(isValidRoute('/world/123#section', availableRoutes)).toBe(true);
      expect(isValidRoute('/world/123?tab=edit#form', availableRoutes)).toBe(true);
    });

    it('should accept external URLs', () => {
      expect(isValidRoute('https://example.com', availableRoutes)).toBe(true);
      expect(isValidRoute('http://example.com', availableRoutes)).toBe(true);
      expect(isValidRoute('//example.com', availableRoutes)).toBe(true);
    });

    it('should accept special protocols', () => {
      expect(isValidRoute('mailto:test@example.com', availableRoutes)).toBe(true);
      expect(isValidRoute('tel:+1234567890', availableRoutes)).toBe(true);
    });

    it('should respect custom routes', () => {
      const customRoutes = { '/api/custom': true, '/special': false };
      
      expect(isValidRoute('/api/custom', availableRoutes, customRoutes)).toBe(true);
      expect(isValidRoute('/special', availableRoutes, customRoutes)).toBe(false);
    });

    it('should skip dynamic validation when disabled', () => {
      expect(isValidRoute('/world/123', availableRoutes, {}, false)).toBe(false);
      expect(isValidRoute('/world/123', ['/', '/world/123'], {}, false)).toBe(true);
    });
  });

  describe('extractAvailableRoutes', () => {
    it('should extract routes from page files', async () => {
      mockGlob.mockResolvedValue([
        'src/app/page.tsx',
        'src/app/about/page.tsx',
        'src/app/worlds/page.tsx',
        'src/app/world/[id]/page.tsx',
        'src/app/world/[id]/edit/page.tsx',
        'src/app/(dev)/dev/test/page.tsx'
      ]);

      const routes = await extractAvailableRoutes('src/app');

      expect(routes).toContain('/');
      expect(routes).toContain('/about');
      expect(routes).toContain('/worlds');
      expect(routes).toContain('/world/:id');
      expect(routes).toContain('/world/:id/edit');
      expect(routes).toContain('/dev/test'); // Route groups removed
    });

    it('should handle errors gracefully', async () => {
      mockGlob.mockRejectedValue(new Error('File system error'));

      const routes = await extractAvailableRoutes('src/app');

      expect(routes).toEqual([]);
    });
  });

  describe('extractRouteReferences', () => {
    it('should extract Link components', async () => {
      mockGlob.mockResolvedValue(['src/components/Navigation.tsx']);
      mockFs.promises.readFile = jest.fn().mockResolvedValue(`
        import Link from 'next/link';
        
        function Navigation() {
          return (
            <div>
              <Link href="/worlds">Worlds</Link>
              <Link href="/characters">Characters</Link>
              <Link href="/world/123">Specific World</Link>
            </div>
          );
        }
      `);

      const references = await extractRouteReferences('src');

      expect(references).toHaveLength(3);
      expect(references[0]).toMatchObject({
        route: '/worlds',
        type: 'Link',
        file: 'src/components/Navigation.tsx'
      });
      expect(references[1]).toMatchObject({
        route: '/characters',
        type: 'Link'
      });
      expect(references[2]).toMatchObject({
        route: '/world/123',
        type: 'Link'
      });
    });

    it('should extract router.push calls', async () => {
      mockGlob.mockResolvedValue(['src/pages/test.tsx']);
      mockFs.promises.readFile = jest.fn().mockResolvedValue(`
        function TestPage() {
          const router = useRouter();
          
          const handleNavigation = () => {
            router.push('/dashboard');
            router.replace('/login');
          };
        }
      `);

      const references = await extractRouteReferences('src');

      expect(references).toHaveLength(2);
      expect(references[0]).toMatchObject({
        route: '/dashboard',
        type: 'router.push'
      });
      expect(references[1]).toMatchObject({
        route: '/login',
        type: 'router.replace'
      });
    });

    it('should handle file read errors', async () => {
      mockGlob.mockResolvedValue(['src/test.tsx']);
      mockFs.promises.readFile = jest.fn().mockRejectedValue(new Error('Permission denied'));

      const references = await extractRouteReferences('src');

      expect(references).toEqual([]);
    });
  });

  describe('validateAllRoutes', () => {
    it('should perform complete validation', async () => {
      // Mock available routes
      mockGlob.mockImplementation((pattern: string) => {
        if (pattern.includes('**/page.tsx')) {
          return Promise.resolve([
            'src/app/page.tsx',
            'src/app/worlds/page.tsx',
            'src/app/world/[id]/page.tsx'
          ]);
        }
        // Source files
        return Promise.resolve(['src/components/Navigation.tsx']);
      });

      mockFs.promises.readFile = jest.fn().mockResolvedValue(`
        <Link href="/worlds">Valid</Link>
        <Link href="/invalid">Invalid</Link>
        <Link href="/world/123">Dynamic Valid</Link>
      `);

      const result = await validateAllRoutes();

      expect(result.valid).toBe(false);
      expect(result.validRoutes).toHaveLength(2);
      expect(result.invalidRoutes).toHaveLength(1);
      expect(result.invalidRoutes[0].route).toBe('/invalid');
      expect(result.availableRoutes).toContain('/');
      expect(result.availableRoutes).toContain('/worlds');
      expect(result.availableRoutes).toContain('/world/:id');
    });
  });

  describe('generateValidationReport', () => {
    it('should generate a readable report', () => {
      const result = {
        valid: false,
        validRoutes: [
          {
            route: '/worlds',
            file: 'src/test.tsx',
            line: 1,
            type: 'Link' as const,
            snippet: '<Link href="/worlds">'
          }
        ],
        invalidRoutes: [
          {
            route: '/invalid',
            file: 'src/test.tsx',
            line: 2,
            type: 'Link' as const,
            snippet: '<Link href="/invalid">'
          }
        ],
        availableRoutes: ['/', '/worlds'],
        summary: {
          totalRoutes: 2,
          validCount: 1,
          invalidCount: 1
        }
      };

      const report = generateValidationReport(result);

      expect(report).toContain('Route Validation Report');
      expect(report).toContain('Total routes checked: 2');
      expect(report).toContain('Valid routes: 1');
      expect(report).toContain('Invalid routes: 1');
      expect(report).toContain('Overall status: FAIL');
      expect(report).toContain('/invalid');
      expect(report).toContain('src/test.tsx:2');
      expect(report).toContain('Available Routes:');
      expect(report).toContain('- /');
      expect(report).toContain('- /worlds');
    });

    it('should show success for valid results', () => {
      const result = {
        valid: true,
        validRoutes: [],
        invalidRoutes: [],
        availableRoutes: ['/'],
        summary: {
          totalRoutes: 0,
          validCount: 0,
          invalidCount: 0
        }
      };

      const report = generateValidationReport(result);

      expect(report).toContain('Overall status: PASS');
    });
  });
});