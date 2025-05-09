// User Story Update Script (Enhanced Version)
// This script updates existing user story issues with correct documentation links,
// implementation notes, and complexity/priority estimates.
// All complexity and priority values are sourced from getStoryComplexityAndPriority() mapping.

import https from 'https';
import fs from 'fs'; // Added
import path from 'path'; // Added
import {
  validateIssuesAgainstDocs
} from './story-validation-utils.js';
import {
  processIssues
} from './process-issues.js';
import { parseCsvRows } from './user-stories/modules/parsers.js'; // Added

const OWNER = 'jerseycheese';
const REPO = 'narraitor';
const TOKEN = process.env.GITHUB_TOKEN;

// Debug flag - set to true to enable extra logging
const DEBUG = false;

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
  body = body.replace(htmlLinkRegex, `<a href="https://github.com/${OWNER}/${REPO}/blob/develop/docs/requirements/core/$1.md">$2</a>`);
  return body;
}

// Add implementation notes to issue body
export function addImplementationNotes(body, notes) {
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

// Verify labels in repository - Enhanced version with case-insensitive comparison
async function verifyLabels() {
  try {
    // Check for complexity and priority labels
    console.log('Checking for required labels...');
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/labels?per_page=100`,
      method: 'GET',
      headers: {
        'User-Agent': 'User-Story-Update-Script',
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    const labels = await new Promise((resolve, reject) => {
      const req = https.request(options, res => {
        let responseData = '';
        res.on('data', chunk => (responseData += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsedLabels = JSON.parse(responseData);
              if (DEBUG) {
                console.log(`Received ${parsedLabels.length} labels from GitHub`);
                console.log(`Labels: ${parsedLabels.map(l => l.name).join(', ')}`);
              }
              resolve(parsedLabels);
            } catch (err) {
              reject(new Error(`Failed to parse response: ${err.message}`));
            }
          } else {
            reject(new Error(`Failed to get labels: ${responseData}`));
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    // Normalize label names for more reliable comparison (lowercase, trim)
    const normalizedLabels = labels.map(l => ({ ...l, name: l.name.toLowerCase().trim() }));
    
    // Define required labels (all lowercase)
    const requiredLabels = [
      'complexity:small', 'complexity:medium', 'complexity:large',
      'priority:high', 'priority:medium', 'priority:low', 'priority:post-mvp'
    ];
    
    // Find missing labels with case-insensitive comparison
    const missingLabels = requiredLabels.filter(
      requiredLabel => !normalizedLabels.some(l => l.name === requiredLabel)
    );
    
    if (missingLabels.length > 0) {
      console.warn(`Warning: Missing required labels: ${missingLabels.join(', ')}`);
      console.warn('Run "node scripts/github-label-creator.js" to create all required labels before proceeding.');
      
      // Debug output of all actual labels for diagnosis
      if (DEBUG) {
        console.log('Existing labels:', normalizedLabels.map(l => l.name).join(', '));
      }
      
      return false;
    }
    
    console.log('All required labels exist.');
    return true;
  } catch (err) {
    console.warn(`Warning: Could not verify labels: ${err.message}`);
    console.warn('Run "node scripts/github-label-creator.js" to ensure all required labels exist.');
    return false;
  }
}

// Fetch issues from GitHub
export async function fetchIssues(labels = ['user-story']) {
  let allIssues = [];
  let url = `/repos/${OWNER}/${REPO}/issues?labels=${labels.map(encodeURIComponent).join(',')}&state=open&per_page=100`;

  while (url) {
    const options = {
      hostname: 'api.github.com',
      path: url,
      method: 'GET',
      headers: {
        'User-Agent': 'User-Story-Update-Script',
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const { data, nextUrl } = await new Promise((resolve, reject) => {
      const req = https.request(options, res => {
        let responseData = '';
        res.on('data', chunk => (responseData += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const linkHeader = res.headers.link;
              let nextUrl = null;
              if (linkHeader) {
                const links = linkHeader.split(', ');
                const nextLink = links.find(link => link.endsWith('rel="next"'));
                if (nextLink) {
                  const nextMatch = nextLink.match(/<(.*)>; rel="next"/);
                  if (nextMatch && nextMatch[1]) {
                    // Extract just the path and query from the full URL
                    const nextUrlObject = new URL(nextMatch[1]);
                    nextUrl = `${nextUrlObject.pathname}${nextUrlObject.search}`;
                  }
                }
              }
              resolve({ data: JSON.parse(responseData), nextUrl });
            } catch (err) {
              reject(new Error(`Failed to parse response or link header: ${err.message}`));
            }
          } else {
            reject(new Error(`Failed to fetch issues (Status: ${res.statusCode}): ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });

    allIssues = allIssues.concat(data);
    url = nextUrl; // Set url to the next page's url, or null if no next page
  }

  return allIssues;
}

