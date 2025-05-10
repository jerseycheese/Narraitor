// cleanup-duplicates.js
// This script analyzes and fixes duplicate issues in the repository

import fs from 'fs';
import path from 'path';
import { OWNER, REPO } from './user-stories/modules/config.js';
import { 
  findAllCsvFiles,
  readCsvFile,
  writeCsvFile
} from './user-stories/modules/csv-utils.js';
import {
  githubRequest
} from './user-stories/modules/github-api.js';
import { parseCsvRows } from './user-stories/modules/parsers.js';

// Get GitHub token from environment variables
const TOKEN = process.env.GITHUB_TOKEN;
const ANALYSIS_FILE = path.resolve(process.cwd(), 'duplicate-analysis.json');

// Fix duplicate GitHub issues
async function fixDuplicateIssues(duplicateIssues, dryRun) {
  console.log("\n=== Fixing Duplicate GitHub Issues ===");
  
  for (const [title, issues] of Object.entries(duplicateIssues)) {
    if (issues.length < 2) continue;
    
    // Sort issues by number (ascending)
    issues.sort((a, b) => a.number - b.number);
    
    // Keep the first (lowest number) issue
    const primaryIssue = issues[0];
    const duplicateIssues = issues.slice(1);
    
    console.log(`\nTitle: "${title}"`);
    console.log(`Primary issue: #${primaryIssue.number}`);
    
    for (const duplicate of duplicateIssues) {
      console.log(`Duplicate: #${duplicate.number} - Will close and reference primary`);
      
      if (!dryRun) {
        try {
          // Comment on duplicate issue
          await githubRequest(
            'POST',
            `/repos/${OWNER}/${REPO}/issues/${duplicate.number}/comments`,
            {
              body: `This issue is a duplicate of #${primaryIssue.number} and will be closed. Please refer to the primary issue for updates.`
            },
            TOKEN
          );
          
          // Close duplicate issue
          await githubRequest(
            'PATCH',
            `/repos/${OWNER}/${REPO}/issues/${duplicate.number}`,
            {
              state: 'closed',
              state_reason: 'completed'
            },
            TOKEN
          );
          
          console.log(`✅ Closed issue #${duplicate.number} with reference to #${primaryIssue.number}`);
        } catch (error) {
          console.error(`❌ Failed to close issue #${duplicate.number}: ${error.message}`);
        }
      }
    }
  }
}

// Fix CSV references to point to the correct GitHub issues
function fixCsvReferences(duplicateIssues, allCsvFiles, dryRun) {
  console.log("\n=== Fixing CSV References to Duplicate Issues ===");
  
  // Build a map of issue numbers to be redirected
  const redirectMap = new Map();
  
  for (const [, issues] of Object.entries(duplicateIssues)) {
    if (issues.length < 2) continue;
    
    // Sort issues by number (ascending)
    issues.sort((a, b) => a.number - b.number);
    
    // Keep the first (lowest number) issue
    const primaryIssue = issues[0];
    
    // Map duplicates to primary
    for (let i = 1; i < issues.length; i++) {
      const duplicateUrl = issues[i].html_url;
      redirectMap.set(duplicateUrl, primaryIssue.html_url);
    }
  }
  
  // Process each CSV file
  for (const csvFile of allCsvFiles) {
    let modified = false;
    const csvPath = csvFile.path;
    
    console.log(`\nProcessing CSV: ${path.basename(csvPath)}`);
    
    // Read the CSV content
    let csvContent = readCsvFile(csvPath);
    
    // Check each redirect
    for (const [fromUrl, toUrl] of redirectMap.entries()) {
      // If CSV contains the duplicate URL, replace it with the primary URL
      if (csvContent.includes(fromUrl)) {
        csvContent = csvContent.replace(new RegExp(fromUrl, 'g'), toUrl);
        console.log(`  - Updated reference from ${fromUrl} to ${toUrl}`);
        modified = true;
      }
    }
    
    // Write updated CSV content if modified
    if (modified && !dryRun) {
      writeCsvFile(csvPath, csvContent);
      console.log(`✅ Updated CSV file: ${path.basename(csvPath)}`);
    } else if (modified) {
      console.log(`Would update CSV file: ${path.basename(csvPath)} (dry run)`);
    } else {
      console.log(`No changes needed for: ${path.basename(csvPath)}`);
    }
  }
}

