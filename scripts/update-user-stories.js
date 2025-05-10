// update-user-stories.js
// Main script for synchronizing CSV user story data with GitHub issues
// 
// This script updates existing user story issues with correct documentation links,
// implementation notes, and complexity/priority estimates from CSV data.
//
// Features:
// - Updates GitHub issues from CSV data
// - Fixes documentation links in issues
// - Adds implementation notes based on story content
// - Updates complexity and priority based on CSV data
// - Handles rate limiting for GitHub API
//
// Usage:
//   node scripts/update-user-stories.js [options]
//
// Options:
//   --dry-run      Test run without making changes
//   --limit N      Limit to N issues
//   --force        Bypass label verification
//   --validate     Run in validation mode
//   --issue=N      Process specific issue number

import fs from 'fs';
import path from 'path';
import {
  OWNER,
  REPO,
  DEBUG_MODE
} from './user-stories/modules/config.js';
import {
  findAllCsvFiles,
  extractIssueNumber
} from './user-stories/modules/csv-utils.js';
import {
  fetchAllIssues,
  fetchIssueByNumber,
  verifyLabels
} from './user-stories/modules/github-api.js';
import {
  validateIssuesAgainstDocs
} from './story-validation-utils.js';
import {
  processIssues
} from './process-issues.js';
import { parseCsvRows } from './user-stories/modules/parsers.js';

// Get GitHub token from environment variables
const TOKEN = process.env.GITHUB_TOKEN;

// Generate implementation notes based on user story content and technical requirements
export function generateImplementationNotes(story) {
  const content = story.body || '';
  
  // Extract category if available
  let category = '';
  const categoryMatch = content.match(/domain:([a-z-]+)/i);
  if (categoryMatch) {
    category = categoryMatch[1].replace(/-/g, ' ');
  }
  
  // Extract user story text
  const storyTextMatch = content.match(/## User Story\n([\s\S]*?)(?=\n##)/);
  const storyText = storyTextMatch ? storyTextMatch[1].trim() : '';
  
  // Extract technical requirements
  const techReqMatch = content.match(/## Technical Requirements\n([\s\S]*?)(?=\n##)/);
  const techReq = techReqMatch ? techReqMatch[1].trim() : '';
  
  const lowerStory = storyText.toLowerCase();
  
  let notes = [];
  
  // First note based on story pattern and category
  const actionWords = ['create', 'implement', 'develop', 'build', 'integrate', 'manage', 'track', 'handle'];
  const actionMatch = actionWords.find(word => lowerStory.includes(word));
  
  if (category && actionMatch) {
    notes.push(`Follow the ${category} module pattern for the ${actionMatch} functionality`);
  } else {
    notes.push(`Use standard implementation approach for this feature`);
  }
  
  // Second note based on technical requirements
  if (techReq && techReq.length > 0) {
    const lowerReq = techReq.toLowerCase();
    if (lowerReq.includes('api') || lowerReq.includes('service')) {
      notes.push(`Implement with service interface design patterns`);
    } else if (lowerReq.includes('storage') || lowerReq.includes('data')) {
      notes.push(`Consider data persistence and state management requirements`);
    } else {
      notes.push(`Ensure compatibility with existing system architecture`);
    }
  }
  
  // Third note - always include testing recommendation
  notes.push(`Write tests first following TDD approach`);
  
  return notes;
}

// Fix documentation links in issue body
export function fixDocumentationLinks(body) {
  if (!body) return body;
  
  // This regex finds the documentation link and captures the domain name (supports relative and absolute URLs)
  const linkRegex = /- \[([^.]+)\.md\]\(\s*(?:https:\/\/github\.com\/[\w-]+\/[\w-]+\/blob\/(?:main|develop)\/)?docs\/requirements\/core\/([^)]+)\.md\s*\) - Source requirements document/;
  const linkMatch = body.match(linkRegex);
  
  if (linkMatch) {
    const domain = linkMatch[2];
    const oldLink = linkMatch[0];
    const newLink = `- [${domain}.md](https://github.com/${OWNER}/${REPO}/blob/develop/docs/requirements/core/${domain}.md) - Source requirements document`;
    
    return body.replace(oldLink, newLink);
  }
  
  // Handle HTML anchor tags for documentation links
  const htmlLinkRegex = /<a\s+href="(?:https:\/\/github\.com\/[\w-]+\/[\w-]+\/blob\/(?:main|develop)\/)?(?:\/|\.\.\/)?docs\/requirements\/core\/([^"]+)\.md">([^<]+)<\/a>/g;
  return body.replace(htmlLinkRegex, `<a href="https://github.com/${OWNER}/${REPO}/blob/develop/docs/requirements/core/$1.md">$2</a>`);
}

