// process-issues.js
// Processes GitHub issues

import fs from 'fs';
import path from 'path';
import { updateIssue, listIssues } from '../github/github-issue-utils.js';
import {
  extractDomainFromIssue,
  extractUserStoryFromIssue
} from './story-validation-utils.js';
import { parseCsvRows } from './modules/parsers.js'; // Import parseCsvRows

// Add argument parsing
const args = process.argv.slice(2);
let skip = 0;
let limit = null;
let dryRun = false;

// Basic argument parsing
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--skip' && args[i + 1]) {
    skip = parseInt(args[i + 1], 10);
    i++; // Skip the next argument as it's the value
  } else if (args[i] === '--limit' && args[i + 1]) {
    limit = parseInt(args[i + 1], 10);
    i++; // Skip the next argument as it's the value
  } else if (args[i] === '--dry-run') {
    dryRun = true;
  } else if (args[i] === '--help') {
    console.log(`
Usage: node scripts/user-stories/process-issues.js [options]

Options:
  --skip <number>   Number of issues to skip (default: 0)
  --limit <number>  Maximum number of issues to process after skipping
  --dry-run         Perform a dry run without updating GitHub issues
  --help            Show this help message
`);
    process.exit(0);
  }
}


// Process issues - enhanced version that always uses getStoryComplexityAndPriority
export async function processIssues(issues, dryRun = false) {
  // Import these from the main file to avoid circular dependencies
  const {
    fixDocumentationLinks,
    addImplementationNotes,
    generateImplementationNotes
  } = await import('../update-user-stories.js');

  console.log(`Found ${issues.length} user story issues to update.`);
  if (dryRun) {
    console.log(`DRY RUN MODE - No issues will be updated.`);
  }

  let updated = 0, skipped = 0, errors = 0;
  let complexityUpdated = 0;
  let priorityUpdated = 0;

  for (const [index, issue] of issues.entries()) {
    try {
      console.log(`\nProcessing issue #${issue.number}: ${issue.title} (${index + 1}/${issues.length})`);
      let body = issue.body;
      let hasChanges = false;

      // 1. Extract domain and user story text
      const domain = extractDomainFromIssue(issue);
      const storyText = extractUserStoryFromIssue(issue);
      console.log(`- Domain: ${domain}`);
      console.log(`- Story: ${storyText.substring(0, 50)}...`);

      // 2. Find and read complexity and priority from the corresponding CSV file
      const domainFileName = `${domain.toLowerCase().replace(/\s+/g, '-')}-user-stories.csv`;
      console.log(`- Searching for CSV file: ${domainFileName} in docs/requirements/`);

      // Use Node.js fs to find the CSV file in known subdirectories.
      // This replaces the previous searchFiles tool usage.
      const baseDir = 'docs/requirements/';
      const subDirs = ['core', 'ui', 'integrations']; // Known subdirectories to search within
      let csvPath = null;

      for (const subDir of subDirs) {
        const potentialCsvPath = path.join(baseDir, subDir, domainFileName);
        // Check if the file exists at the potential path
        if (fs.existsSync(potentialCsvPath)) {
          csvPath = potentialCsvPath;
          break; // Found the file, no need to check other directories
        }
      }

      let csvRows = [];

      if (csvPath) {
        console.log(`- Found CSV file at: ${csvPath}`);
        try {
          // Read and parse the CSV file content
          // parseCsvRows is assumed to take a file path based on current usage
          csvRows = parseCsvRows(csvPath);
        } catch (e) {
          console.error(`- Error reading or parsing CSV file ${csvPath}: ${e.message}`);
          // Continue with empty csvRows if parsing fails to avoid stopping the script
        }
      } else {
        console.log(`- CSV file not found for domain: ${domain}`);
      }

      let complexity = 'Unknown';
      let priority = 'Unknown';

      if (csvRows.length > 0) {
        // Find the row in the CSV that matches the GitHub issue title.
        // We remove trailing periods from the issue title before trimming and comparing
        // to handle data inconsistencies like issue #124.
        const matchingRow = csvRows.find(row => row.userStory.trim() === issue.title.replace(/\.$/, '').trim());

        if (matchingRow) {
          complexity = matchingRow.complexity.trim() || 'Unknown';
          priority = matchingRow.priority.trim() || 'Unknown';
          console.log(`- Found matching row in ${csvPath}. Complexity: ${complexity}, Priority: ${priority}`);
        } else {
          console.log(`- No matching row found in ${csvPath} for issue title: ${issue.title}`);
        }
      } else {
        console.log(`- No data found in CSV at ${csvPath} or file not found/error reading.`);
      }

      // Format labels
      const complexityLabel = complexity !== 'Unknown' ? `complexity:${complexity.toLowerCase()}` : null;
      const priorityLabel = priority !== 'Unknown' ? `priority:${priority.toLowerCase().replace(/\s+|\(|\)/g, '-')}` : null;

      // 3. Fix documentation links
      const bodyWithFixedLinks = fixDocumentationLinks(body);
      if (bodyWithFixedLinks !== body) {
        console.log(`- Fixed documentation links`);
        body = bodyWithFixedLinks;
        hasChanges = true;
      }

      // 4. Add implementation notes
      const implementationNotes = generateImplementationNotes(issue);
      const bodyWithImplNotes = addImplementationNotes(body, implementationNotes);
      if (bodyWithImplNotes !== body) {
        console.log(`- Added implementation notes: ${implementationNotes.map(n => `\n  * ${n}`).join('')}`);
        body = bodyWithImplNotes;
        hasChanges = true;
      }




      if (hasChanges || complexityLabel || priorityLabel) { // Check if labels changed too
        if (!dryRun) {
          // Update issue with body and labels
          await updateIssue(issue, body, complexityLabel, priorityLabel);
          console.log(`✅ Updated issue #${issue.number}`);
          if (complexityLabel) complexityUpdated++;
          if (priorityLabel) priorityUpdated++;
        } else {
          console.log(`Would update issue #${issue.number} (dry run)`);
        }
        updated++;
      } else {
        console.log(`⏭️ No changes needed for issue #${issue.number}`);
        skipped++;
      }

      // Add a small delay to prevent rate limiting
      await new Promise(r => setTimeout(r, 1000));

    } catch (err) {
      console.error(`❌ Error processing issue #${issue.number}: ${err.message}`);
      errors++;
    }
  }

  return {
    updated,
    skipped,
    errors,
    total: issues.length,
    complexityUpdated,
    priorityUpdated
  };
}

