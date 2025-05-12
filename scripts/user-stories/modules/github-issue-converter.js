// github-issue-converter.js - GitHub issue conversion functionality extracted from parsers.js
import { ISSUE_BODY_TEMPLATE } from './config.js';
import { formatRelatedIssues } from './parser-utils.js';

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
