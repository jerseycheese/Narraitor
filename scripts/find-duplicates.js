// find-duplicates.js
// This script finds duplicate GitHub issues and CSV rows

import fs from 'fs';
import path from 'path';
import { OWNER, REPO } from './user-stories/modules/config.js';
import { 
  findAllCsvFiles,
  findDuplicateCsvRows,
  findRowsWithoutIssueLinks
} from './user-stories/modules/csv-utils.js';
import {
  fetchAllIssues
} from './user-stories/modules/github-api.js';
import { parseCsvRows } from './user-stories/modules/parsers.js';

// Get GitHub token from environment variables
const TOKEN = process.env.GITHUB_TOKEN;

// Find duplicate GitHub issues
function findDuplicateIssues(issues) {
  // Group by title
  const issuesByTitle = {};
  
  issues.forEach(issue => {
    // Skip pull requests
    if (issue.pull_request) return;
    
    const title = issue.title.trim();
    if (!issuesByTitle[title]) {
      issuesByTitle[title] = [];
    }
    issuesByTitle[title].push(issue);
  });
  
  // Find titles with multiple issues
  const duplicateTitles = {};
  Object.entries(issuesByTitle).forEach(([title, titleIssues]) => {
    if (titleIssues.length > 1) {
      duplicateTitles[title] = titleIssues;
    }
  });
  
  return duplicateTitles;
}

// Find GitHub issues with multiple CSV references
function findMultiReferencedIssues(issues, csvRows) {
  const issueUrlMap = new Map();
  
  // Build map of GitHub issue URLs
  issues.forEach(issue => {
    if (!issue.pull_request) {
      issueUrlMap.set(issue.html_url, { issue, csvReferences: [] });
    }
  });
  
  // Count CSV references to each issue
  csvRows.forEach(row => {
    if (row.gitHubIssueLink && row.gitHubIssueLink.trim()) {
      const normalizedUrl = row.gitHubIssueLink.trim().replace(/\/$/, '');
      if (issueUrlMap.has(normalizedUrl)) {
        issueUrlMap.get(normalizedUrl).csvReferences.push(row);
      }
    }
  });
  
  // Filter to issues with multiple references
  const multiReferenced = {};
  
  for (const [url, data] of issueUrlMap.entries()) {
    if (data.csvReferences.length > 1) {
      multiReferenced[url] = {
        issue: data.issue,
        csvReferences: data.csvReferences
      };
    }
  }
  
  return multiReferenced;
}

// Find CSV rows with no GitHub issue
function findRowsWithoutIssues(csvRows, issues) {
  const issueUrls = new Set(issues.map(issue => issue.html_url));
  const rowsWithoutIssues = [];
  
  csvRows.forEach(row => {
    if (!row.gitHubIssueLink || !row.gitHubIssueLink.trim()) {
      rowsWithoutIssues.push(row);
    } else {
      const normalizedUrl = row.gitHubIssueLink.trim().replace(/\/$/, '');
      if (!issueUrls.has(normalizedUrl)) {
        rowsWithoutIssues.push(row);
      }
    }
  });
  
  return rowsWithoutIssues;
}

