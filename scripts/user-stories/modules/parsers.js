// Parsers for user story files (CSV and Markdown)
import fs from 'fs';
import path from 'path';
import { getStoryComplexityAndPriority } from '../story-complexity-mapping.js';
import { buildRelatedDocumentationLink } from './fs-utils.js';
import { ISSUE_BODY_TEMPLATE } from './config.js';

// Parse CSV file if it exists
export function parseUserStoriesFromCSV(csvFile, domain) {
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
    
    // Parse CSV line
    const columns = line.split(',');
    if (columns.length < 5) continue;
    
    // Extract data
    const titleSummary = columns[0].trim().replace(/"/g, '');
    const userStory = columns[1].trim().replace(/"/g, '');
    const priority = columns[2].trim().replace(/"/g, '');
    const complexity = columns[3].trim().replace(/"/g, '');
    const acceptanceCriteria = columns[4].trim().replace(/"/g, '').split('\\n');
    
    userStories.push({
      domain,
      priority,
      complexity,
      content: userStory,
      title: `[USER STORY] ${userStory}`,
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

// Extract acceptance criteria from the markdown content
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
    
    // Add complexity and priority using our mapping
    const { complexity, priority } = getStoryComplexityAndPriority(story.content, domainName);
    story.complexity = complexity;
    
    // Only override the story priority if it doesn't already have one or if it's empty
    if (!story.priority || story.priority.trim() === '') {
      story.priority = priority;
    }
    
    console.log(`Story complexity: ${story.complexity}, priority: ${story.priority}`);
  });
  
  return convertUserStoriesToGithubIssues(userStories);
}

// Convert user stories to GitHub issues format
export function convertUserStoriesToGithubIssues(userStories) {
  return userStories.map(story => {
    const lines = story.content ? story.content.split('\n') : ['No content'];
    const title = lines[0];
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
    const issueTitle = `[USER STORY] ${title}`;
    
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
    
    return {
      title: issueTitle,
      body,
      labels: ['user-story', domainLabel, priorityLabelValue, complexityLabel]
    };
  });
}
