// Test the update logic for issue #308

const testBody = `## Plain Language Summary
Presents player choices in a visually clear way that's easy to understand and interact with
## User Story
Clean, readable interface for decisions
## Acceptance Criteria
- [ ] Decision interface components with:
- [ ] - Clear visual distinction between options
- [ ] - Responsive design for all screen sizes
- [ ] - Seamless integration with narrative flow
- [ ] - Accessible interaction controls
## Technical Requirements
<!-- List specific technical implementation details -->
- No technical requirements specified
## Implementation Considerations
<!-- Describe potential challenges, dependencies, or alternative approaches -->
- No implementation considerations specified
## Related Documentation
<!-- Link to requirements documents and other references -->
- No related documentation specified
## Related Issues/Stories
<!-- Link to any related issues or stories - Each issue number should be prefixed with # to create a link -->
- None`;

const csvData = {
  userStory: "As a player, I want a clean, readable interface for decisions so I can easily understand my options",
  relatedIssues: "#220\\n#217\\n#234\\n#248\\n#280\\n#211\\n#206",
  technicalRequirements: "Decision interface components with:\\n- Clear visual distinction between options\\n- Responsive design for all screen sizes\\n- Seamless integration with narrative flow\\n- Accessible interaction controls",
  implementationConsiderations: "Use standard implementation approach for this feature\\nConsider data persistence and state management requirements\\nWrite tests first following TDD approach\\nImplement accessible design patterns for decision interface"
};

import { 
  updateUserStory,
  updateRelatedIssues,
  updateTechnicalRequirements
} from '../utils/issue-body-utils.js';

console.log('Testing User Story Update');
console.log('========================');
console.log('Current User Story:', testBody.match(/## User Story\s*\n([^\n#]*)/)?.[1]);
console.log('CSV User Story:', csvData.userStory);

let updatedBody = updateUserStory(testBody, csvData);
console.log('\nAfter update:', updatedBody.match(/## User Story\s*\n([^\n#]*)/)?.[1]);

console.log('\nTesting Related Issues Update');
console.log('=============================');
console.log('Current Related Issues:', testBody.match(/## Related Issues\/Stories\s*\n(?:<!-- Link to any related issues or stories - Each issue number should be prefixed with # to create a link -->\s*\n)?((?:[^\n]|\n(?!##))*?)(?=\n##|$)/)?.[1]);
console.log('CSV Related Issues:', csvData.relatedIssues);

updatedBody = updateRelatedIssues(updatedBody, csvData);
const riMatch = updatedBody.match(/## Related Issues\/Stories\s*\n(?:<!-- Link to any related issues or stories - Each issue number should be prefixed with # to create a link -->\s*\n)?((?:[^\n]|\n(?!##))*?)(?=\n##|$)/);
console.log('\nAfter update:', riMatch?.[1]);

console.log('\nTesting Technical Requirements Update');
console.log('====================================');
updatedBody = updateTechnicalRequirements(updatedBody, csvData);
const trMatch = updatedBody.match(/## Technical Requirements\s*\n(?:<!-- List specific technical implementation details -->\s*\n)?((?:[^\n]|\n(?!##))*)/);
console.log('After update:', trMatch?.[1]);

console.log('\nFinal Updated Body:');
console.log('==================');
console.log(updatedBody);
