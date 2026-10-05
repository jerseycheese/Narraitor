// CSV utility functions
// Provides standardized CSV operations with error handling

import fs from 'fs';
import path from 'path';
import { CSV_USER_STORY_PATTERN } from './config.js';

/**
 * Find all user story CSV files in a directory recursively
 * @param {string} startPath - Directory to search from
 * @param {RegExp} pattern - File pattern to match (defaults to CSV_USER_STORY_PATTERN)
 * @returns {string[]} - Array of file paths
 */
export function findAllCsvFiles(startPath, pattern = CSV_USER_STORY_PATTERN) {
  let results = [];
  try {
    const files = fs.readdirSync(startPath);
    for (const file of files) {
      const filePath = path.join(startPath, file);
      const stat = fs.lstatSync(filePath);
      
      if (stat.isDirectory()) {
        results = results.concat(findAllCsvFiles(filePath, pattern));
      } else if (pattern.test(filePath)) {
        results.push(filePath);
      }
    }
  } catch (error) {
     console.error(`Error reading directory ${startPath}: ${error.message}`);
  }
  return results;
}
