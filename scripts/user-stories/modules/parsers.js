// parsers.js - Main parsers module (refactored)
// Re-exports functionality from split modules for backward compatibility

// CSV parsing functionality
export { parseCsvRows } from './csv-parser.js';

// Markdown parsing functionality  
export { parseUserStoriesFromMarkdown } from './markdown-parser.js';

// GitHub issue conversion functionality
export { convertUserStoriesToGithubIssues } from './github-issue-converter.js';

// Utility functions
export { formatRelatedIssues, generateImplementationNotes } from './parser-utils.js';

// Legacy functions (deprecated)
export { parseUserStoriesFromCSV_Legacy } from './legacy-parsers.js';
