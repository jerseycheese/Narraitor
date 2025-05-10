// Parsers for user story files (CSV and Markdown)
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync'; // Add csv-parse import
// Removed import of getStoryComplexityAndPriority as it's no longer needed here
import { buildRelatedDocumentationLink } from './fs-utils.js';
import { ISSUE_BODY_TEMPLATE } from './config.js';

/**
 * Parses a CSV file and returns an array of row objects using csv-parse.
 * It maps specific columns from the CSV to a standardized object structure.
 * Handles new columns like Technical Requirements, Implementation Considerations,
 * Related Issues/Stories, and Related Documentation. Priority and Complexity
 * are sourced directly from the CSV.
 *
 * @param {string} csvPath - The path to the CSV file.
 * @returns {Array<Object>} An array of objects, where each object represents a row
 *   from the CSV with mapped keys. Returns an empty array if the file is not found
 *   or parsing fails.
 * @returns {string} returns[].titleSummary - The user story title summary.
 * @returns {string} returns[].userStory - The main user story content.
 * @returns {string} returns[].priority - The priority from the CSV.
 * @returns {string} returns[].complexity - The estimated complexity from the CSV.
 * @returns {string} returns[].acceptanceCriteriaRaw - The raw acceptance criteria string from the CSV.
 * @returns {string} returns[].gitHubIssueLink - The GitHub issue link from the CSV.
 * @returns {string} returns[].relatedIssues - The related issues/stories from the CSV.
 * @returns {string} returns[].technicalRequirements - The technical requirements from the CSV.
 * @returns {string} returns[].implementationConsiderations - The implementation considerations from the CSV.
 * @returns {string} returns[].relatedDocumentation - The related documentation paths from the CSV.
 */
export function parseCsvRows(csvPath) {
  try {
    console.log(`Reading CSV file: ${csvPath}`);
    if (!fs.existsSync(csvPath)) {
      console.warn(`CSV file not found: ${csvPath}`);
      return [];
    }
    const content = fs.readFileSync(csvPath, 'utf8');

    // Use csv-parse/sync for robust parsing
    const records = parse(content, {
      columns: true,          // Treat the first line as column headers
      skip_empty_lines: true, // Skip lines that are empty
      trim: true,             // Trim whitespace from values
      relax_column_count: true // Allow varying numbers of columns per row
    });

    // Basic validation/mapping to expected keys for consistency downstream
    return records.map(row => {
        const gitHubLinkFromCsv = row['GitHub Issue Link'] || ''; // Get the raw value

        // ADD THIS LOGGING BLOCK
        if (gitHubLinkFromCsv.includes('128')) { // Log if "128" is in the link
        }

        return {
            titleSummary: row['User Story Title Summary'] || '',
            userStory: row['User Story'] || '',
            priority: row['Priority'] || '',
            complexity: row['Estimated Complexity'] || '',
            acceptanceCriteriaRaw: row['Acceptance Criteria'] || '',
            gitHubIssueLink: gitHubLinkFromCsv, // Use the variable we logged
            relatedIssues: row['Related Issues/Stories'] || '',
            technicalRequirements: row['Technical Requirements'] || '',
            implementationConsiderations: row['Implementation Considerations'] || '',
            relatedDocumentation: row['Related Documentation'] || '',
        };
    });

  } catch (error) {
    console.error(`Error parsing CSV file ${csvPath}: ${error.message}`);
    return [];
  }
}


// --- Functions below are mostly for Markdown parsing or GitHub Issue conversion ---
// --- They might need review/adjustment if migrate-user-stories.js is used ---


// Parse CSV file if it exists (Original function - kept for reference/potential use by migrate-user-stories?)
// NOTE: This uses the old mapping file logic via getStoryComplexityAndPriority
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
     const { complexity, priority } = getStoryComplexityAndPriority(userStory, domain);

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


