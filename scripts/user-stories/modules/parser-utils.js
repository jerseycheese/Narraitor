// parser-utils.js - Shared utility functions extracted from parsers.js

/**
 * Formats issue numbers in the Related Issues/Stories field to create clickable GitHub links.
 * It converts plain issue numbers or issue numbers with # prefix to properly formatted GitHub issue links.
 * 
 * @param {string} relatedIssues - Raw related issues string from CSV, potentially containing newlines
 * @returns {string} - Formatted related issues string with proper GitHub issue links
 */
export function formatRelatedIssues(relatedIssues) {
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
 * Generate implementation notes based on user story content and technical requirements
 * 
 * @param {Object} story - User story object
 * @param {string} story.content - The main content of the user story
 * @param {string} story.category - The category of the user story
 * @param {Array<string>} technicalRequirements - Array of technical requirements
 * @returns {Array<string>} Array of implementation notes
 */
export function generateImplementationNotes(story, technicalRequirements) {
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