// Main execution block (assuming this script is the entry point)
async function main() {
 const issuesToProcess = [];
 let currentPage = Math.floor(skip / 100) + 1;
 let issuesFetchedCount = 0;
 const remainingToFetch = limit === null ? Infinity : limit;
 const startIndexOnPage = skip % 100;

 console.log(`Fetching issues starting from index ${skip} (page ${currentPage}, starting index on page ${startIndexOnPage}).`);

 while (issuesFetchedCount < remainingToFetch) {
   const pageIssues = await listIssues(currentPage, 100);

   if (pageIssues.length === 0) {
     // No more issues to fetch
     break;
   }

   let relevantIssues = pageIssues;
   if (currentPage === Math.floor(skip / 100) + 1) {
     // For the first page we fetch, apply the starting index offset
     relevantIssues = pageIssues.slice(startIndexOnPage);
   }

   // Add relevant issues, respecting the overall limit
   const issuesToAddCount = Math.min(relevantIssues.length, remainingToFetch - issuesFetchedCount);
   issuesToProcess.push(...relevantIssues.slice(0, issuesToAddCount));
   issuesFetchedCount += issuesToAddCount;

   if (issuesFetchedCount >= remainingToFetch) {
       break; // Reached the limit
   }

   currentPage++;
 }


 console.log(`Processing ${issuesToProcess.length} issues (skipping ${skip}, limiting to ${limit === null ? 'all' : limit}).`);

 // Call the main processing function
 const results = await processIssues(issuesToProcess, dryRun);

 console.log(`\nProcessing complete.`);
 console.log(`Results:`);
 console.log(`- Total issues considered (after skip/limit): ${issuesToProcess.length}`);
 console.log(`- Issues updated: ${results.updated}`);
 console.log(`- Issues skipped (no changes needed): ${results.skipped}`);
 console.log(`- Errors: ${results.errors}`);
 console.log(`- Complexity labels updated: ${results.complexityUpdated}`);
 console.log(`- Priority labels updated: ${results.priorityUpdated}`);
}

main().catch(console.error);