// Extract acceptance criteria from the markdown content (Used by parseUserStoriesFromMarkdown)
function extractAcceptanceCriteria(content, userStory) {
  // Extract the "Acceptance Criteria" section
  const acMatch = content.match(/## Acceptance Criteria\n([\s\S]*?)(?=\n##|$)/);
  if (!acMatch) return [];
  
  const acSection = acMatch[1].trim();
  const criteria = acSection.split('\n').filter(line => line.trim().startsWith('1.') || line.trim().startsWith('-'));
  
  // Take the top 3-5 most relevant acceptance criteria for this user story
  const relevantCriteria = criteria
    .filter(criterion => {
      const storyKeywords = userStory.toLowerCase().split(' ');
      return storyKeywords.some(keyword => 
        keyword.length > 4 && criterion.toLowerCase().includes(keyword)
      );
    })
    .slice(0, 4);
  
  // If no relevant criteria found, take the first 3 general ones
  return relevantCriteria.length > 0 ? relevantCriteria : criteria.slice(0, 3);
}

// Extract technical requirements from the markdown content
function extractTechnicalRequirements(content) {
  // Extract the "MVP Scope Boundaries" section, focusing on "Included"
  const mvpMatch = content.match(/### Included\n([\s\S]*?)(?=\n###|$)/);
  if (!mvpMatch) return [];
  
  const mvpSection = mvpMatch[1].trim();
  
  // Extract bullet points, focusing on the first level ones
  const requirements = mvpSection
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.trim().replace(/^- \*\*([^*]+)\*\*:/, '- $1:')) // Normalize formatting
    .slice(0, 3); // Take top 3 to keep it concise
  
  return requirements;
}

// Generate implementation notes based on user story content and technical requirements
function generateImplementationNotes(story, technicalRequirements) {
  const storyContent = story.content || '';
  const category = story.category || '';
  const lowerStory = storyContent.toLowerCase();
  
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
  if (technicalRequirements && technicalRequirements.length > 0) {
    const req = technicalRequirements[0].toLowerCase();
    if (req.includes('api') || req.includes('service')) {
      notes.push(`Implement with service interface design patterns`);
    } else if (req.includes('storage') || req.includes('data')) {
      notes.push(`Consider data persistence and state management requirements`);
    } else {
      notes.push(`Ensure compatibility with existing system architecture`);
    }
  }
  
  // Third note - always include testing recommendation
  notes.push(`Write tests first following TDD approach`);
  
  return notes;
}

// Generate user stories from GitHub Issues section if no User Stories section exists
function generateUserStoriesFromGitHubIssues(content, domainName) {
  const gitHubIssuesMatch = content.match(/## GitHub Issues\n([\s\S]*?)(?=\n##|$)/);
  if (!gitHubIssuesMatch) return [];
  
  const gitHubIssuesSection = gitHubIssuesMatch[1].trim();
  const issues = gitHubIssuesSection.split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.trim().replace(/^- \[([^\]]+)\].*$/, '$1'));
  
  return issues.map(issue => {
    // Convert GitHub issue title to user story format
    let storyContent = '';
    
    // Look for key action words to create user story pattern
    if (issue.toLowerCase().startsWith('implement') || 
        issue.toLowerCase().startsWith('create') || 
        issue.toLowerCase().startsWith('build') || 
        issue.toLowerCase().startsWith('develop')) {
      
      // Transform to user story format
      storyContent = `As a developer, I want to ${issue.toLowerCase()} so that the application has proper utility functions and infrastructure.`;
    } else {
      // Default transformation
      storyContent = `As a developer, I want to implement ${issue.toLowerCase()} so that the application has the necessary utility functions.`;
    }
    
    return {
      domain: domainName,
      priority: 'Medium',
      content: storyContent,
      category: 'Core Utilities'
    };
  });
}

