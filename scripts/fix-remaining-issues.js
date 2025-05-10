// fix-remaining-issues.js
// This script verifies title consistency after the main fixes

import fs from 'fs';
import path from 'path';
import {
  findAllCsvFiles,
  parseCSVLine
} from './user-stories/modules/csv-utils.js';
import { parseCsvRows } from './user-stories/modules/parsers.js';

/**
 * Find issues referenced with different titles in CSV files
 * This is a validation function that checks whether our cleanup was successful
 */
function findIssuesWithDifferentTitles(csvFiles) {
  console.log('Verifying title consistency in multiple CSV references...');
  
  // Build a map of GitHub issue URLs to rows
  const issueMap = new Map();
  
  for (const file of csvFiles) {
    try {
      const rows = parseCsvRows(file);
      
      for (const row of rows) {
        if (row.gitHubIssueLink && row.gitHubIssueLink.trim()) {
          const url = row.gitHubIssueLink.trim();
          
          if (!issueMap.has(url)) {
            issueMap.set(url, []);
          }
          
          issueMap.get(url).push({
            file,
            row
          });
        }
      }
    } catch (error) {
      console.error(`Error processing ${file}: ${error.message}`);
    }
  }
  
  // Find issues referenced with different titles
  const issuesWithDifferentTitles = new Map();
  
  for (const [url, references] of issueMap.entries()) {
    if (references.length > 1) {
      // Check if there are different titles
      const uniqueTitles = new Set(references.map(ref => ref.row.titleSummary));
      
      if (uniqueTitles.size > 1) {
        issuesWithDifferentTitles.set(url, references);
      }
    }
  }
  
  return issuesWithDifferentTitles;
}

/**
 * Find CSV rows with empty GitHub issue links
 */
function findRowsWithEmptyLinks(csvFiles) {
  const rowsWithEmptyLinks = [];
  
  for (const file of csvFiles) {
    try {
      const rows = parseCsvRows(file);
      
      for (const row of rows) {
        if (!row.gitHubIssueLink || row.gitHubIssueLink.trim() === '') {
          rowsWithEmptyLinks.push({
            file,
            row
          });
        }
      }
    } catch (error) {
      console.error(`Error processing ${file}: ${error.message}`);
    }
  }
  
  return rowsWithEmptyLinks;
}

// Main function
async function main() {
  try {
    // Find all CSV files
    const csvPath = path.resolve(process.cwd(), 'docs/requirements');
    const csvFiles = findAllCsvFiles(csvPath);
    console.log(`Found ${csvFiles.length} CSV files`);
    
    // Find issues with different titles
    const issuesWithDifferentTitles = findIssuesWithDifferentTitles(csvFiles);
    const issuesWithDifferentTitlesCount = issuesWithDifferentTitles.size;
    
    // Print issues with different titles
    if (issuesWithDifferentTitlesCount > 0) {
      console.log(`\nFound ${issuesWithDifferentTitlesCount} issues with different titles in CSV files:`);
      
      for (const [url, references] of issuesWithDifferentTitles.entries()) {
        console.log(`\nIssue ${url} has different titles:`);
        for (const ref of references) {
          console.log(`- ${path.basename(ref.file)}: "${ref.row.titleSummary}"`);
        }
      }
    } else {
      console.log('\nNo issues with different titles found!');
    }
    
    // Find rows with empty GitHub issue links
    const rowsWithEmptyLinks = findRowsWithEmptyLinks(csvFiles);
    
    // Print rows with empty GitHub issue links
    if (rowsWithEmptyLinks.length > 0) {
      console.log(`\nFound ${rowsWithEmptyLinks.length} rows with empty GitHub issue links:`);
      
      for (const { file, row } of rowsWithEmptyLinks) {
        console.log(`\nEmpty GitHub issue link in ${path.basename(file)}:`);
        console.log(`- Title: "${row.titleSummary}"`);
        
        // Read the file content to check for structure
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').slice(0, 2); // Get header and first row
        console.log(`- File structure (first 2 lines):`);
        console.log(lines.map(line => `  ${line}`).join('\n'));
      }
    } else {
      console.log('\nNo rows with empty GitHub issue links found!');
    }
    
    console.log('\nVerification completed!');
    
    // Return status for external processes
    return {
      issuesWithDifferentTitles: issuesWithDifferentTitlesCount,
      rowsWithEmptyLinks: rowsWithEmptyLinks.length
    };
    
  } catch (error) {
    console.error(`\nAn error occurred: ${error.message}`);
    return {
      error: error.message
    };
  }
}

// Execute the main function
main();