// Add implementation notes to issue body
export function addImplementationNotes(body, notes) {
  if (!body) return body;
  
  const implNotesRegex = /## Implementation Notes\n<!-- Add guidance on implementation approach, architecture considerations, etc. -->\n([^#]*)/;
  const implNotesMatch = body.match(implNotesRegex);
  
  if (implNotesMatch) {
    const oldNotes = implNotesMatch[0];
    const notesText = notes.map(note => `- ${note}`).join('\n');
    const newNotes = `## Implementation Notes\n<!-- Add guidance on implementation approach, architecture considerations, etc. -->\n${notesText}\n`;
    
    return body.replace(oldNotes, newNotes);
  }
  
  return body;
}

// Update estimated complexity in issue body
export function updateComplexity(body, complexity) {
  if (!body) return body;
  
  const compRegex = /## Estimated Complexity[\s\S]*?(?=\n##|$)/;
  const match = body.match(compRegex);
  if (match) {
    const newSection = [
      '## Estimated Complexity',
      '<!-- Select the estimated complexity level -->',
      `- [${complexity === 'Small' ? 'x' : ' '}] Small (1-2 days)`,
      `- [${complexity === 'Medium' ? 'x' : ' '}] Medium (3-5 days)`,
      `- [${complexity === 'Large' ? 'x' : ' '}] Large (1+ week)`
    ].join('\n');
    return body.replace(compRegex, newSection);
  }
  return body;
}

// Update priority in issue body
export function updatePriority(body, priority) {
  if (!body) return body;
  
  const priRegex = /## Priority[\s\S]*?(?=\n##|$)/;
  const match = body.match(priRegex);
  if (match) {
    const newSection = [
      '## Priority',
      '<!-- Select the priority level -->',
      `- [${priority === 'High' ? 'x' : ' '}] High (MVP)`,
      `- [${priority === 'Medium' ? 'x' : ' '}] Medium (MVP Enhancement)`,
      `- [${priority === 'Low' ? 'x' : ' '}] Low (Nice to Have)`,
      `- [${priority === 'Post-MVP' ? 'x' : ' '}] Post-MVP`
    ].join('\n');
    return body.replace(priRegex, newSection);
  }
  return body;
}

// Helper function to normalize priority strings
export function normalizePriority(priorityStr) {
  if (!priorityStr) return 'Medium'; // Default
  
  const lowerPriority = priorityStr.toLowerCase();
  if (lowerPriority.includes('high')) return 'High';
  if (lowerPriority.includes('medium')) return 'Medium';
  if (lowerPriority.includes('low')) return 'Low';
  if (lowerPriority.includes('post-mvp')) return 'Post-MVP';
  return 'Medium'; // Default if unknown format
}