// Parse user stories from markdown file
export function parseUserStoriesFromMarkdown(filePath, domainType) {
  console.log(`Reading file: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  const sections = content.split(/^## /m).slice(1);
  let userStories = [];
  
  // Extract the domain name from the file path
  const domainName = path.basename(filePath, '.md');
  console.log(`Domain name: ${domainName}`);
  
  // First, check if there's a dedicated User Stories section
  let hasUserStoriesSection = false;
  
  for (const section of sections) {
    const lines = section.split('\n');
    const sectionTitle = lines[0].trim();
    console.log(`Processing section: ${sectionTitle}`);
    
    if (sectionTitle.toLowerCase().includes('user stories')) {
      hasUserStoriesSection = true;
      let currentPriority = '';
      let storyContent = '';
      let storyCategory = '';
      let inStory = false;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.match(/^\d+\.\s+\*\*(.+)\*\*/)) {
          // This is a category header like "1. **World Creation**"
          storyCategory = line.match(/^\d+\.\s+\*\*(.+)\*\*/)[1];
          console.log(`  Found category: ${storyCategory}`);
          continue;
        }
        
        if (line.startsWith('### ')) {
          currentPriority = line.replace('### ', '').trim();
          console.log(`  Found priority section: ${currentPriority}`);
          continue;
        }
        
        if (line.trim().startsWith('- As a ')) {
          if (inStory) {
            userStories.push({ 
              domain: domainName, 
              priority: currentPriority, 
              content: storyContent,
              category: storyCategory 
            });
          }
          storyContent = line.trim().substring(2);
          inStory = true;
        } else if (inStory && !line.trim().startsWith('-') && line.trim() !== '') {
          storyContent += '\n' + line.trim();
        } else if (inStory && (line.trim().startsWith('-') || line.trim() === '')) {
          userStories.push({ 
            domain: domainName, 
            priority: currentPriority, 
            content: storyContent,
            category: storyCategory 
          });
          inStory = false;
          if (line.trim().startsWith('- As a ')) {
            storyContent = line.trim().substring(2);
            inStory = true;
          }
        }
      }
      
      if (inStory) {
        userStories.push({ 
          domain: domainName, 
          priority: currentPriority, 
          content: storyContent,
          category: storyCategory 
        });
      }
    }
  }
  
  // If no User Stories section found, try to generate from GitHub Issues
  if (!hasUserStoriesSection || userStories.length === 0) {
    console.log(`No User Stories section found, generating from GitHub Issues...`);
    userStories = generateUserStoriesFromGitHubIssues(content, domainName);
    console.log(`Generated ${userStories.length} user stories from GitHub Issues section`);
  }
  
  // Extract acceptance criteria and technical requirements
  const technicalRequirements = extractTechnicalRequirements(content);
  
  // Get acceptance criteria for each user story and add the new properties
  userStories.forEach(story => {
    story.acceptanceCriteria = extractAcceptanceCriteria(content, story.content);
    story.technicalRequirements = technicalRequirements;
    story.relatedDocumentation = buildRelatedDocumentationLink(domainName, domainType);
    
    // Add implementation notes
    story.implementationNotes = generateImplementationNotes(story, story.technicalRequirements);
    
    // Add complexity and priority using our mapping (Legacy behavior for Markdown parsing)
    // TODO: Consider if Markdown parsing should also read from CSVs if a link exists?
    const { complexity: mappedComplexity, priority: mappedPriority } = getStoryComplexityAndPriority(story.content, domainName);
    story.complexity = mappedComplexity;
    
    // Only override the story priority if it doesn't already have one or if it's empty
    if (!story.priority || story.priority.trim() === '') {
      story.priority = mappedPriority;
    }
    
    console.log(`Story complexity (from mapping): ${story.complexity}, priority (from mapping/markdown): ${story.priority}`);
  });
  
  return convertUserStoriesToGithubIssues(userStories);
}

/**
 * Formats issue numbers in the Related Issues/Stories field to create clickable GitHub links.
 * It converts plain issue numbers or issue numbers with # prefix to properly formatted GitHub issue links.
 * 
 * @param {string} relatedIssues - Raw related issues string from CSV, potentially containing newlines
 * @returns {string} - Formatted related issues string with proper GitHub issue links
 */
function formatRelatedIssues(relatedIssues) {
  if (!relatedIssues || relatedIssues === 'N/A') {
    return '';
  }
  
  // Split by newline and process each issue number
  const issueLines = relatedIssues.split(/\\n|\n/).filter(line => line.trim());
  
  // Format each issue number to ensure it has a # prefix for GitHub linking
  return issueLines.map(issueLine => {
    // If it already starts with #, return as is
    if (issueLine.trim().startsWith('#')) {
      return issueLine.trim();
    }
    
    // Otherwise, add # prefix if it's a number
    const issueNumber = issueLine.trim().replace(/^#?/, '');
    if (/^\d+$/.test(issueNumber)) {
      return `#${issueNumber}`;
    }
    
    // If not a number, return as is
    return issueLine.trim();
  }).join('\n');
}

