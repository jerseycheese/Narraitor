// process-issues.js (refactored < 300 lines)
// Processes GitHub issues to update from CSV data

import { updateIssue } from './github-issue-utils.js';
import { extractDomainFromIssue } from './story-validation-utils.js';
import {
  updateUserStory,
  updatePlainLanguageSummary,
  updateAcceptanceCriteria,
  updateTechnicalRequirements,
  updateImplementationConsiderations,
  updateRelatedDocumentation,
  updateRelatedIssues,
  updateDomainCheckbox,
  generateImplementationNotes,
  addImplementationNotes,
  updateComplexity,
  updatePriority,
  fixDocumentationLinks
} from './utils/issue-body-utils.js';
import { processEmptyPlaceholders } from './utils/csv-data-utils.js';

// Main issue processing function
export async function processIssues(issues, loadedCsvData, issueTemplateContent, dryRun = false) {
  // console.log(`Found ${issues.length} user story issues to update.`);
  if (dryRun) {
    // console.log(`DRY RUN MODE - No issues will be updated.`);
  }

  let updated = 0, skipped = 0, errors = 0;

  for (const issue of issues) {
    try {
      
      let body = issue.body || '';
      let hasChanges = false;

      // Extract domain from labels
      const domainFromLabels = extractDomainFromIssue(issue);
      // console.log(`- Domain from labels: ${domainFromLabels}`);

      // Get CSV data for this issue
      const normalizedIssueUrl = issue.html_url.trim().replace(/\/$/, '');
      const csvRowData = loadedCsvData.get(normalizedIssueUrl);

      let complexity = 'Medium';
      let priority = 'Medium';
      let domain = domainFromLabels;

      if (!csvRowData) {
        console.warn(`⏭️ No CSV data found for issue #${issue.number} - preserving existing content`);
        // Extract current values from issue body
        const complexityMatch = body.match(/- \[x\] (Small|Medium|Large) \(.*\)/);
        if (complexityMatch) complexity = complexityMatch[1];
        
        const priorityMatch = body.match(/- \[x\] (High|Medium|Low|Post-MVP) \(.*\)/);
        if (priorityMatch) priority = priorityMatch[1];
      } else {
        // Use CSV data
        complexity = csvRowData.complexity;
        priority = csvRowData.priority;
        
        if (csvRowData._domain) {
          domain = csvRowData._domain;
          // console.log(`- Using domain from CSV: ${domain}`);
        }

        // Update all sections from CSV data
        const originalBody = body;
        
        // First check the current user story
        const currentUserStory = body.match(/## User Story\s*\n([^\n#]*)/)?.[1]?.trim();
        
        // Track PLS updates
        const currentPLS = body.match(/## Plain Language Summary\s*\n([^\n#]*)/)?.[1]?.trim();
        body = updatePlainLanguageSummary(body, csvRowData);
        const updatedPLS = body.match(/## Plain Language Summary\s*\n([^\n#]*)/)?.[1]?.trim();
        if (currentPLS !== updatedPLS) {
          // console.log(`- Plain Language Summary updated from: "${currentPLS}" to: "${updatedPLS}"`);
        }
        
        body = updateUserStory(body, csvRowData);
        
        // Check if user story was updated
        const updatedUserStory = body.match(/## User Story\s*\n([^\n#]*)/)?.[1]?.trim();
        if (currentUserStory !== updatedUserStory) {
          // console.log(`- User Story updated to: "${updatedUserStory}"`);
        }
        
        body = updateAcceptanceCriteria(body, csvRowData);
        body = updateTechnicalRequirements(body, csvRowData);
        body = updateImplementationConsiderations(body, csvRowData);
        body = updateRelatedDocumentation(body, csvRowData);
        body = updateRelatedIssues(body, csvRowData);
        body = updateDomainCheckbox(body, domain);
        
        if (body !== originalBody) {
          hasChanges = true;
          // console.log('- Updated issue body sections from CSV data');
        }
      }

      // Fix documentation links
      const bodyAfterLinks = fixDocumentationLinks(body);
      if (bodyAfterLinks !== body) {
        // console.log(`- Fixed documentation links`);
        body = bodyAfterLinks;
        hasChanges = true;
      }

      // Add/update implementation notes
      const notes = generateImplementationNotes({ body });
      const bodyAfterNotes = addImplementationNotes(body, notes);
      if (bodyAfterNotes !== body) {
        // console.log(`- Added implementation notes`);
        body = bodyAfterNotes;
        hasChanges = true;
      }

      // Update complexity and priority
      const bodyAfterComplexity = updateComplexity(body, complexity);
      if (bodyAfterComplexity !== body) {
        // console.log(`- Updated complexity checkbox to: ${complexity}`);
        body = bodyAfterComplexity;
        hasChanges = true;
      }

      const bodyAfterPriority = updatePriority(body, priority);
      if (bodyAfterPriority !== body) {
        // console.log(`- Updated priority checkbox to: ${priority}`);
        body = bodyAfterPriority;
        hasChanges = true;
      }

      // Replace any remaining placeholders
      const remainingPlaceholders = body.match(/\{\{[A-Z_]+\}\}/g);
      if (remainingPlaceholders && remainingPlaceholders.length > 0) {
        // console.log(`- Found ${remainingPlaceholders.length} remaining placeholders, replacing with fallback content`);
        body = processEmptyPlaceholders(body);
        hasChanges = true;
      }

      // Check labels
      const currentLabelsLower = issue.labels.map(l => (typeof l === 'object' ? l.name : l).toLowerCase());
      const complexityLabel = `complexity:${complexity.toLowerCase()}`;
      const priorityLabel = `priority:${priority.toLowerCase().replace(/\s+/g, '-')}`;
      const domainLabel = `domain:${domain}`;

      const needsLabelUpdate = 
        !currentLabelsLower.includes(complexityLabel.toLowerCase()) ||
        !currentLabelsLower.includes(priorityLabel.toLowerCase()) ||
        !currentLabelsLower.includes(domainLabel.toLowerCase());

      if (needsLabelUpdate) {
        // console.log(`- Will update labels: ${complexityLabel}, ${priorityLabel}, ${domainLabel}`);
        hasChanges = true;
      }

      // Check for title update (moved outside of dry-run check)
      let titleToUpdate = null;
      if (csvRowData?.titleSummary) {
        const proposedTitle = csvRowData.titleSummary.replace(/^\[[A-Z\s]+\]\s+/, '');
        if (proposedTitle.trim().toLowerCase() !== issue.title.trim().toLowerCase()) {
          // console.log(`- Title needs update: "${issue.title}" -> "${proposedTitle}"`);
          titleToUpdate = proposedTitle;
          hasChanges = true;
        }
      }

      // Process updates
      if (hasChanges) {
        if (!dryRun) {
          await updateIssue(issue, body, complexityLabel, priorityLabel, titleToUpdate, domainLabel);
          // console.log(`✅ Updated issue #${issue.number}`);
        } else {
          // console.log(`Would update issue #${issue.number} (dry run)`);
          // console.log("\n--- Would update body to: ---");
          // console.log(body);
          // console.log("--- End body ---\n");
          // console.log(`Would update labels to: ${complexityLabel}, ${priorityLabel}, ${domainLabel}`);
          if (titleToUpdate) {
            // console.log(`Would update title to: "${titleToUpdate}"`);
          }
        }
        updated++;
      } else {
        // console.log(`⏭️ No changes needed for issue #${issue.number}`);
        skipped++;
      }

      // Rate limit delay
      await new Promise(r => setTimeout(r, 1000));

    } catch (err) {
      console.error(`❌ Error processing issue #${issue.number}: ${err.message}`);
      errors++;
    }
  }

  return { updated, skipped, errors, total: issues.length };
}