// Fix CSV rows without valid GitHub issue links or with corrupted links
function fixInvalidCsvLinks(rowsWithoutIssues, allCsvFiles, dryRun) {
  console.log("\n=== Fixing Invalid CSV Links ===");
  
  // Process problematic rows
  for (const row of rowsWithoutIssues) {
    const filePath = row._filePath;
    const title = row.titleSummary || '[No Title]';
    const currentLink = row.gitHubIssueLink || '';
    
    console.log(`\nTitle: "${title}" in ${path.basename(filePath)}`);
    console.log(`Current link: ${currentLink}`);
    
    // Only fix if this is an obviously corrupted link (not just empty)
    if (currentLink && !currentLink.match(/^https:\/\/github\.com\/[\w-]+\/[\w-]+\/issues\/\d+$/)) {
      console.log(`Appears to be corrupted - would clear this link in the CSV`);
      
      if (!dryRun) {
        // Read the CSV content
        let csvContent = readCsvFile(filePath);
        
        // Create a sanitized version of the corrupted link for safe regex replacement
        const sanitizedLink = currentLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Replace the corrupted link with an empty string
        csvContent = csvContent.replace(new RegExp(sanitizedLink, 'g'), '');
        
        // Write updated CSV content
        writeCsvFile(filePath, csvContent);
        console.log(`✅ Cleared corrupted link in CSV file: ${path.basename(filePath)}`);
      }
    } else {
      console.log(`No automatic fix available - manual review required`);
    }
  }
}

// Main function
async function main() {
  // Check for GitHub token
  if (!TOKEN) {
    console.error('GitHub token not found. Set GITHUB_TOKEN environment variable.');
    process.exit(1);
  }
  
  // Check for analysis file
  if (!fs.existsSync(ANALYSIS_FILE)) {
    console.error('Duplicate analysis file not found. Run find-duplicates.js first.');
    process.exit(1);
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fixIssues = args.includes('--fix-issues');
  const fixCsvs = args.includes('--fix-csvs');
  const fixAll = args.includes('--fix-all');
  
  if (dryRun) {
    console.log('Running in dry-run mode - no changes will be made');
  }
  
  try {
    // Load analysis data
    const analysisData = JSON.parse(fs.readFileSync(ANALYSIS_FILE, 'utf8'));
    
    // Find all CSV files
    const allCsvFiles = findAllCsvFiles(path.resolve(process.cwd(), 'docs/requirements')).map(filePath => {
      return {
        path: filePath,
        rows: parseCsvRows(filePath)
      };
    });
    console.log(`Found ${allCsvFiles.length} CSV files`);
    
    // Fix duplicate GitHub issues
    if (fixIssues || fixAll) {
      await fixDuplicateIssues(analysisData.duplicateIssues, dryRun);
    }
    
    // Fix CSV references to duplicates
    if (fixCsvs || fixAll) {
      fixCsvReferences(analysisData.duplicateIssues, allCsvFiles, dryRun);
    }
    
    // Fix invalid CSV links
    if (fixCsvs || fixAll) {
      fixInvalidCsvLinks(analysisData.rowsWithoutIssues, allCsvFiles, dryRun);
    }
    
    console.log('\nDuplicate cleanup completed!');
    
    // Recommendations for manual steps
    console.log('\n=== Recommended Manual Steps ===');
    console.log('1. Review GitHub issues with multiple CSV references - consolidate where appropriate');
    console.log('2. Review any CSV rows without GitHub issues - create issues or remove rows');
    console.log('3. Re-run find-duplicates.js to verify fixes');
    
  } catch (error) {
    console.error(`\nAn error occurred: ${error.message}`);
    process.exit(1);
  }
}

// Execute the main function
main();
