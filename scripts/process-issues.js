// process-issues.js
// Processes GitHub issues to update complexity and priority values
// Always uses getStoryComplexityAndPriority for setting values

import { updateIssue } from './github-issue-utils.js';
import { 
  extractDomainFromIssue, 
  extractUserStoryFromIssue 
} from './story-validation-utils.js';
import { getStoryComplexityAndPriority } from './story-complexity-mapping.js';

// Process issues - enhanced version that always uses getStoryComplexityAndPriority
export async function processIssues(issues, dryRun = false) {
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
      let body = issue.body;
      let hasChanges = false;
      
      // 1. Extract domain and user story text
      const domain = extractDomainFromIssue(issue);
      const storyText = extractUserStoryFromIssue(issue);
      console.log(`- Domain: ${domain}`);
      console.log(`- Story: ${storyText.substring(0, 50)}...`);
      
      // 2. ALWAYS get complexity and priority based on story mapping
      // This is the key change - no longer checking body or priority values
      const { complexity, priority } = getStoryComplexityAndPriority(storyText, domain);
      console.log(`- Mapping complexity: ${complexity}`);
      console.log(`- Mapping priority: ${priority}`);
      
      // Create standard label format
      const complexityLabel = `complexity:${complexity.toLowerCase()}`;
      const priorityLabel = `priority:${priority.toLowerCase().replace(/\s+/g, '-')}`;
      
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
      
      // 5. Always update complexity section with mapping value
      const bodyWithComplexity = updateComplexity(body, complexity);
      if (bodyWithComplexity !== body) {
        console.log(`- Updated complexity checkbox to: ${complexity}`);
        body = bodyWithComplexity;
        hasChanges = true;
        complexityUpdated++;
      }
      
      // 6. Always update priority section with mapping value
      const bodyWithPriority = updatePriority(body, priority);
      if (bodyWithPriority !== body) {
        console.log(`- Updated priority checkbox to: ${priority}`);
        body = bodyWithPriority;
        hasChanges = true;
        priorityUpdated++;
      }
      
      // 7. Check if labels need to be updated (using case-insensitive comparison)
      const hasCorrectComplexityLabel = issue.labels.some(label => {
        const labelName = typeof label === 'object' ? label.name : label;
        return labelName.toLowerCase() === complexityLabel.toLowerCase();
      });
      
      const hasCorrectPriorityLabel = issue.labels.some(label => {
        const labelName = typeof label === 'object' ? label.name : label;
        return labelName.toLowerCase() === priorityLabel.toLowerCase();
      });
      
      if (!hasCorrectComplexityLabel || !hasCorrectPriorityLabel) {
        console.log(`- Will update labels: ${complexityLabel}, ${priorityLabel}`);
        hasChanges = true;
      }
      
      if (hasChanges) {
        if (!dryRun) {
          await updateIssue(issue, body, complexityLabel, priorityLabel);
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