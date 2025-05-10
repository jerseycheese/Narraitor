// Configuration module for GitHub sync scripts
// This centralized configuration removes duplication across scripts

// GitHub repository settings
export const OWNER = 'jerseycheese';
export const REPO = 'narraitor';

// API settings
export const API_BASE_URL = 'https://api.github.com';
export const PER_PAGE = 100;

// Rate limiting parameters
export const RATE_LIMIT_PAUSE = 1000; // milliseconds to wait when approaching rate limit
export const RATE_LIMIT_THRESHOLD = 10; // remaining requests that trigger slowdown

// CSV related settings
export const CSV_USER_STORY_PATTERN = /.+-user-stories\.csv$/;
export const CSV_DEFAULT_ENCODING = 'utf8';

// Debug settings (should be false in production)
export const DEBUG_MODE = false;
