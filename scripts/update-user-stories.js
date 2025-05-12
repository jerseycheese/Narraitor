// update-user-stories.js (refactored main file < 300 lines)
// Main script for synchronizing CSV user story data with GitHub issues

import fs from 'fs';
import path from 'path';
import { OWNER, REPO } from './user-stories/modules/config.js';
import { findAllCsvFiles } from './user-stories/modules/csv-utils.js';
import { fetchAllIssues, fetchIssueByNumber, verifyLabels } from './user-stories/modules/github-api.js';
import { validateIssuesAgainstDocs } from './story-validation-utils.js';
import { processIssues } from './process-issues.js';
import { parseCsvRows } from './user-stories/modules/parsers.js';
import { parseCommandLineArgs, getIssueTemplatePath, getIssueLabelByType } from './utils/cli-parser.js';
import { 
  extractDomainFromCsvPath, 
  normalizePriority, 
  findCsvRowByIssueNumber
} from './utils/csv-data-utils.js';

// Re-export functions needed by process-issues.js
export { 
  fixDocumentationLinks,
  addImplementationNotes,
  generateImplementationNotes,
  updateComplexity,
  updatePriority
} from './utils/issue-body-utils.js';

const TOKEN = process.env.GITHUB_TOKEN;

// Load CSV data into memory
function loadCsvData(csvFiles) {
  const loadedCsvData = new Map();
  let totalCsvRows = 0;

  for (const csvPath of csvFiles) {
    const rows = parseCsvRows(csvPath);
    totalCsvRows += rows.length;
    
    const csvDomain = extractDomainFromCsvPath(csvPath);
    
    for (const row of rows) {
      row._csvPath = csvPath;
      row._domain = csvDomain;
      
      if (row.gitHubIssueLink && row.gitHubIssueLink.startsWith('https://github.com/')) {
        const normalizedUrl = row.gitHubIssueLink.trim().replace(/\/$/, '');
        row.priority = normalizePriority(row.priority);
        row.complexity = row.complexity || 'Medium';
        loadedCsvData.set(normalizedUrl, row);
      }
    }
  }
  
  console.log(`Loaded data for ${loadedCsvData.size} issues from ${csvFiles.length} CSV files (total rows scanned: ${totalCsvRows}).`);
  return loadedCsvData;
}

// Main processing logic
async function main() {
  if (!TOKEN) {
    console.error('GitHub token not found. Set GITHUB_TOKEN environment variable.');
    process.exit(1);
  }
  
  const options = parseCommandLineArgs(process.argv.slice(2));
  
  console.log(`User Story Update Script (Enhanced Version)`);
  console.log(`-------------------------------------`);
  console.log(`Repository: ${OWNER}/${REPO}`);
  console.log(`Issue Type: ${options.issueType}`);
  if (options.dryRun) console.log(`Mode: Dry Run`);
  if (options.validate) console.log(`Mode: Validation`);
  if (options.limit) console.log(`Limit: ${options.limit} issues`);
  if (options.force) console.log(`Force mode: Bypassing label verification`);
  
  try {
    // Verify labels if not in force mode
    if (!options.force) {
      const requiredLabels = [
        'complexity:small', 'complexity:medium', 'complexity:large',
        'priority:high', 'priority:medium', 'priority:low', 'priority:post-mvp'
      ];
      
      const labelCheck = await verifyLabels(OWNER, REPO, requiredLabels, TOKEN);
      
      if (!labelCheck.exists) {
        console.error('Required labels are missing:', labelCheck.missing.join(', '));
        console.error('Run "node scripts/github-label-creator.js" first or use --force to bypass verification.');
        
        if (!options.dryRun) {
          process.exit(1);
        }
      }
    }

    // Read issue template
    console.log('\nReading GitHub Issue Template...');
    const issueTemplatePath = path.resolve(process.cwd(), getIssueTemplatePath(options.issueType));
    
    let issueTemplateContent = '';
    try {
      issueTemplateContent = fs.readFileSync(issueTemplatePath, 'utf8');
      console.log(`Successfully read issue template for type: ${options.issueType}`);
    } catch (error) {
      console.error(`Error reading issue template file ${issueTemplatePath}: ${error.message}`);
      console.log('Cannot proceed without the issue template.');
      process.exit(1);
    }

    // Load CSV data
    console.log('\nLoading User Story data from CSV files...');
    const csvFiles = findAllCsvFiles(path.resolve(process.cwd(), 'docs/requirements'));
    const loadedCsvData = loadCsvData(csvFiles);
    
    if (loadedCsvData.size === 0) {
      console.warn("Warning: No valid user story data with GitHub links found in CSV files. Proceeding with defaults.");
    }
    
    // Process specific issue if requested
    if (options.specificIssueNum) {
      console.log(`\nFetching specific issue #${options.specificIssueNum}...`);
      const issue = await fetchIssueByNumber(OWNER, REPO, options.specificIssueNum, TOKEN);
      console.log(`Processing single issue #${issue.number}`);
      
      if (options.validate) {
        await validateIssuesAgainstDocs([issue], options.dryRun);
      } else {
        // Ensure CSV data for the specific issue is available
        let csvRowData = loadedCsvData.get(issue.html_url);
        if (!csvRowData) {
          const matchedRow = findCsvRowByIssueNumber(loadedCsvData, options.specificIssueNum, OWNER, REPO);
          if (matchedRow) {
            loadedCsvData.set(issue.html_url, matchedRow);
            csvRowData = matchedRow;
          }
        }

        if (!csvRowData) {
          console.warn(`- CSV data not found for issue #${issue.number}. Proceeding with defaults.`);
        }

        await processIssues([issue], loadedCsvData, issueTemplateContent, options.dryRun);
      }
      
      console.log(`\nCompleted processing issue #${options.specificIssueNum}`);
      process.exit(0);
    }
    
    // Fetch and process multiple issues
    console.log(`\nFetching ${options.issueType} issues...`);
    const issueLabel = getIssueLabelByType(options.issueType);
    let issues = await fetchAllIssues(OWNER, REPO, [issueLabel], 'open', TOKEN);
    
    if (options.limit && options.limit < issues.length) {
      console.log(`Limiting to first ${options.limit} issues.`);
      issues = issues.slice(0, options.limit);
    }
    
    if (options.validate) {
      const inconsistencies = await validateIssuesAgainstDocs(issues, options.dryRun);
      
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
    
    // Apply flexible matching
    for (const issue of issues) {
      if (!loadedCsvData.has(issue.html_url)) {
        const matchedRow = findCsvRowByIssueNumber(loadedCsvData, issue.number, OWNER, REPO);
        if (matchedRow) {
          loadedCsvData.set(issue.html_url, matchedRow);
        }
      }
    }
    
    // Process issues
    console.log(`\nProcessing ${issues.length} ${options.issueType} issues...`);
    await processIssues(issues, loadedCsvData, issueTemplateContent, options.dryRun);
    
    console.log(`\n${options.issueType} update script finished.`);
    
  } catch (error) {
    console.error(`\nAn error occurred: ${error.message}`);
    process.exit(1);
  }
}

// Execute the main function
main();