// Find CSV row by issue number - flexible matching
function findCsvRowByIssueNumber(loadedCsvRows, issueNumber) {
  // First try to find by full URL
  const fullUrl = `https://github.com/${OWNER}/${REPO}/issues/${issueNumber}`;
  
  for (const [url, rowData] of loadedCsvRows.entries()) {
    // Try exact URL match
    if (url === fullUrl) {
      return rowData;
    }
    
    // Look for issue number in Related Issues/Stories
    if (rowData.relatedIssues) {
      const relatedIssues = rowData.relatedIssues.split(/[\n,]/).map(issue => issue.trim());
      if (relatedIssues.includes(`#${issueNumber}`)) {
        // Check if this row doesn't have its own GitHub issue link
        if (!rowData.gitHubIssueLink || rowData.gitHubIssueLink.trim() === '') {
          return rowData;
        }
      }
    }
    
    // Check if the URL contains the issue number at the end
    if (url.endsWith(`/${issueNumber}`)) {
      return rowData;
    }
  }
  
  // If no match found, try to find by title match or user story content
  return null;
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
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 && args[limitIndex + 1] ? parseInt(args[limitIndex + 1], 10) : null;
  const force = args.includes('--force'); // Flag to bypass label verification
  const validate = args.includes('--validate'); // Flag to run validation mode
  
  // Issue number to process
  let specificIssueNum = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--issue') {
      if (i + 1 < args.length && !isNaN(parseInt(args[i + 1], 10))) {
        specificIssueNum = parseInt(args[i + 1], 10);
        break;
      }
    } else if (args[i].startsWith('--issue=')) {
      const valuePart = args[i].substring('--issue='.length);
      if (!isNaN(parseInt(valuePart, 10))) {
        specificIssueNum = parseInt(valuePart, 10);
        break;
      }
    }
  }
  
  console.log(`User Story Update Script (Enhanced Version)`);
  console.log(`-------------------------------------`);
  console.log(`Repository: ${OWNER}/${REPO}`);
  if (dryRun) console.log(`Mode: Dry Run`);
  if (validate) console.log(`Mode: Validation`);
  if (limit) console.log(`Limit: ${limit} issues`);
  if (force) console.log(`Force mode: Bypassing label verification`);
  
  try {
    // Only verify labels if not in force mode
    let labelsExist = true;
    if (!force) {
      // Verify required labels
      const requiredLabels = [
        'complexity:small', 'complexity:medium', 'complexity:large',
        'priority:high', 'priority:medium', 'priority:low', 'priority:post-mvp'
      ];
      
      const labelCheck = await verifyLabels(OWNER, REPO, requiredLabels, TOKEN);
      labelsExist = labelCheck.exists;
      
      if (!labelsExist) {
        console.error('Required labels are missing:', labelCheck.missing.join(', '));
        console.error('Run "node scripts/github-label-creator.js" first or use --force to bypass verification.');
        
        if (!dryRun) {
          process.exit(1);
        }
      }
    }

    // --- Read Issue Template ---
    console.log('\nReading GitHub Issue Template...');
    const issueTemplatePath = path.resolve(process.cwd(), '.github/ISSUE_TEMPLATE/user-story.md');
    let issueTemplateContent = '';
    try {
      issueTemplateContent = fs.readFileSync(issueTemplatePath, 'utf8');
      console.log('Successfully read issue template.');
    } catch (error) {
      console.error(`Error reading issue template file ${issueTemplatePath}: ${error.message}`);
      console.log('Cannot proceed without the issue template.');
      process.exit(1); // Exit if template is not found
    }
    // --- End Read Issue Template ---

    // --- Load CSV Data ---
    console.log('\nLoading User Story data from CSV files...');
    const csvFiles = findAllCsvFiles(path.resolve(process.cwd(), 'docs/requirements'));
    const loadedCsvData = new Map();
    const allCsvRows = [];
    let totalCsvRows = 0;

    for (const csvPath of csvFiles) {
      const rows = parseCsvRows(csvPath);
      totalCsvRows += rows.length;
      for (const row of rows) {
        // Store all rows for flexible matching
        allCsvRows.push(row);
        
        if (row.gitHubIssueLink && row.gitHubIssueLink.startsWith('https://github.com/')) {
           // Normalize URL slightly in case of trailing slashes etc.
           const normalizedUrl = row.gitHubIssueLink.trim().replace(/\/$/, '');
           // Add complexity/priority directly to the row object for easy access
           row.priority = normalizePriority(row.priority); // Normalize priority
           row.complexity = row.complexity || 'Medium'; // Default complexity if empty
           loadedCsvData.set(normalizedUrl, row);
        }
      }
    }
    console.log(`Loaded data for ${loadedCsvData.size} issues from ${csvFiles.length} CSV files (total rows scanned: ${totalCsvRows}).`);
    if (loadedCsvData.size === 0) {
        console.error("Error: No valid user story data with GitHub links found in CSV files. Exiting.");
        process.exit(1);
    }
    // --- End Load CSV Data ---
    
    // Process specific issue if requested
    if (specificIssueNum) {
      console.log(`\nFetching specific issue #${specificIssueNum}...`);
      const issue = await fetchIssueByNumber(OWNER, REPO, specificIssueNum, TOKEN);
      console.log(`Processing single issue #${issue.number}`);
      
      if (validate) {
        await validateIssuesAgainstDocs([issue], dryRun);
      } else {
        // Try to find CSV row using flexible matching
        if (!loadedCsvData.has(issue.html_url)) {
          const matchedRow = findCsvRowByIssueNumber(loadedCsvData, specificIssueNum);
          if (matchedRow) {
            // Add to loadedCsvData with the correct URL
            loadedCsvData.set(issue.html_url, matchedRow);
          }
        }
        
        // Pass loadedCsvData to processIssues
        await processIssues([issue], loadedCsvData, issueTemplateContent, dryRun);
      }
      
      console.log(`\nCompleted processing issue #${specificIssueNum}`);
      process.exit(0);
    }
    
    // Fetch user story issues
    console.log(`\nFetching user story issues...`);
    let issues = await fetchAllIssues(OWNER, REPO, ['user-story'], 'open', TOKEN);
    
    // Apply limit if specified
    if (limit && limit < issues.length) {
      console.log(`Limiting to first ${limit} issues.`);
      issues = issues.slice(0, limit);
    }
    
    // Run validation mode if requested
    if (validate) {
      const inconsistencies = await validateIssuesAgainstDocs(issues, dryRun);
      
      if (inconsistencies.length > 0) {
        console.log(`\nInconsistencies Found (${inconsistencies.length}):`);
        inconsistencies.forEach(issue => {
          console.log(`- Issue #${issue.issue}: ${issue.title}`);
          console.log(`  Domain: ${issue.domain}`);
          console.log(`  Story: ${issue.storyText}`);
          
          if (issue.currentComplexity !== issue.expectedComplexity) {
            console.log(`  Complexity: ${issue.currentComplexity} (expected: ${issue.expectedComplexity})`);
          }
          
          if (issue.currentPriority !== issue.expectedPriority) {
            console.log(`  Priority: ${issue.currentPriority} (expected: ${issue.expectedPriority})`);
          }
          
          console.log('');
        });
        
        console.log('Run without --validate to fix these inconsistencies.');
      } else {
        console.log('\nAll issues are consistent with requirement docs!');
      }
      
      process.exit(0); // Exit after validation
    }
    
    // Apply flexible matching for each issue
    for (const issue of issues) {
      if (!loadedCsvData.has(issue.html_url)) {
        const matchedRow = findCsvRowByIssueNumber(loadedCsvData, issue.number);
        if (matchedRow) {
          // Add to loadedCsvData with the correct URL
          loadedCsvData.set(issue.html_url, matchedRow);
        }
      }
    }
    
    // Process issues
    console.log(`\nProcessing ${issues.length} user story issues...`);
    // Pass loadedCsvData to processIssues
    await processIssues(issues, loadedCsvData, issueTemplateContent, dryRun);
    
    console.log('\nUser story update script finished.');
    
  } catch (error) {
    console.error(`\nAn error occurred: ${error.message}`);
    process.exit(1);
  }
}

// Execute the main function
main();
