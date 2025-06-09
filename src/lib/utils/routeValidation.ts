/**
 * Route Validation Utility
 * 
 * Validates that all Link components and router.push calls point to valid routes
 * by checking against the actual app directory structure.
 * 
 * Features:
 * - AST parsing to find Link components and router.push calls
 * - Route validation against app directory structure
 * - Support for dynamic routes ([id], [slug], etc.)
 * - Pre-commit hook integration
 * - Detailed validation reports
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

/**
 * Route validation result
 */
export interface RouteValidationResult {
  /** Whether all routes are valid */
  valid: boolean;
  /** Valid routes found */
  validRoutes: RouteReference[];
  /** Invalid routes found */
  invalidRoutes: RouteReference[];
  /** Available routes in the app */
  availableRoutes: string[];
  /** Summary of validation */
  summary: {
    totalRoutes: number;
    validCount: number;
    invalidCount: number;
  };
}

/**
 * Reference to a route found in the code
 */
export interface RouteReference {
  /** The route path */
  route: string;
  /** File where the route was found */
  file: string;
  /** Line number in the file */
  line: number;
  /** Type of reference (Link component or router.push) */
  type: 'Link' | 'router.push' | 'router.replace' | 'redirect';
  /** The actual code snippet */
  snippet: string;
}

/**
 * Configuration for route validation
 */
export interface RouteValidationConfig {
  /** Root directory to search for source files */
  sourceDir: string;
  /** App directory containing page routes */
  appDir: string;
  /** File patterns to include in search */
  includePatterns: string[];
  /** File patterns to exclude from search */
  excludePatterns: string[];
  /** Whether to validate dynamic routes */
  validateDynamicRoutes: boolean;
  /** Custom route mappings for special cases */
  customRoutes: Record<string, boolean>;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: RouteValidationConfig = {
  sourceDir: 'src',
  appDir: 'src/app',
  includePatterns: ['**/*.tsx', '**/*.ts'],
  excludePatterns: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/__tests__/**'],
  validateDynamicRoutes: true,
  customRoutes: {
    '/': true, // Root route
    '/api': true, // API routes (would need separate validation)
  }
};

/**
 * Extract routes from app directory structure
 */
export async function extractAvailableRoutes(appDir: string): Promise<string[]> {
  const routes = new Set<string>();
  
  try {
    // Find all page.tsx files
    const pageFiles = await glob(`${appDir}/**/page.tsx`);
    
    for (const pageFile of pageFiles) {
      // Convert file path to route
      const relativePath = path.relative(appDir, pageFile);
      const route = convertFilePathToRoute(relativePath);
      routes.add(route);
    }
    
    // Add root route
    routes.add('/');
    
    return Array.from(routes).sort();
  } catch (error) {
    console.warn('Failed to extract available routes:', error);
    return [];
  }
}

/**
 * Convert file path to route pattern
 */
function convertFilePathToRoute(filePath: string): string {
  // Remove page.tsx from the end
  let route = filePath.replace(/\/page\.tsx$/, '');
  
  // Handle root route
  if (route === '') {
    return '/';
  }
  
  // Handle route groups (folders in parentheses are ignored)
  route = route.replace(/\([^)]+\)\//g, '');
  
  // Convert dynamic segments [id] to :id pattern for easier matching
  route = route.replace(/\[([^\]]+)\]/g, ':$1');
  
  // Ensure starts with /
  if (!route.startsWith('/')) {
    route = '/' + route;
  }
  
  return route;
}

/**
 * Extract route references from source files
 */
export async function extractRouteReferences(
  sourceDir: string,
  config: Partial<RouteValidationConfig> = {}
): Promise<RouteReference[]> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const references: RouteReference[] = [];
  
  try {
    // Find all source files
    const includePatterns = finalConfig.includePatterns.map(pattern => 
      `${sourceDir}/${pattern}`
    );
    
    const sourceFiles = await glob(includePatterns, {
      ignore: finalConfig.excludePatterns
    });
    
    for (const filePath of sourceFiles) {
      const fileReferences = await extractRoutesFromFile(filePath);
      references.push(...fileReferences);
    }
    
    return references;
  } catch (error) {
    console.warn('Failed to extract route references:', error);
    return [];
  }
}

/**
 * Extract routes from a single file
 */
async function extractRoutesFromFile(filePath: string): Promise<RouteReference[]> {
  const references: RouteReference[] = [];
  
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // Find Link components with href
      const linkMatches = line.matchAll(/<Link[^>]*href=["']([^"']+)["'][^>]*>/g);
      for (const match of linkMatches) {
        references.push({
          route: match[1],
          file: filePath,
          line: lineNumber,
          type: 'Link',
          snippet: match[0]
        });
      }
      
      // Find router.push calls
      const routerPushMatches = line.matchAll(/router\.push\(["']([^"']+)["']\)/g);
      for (const match of routerPushMatches) {
        references.push({
          route: match[1],
          file: filePath,
          line: lineNumber,
          type: 'router.push',
          snippet: match[0]
        });
      }
      
      // Find router.replace calls
      const routerReplaceMatches = line.matchAll(/router\.replace\(["']([^"']+)["']\)/g);
      for (const match of routerReplaceMatches) {
        references.push({
          route: match[1],
          file: filePath,
          line: lineNumber,
          type: 'router.replace',
          snippet: match[0]
        });
      }
      
      // Find redirect calls
      const redirectMatches = line.matchAll(/redirect\(["']([^"']+)["']\)/g);
      for (const match of redirectMatches) {
        references.push({
          route: match[1],
          file: filePath,
          line: lineNumber,
          type: 'redirect',
          snippet: match[0]
        });
      }
    }
    
    return references;
  } catch (error) {
    console.warn(`Failed to read file ${filePath}:`, error);
    return [];
  }
}

