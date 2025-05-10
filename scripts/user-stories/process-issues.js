// process-issues.js
// Processes GitHub issues

import { updateIssue } from '../github/github-issue-utils.js';

// Process issues - enhanced version that always uses getStoryComplexityAndPriority
import {
  fixDocumentationLinks,
  addImplementationNotes,
  generateImplementationNotes,
  updateComplexity,
  updatePriority,
  normalizePriority,
  OWNER,
  REPO
} from '../update-user-stories.js';

// Helper function to format text to a Markdown list
function formatToMarkdownList(text) {
  if (!text) return ''; // Return empty string for empty/null input
  return text.split('\\n').map(item => `- ${item.trim()}`).join('\n');
}

// Helper function to strip frontmatter from the template
function stripFrontmatter(template) {
  // Matches YAML frontmatter between --- delimiters
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  return template.replace(frontmatterRegex, '');
}

// Process issues - enhanced version using pre-loaded CSV data and template
export async function processIssues(issues, loadedCsvData, issueTemplateContent, dryRun = false) {
  console.log(`Found ${issues.length} user story issues to process.`);
  if (dryRun) {
    console.log(`DRY RUN MODE - No issues will be updated.`);
  }

  let updated = 0, skipped = 0, errors = 0;
  let complexityUpdated = 0;
  let priorityUpdated = 0;

  // Strip frontmatter from template before processing
  const cleanTemplate = stripFrontmatter(issueTemplateContent);

  for (const [index, issue] of issues.entries()) {
    try {
      console.log(`\nProcessing issue #${issue.number}: ${issue.title} (${index + 1}/${issues.length})`);

       // Get CSV data for the current issue
       const csvRowData = loadedCsvData.get(issue.html_url);

       if (!csvRowData) {
         console.warn(`- CSV data not found for issue #${issue.number} via URL ${issue.html_url}`);
         skipped++;
         continue; // Skip to the next issue
       }

       // 1. Implement Title Update
       let newTitle = issue.title;
       if (csvRowData.titleSummary) {
         newTitle = csvRowData.titleSummary;
         console.log(`- Title change detected: "${issue.title}" -> "${newTitle}"`);
       } else {
          console.log(`- No title change needed.`);
       }

       // 2. Implement Body Update with Placeholder Replacement
       let newBody = cleanTemplate;

       // Replace placeholders with CSV data, using || '' for fallbacks
       newBody = newBody.replace('As a [type of user], I want [goal/need] so that [benefit/value].', csvRowData.userStory || '');
       newBody = newBody.replace('{{ACCEPTANCE_CRITERIA_LIST}}', formatToMarkdownList(csvRowData.acceptanceCriteriaRaw || ''));
       newBody = newBody.replace('{{TECHNICAL_REQUIREMENTS_LIST}}', formatToMarkdownList(csvRowData.technicalRequirements || ''));
       newBody = newBody.replace('{{IMPLEMENTATION_CONSIDERATIONS}}', formatToMarkdownList(csvRowData.implementationConsiderations || ''));
       const relatedDocsText = csvRowData.relatedDocumentation ? csvRowData.relatedDocumentation.split(',').map(doc => doc.trim()).filter(doc => doc).map(doc => `- ${doc}`).join('\n') : '';
       newBody = newBody.replace('{{RELATED_DOCUMENTATION_LIST}}', relatedDocsText);
       newBody = newBody.replace('{{RELATED_ISSUES_LIST}}', formatToMarkdownList(csvRowData.relatedIssues || ''));

       // Apply existing body modifiers
       newBody = fixDocumentationLinks(newBody);
       const implementationNotes = generateImplementationNotes({ body: newBody }); // Pass the potentially updated body
       newBody = addImplementationNotes(newBody, implementationNotes);

       // Update Complexity and Priority checkboxes
       newBody = updateComplexity(newBody, csvRowData.complexity);
       newBody = updatePriority(newBody, csvRowData.priority);

       if (newBody !== issue.body) {
         console.log(`- Body changes detected.`);
       } else {
          console.log(`- No body changes needed.`);
       }

       // 3. Refine Label Generation
       const complexity = csvRowData.complexity;
       const priority = normalizePriority(csvRowData.priority); // Use normalizePriority

       const complexityLabel = complexity ? `complexity:${complexity.toLowerCase().trim()}` : null;
       const priorityLabel = priority ? `priority:${priority.toLowerCase().trim().replace(/\s+|\(|\)/g, '-')}` : null;

       let finalLabelsArray = issue.labels.map(label => label.name);

       // Filter out existing complexity and priority labels
       finalLabelsArray = finalLabelsArray.filter(label =>
         !label.startsWith('complexity:') && !label.startsWith('priority:')
       );

       // Add new complexity and priority labels if they exist
       if (complexityLabel) {
         finalLabelsArray.push(complexityLabel);
       }
       if (priorityLabel) {
         finalLabelsArray.push(priorityLabel);
       }

       // Check if labels have changed
       const originalLabelsSet = new Set(issue.labels.map(label => label.name));
       const finalLabelsSet = new Set(finalLabelsArray);
       const labelsChanged = !(originalLabelsSet.size === finalLabelsSet.size &&
                                [...originalLabelsSet].every(label => finalLabelsSet.has(label)));

       if (labelsChanged) {
         console.log(`- Label changes detected: [${issue.labels.map(label => label.name).join(', ')}] -> [${finalLabelsArray.join(', ')}]`);
       } else {
          console.log(`- No label changes needed.`);
       }

       // 4. Correct updateIssue Call
       const updatePayload = {};
       if (newTitle !== issue.title) {
         updatePayload.title = newTitle;
       }
       if (newBody !== issue.body) { // Compare against original body
         updatePayload.body = newBody;
       }
       if (labelsChanged) {
         updatePayload.labels = finalLabelsArray;
       }

       if (Object.keys(updatePayload).length > 0) {
         if (!dryRun) {
           // Assuming updateIssue signature is (owner, repo, issueNumber, data)
           await updateIssue(OWNER, REPO, issue.number, updatePayload);
           console.log(`✅ Updated issue #${issue.number}`);
           if (updatePayload.labels) {
              if (complexityLabel) complexityUpdated++;
              if (priorityLabel) priorityUpdated++;
           }
         } else {
           console.log(`Would update issue #${issue.number} with payload:`, updatePayload, '(dry run)');
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
