// issue-body-utils.js
// Functions for updating issue body sections

import { OWNER, REPO } from '../user-stories/modules/config.js';
import { 
  EMPTY_PATTERNS, 
  DOMAIN_CHECKBOX_MAP,
  formatAcceptanceCriteria,
  formatTechnicalRequirements,
  formatImplementationConsiderations,
  formatRelatedIssues,
  formatRelatedDocumentation
} from './issue-body-formats.js';

// Check if a field has default/empty content
export function isFieldEmpty(fieldContent) {
  if (!fieldContent) return true;
  const trimmed = fieldContent.trim();
  return EMPTY_PATTERNS.includes(trimmed);
}

// Update user story - always update if different
export function updateUserStory(body, csvRowData) {
  const userStory = csvRowData.userStory || '';
  console.log('updateUserStory called with CSV userStory:', JSON.stringify(userStory));
  
  if (!userStory) {
    console.log('No user story in CSV data, skipping update');
    return body;
  }
  
  const usRegex = /## User Story\s*\n([^\n#]*)/;
  const usMatch = body.match(usRegex);
  
  if (usMatch) {
    const currentUserStory = usMatch[1].trim();
    console.log('Current user story:', JSON.stringify(currentUserStory));
    console.log('CSV user story:', JSON.stringify(userStory.trim()));
    console.log('Are they different?', currentUserStory !== userStory.trim());
    
    // ALWAYS update if the current user story is different from CSV
    if (currentUserStory !== userStory.trim()) {
      console.log(`Updating User Story from "${currentUserStory}" to "${userStory}"`);
      const updated = body.replace(usRegex, `## User Story\n${userStory}`);
      
      // Verify the update worked
      const verifyMatch = updated.match(usRegex);
      console.log('After update, user story is:', JSON.stringify(verifyMatch?.[1]));
      
      return updated;
    } else {
      console.log('User stories are identical, no update needed');
    }
  } else {
    console.log('No User Story section found in body');
  }
  
  return body;
}

// Update plain language summary - update from titleSummary if plainLanguageSummary is empty or if current is a default value
export function updatePlainLanguageSummary(body, csvRowData) {
  // Prefer plainLanguageSummary, but fall back to titleSummary if not available
  const pls = csvRowData.plainLanguageSummary || csvRowData.titleSummary || '';
  
  if (!pls) {
    console.log('No plainLanguageSummary or titleSummary in CSV data');
    return body;
  }
  
  const plsRegex = /## Plain Language Summary\s*\n([^\n#]*)/;
  const plsMatch = body.match(plsRegex);
  
  if (plsMatch) {
    const currentPLS = plsMatch[1].trim();
    console.log(`Current PLS: "${currentPLS}"`);
    console.log(`CSV PLS/Title: "${pls}"`);
    
    // Always update if the current is empty, a default value, or different from CSV
    if (isFieldEmpty(currentPLS) || currentPLS !== pls.trim()) {
      console.log(`Updating Plain Language Summary from "${currentPLS}" to "${pls}"`);
      return body.replace(plsRegex, `## Plain Language Summary\n${pls}`);
    }
  } else {
    console.log('No Plain Language Summary section found in body');
  }
  
  return body;
}

// Update acceptance criteria with proper formatting and comparison
export function updateAcceptanceCriteria(body, csvRowData) {
  const acRaw = csvRowData.acceptanceCriteriaRaw;
  if (!acRaw) return body;
  
  const acRegex = /## Acceptance Criteria\s*\n((?:[^\n]|\n(?!##))*)/;
  const acMatch = body.match(acRegex);
  
  if (acMatch) {
    const currentAC = acMatch[1].trim();
    const formattedAC = formatAcceptanceCriteria(acRaw);
    
    // Always update if the current doesn't match the properly formatted version
    if (currentAC !== formattedAC.trim()) {
      console.log('Updating Acceptance Criteria');
      return body.replace(acRegex, `## Acceptance Criteria\n${formattedAC}\n`);
    }
  }
  
  return body;
}

// Update technical requirements with proper formatting
export function updateTechnicalRequirements(body, csvRowData) {
  const techReq = csvRowData.technicalRequirements;
  if (!techReq) return body;
  
  const trRegex = /## Technical Requirements\s*\n(?:<!-- List specific technical implementation details -->\s*\n)?([\s\S]*?)(?=\n##|$)/; // Modified regex to capture across newlines
  const trMatch = body.match(trRegex);

  if (trMatch) {
    const currentTR = trMatch[1].trim();
    const formattedTR = formatTechnicalRequirements(techReq);

    // Always update if the current doesn't match the properly formatted version
    // Normalize current content by replacing literal \n with actual newlines for comparison
    const normalizedCurrentTR = currentTR.replace(/\\n/g, '\n');
    if (normalizedCurrentTR !== formattedTR.trim()) {
      console.log('Updating Technical Requirements');
      return body.replace(trMatch[0], // Replace the entire matched section
        `## Technical Requirements\n<!-- List specific technical implementation details -->\n${formattedTR}\n`);
    }
  }

  return body;
}