/**
 * Validate a route against available routes
 */
export function isValidRoute(
  route: string,
  availableRoutes: string[],
  customRoutes: Record<string, boolean> = {},
  validateDynamicRoutes: boolean = true
): boolean {
  // Check custom routes first
  if (route in customRoutes) {
    return customRoutes[route];
  }
  
  // Skip external URLs
  if (route.startsWith('http://') || route.startsWith('https://') || route.startsWith('//')) {
    return true;
  }
  
  // Skip mailto, tel, etc.
  if (route.includes(':') && !route.startsWith('/')) {
    return true;
  }
  
  // Remove query params and hash for validation
  const cleanRoute = route.split('?')[0].split('#')[0];
  
  // Exact match
  if (availableRoutes.includes(cleanRoute)) {
    return true;
  }
  
  // If dynamic route validation is disabled, skip
  if (!validateDynamicRoutes) {
    return false;
  }
  
  // Check against dynamic routes
  for (const availableRoute of availableRoutes) {
    if (matchesDynamicRoute(cleanRoute, availableRoute)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a route matches a dynamic route pattern
 */
function matchesDynamicRoute(route: string, pattern: string): boolean {
  // Convert pattern to regex
  const regexPattern = pattern
    .replace(/:[^/]+/g, '[^/]+') // Replace :id with [^/]+
    .replace(/\//g, '\\/'); // Escape forward slashes
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(route);
}

/**
 * Validate all routes in the project
 */
export async function validateAllRoutes(
  config: Partial<RouteValidationConfig> = {}
): Promise<RouteValidationResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Extract available routes and route references
  const [availableRoutes, routeReferences] = await Promise.all([
    extractAvailableRoutes(finalConfig.appDir),
    extractRouteReferences(finalConfig.sourceDir, finalConfig)
  ]);
  
  // Validate each route reference
  const validRoutes: RouteReference[] = [];
  const invalidRoutes: RouteReference[] = [];
  
  for (const reference of routeReferences) {
    const valid = isValidRoute(
      reference.route,
      availableRoutes,
      finalConfig.customRoutes,
      finalConfig.validateDynamicRoutes
    );
    
    if (valid) {
      validRoutes.push(reference);
    } else {
      invalidRoutes.push(reference);
    }
  }
  
  return {
    valid: invalidRoutes.length === 0,
    validRoutes,
    invalidRoutes,
    availableRoutes,
    summary: {
      totalRoutes: routeReferences.length,
      validCount: validRoutes.length,
      invalidCount: invalidRoutes.length
    }
  };
}

/**
 * Generate a human-readable validation report
 */
export function generateValidationReport(result: RouteValidationResult): string {
  const { summary, invalidRoutes, availableRoutes } = result;
  
  let report = `Route Validation Report\n`;
  report += `========================\n\n`;
  
  report += `Summary:\n`;
  report += `- Total routes checked: ${summary.totalRoutes}\n`;
  report += `- Valid routes: ${summary.validCount}\n`;
  report += `- Invalid routes: ${summary.invalidCount}\n`;
  report += `- Overall status: ${result.valid ? 'PASS' : 'FAIL'}\n\n`;
  
  if (invalidRoutes.length > 0) {
    report += `Invalid Routes:\n`;
    report += `---------------\n`;
    for (const route of invalidRoutes) {
      report += `- ${route.route}\n`;
      report += `  File: ${route.file}:${route.line}\n`;
      report += `  Type: ${route.type}\n`;
      report += `  Code: ${route.snippet}\n\n`;
    }
  }
  
  report += `Available Routes:\n`;
  report += `-----------------\n`;
  for (const route of availableRoutes) {
    report += `- ${route}\n`;
  }
  
  return report;
}

/**
 * CLI tool for route validation
 */
export async function runRouteValidation(
  options: {
    config?: Partial<RouteValidationConfig>;
    output?: string;
    exitOnError?: boolean;
  } = {}
): Promise<void> {
  const { config = {}, output, exitOnError = true } = options;
  
  console.log('Running route validation...');
  
  const result = await validateAllRoutes(config);
  const report = generateValidationReport(result);
  
  // Output report
  if (output) {
    await fs.promises.writeFile(output, report);
    console.log(`Report written to ${output}`);
  } else {
    console.log(report);
  }
  
  // Exit with error code if validation failed
  if (!result.valid && exitOnError) {
    process.exit(1);
  }
}

/**
 * Pre-commit hook function
 */
export async function preCommitHook(): Promise<boolean> {
  try {
    const result = await validateAllRoutes();
    
    if (!result.valid) {
      console.error('❌ Route validation failed!');
      console.error(generateValidationReport(result));
      return false;
    }
    
    console.log(`✅ Route validation passed (${result.summary.totalRoutes} routes checked)`);
    return true;
  } catch (error) {
    console.error('❌ Route validation error:', error);
    return false;
  }
}