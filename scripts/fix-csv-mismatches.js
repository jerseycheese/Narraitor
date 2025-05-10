// fix-csv-mismatches.js
// This script fixes CSV reference mismatches in GitHub issue titles

import path from 'path';
import { OWNER, REPO } from './user-stories/modules/config.js';
import { 
  findAllCsvFiles,
  loadAllCsvFiles,
  updateCsvTitle,
  updateCsvIssueLink,
  extractIssueNumber
} from './user-stories/modules/csv-utils.js';
import {
  fetchIssueByNumber,
  createIssue
} from './user-stories/modules/github-api.js';

// Get GitHub token from environment variables
const TOKEN = process.env.GITHUB_TOKEN;

// Find issues with multiple CSV references and different titles
async function findMismatchedReferences(csvFiles) {
  const issueReferences = new Map();
  
  // First pass: collect all references
  for (const csvFile of csvFiles) {
    for (const row of csvFile.rows) {
      if (!row.gitHubIssueLink) continue;
      
      const issueNumber = extractIssueNumber(row.gitHubIssueLink);
      if (!issueNumber) continue;
      
      if (!issueReferences.has(issueNumber)) {
        issueReferences.set(issueNumber, []);
      }
      
      issueReferences.get(issueNumber).push({
        csvPath: csvFile.path,
        titleSummary: row.titleSummary,
        csvRow: row
      });
    }
  }
  
  // Second pass: filter to issues with different titles
  const mismatches = [];
  
  for (const [issueNumber, references] of issueReferences.entries()) {
    if (references.length < 2) continue;
    
    // Check if there are different titles
    const uniqueTitles = new Set(references.map(ref => ref.titleSummary));
    if (uniqueTitles.size > 1) {
      // Fetch the actual issue title from GitHub
      try {
        const issueDetails = await fetchIssueByNumber(OWNER, REPO, issueNumber, TOKEN);
        
        if (issueDetails) {
          mismatches.push({
            issueNumber,
            issueTitle: issueDetails.title,
            references
          });
        }
      } catch (error) {
        console.error(`Error fetching issue #${issueNumber}: ${error.message}`);
      }
    }
  }
  
  return mismatches;
}

// Find CSV rows pointing to non-existent issues
async function findNonExistentIssues(csvFiles) {
  const result = [];
  
  for (const csvFile of csvFiles) {
    for (const row of csvFile.rows) {
      if (!row.gitHubIssueLink) continue;
      
      const issueNumber = extractIssueNumber(row.gitHubIssueLink);
      if (!issueNumber) continue;
      
      try {
        // Try to fetch the issue
        const issue = await fetchIssueByNumber(OWNER, REPO, issueNumber, TOKEN);
        
        if (!issue) {
          result.push({
            csvPath: csvFile.path,
            titleSummary: row.titleSummary,
            issueNumber,
            csvRow: row
          });
        }
      } catch (error) {
        // If we get a 404, the issue doesn't exist
        if (error.message.includes('404')) {
          result.push({
            csvPath: csvFile.path,
            titleSummary: row.titleSummary,
            issueNumber,
            csvRow: row
          });
        }
      }
    }
  }
  
  return result;
}

// Fix mismatches by updating CSV titles to match GitHub issue titles
async function fixMismatchedReferences(mismatches, dryRun) {
  console.log("\n=== Fixing Mismatched References ===");
  
  for (const mismatch of mismatches) {
    console.log(`\nIssue #${mismatch.issueNumber}: "${mismatch.issueTitle}"`);
    
    for (const reference of mismatch.references) {
      if (reference.titleSummary !== mismatch.issueTitle) {
        console.log(`- CSV: ${path.basename(reference.csvPath)}`);
        console.log(`  Current title: "${reference.titleSummary}"`);
        
        const updated = updateCsvTitle(reference.csvPath, reference.csvRow, mismatch.issueTitle, dryRun);
        
        if (updated) {
          console.log(`  ${dryRun ? 'Would update' : 'Updated'} title to match GitHub issue`);
        } else {
          console.log(`  Failed to update title`);
        }
      }
    }
  }
}

