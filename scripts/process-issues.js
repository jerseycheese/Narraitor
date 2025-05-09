// process-issues.js
// Processes GitHub issues to update complexity and priority values
// Always uses getStoryComplexityAndPriority for setting values

import { updateIssue } from './github-issue-utils.js';
import {
  extractDomainFromIssue,
} from './story-validation-utils.js';

// Process issues - Refactored to use CSV data for complexity/priority
export async function processIssues(issues, loadedCsvData, issueTemplateContent, dryRun = false) {
  // Import these from the main file to avoid circular dependencies
  const {
    fixDocumentationLinks,
    addImplementationNotes,
    generateImplementationNotes,
    updateComplexity,
    updatePriority
  } = await import('./update-user-stories.js');

  console.log(`Found ${issues.length} user story issues to update.`);
  if (dryRun) {
    console.log(`DRY RUN MODE - No issues will be updated.`);
  }

  let updated = 0, skipped = 0, errors = 0;
  let complexityUpdated = 0, priorityUpdated = 0;

  for (const [index, issue] of issues.entries()) {
    try {
      console.log(`\nProcessing issue #${issue.number}: ${issue.title} (${index + 1}/${issues.length})`);
      // Start with the template content
      let body = issueTemplateContent;
      let hasChanges = false;

      // Strip YAML frontmatter if present
      const frontmatterMatch = body.match(/^---\s*[\s\S]*?^---\s*/m);
      if (frontmatterMatch) {
        body = body.substring(frontmatterMatch[0].length);
        console.log('- Stripped YAML frontmatter from template.');
      }

      // 1. Extract domain (still useful for context/logging)
      const domain = extractDomainFromIssue(issue);
      console.log(`- Domain: ${domain}`);

      // 2. Get Complexity and Priority from loaded CSV data
      const normalizedIssueUrl = issue.html_url.trim().replace(/\/$/, '');
      const csvRowData = loadedCsvData.get(normalizedIssueUrl);

      let complexity = 'Medium'; // Default if not found
      let priority = 'Medium'; // Default if not found

      if (!csvRowData) {
        console.warn(`⏭️ Skipping template population and complexity/priority update for issue #${issue.number}: Corresponding row not found in loaded CSV data using URL ${normalizedIssueUrl}`);
        // If no CSV data, we proceed with the template body but don't populate placeholders
      } else {
         // Use values directly from the CSV row (already normalized in update-user-stories.js)
         complexity = csvRowData.complexity;
         priority = csvRowData.priority;
         console.log(`- Using CSV values: Complexity=${complexity}, Priority=${priority}`);

         // New logic: Populate template placeholders
         // Replace User Story placeholder (line 10 in template)
         const userStoryPlaceholder = 'As a [type of user], I want [goal/need] so that [benefit/value].';
         body = body.replace(userStoryPlaceholder, csvRowData.userStory || '');

         // Replace Acceptance Criteria section (lines 12-18 in template)
         const acceptanceCriteriaRaw = csvRowData.acceptanceCriteriaRaw || '';
         let formattedAcceptanceCriteria;

         const acLines = acceptanceCriteriaRaw
           .replace(/\r\n/g, '\n') // Normalize newlines
           .split(/\\n|\n/)
           .map(line => line.trim()) // Trim whitespace from each line
           .filter(line => line !== ''); // Filter out empty lines

         if (acLines.length === 0 || acceptanceCriteriaRaw.trim().toLowerCase() === 'n/a') {
           formattedAcceptanceCriteria = '- [ ] (No acceptance criteria provided)';
         } else {
           formattedAcceptanceCriteria = acLines
             .map(line => `- [ ] ${line}`) // Prepend Markdown prefix
             .join('\n'); // Join with newline
         }

         body = body.replace('{{ACCEPTANCE_CRITERIA_LIST}}', formattedAcceptanceCriteria);

         // Replace Technical Requirements section
         const technicalRequirementsRaw = csvRowData.technicalRequirements || '';
         let formattedTechnicalRequirements;

         const trLines = technicalRequirementsRaw
           .replace(/\r\n/g, '\n') // Normalize newlines
           .split(/\\n|\n/)
           .map(line => line.trim()) // Trim whitespace from each line
           .filter(line => line !== ''); // Filter out empty lines

         if (trLines.length === 0 || technicalRequirementsRaw.trim().toLowerCase() === 'n/a') {
           formattedTechnicalRequirements = '- [ ] (No technical requirements provided)';
         } else {
           formattedTechnicalRequirements = trLines
             .map(line => `- [ ] ${line}`) // Prepend Markdown prefix
             .join('\n'); // Join with newline
         }
         body = body.replace('{{TECHNICAL_REQUIREMENTS_LIST}}', formattedTechnicalRequirements);

         // Replace Implementation Considerations section
         const implementationConsiderationsRaw = csvRowData.implementationConsiderations || '';
         let formattedImplementationConsiderations;

         const icLines = implementationConsiderationsRaw
           .replace(/\r\n/g, '\n') // Normalize newlines
           .split(/\\n|\n/)
           .map(line => line.trim()) // Trim whitespace from each line
           .filter(line => line !== ''); // Filter out empty lines

         if (icLines.length === 0 || implementationConsiderationsRaw.trim().toLowerCase() === 'n/a') {
           formattedImplementationConsiderations = '- (No implementation considerations provided)';
         } else {
           formattedImplementationConsiderations = icLines
             .map(line => `- ${line}`) // Prepend Markdown prefix
             .join('\n'); // Join with newline
         }
         body = body.replace('{{IMPLEMENTATION_CONSIDERATIONS}}', formattedImplementationConsiderations);

         // Mark as changed since we populated the template
         hasChanges = true;

         // Replace other potential placeholders
         body = body.replace('{{TITLE_SUMMARY}}', csvRowData.titleSummary || 'N/A');
         body = body.replace('{{PRIORITY}}', csvRowData.priority || 'N/A');
         body = body.replace('{{COMPLEXITY}}', csvRowData.complexity || 'N/A');

         // Replace Related Documentation section
         const relatedDocumentationRaw = csvRowData.relatedDocumentation || ''; // Use camelCase key
         let formattedRelatedDocumentation;


         const allDocLinks = [];
         if (relatedDocumentationRaw && relatedDocumentationRaw.trim().toLowerCase() !== 'n/a') {
           const lineArray = relatedDocumentationRaw
             .replace(/\r\n/g, '\n') // Normalize newlines
             .split(/\n/); // Split by normalized newlines

           for (const line of lineArray) {
             const pathArray = line.split(',');
             for (const path of pathArray) {
               const trimmedPath = path.trim();
               if (trimmedPath) {
                 let pathWithoutLeadingSlash = trimmedPath;
                 if (pathWithoutLeadingSlash.startsWith('/')) {
                   pathWithoutLeadingSlash = pathWithoutLeadingSlash.substring(1);
                 }
                 const absoluteUrl = `https://github.com/jerseycheese/Narraitor/blob/develop/${pathWithoutLeadingSlash}`;
                 allDocLinks.push(`[${trimmedPath}](${absoluteUrl})`);
               }
             }
           }
         }

         if (allDocLinks.length > 0) {
           formattedRelatedDocumentation = allDocLinks
             .map(link => `- ${link}`)
             .join('\n');
         } else {
           formattedRelatedDocumentation = '- (No related documentation provided)';
         }
         body = body.replace('{{RELATED_DOCUMENTATION_LIST}}', formattedRelatedDocumentation);
      
        // Replace Related Issues section
        const relatedIssuesRaw = csvRowData.relatedIssues || '';
        let formattedRelatedIssues;
        if (relatedIssuesRaw.trim().toLowerCase() === 'n/a' || relatedIssuesRaw.trim() === '') {
          formattedRelatedIssues = '- None';
        } else {
          formattedRelatedIssues = relatedIssuesRaw
            .split(';')
            .map(item => item.trim())
            .filter(item => item !== '')
            .map(item => `- ${item}`)
            .join('\n');
        }
        body = body.replace('{{RELATED_ISSUES_LIST}}', formattedRelatedIssues);
      
                 // Map domain name to template checkbox text
                  const domainCheckboxMap = {
                    "world-configuration": "World Configuration",
                    "character-system": "Character System",
                    "narrative-engine": "Narrative Engine",
                    "journal-system": "Journal System",
                    "state-management": "State Management",
                    "ai-service": "AI Service Integration",
                    "game-session": "Game Session UI",
                    "world-interface": "World Interface",
                    "character-interface": "Character Interface",
                    "journal-interface": "Journal Interface",
                    "utilities-and-helpers": "Utilities and Helpers",
                    "devtools": "Devtools",
                    "decision-relevance": "Decision Relevance System",
                    "decision-relevance-system": "Decision Relevance System",
                    "inventory-system": "Inventory System",
                    "lore-management-system": "Lore Management System",
                    "player-decision-system": "Player Decision System"
                  };
       
                  const templateDomainText = domainCheckboxMap[domain];
       
                  // Check the correct domain checkbox if a mapping exists
                  if (templateDomainText) {
                    const searchRegex = new RegExp(`- \\[ \\] ${templateDomainText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
                    const replaceText = `- [x] ${templateDomainText}`;
                    const bodyAfterDomainCheckbox = body.replace(searchRegex, replaceText);
       
                    if (bodyAfterDomainCheckbox !== body) {
                      console.log(`- Checked domain checkbox for: ${templateDomainText}`);
                      body = bodyAfterDomainCheckbox;
                      hasChanges = true; // Mark as changed
                    } else {
                       console.warn(`- Could not find checkbox for domain: ${templateDomainText}`);
                    }
                  } else {
                     console.warn(`- No domain checkbox mapping found for domain: ${domain}`);
                  }
                }
       
               // Create standard label format using CSV values (or defaults if not found)
      const complexityLabel = `complexity:${complexity.toLowerCase()}`;
      const priorityLabel = `priority:${priority.toLowerCase().replace(/\s+/g, '-')}`;

      // 3. Fix documentation links (apply to the current body, which is either template-populated or original)
      const bodyAfterLinks = fixDocumentationLinks(body);
      if (bodyAfterLinks !== body) {
        console.log(`- Fixed documentation links`);
        body = bodyAfterLinks;
        hasChanges = true;
      }

      // 4. Add implementation notes (apply to the current body)
      const implementationNotes = generateImplementationNotes(issue); // Keep using original issue object
      const bodyAfterNotes = addImplementationNotes(body, implementationNotes);
      if (bodyAfterNotes !== body) {
        console.log(`- Added implementation notes: ${implementationNotes.map(n => `\n  * ${n}`).join('')}`);
        body = bodyAfterNotes;
        hasChanges = true;
      }

      // 5. Update complexity section using CSV value (or default) (apply to the current body)
      const bodyAfterComplexity = updateComplexity(body, complexity); // Use determined complexity
      if (bodyAfterComplexity !== body) {
        console.log(`- Updated complexity checkbox to: ${complexity}`);
        body = bodyAfterComplexity; // Update body only if changed
        hasChanges = true;
        complexityUpdated++;
      }

      // 6. Update priority section using CSV value (or default) (apply to the current body)
      const bodyAfterPriority = updatePriority(body, priority); // Use determined priority
      if (bodyAfterPriority !== body) {
        console.log(`- Updated priority checkbox to: ${priority}`);
        body = bodyAfterPriority; // Update body only if changed
        hasChanges = true;
        priorityUpdated++;
      }

      // Determine correct labels based on CSV data (or defaults)
      // Note: complexity and priority variables hold the values from CSV or defaults already
      // const complexityLabel = `complexity:${complexity.toLowerCase()}`; // Already defined above
      // const priorityLabel = `priority:${priority.toLowerCase().replace(/\s+/g, '-')}`; // Already defined above

      // 7. Check if labels need to be updated (using case-insensitive comparison)
      // let labelsNeedUpdate = false; // Unused variable
      const currentLabelsLower = issue.labels.map(l => (typeof l === 'object' ? l.name : l).toLowerCase());

      const hasCorrectComplexityLabel = currentLabelsLower.includes(complexityLabel.toLowerCase());
      const hasCorrectPriorityLabel = currentLabelsLower.includes(priorityLabel.toLowerCase());

      if (!hasCorrectComplexityLabel || !hasCorrectPriorityLabel) {
         // Only log if we actually intend to update based on CSV data
         if (csvRowData) {
            console.log(`- Will update labels: ${complexityLabel}, ${priorityLabel}`);
         }
         // labelsNeedUpdate = true; // Unused variable
         hasChanges = true; // Mark that changes are needed
      }

      // Only proceed with API update if there are body changes OR label changes needed
      if (hasChanges) {
        if (!dryRun) {
          let proposedTitle = csvRowData?.titleSummary;
          let titleToUpdate = null;

          if (proposedTitle) {
            // Optional: Remove [USER STORY] prefix if present
            if (proposedTitle.startsWith('[USER STORY] ')) {
              proposedTitle = proposedTitle.substring('[USER STORY] '.length);
            }

            const titleNeedsUpdate = proposedTitle.trim().toLowerCase() !== issue.title.trim().toLowerCase();

            // Compare with current title (case-insensitive and trim whitespace)
            if (titleNeedsUpdate) {
              console.log(`- Title needs update: "${issue.title}" -> "${proposedTitle}"`);
              titleToUpdate = proposedTitle;
              hasChanges = true; // Mark as changed if title is different
            }
          }

          // Pass the determined labels and title for the update.
          // updateIssue function in github-issue-utils.js needs to handle merging these with existing labels.
          await updateIssue(issue, body, complexityLabel, priorityLabel, titleToUpdate);
          console.log(`✅ Updated issue #${issue.number}`);
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