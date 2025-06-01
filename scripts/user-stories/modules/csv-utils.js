// CSV utility functions
// Provides standardized CSV operations with error handling

import fs from 'fs';
import path from 'path';
import { CSV_USER_STORY_PATTERN, CSV_DEFAULT_ENCODING } from './config.js';
import { parseCsvRows } from './parsers.js';

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

/**
 * Read a CSV file and return its content
 * @param {string} filePath - Path to the CSV file
 * @param {string} encoding - File encoding (defaults to CSV_DEFAULT_ENCODING)
 * @returns {string} - File content as string
 */
export function readCsvFile(filePath, encoding = CSV_DEFAULT_ENCODING) {
  try {
    return fs.readFileSync(filePath, encoding);
  } catch (error) {
    throw new Error(`Failed to read CSV file ${filePath}: ${error.message}`);
  }
}

/**
 * Write content to a CSV file
 * @param {string} filePath - Path to the CSV file
 * @param {string} content - Content to write
 * @param {string} encoding - File encoding (defaults to CSV_DEFAULT_ENCODING)
 */
export function writeCsvFile(filePath, content, encoding = CSV_DEFAULT_ENCODING) {
  try {
    fs.writeFileSync(filePath, content, encoding);
  } catch (error) {
    throw new Error(`Failed to write CSV file ${filePath}: ${error.message}`);
  }
}

/**
 * Load all user story CSV files with parsed rows
 * @param {string} startPath - Directory to search from
 * @returns {Array<{path: string, rows: Array}>} - Array of file info with parsed rows
 */
export function loadAllCsvFiles(startPath) {
  const csvPaths = findAllCsvFiles(startPath);
  return csvPaths.map(filePath => {
    try {
      return {
        path: filePath,
        rows: parseCsvRows(filePath)
      };
    } catch (error) {
      console.error(`Error parsing CSV ${filePath}: ${error.message}`);
      return {
        path: filePath,
        rows: [],
        error: error.message
      };
    }
  });
}

/**
 * Extract issue number from GitHub URL
 * @param {string} url - GitHub issue URL
 * @returns {number|null} - Issue number or null if not found
 */
