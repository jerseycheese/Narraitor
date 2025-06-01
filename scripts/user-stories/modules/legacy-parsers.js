// legacy-parsers.js - Legacy parsing functionality (deprecated)
import fs from 'fs';
import { buildRelatedDocumentationLink } from './fs-utils.js';
import { convertUserStoriesToGithubIssues } from './github-issue-converter.js';

/**
 * @deprecated This function is deprecated and maintained only for backward compatibility.
 * Use parseCsvRows() from csv-parser.js instead.
 * 
 * Parse CSV file if it exists (Original function - kept for reference/potential use by migrate-user-stories?)
 * NOTE: This uses the old mapping file logic via getStoryComplexityAndPriority
 */
export function parseUserStoriesFromCSV_Legacy(csvFile, domain) {
  // ... (Original implementation using getStoryComplexityAndPriority) ...
  // This function likely needs refactoring if migrate-user-stories.js
  // should also use the CSV directly for complexity/priority.
  // For now, we focus on the update script.
  console.warn("parseUserStoriesFromCSV_Legacy is being called - review if complexity/priority should come from CSV directly here too.");
   if (!csvFile) {
     return [];
   }
   
   console.log(`Reading CSV file: ${csvFile.path}`);
   const content = fs.readFileSync(csvFile.path, 'utf8');
   const lines = content.split('\n');
   
   // Skip header line
   const userStories = [];
   for (let i = 1; i < lines.length; i++) {
     const line = lines[i].trim();
     if (!line) continue;
     
     // Parse CSV line (Fragile)
     const columns = line.split(',');
     if (columns.length < 5) continue;
     
     // Extract data
     const titleSummary = columns[0].trim().replace(/"/g, '');
     const userStory = columns[1].trim().replace(/"/g, '');
     // Priority & Complexity from CSV are ignored here in legacy version!
     // const priority = columns[2].trim().replace(/"/g, '');
     // const complexity = columns[3].trim().replace(/"/g, '');
     const acceptanceCriteria = columns[4].trim().replace(/"/g, '').split('\\n');
     
     // Get complexity/priority from mapping file (Legacy behavior)
     // Note: getStoryComplexityAndPriority function would need to be imported if this function is used
     // For now, using default values
     const complexity = 'Medium';
     const priority = 'Medium';

     userStories.push({
       domain,
       priority, // Uses mapped priority
       complexity, // Uses mapped complexity
       content: userStory,
       title: titleSummary, // Uses title summary from CSV
       acceptanceCriteria,
       technicalRequirements: [],
       relatedDocumentation: buildRelatedDocumentationLink(domain, csvFile.type),
       implementationNotes: [
         'Use standard implementation approach for this feature',
         'Implement with service interface design patterns',
         'Write tests first following TDD approach'
       ]
     });
   }
   
   return convertUserStoriesToGithubIssues(userStories);
}
