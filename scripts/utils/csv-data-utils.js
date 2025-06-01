// csv-data-utils.js
// CSV data processing utilities

// Extract domain from CSV file path
export function extractDomainFromCsvPath(csvPath) {
  const filename = csvPath.split('/').pop();
  const match = filename.match(/^(.+?)-user-stories\.csv$/);
  return match ? match[1] : 'utilities-and-helpers';
}

// Helper function to normalize priority strings
export function normalizePriority(priorityStr) {
  if (!priorityStr) return 'Medium';
  
  const lowerPriority = priorityStr.toLowerCase();
  if (lowerPriority.includes('high')) return 'High';
  if (lowerPriority.includes('medium')) return 'Medium';
  if (lowerPriority.includes('low')) return 'Low';
  if (lowerPriority.includes('post-mvp')) return 'Post-MVP';
  return 'Medium';
}

// Find CSV row by issue number - flexible matching
export function findCsvRowByIssueNumber(loadedCsvRows, issueNumber, owner, repo) {
  const fullUrl = `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
  
  for (const [url, rowData] of loadedCsvRows.entries()) {
    if (url === fullUrl || url.endsWith(`/${issueNumber}`)) {
      return rowData;
    }
    
    if (rowData.relatedIssues) {
      const relatedIssues = rowData.relatedIssues.split(/[\n,]/).map(issue => issue.trim());
      if (relatedIssues.includes(`#${issueNumber}`)) {
        if (!rowData.gitHubIssueLink || rowData.gitHubIssueLink.trim() === '') {
          return rowData;
        }
      }
    }
  }
  
  return null;
}

// Strip frontmatter from template
export function stripFrontmatter(template) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  return template.replace(frontmatterRegex, '');
}

// Process empty placeholders with sensible defaults
export function processEmptyPlaceholders(body) {
  return body
    .replace('{{PLAIN_LANGUAGE_SUMMARY_PLACEHOLDER}}', 'No plain language summary provided.')
    .replace('{{ACCEPTANCE_CRITERIA_LIST}}', '- [ ] No acceptance criteria specified')
    .replace('{{TECHNICAL_REQUIREMENTS_LIST}}', '- No technical requirements specified')
    .replace('{{IMPLEMENTATION_CONSIDERATIONS}}', '- No implementation considerations specified')
    .replace('{{RELATED_DOCUMENTATION_LIST}}', '- No related documentation specified')
    .replace('{{RELATED_ISSUES_LIST}}', '- None')
    .replace('{{TITLE_SUMMARY}}', '')
    .replace('{{PRIORITY}}', '')
    .replace('{{COMPLEXITY}}', '');
}