export function extractIssueNumber(url) {
  if (!url) return null;
  
  const match = url.match(/\/issues\/(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Update a CSV row's title
 * @param {string} csvPath - Path to the CSV file
 * @param {Object} row - Row object with titleSummary property
 * @param {string} newTitle - New title to set
 * @param {boolean} dryRun - Whether to actually write the changes
 * @returns {boolean} - Whether the update was successful
 */
export function updateCsvTitle(csvPath, row, newTitle, dryRun = false) {
  if (!row.titleSummary) {
    console.error(`Cannot update title in ${csvPath}: row has no titleSummary property`);
    return false;
  }
  
  try {
    // Read CSV content
    let csvContent = readCsvFile(csvPath);
    
    // Find and replace the title, being careful with potential CSV escaping
    const oldTitle = row.titleSummary.replace(/"/g, '""');
    const escapedOldTitle = oldTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create a regex to match the title in the CSV considering possible surrounding quotes
    const titleRegex = new RegExp(`(^|,)"?${escapedOldTitle}"?(,|$)`, 'g');
    const newEscapedTitle = newTitle.replace(/"/g, '""');
    
    // Replace with appropriate quoting if needed
    let replacement;
    if (newTitle.includes(',') || newTitle.includes('"') || newTitle.includes('\n')) {
      replacement = `$1"${newEscapedTitle}"$2`;
    } else {
      replacement = `$1${newTitle}$2`;
    }
    
    const newContent = csvContent.replace(titleRegex, replacement);
    
    // Check if anything changed
    if (newContent === csvContent) {
      console.warn(`Warning: Title "${oldTitle}" not found in ${csvPath}`);
      return false;
    }
    
    // Write updated content if not in dry run mode
    if (!dryRun) {
      writeCsvFile(csvPath, newContent);
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating CSV title in ${csvPath}: ${error.message}`);
    return false;
  }
}

/**
 * Update a CSV row's GitHub issue link
 * @param {string} csvPath - Path to the CSV file
 * @param {Object} row - Row object with gitHubIssueLink property
 * @param {string} newIssueLink - New GitHub issue link
 * @param {boolean} dryRun - Whether to actually write the changes
 * @returns {boolean} - Whether the update was successful
 */
export function updateCsvIssueLink(csvPath, row, newIssueLink, dryRun = false) {
  try {
    // Read CSV content
    let csvContent = readCsvFile(csvPath);
    
    // Get header row to find GitHub Issue Link column index
    const lines = csvContent.split('\n');
    if (lines.length < 2) {
      console.error(`CSV file ${csvPath} has insufficient rows`);
      return false;
    }
    
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);
    
    // Find the GitHub Issue Link column
    const githubIssueLinkIdx = headers.findIndex(col => 
      col.trim().toLowerCase() === 'github issue link' || 
      col.trim().toLowerCase() === 'githubissuelink');
    
    if (githubIssueLinkIdx === -1) {
      console.error(`GitHub Issue Link column not found in ${csvPath}`);
      return false;
    }
    
    // Find the row with matching title
    const titleCol = 0; // Title is usually the first column
    let foundRowIndex = -1;
    
    for (let i = 1; i < lines.length; i++) {
      const rowValues = parseCSVLine(lines[i]);
      if (rowValues.length <= titleCol) continue;
      
      const rowTitle = rowValues[titleCol]?.trim() || '';
      if (rowTitle === row.titleSummary?.trim()) {
        foundRowIndex = i;
        break;
      }
    }
    
    if (foundRowIndex === -1) {
      console.error(`Row with title "${row.titleSummary}" not found in ${csvPath}`);
      return false;
    }
    
    // Parse the row and update the GitHub Issue Link
    const rowValues = parseCSVLine(lines[foundRowIndex]);
    if (rowValues.length <= githubIssueLinkIdx) {
      // Extend the array if needed
      rowValues.length = githubIssueLinkIdx + 1;
    }
    
    rowValues[githubIssueLinkIdx] = newIssueLink;
    
    // Rebuild the line
    lines[foundRowIndex] = rowValues.map(val => {
      // Add quotes if value contains commas or quotes
      if (val?.includes(',') || val?.includes('"') || val?.includes('\n')) {
        return `"${(val || '').replace(/"/g, '""')}"`;
      }
      return val || '';
    }).join(',');
    
    // Write the updated content if not in dry run mode
    if (!dryRun) {
      writeCsvFile(csvPath, lines.join('\n'));
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating CSV issue link in ${csvPath}: ${error.message}`);
    return false;
  }
}

/**
 * Parse a CSV line into an array of values
 * @param {string} line - CSV line to parse
 * @returns {string[]} - Array of values
 */
export function parseCSVLine(line) {
  if (!line) return [];
  
  const result = [];
  let inQuotes = false;
  let currentValue = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Double quotes inside quotes = escaped quote
        currentValue += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quotes state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Don't forget the last field
  result.push(currentValue);
  
  return result;
}

/**
 * Find CSV rows with duplicate titles
 * @param {Array<{path: string, rows: Array}>} csvFiles - Array of CSV files with parsed rows
 * @returns {Object} - Mapping of titles to arrays of duplicate rows
 */
export function findDuplicateCsvRows(csvFiles) {
  // Group by title/summary
  const rowsByTitle = {};
  
  for (const csvFile of csvFiles) {
    for (const row of csvFile.rows) {
      const title = row.titleSummary?.trim() || '';
      if (!title) continue;
      
      if (!rowsByTitle[title]) {
        rowsByTitle[title] = [];
      }
      
      rowsByTitle[title].push({
        ...row,
        _filePath: csvFile.path
      });
    }
  }
  
  // Find titles with multiple rows
  const duplicateTitles = {};
  Object.entries(rowsByTitle).forEach(([title, titleRows]) => {
    if (titleRows.length > 1) {
      duplicateTitles[title] = titleRows;
    }
  });
  
  return duplicateTitles;
}

/**
 * Find CSV rows without GitHub issue links
 * @param {Array<{path: string, rows: Array}>} csvFiles - Array of CSV files with parsed rows
 * @returns {Array<Object>} - Array of rows without issue links
 */
export function findRowsWithoutIssueLinks(csvFiles) {
  const result = [];
  
  for (const csvFile of csvFiles) {
    for (const row of csvFile.rows) {
      if (!row.gitHubIssueLink || row.gitHubIssueLink.trim() === '') {
        result.push({
          csvPath: csvFile.path,
          titleSummary: row.titleSummary,
          csvRow: row
        });
      }
    }
  }
  
  return result;
}