// Main function
async function main() {
  // Check for GitHub token
  if (!TOKEN) {
    console.error('GitHub token not found. Set GITHUB_TOKEN environment variable.');
    process.exit(1);
  }
  
  try {
    // Load all CSV files
    console.log('Loading CSV files...');
    const csvFiles = findAllCsvFiles(path.resolve(process.cwd(), 'docs/requirements'));
    const allCsvRows = [];
    let totalCsvRows = 0;

    for (const csvPath of csvFiles) {
      const rows = parseCsvRows(csvPath);
      totalCsvRows += rows.length;
      rows.forEach(row => {
        // Store CSV file path for reference
        row._filePath = csvPath;
        allCsvRows.push(row);
      });
    }
    console.log(`Loaded ${totalCsvRows} rows from ${csvFiles.length} CSV files.\n`);
    
    // Fetch all GitHub issues
    console.log('Fetching GitHub issues...');
    const allIssues = await fetchAllIssues(OWNER, REPO, [], 'all', TOKEN);
    console.log(`Fetched ${allIssues.length} GitHub issues.\n`);
    
    // Find duplicate GitHub issues
    console.log('Finding duplicate GitHub issues...');
    const duplicateIssues = findDuplicateIssues(allIssues);
    const numDuplicateIssues = Object.keys(duplicateIssues).length;
    console.log(`Found ${numDuplicateIssues} titles with multiple GitHub issues.\n`);
    
    // Find duplicate CSV rows
    console.log('Finding duplicate CSV rows...');
    const csvFilesWithRows = csvFiles.map(path => ({
      path,
      rows: parseCsvRows(path)
    }));
    
    const duplicateCsvRows = findDuplicateCsvRows(csvFilesWithRows);
    const numDuplicateCsvRows = Object.keys(duplicateCsvRows).length;
    console.log(`Found ${numDuplicateCsvRows} titles with multiple CSV rows.\n`);
    
    // Find GitHub issues with multiple CSV references
    console.log('Finding GitHub issues with multiple CSV references...');
    const multiReferencedIssues = findMultiReferencedIssues(allIssues, allCsvRows);
    const numMultiReferenced = Object.keys(multiReferencedIssues).length;
    console.log(`Found ${numMultiReferenced} GitHub issues referenced by multiple CSV rows.\n`);
    
    // Find CSV rows without corresponding GitHub issues
    console.log('Finding CSV rows without corresponding GitHub issues...');
    const rowsWithoutIssues = findRowsWithoutIssues(allCsvRows, allIssues);
    console.log(`Found ${rowsWithoutIssues.length} CSV rows without corresponding GitHub issues.\n`);
    
    // Output detailed information
    if (numDuplicateIssues > 0) {
      console.log('\n=== Duplicate GitHub Issues ===');
      Object.entries(duplicateIssues).forEach(([title, issues]) => {
        console.log(`\nTitle: "${title}"`);
        issues.forEach(issue => {
          console.log(`- #${issue.number}: ${issue.html_url} (${issue.state})`);
        });
      });
    }
    
    if (numDuplicateCsvRows > 0) {
      console.log('\n=== Duplicate CSV Rows ===');
      Object.entries(duplicateCsvRows).forEach(([title, rows]) => {
        console.log(`\nTitle: "${title}"`);
        rows.forEach(row => {
          console.log(`- File: ${path.basename(row._filePath)}`);
          console.log(`  GitHub Issue: ${row.gitHubIssueLink || 'None'}`);
        });
      });
    }
    
    if (numMultiReferenced > 0) {
      console.log('\n=== GitHub Issues With Multiple CSV References ===');
      Object.entries(multiReferencedIssues).forEach(([url, data]) => {
        console.log(`\nIssue #${data.issue.number}: ${data.issue.title}`);
        console.log(`URL: ${url}`);
        data.csvReferences.forEach(row => {
          console.log(`- File: ${path.basename(row._filePath)}`);
          console.log(`  Title: ${row.titleSummary || 'None'}`);
        });
      });
    }
    
    if (rowsWithoutIssues.length > 0) {
      console.log('\n=== CSV Rows Without GitHub Issues ===');
      rowsWithoutIssues.forEach(row => {
        console.log(`\nTitle: "${row.titleSummary || 'No Title'}"`);
        console.log(`File: ${path.basename(row._filePath)}`);
        console.log(`GitHub Issue Link: ${row.gitHubIssueLink || 'None'}`);
      });
    }
    
    // Write analysis to file
    const analysisOutput = {
      duplicateIssues,
      duplicateCsvRows,
      multiReferencedIssues,
      rowsWithoutIssues
    };
    fs.writeFileSync('duplicate-analysis.json', JSON.stringify(analysisOutput, null, 2));
    console.log('\nAnalysis saved to duplicate-analysis.json');
    
  } catch (error) {
    console.error(`\nAn error occurred: ${error.message}`);
    process.exit(1);
  }
}

// Execute the main function
main();