/**
 * Converts an array of user story objects into an array of GitHub issue objects,
 * formatting the content according to a predefined template.
 * Handles formatting of list-based fields like Acceptance Criteria, Technical Requirements,
 * Related Documentation, and Implementation Notes into Markdown lists.
 *
 * @param {Array<Object>} userStories - An array of user story objects, typically parsed from CSV or Markdown.
 * @param {string} userStories[].title - The title summary for the user story (from CSV).
 * @param {string} userStories[].content - The main content of the user story.
 * @param {string} userStories[].domain - The domain the user story belongs to.
 * @param {string} userStories[].priority - The priority level of the user story (e.g., 'High', 'Medium', 'Low', 'Post-MVP').
 * @param {string} userStories[].complexity - The estimated complexity of the user story (e.g., 'Small', 'Medium', 'Large').
 * @param {Array<string>} userStories[].acceptanceCriteria - An array of acceptance criteria strings.
 * @param {Array<string>} userStories[].technicalRequirements - An array of technical requirements strings.
 * @param {string} userStories[].relatedDocumentation - A formatted string or path for related documentation.
 * @param {Array<string>} userStories[].implementationNotes - An array of implementation notes strings.
 * @param {string} userStories[].relatedIssues - A string containing related issues/stories, potentially comma-separated.
 * @param {string} userStories[].implementationConsiderations - A string containing implementation considerations, potentially multi-line.
 * @returns {Array<Object>} An array of objects formatted for GitHub issue creation.
 * @returns {string} returns[].title - The title of the GitHub issue.
 * @returns {string} returns[].body - The body content of the GitHub issue in Markdown format.
 * @returns {Array<string>} returns[].labels - An array of labels for the GitHub issue.
 */