// Update implementation considerations
export function updateImplementationConsiderations(body, csvRowData) {
  const implCons = csvRowData.implementationConsiderations;
  if (!implCons) return body;
  
  const icRegex = /## Implementation Considerations\s*\n(?:<!-- Describe potential challenges, dependencies, or alternative approaches -->\s*\n)?([\s\S]*?)(?=\n##|$)/; // Modified regex to capture across newlines
  const icMatch = body.match(icRegex);

  if (icMatch) {
    const currentIC = icMatch[1].trim();
    const formattedIC = formatImplementationConsiderations(implCons);

    // Always update if the current doesn't match the properly formatted version
    // Normalize current content by replacing literal \n with actual newlines for comparison
    const normalizedCurrentIC = currentIC.replace(/\\n/g, '\n');
    if (normalizedCurrentIC !== formattedIC.trim()) {
      console.log('Updating Implementation Considerations');
      return body.replace(icMatch[0], // Replace the entire matched section
        `## Implementation Considerations\n<!-- Describe potential challenges, dependencies, or alternative approaches -->\n${formattedIC}\n`);
    }
  }

  return body;
}

// Update related documentation
export function updateRelatedDocumentation(body, csvRowData) {
  const relatedDocs = csvRowData.relatedDocumentation || '';
  if (!relatedDocs || relatedDocs.trim().toLowerCase() === 'n/a') return body;
  
  const rdRegex = /## Related Documentation\s*\n(?:<!-- Link to requirements documents and other references -->\s*\n)?((?:[^\n]|\n(?!##))*)/;
  const rdMatch = body.match(rdRegex);
  
  if (rdMatch) {
    const currentRD = rdMatch[1].trim();
    const formattedDocs = formatRelatedDocumentation(relatedDocs);
    
    if (currentRD !== formattedDocs.trim()) {
      console.log('Updating Related Documentation');
      return body.replace(rdRegex, 
        `## Related Documentation\n<!-- Link to requirements documents and other references -->\n${formattedDocs}\n`);
    }
  }
  
  return body;
}

// Update related issues - handle literal \n in body too
export function updateRelatedIssues(body, csvRowData) {
  const relatedIssues = csvRowData.relatedIssues || '';
  if (!relatedIssues || relatedIssues.trim().toLowerCase() === 'n/a') return body;
  
  // More flexible regex that captures everything in the Related Issues section
  const riRegex = /## Related Issues\/Stories\s*\n(?:<!-- [^>]* -->\s*\n)?([\s\S]*?)(?=\n*$|\n## )/;
  const riMatch = body.match(riRegex);
  
  if (riMatch) {
    const currentRI = riMatch[1].trim();
    const formattedIssues = formatRelatedIssues(relatedIssues);
    
    // Always update if current doesn't match the formatted version
    // The current body has literal \n characters too, so we need to normalize for comparison
    const normalizedCurrent = currentRI.replace(/\\n/g, '\n');
    
    if (normalizedCurrent !== formattedIssues.trim()) {
      console.log('Updating Related Issues from:', JSON.stringify(currentRI));
      console.log('To:', JSON.stringify(formattedIssues));
      
      // Replace the entire match to ensure we preserve the structure
      const replacement = `## Related Issues/Stories\n<!-- Link to any related issues or stories - Each issue number should be prefixed with # to create a link -->\n${formattedIssues}`;
      return body.replace(riMatch[0], replacement);
    }
  }
  
  return body;
}

