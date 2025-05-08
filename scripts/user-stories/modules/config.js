// Configuration and constants for the user story migration scripts
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// GitHub repository information
export const OWNER = 'jerseycheese';
export const REPO = 'narraitor';
export const TOKEN = process.env.GITHUB_TOKEN;

// GitHub Project Board URL (for user stories)
export const PROJECT_BOARD_URL = 'https://github.com/users/jerseycheese/projects/3';

// Base paths
export const BASE_DIR = path.join(__dirname, '..', '..', '..');
export const DOCS_DIR = path.join(BASE_DIR, 'docs');
export const REQUIREMENTS_DIR = path.join(DOCS_DIR, 'requirements');
export const CORE_DIR = path.join(REQUIREMENTS_DIR, 'core');
export const UI_DIR = path.join(REQUIREMENTS_DIR, 'ui');
export const INTEGRATIONS_DIR = path.join(REQUIREMENTS_DIR, 'integrations');

// Load GitHub issue template
const ISSUE_TEMPLATE_PATH = path.join(BASE_DIR, '.github', 'ISSUE_TEMPLATE', 'user-story.md');
const ISSUE_TEMPLATE_CONTENT = fs.readFileSync(ISSUE_TEMPLATE_PATH, 'utf8');
const ISSUE_TEMPLATE_FM_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
const ISSUE_TEMPLATE_FM_MATCH = ISSUE_TEMPLATE_CONTENT.match(ISSUE_TEMPLATE_FM_REGEX);

export const ISSUE_BODY_TEMPLATE = ISSUE_TEMPLATE_CONTENT.slice(ISSUE_TEMPLATE_FM_MATCH ? ISSUE_TEMPLATE_FM_MATCH[0].length : 0);

// Domain types
export const DOMAIN_TYPES = {
  CORE: 'core',
  UI: 'ui',
  INTEGRATIONS: 'integrations'
};

// Verify the template is valid
if (!ISSUE_TEMPLATE_FM_MATCH) {
  console.error('Invalid issue template format');
  process.exit(1);
}