// Fix CSV rows pointing to non-existent issues
async function fixNonExistentIssues(nonExistentIssues, dryRun) {
  console.log("\n=== Fixing Non-Existent Issues ===");
  
  for (const issue of nonExistentIssues) {
    console.log(`\nMissing issue #${issue.issueNumber} referenced in ${path.basename(issue.csvPath)}`);
    console.log(`Title: "${issue.titleSummary}"`);
    
    // Create a new GitHub issue with the same title
    if (!dryRun) {
      // Get user story content from the CSV row for the issue body
      let body = `## User Story\n${issue.csvRow.userStory || ''}\n\n`;
      
      // Add acceptance criteria if available
      if (issue.csvRow.acceptanceCriteriaRaw) {
        body += `## Acceptance Criteria\n${issue.csvRow.acceptanceCriteriaRaw
          .split('\\n')
          .map(item => `- ${item.trim()}`)
          .join('\n')}\n\n`;
      }
      
      // Add technical requirements if available
      if (issue.csvRow.technicalRequirements) {
        body += `## Technical Requirements\n${issue.csvRow.technicalRequirements
          .split('\\n')
          .map(item => `- ${item.trim()}`)
          .join('\n')}\n\n`;
      }
      
      // Add implementation notes if available
      body += `## Implementation Notes\n<!-- Add guidance on implementation approach, architecture considerations, etc. -->\n`;
      if (issue.csvRow.implementationConsiderations) {
        body += `${issue.csvRow.implementationConsiderations
          .split('\\n')
          .map(item => `- ${item.trim()}`)
          .join('\n')}\n\n`;
      } else {
        body += '\n';
      }
      
      // Add complexity section
      body += `## Estimated Complexity\n<!-- Select the estimated complexity level -->\n`;
      const complexity = issue.csvRow.complexity || 'Medium';
      body += `- [${complexity === 'Small' ? 'x' : ' '}] Small (1-2 days)\n`;
      body += `- [${complexity === 'Medium' ? 'x' : ' '}] Medium (3-5 days)\n`;
      body += `- [${complexity === 'Large' ? 'x' : ' '}] Large (1+ week)\n\n`;
      
      // Add priority section
      body += `## Priority\n<!-- Select the priority level -->\n`;
      const priority = issue.csvRow.priority || 'Medium';
      body += `- [${priority === 'High' ? 'x' : ' '}] High (MVP)\n`;
      body += `- [${priority === 'Medium' ? 'x' : ' '}] Medium (MVP Enhancement)\n`;
      body += `- [${priority === 'Low' ? 'x' : ' '}] Low (Nice to Have)\n`;
      body += `- [${priority === 'Post-MVP' ? 'x' : ' '}] Post-MVP\n\n`;
      
      // Add related documentation if available
      body += `## Related Documentation\n<!-- Link to requirements documents and other references -->\n`;
      if (issue.csvRow.relatedDocumentation) {
        body += `${issue.csvRow.relatedDocumentation
          .split(',')
          .map(doc => `- ${doc.trim()}`)
          .join('\n')}\n\n`;
      } else {
        body += '\n';
      }
      
      // Add related issues if available
      body += `## Related Issues/Stories\n<!-- Link to any related issues or stories -->\n`;
      if (issue.csvRow.relatedIssues) {
        body += `${issue.csvRow.relatedIssues
          .split('\\n')
          .map(item => `- ${item.trim()}`)
          .join('\n')}\n\n`;
      } else {
        body += '\n';
      }
      
      // Set labels
      const labels = ['user-story'];
      
      // Add complexity label
      if (complexity) {
        labels.push(`complexity:${complexity.toLowerCase()}`);
      }
      
      // Add priority label
      if (priority) {
        labels.push(`priority:${priority.toLowerCase().replace(/\s+|\(|\)/g, '-')}`);
      }
      
      console.log(`Creating new GitHub issue: "${issue.titleSummary}"`);
      try {
        const newIssue = await createIssue(OWNER, REPO, issue.titleSummary, body, labels, TOKEN);
        
        console.log(`✅ Created new issue #${newIssue.number}: ${newIssue.html_url}`);
        
        // Update the CSV to point to the new issue
        const updated = updateCsvIssueLink(issue.csvPath, issue.csvRow, newIssue.html_url, dryRun);
        if (updated) {
          console.log(`✅ Updated CSV reference to new issue`);
        } else {
          console.error(`❌ Failed to update CSV reference`);
        }
      } catch (error) {
        console.error(`❌ Failed to create new issue: ${error.message}`);
      }
    } else {
      console.log(`Would create a new GitHub issue with title "${issue.titleSummary}" and update CSV reference (dry run)`);
    }
  }
}