// Update domain checkbox
export function updateDomainCheckbox(body, domain) {
  const templateDomainText = DOMAIN_CHECKBOX_MAP[domain];
  if (!templateDomainText) return body;
  
  const searchRegex = new RegExp(`- \\[ \\] ${templateDomainText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
  const replaceText = `- [x] ${templateDomainText}`;
  
  return body.replace(searchRegex, replaceText);
}

// Generate implementation notes
export function generateImplementationNotes(story) {
  const content = story.body || '';
  
  let category = '';
  const categoryMatch = content.match(/domain:([a-z-]+)/i);
  if (categoryMatch) {
    category = categoryMatch[1].replace(/-/g, ' ');
  }
  
  const storyTextMatch = content.match(/## User Story\n([\s\S]*?)(?=\n##)/);
  const storyText = storyTextMatch ? storyTextMatch[1].trim() : '';
  
  const techReqMatch = content.match(/## Technical Requirements\n([\s\S]*?)(?=\n##)/);
  const techReq = techReqMatch ? techReqMatch[1].trim() : '';
  
  const lowerStory = storyText.toLowerCase();
  
  let notes = [];
  
  const actionWords = ['create', 'implement', 'develop', 'build', 'integrate', 'manage', 'track', 'handle'];
  const actionMatch = actionWords.find(word => lowerStory.includes(word));
  
  if (category && actionMatch) {
    notes.push(`Follow the ${category} module pattern for the ${actionMatch} functionality`);
  } else {
    notes.push(`Use standard implementation approach for this feature`);
  }
  
  if (techReq && techReq.length > 0) {
    const lowerReq = techReq.toLowerCase();
    if (lowerReq.includes('api') || lowerReq.includes('service')) {
      notes.push(`Implement with service interface design patterns`);
    } else if (lowerReq.includes('storage') || lowerReq.includes('data')) {
      notes.push(`Consider data persistence and state management requirements`);
    } else {
      notes.push(`Ensure compatibility with existing system architecture`);
    }
  }
  
  notes.push(`Write tests first following TDD approach`);
  
  return notes;
}

// Add implementation notes to issue body
export function addImplementationNotes(body, notes) {
  if (!body) return body;
  
  const implNotesRegex = /## Implementation Notes\n<!-- Add guidance on implementation approach, architecture considerations, etc. -->\n([^#]*)/;
  const implNotesMatch = body.match(implNotesRegex);
  
  if (implNotesMatch) {
    const notesText = notes.map(note => `- ${note}`).join('\n');
    const newNotes = `## Implementation Notes\n<!-- Add guidance on implementation approach, architecture considerations, etc. -->\n${notesText}\n`;
    return body.replace(implNotesMatch[0], newNotes);
  }
  
  return body;
}

// Update complexity section
export function updateComplexity(body, complexity) {
  if (!body) return body;
  
  const compRegex = /## Estimated Complexity[\s\S]*?(?=\n##|$)/;
  const match = body.match(compRegex);
  if (match) {
    const newSection = [
      '## Estimated Complexity',
      '<!-- Select the estimated complexity level -->',
      `- [${complexity === 'Small' ? 'x' : ' '}] Small (1-2 days)`,
      `- [${complexity === 'Medium' ? 'x' : ' '}] Medium (3-5 days)`,
      `- [${complexity === 'Large' ? 'x' : ' '}] Large (1+ week)`
    ].join('\n');
    return body.replace(compRegex, newSection);
  }
  return body;
}

// Update priority section
export function updatePriority(body, priority) {
  if (!body) return body;
  
  const priRegex = /## Priority[\s\S]*?(?=\n##|$)/;
  const match = body.match(priRegex);
  if (match) {
    const newSection = [
      '## Priority',
      '<!-- Select the priority level -->',
      `- [${priority === 'High' ? 'x' : ' '}] High (MVP)`,
      `- [${priority === 'Medium' ? 'x' : ' '}] Medium (MVP Enhancement)`,
      `- [${priority === 'Low' ? 'x' : ' '}] Low (Nice to Have)`,
      `- [${priority === 'Post-MVP' ? 'x' : ' '}] Post-MVP`
    ].join('\n');
    return body.replace(priRegex, newSection);
  }
  return body;
}

// Fix documentation links
export function fixDocumentationLinks(body) {
  if (!body) return body;
  
  const linkRegex = /- \[([^.]+)\.md\]\(\s*(?:https:\/\/github\.com\/[\w-]+\/[\w-]+\/blob\/(?:main|develop)\/)?docs\/requirements\/core\/([^)]+)\.md\s*\) - Source requirements document/;
  const linkMatch = body.match(linkRegex);
  
  if (linkMatch) {
    const domain = linkMatch[2];
    const oldLink = linkMatch[0];
    const newLink = `- [${domain}.md](https://github.com/${OWNER}/${REPO}/blob/develop/docs/requirements/core/${domain}.md) - Source requirements document`;
    return body.replace(oldLink, newLink);
  }
  
  const htmlLinkRegex = /<a\s+href="(?:https:\/\/github\.com\/[\w-]+\/[\w-]+\/blob\/(?:main|develop)\/)?(?:\/|\.\.\/)?docs\/requirements\/core\/([^"]+)\.md">([^<]+)<\/a>/g;
  return body.replace(htmlLinkRegex, `<a href="https://github.com/${OWNER}/${REPO}/blob/develop/docs/requirements/core/$1.md">$2</a>`);
}