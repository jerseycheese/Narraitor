// markdown-parser.js - Markdown parsing functionality extracted from parsers.js
import fs from 'fs';
import path from 'path';
import { buildRelatedDocumentationLink } from './fs-utils.js';
import { convertUserStoriesToGithubIssues } from './github-issue-converter.js';
import { generateImplementationNotes } from './parser-utils.js';

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
    
    // Add complexity and priority using default values (Legacy behavior for Markdown parsing)
    // TODO: Consider if Markdown parsing should also read from CSVs if a link exists?
    // For now, set default values since getStoryComplexityAndPriority is not available
    story.complexity = 'Medium';
    
    // Only override the story priority if it doesn't already have one or if it's empty
    if (!story.priority || story.priority.trim() === '') {
      story.priority = 'Medium';
    }
    
    console.log(`Story complexity (default): ${story.complexity}, priority (from markdown/default): ${story.priority}`);
  });
  
  return convertUserStoriesToGithubIssues(userStories);
}