// Find CSV rows without GitHub issue links
function findRowsWithoutIssueLinks(csvFiles) {
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

// Fix CSV rows without GitHub issue links
async function fixRowsWithoutIssueLinks(rowsWithoutLinks, dryRun) {
  console.log("\n=== Fixing Rows Without Issue Links ===");
  
  for (const row of rowsWithoutLinks) {
    console.log(`\nRow without GitHub issue in ${path.basename(row.csvPath)}`);
    console.log(`Title: "${row.titleSummary}"`);
    
    // Create a new GitHub issue with the same title
    if (!dryRun) {
      // Similar to fixNonExistentIssues but for rows without links
      let body = `## User Story\n${row.csvRow.userStory || ''}\n\n`;
      
      // Add rest of issue content similar to fixNonExistentIssues
      // Set labels
      const labels = ['user-story'];
      const complexity = row.csvRow.complexity || 'Medium';
      const priority = row.csvRow.priority || 'Medium';
      
      labels.push(`complexity:${complexity.toLowerCase()}`);
      labels.push(`priority:${priority.toLowerCase().replace(/\s+|\(|\)/g, '-')}`);
      
      console.log(`Creating new GitHub issue: "${row.titleSummary}"`);
      try {
        const newIssue = await createIssue(OWNER, REPO, row.titleSummary, body, labels, TOKEN);
        
        console.log(`✅ Created new issue #${newIssue.number}: ${newIssue.html_url}`);
        
        // Update the CSV to point to the new issue
        const updated = updateCsvIssueLink(row.csvPath, row.csvRow, newIssue.html_url, dryRun);
        if (updated) {
          console.log(`✅ Updated CSV reference to new issue`);
        } else {
          console.error(`❌ Failed to update CSV reference`);
        }
      } catch (error) {
        console.error(`❌ Failed to create new issue: ${error.message}`);
      }
    } else {
      console.log(`Would create a new GitHub issue with title "${row.titleSummary}" and update CSV reference (dry run)`);
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
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fixMismatches = args.includes('--fix-mismatches') || args.includes('--fix-all');
  const fixMissing = args.includes('--fix-missing') || args.includes('--fix-all');
  const fixEmpty = args.includes('--fix-empty') || args.includes('--fix-all');
  
  if (dryRun) {
    console.log('Running in dry-run mode - no changes will be made');
  }
  
  try {
    // Load all CSV files
    console.log('Loading CSV files...');
    const csvFiles = loadAllCsvFiles(path.resolve(process.cwd(), 'docs/requirements'));
    console.log(`Found ${csvFiles.length} CSV files\n`);
    
    // Find issues with mismatched references
    if (fixMismatches) {
      console.log('Finding mismatched references...');
      const mismatches = await findMismatchedReferences(csvFiles);
      console.log(`Found ${mismatches.length} issues with mismatched references`);
      
      // Fix mismatched references
      await fixMismatchedReferences(mismatches, dryRun);
    }
    
    // Find CSV rows pointing to non-existent issues
    if (fixMissing) {
      console.log('\nFinding references to non-existent issues...');
      const nonExistentIssues = await findNonExistentIssues(csvFiles);
      console.log(`Found ${nonExistentIssues.length} references to non-existent issues`);
      
      // Fix non-existent issues
      await fixNonExistentIssues(nonExistentIssues, dryRun);
    }
    
    // Find CSV rows without GitHub issue links
    if (fixEmpty) {
      console.log('\nFinding rows without GitHub issue links...');
      const rowsWithoutLinks = findRowsWithoutIssueLinks(csvFiles);
      console.log(`Found ${rowsWithoutLinks.length} rows without GitHub issue links`);
      
      // Fix rows without issue links
      await fixRowsWithoutIssueLinks(rowsWithoutLinks, dryRun);
    }
    
    console.log('\nCSV mismatch fix completed!');
    
  } catch (error) {
    console.error(`\nAn error occurred: ${error.message}`);
    process.exit(1);
  }
}

// Execute the main function
main();