export function convertUserStoriesToGithubIssues(userStories) {
  return userStories.map(story => {
    // Use the title from the story object, which is now the title summary from CSVs
    const issueTitle = story.title;
    let priorityLevel = story.priority || 'Medium';
    
    // Format domain label correctly
    let domainLabel = story.domain.toLowerCase().replace(/\s+/g, '-');
    if (!domainLabel.startsWith('domain:')) {
      domainLabel = `domain:${domainLabel}`;
    }
    
    // Format complexity label
    const complexityLabel = `complexity:${story.complexity.toLowerCase()}`;
    
    // Format priority label
    const priorityLabelValue = `priority:${priorityLevel.toLowerCase().replace(/\s+|\(|\)/g, '-')}`;
    
    // Populate the issue body template
    
    // Start with the original template
    let body = ISSUE_BODY_TEMPLATE;
    
    // Replace the user story placeholder with actual content
    body = body.replace(
      'As a [type of user], I want [goal/need] so that [benefit/value].',
      story.content
    );
    
    // Remove the entire domain section
    body = body.replace(/## Domain[\s\S]*?(?=\n##)/, '');
    
    // Populate acceptance criteria
    let acText = '';
    if (story.acceptanceCriteria && story.acceptanceCriteria.length > 0) {
      acText = story.acceptanceCriteria.map(ac => `- [ ] ${ac.replace(/^\d+\.\s+/, '')}`).join('\n');
    } else {
      acText = '- [ ] TBD';
    }
    body = body.replace(/<!-- List the specific[\s\S]*?- \[ \] [\s\S]*?- \[ \] [\s\S]*?- \[ \] [\s\S]*?- \[ \] /, `<!-- List the specific, measurable conditions that must be met for this story to be considered complete -->\n${acText}\n`);
    
    // Populate technical requirements
    let trText = '';
    if (story.technicalRequirements && story.technicalRequirements.length > 0) {
      trText = story.technicalRequirements.join('\n');
    } else {
      trText = '- TBD';
    }
    body = body.replace(/<!-- List technical[\s\S]*?- [\s\S]*?- [\s\S]*?- /, `<!-- List technical implementation details, constraints, or dependencies -->\n${trText}\n`);
    
    // Populate related documentation
    body = body.replace(/<!-- Link to requirements[\s\S]*?- /, `<!-- Link to requirements documents and other references -->\n${story.relatedDocumentation}\n`);
    
    // Populate implementation notes
    const implNotes = story.implementationNotes || [];
    const implNotesText = implNotes.map(note => `- ${note}`).join('\n');
    body = body.replace(/<!-- Add guidance[\s\S]*?- [\s\S]*?- [\s\S]*?- /,
                      `<!-- Add guidance on implementation approach, architecture considerations, etc. -->\n${implNotesText}\n`);
    
    // Check the correct priority checkbox
    const prioritySection = body.match(/## Priority[\s\S]*?(?=\n##|$)/);
    if (prioritySection) {
      let priorityText = prioritySection[0];
      
      if (priorityLevel.includes('High')) {
        priorityText = priorityText.replace('- [ ] High (MVP)', '- [x] High (MVP)');
      } else if (priorityLevel.includes('Medium')) {
        priorityText = priorityText.replace('- [ ] Medium (MVP Enhancement)', '- [x] Medium (MVP Enhancement)');
      } else if (priorityLevel.includes('Low')) {
        priorityText = priorityText.replace('- [ ] Low (Nice to Have)', '- [x] Low (Nice to Have)');
      } else if (priorityLevel.includes('Post-MVP')) {
        priorityText = priorityText.replace('- [ ] Post-MVP', '- [x] Post-MVP');
      }
      
      body = body.replace(/## Priority[\s\S]*?(?=\n##|$)/, priorityText);
    }
    
    // Set the estimated complexity checkbox
    const complexitySection = body.match(/## Estimated Complexity[\s\S]*?(?=\n##|$)/);
    if (complexitySection) {
      let complexityText = complexitySection[0];
      
      if (story.complexity === 'Small') {
        complexityText = complexityText.replace('- [ ] Small (1-2 days)', '- [x] Small (1-2 days)');
      } else if (story.complexity === 'Medium') {
        complexityText = complexityText.replace('- [ ] Medium (3-5 days)', '- [x] Medium (3-5 days)');
      } else if (story.complexity === 'Large') {
        complexityText = complexityText.replace('- [ ] Large (1+ week)', '- [x] Large (1+ week)');
      }
      
      body = body.replace(/## Estimated Complexity[\s\S]*?(?=\n##|$)/, complexityText);
    }
    
    // Format and add related issues with proper GitHub links
    if (story.relatedIssues && story.relatedIssues !== 'N/A') {
      const formattedRelatedIssues = formatRelatedIssues(story.relatedIssues);
      if (formattedRelatedIssues) {
        // Find the Related Issues/Stories section and replace it
        const relatedIssuesSection = body.match(/## Related Issues\/Stories[\s\S]*?(?=\n##|$)/);
        if (relatedIssuesSection) {
          const newRelatedIssuesSection = `## Related Issues/Stories\n<!-- Link to any related issues or stories - Each issue number is prefixed with # to create a clickable link -->\n${formattedRelatedIssues}`;
          body = body.replace(/## Related Issues\/Stories[\s\S]*?(?=\n##|$)/, newRelatedIssuesSection);
        } else {
          // If the section doesn't exist, add it at the end
          body += `\n\n## Related Issues/Stories\n<!-- Link to any related issues or stories - Each issue number is prefixed with # to create a clickable link -->\n${formattedRelatedIssues}`;
        }
      }
    }
    
    return {
      title: issueTitle,
      body,
      labels: ['user-story', domainLabel, priorityLabelValue, complexityLabel]
    };
  });
}