// Fetch a single issue by number
export async function fetchIssueByNumber(issueNumber) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/issues/${issueNumber}`,
      method: 'GET',
      headers: {
        'User-Agent': 'User-Story-Update-Script',
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, res => {
      let responseData = '';
      res.on('data', chunk => (responseData += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (err) {
            reject(new Error(`Failed to parse issue data: ${err.message}`));
          }
        } else {
          reject(new Error(`Failed to fetch issue: ${responseData}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Helper function to recursively find CSV files
function findAllCsvFiles(startPath, filter = /.+-user-stories\.csv$/) {
  let results = [];
  try {
    const files = fs.readdirSync(startPath);
    files.forEach(file => {
      const filename = path.join(startPath, file);
      const stat = fs.lstatSync(filename);
      if (stat.isDirectory()) {
        results = results.concat(findAllCsvFiles(filename, filter));
      } else if (filter.test(filename)) {
        results.push(filename);
      }
    });
  } catch (error) {
     console.error(`Error reading directory ${startPath}: ${error.message}`);
  }
  return results;
}

// Helper function to normalize priority strings
function normalizePriority(priorityStr) {
  const lowerPriority = priorityStr.toLowerCase();
  if (lowerPriority.includes('high')) return 'High';
  if (lowerPriority.includes('medium')) return 'Medium';
  if (lowerPriority.includes('low')) return 'Low';
  if (lowerPriority.includes('post-mvp')) return 'Post-MVP';
  return 'Medium'; // Default if unknown format
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
  const validate = args.includes('--validate'); // New flag to run validation mode
  
  // Issue number to process
  let specificIssueNum = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--issue') {
      if (i + 1 < args.length && !isNaN(parseInt(args[i + 1], 10))) {
        specificIssueNum = parseInt(args[i + 1], 10);
        // To prevent '--issue' from being processed again if it's also part of another arg like --issue-related
        // we can consume the next argument if it was used as a value.
        // However, for this specific script, simply breaking is likely sufficient.
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
      // Verify labels first
      labelsExist = await verifyLabels();
      if (!labelsExist && !dryRun) {
        console.error('Required labels are missing. Run "node scripts/github-label-creator.js" first or use --force to bypass verification.');
        process.exit(1);
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
    let totalCsvRows = 0;

    for (const csvPath of csvFiles) {
      const rows = parseCsvRows(csvPath);
      totalCsvRows += rows.length;
      for (const row of rows) {
        if (row.gitHubIssueLink && row.gitHubIssueLink.startsWith('https://github.com/')) {
           // Normalize URL slightly in case of trailing slashes etc.
           const normalizedUrl = row.gitHubIssueLink.trim().replace(/\/$/, '');
           // Add complexity/priority directly to the row object for easy access
           row.priority = normalizePriority(row.priority); // Normalize priority
           row.complexity = row.complexity || 'Medium'; // Default complexity if empty
           loadedCsvData.set(normalizedUrl, row);
        } else {
           // Optionally log rows without valid links if needed for debugging
           // console.warn(`Skipping row without valid GitHub link in ${csvPath}: ${row.titleSummary}`);
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
      const issue = await fetchIssueByNumber(specificIssueNum);
      console.log(`Processing single issue #${issue.number}`);
      
      if (validate) {
        await validateIssuesAgainstDocs([issue], dryRun);
      } else {
        // Pass loadedCsvData to processIssues
        await processIssues([issue], loadedCsvData, issueTemplateContent, dryRun);
      }
      
      console.log(`\nCompleted processing issue #${specificIssueNum}`);
      process.exit(0);
    }
    
    // Fetch user story issues
    console.log(`\nFetching user story issues...`);
    let issues = await fetchIssues(['user-story']);
    
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
      
      process.exit(0);
    }
    
    // Confirm before proceeding
    if (!dryRun) {
      console.log(`\nReady to update ${issues.length} issues. Continue? (y/n)`);
      const proceed = await new Promise(resolve =>
        process.stdin.once('data', data => resolve(data.toString().trim().toLowerCase() === 'y'))
      );
      
      if (!proceed) {
        console.log('Operation cancelled');
        process.exit(0);
      }
    }
    
    // Process issues
    // Pass loadedCsvData to processIssues
    const result = await processIssues(issues, loadedCsvData, issueTemplateContent, dryRun);
    
    // Show summary
    console.log(`\nSummary:`);
    console.log(`- Updated: ${result.updated}`);
    console.log(`- Skipped (no changes needed): ${result.skipped}`);
    console.log(`- Errors: ${result.errors}`);
    console.log(`- Total processed: ${result.total}`);
    console.log(`- Priority labels updated: ${result.priorityUpdated || 0}`);
    console.log(`- Complexity labels updated: ${result.complexityUpdated || 0}`);
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// Start execution
main();