const { execSync } = require('child_process');

// Get the GitHub token from environment
const token = process.env.GITHUB_TOKEN || execSync('gh auth token', { encoding: 'utf8' }).trim();

// PR template content
const prBody = `# Pull Request Template

## Description
Implementation of a comprehensive lore management system for tracking narrative facts and maintaining story coherence. This system provides CRUD operations for lore facts, AI integration for consistent narrative generation, and a user interface for managing world lore.

## Related Issue
Closes #434

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactoring (code improvements without changing functionality)
- [ ] Documentation update
- [ ] Test addition or improvement

## TDD Compliance
- [x] Tests written before implementation
- [x] All new code is tested
- [x] All tests pass locally
- [x] Test coverage maintained or improved

## User Stories Addressed
- As a player, I want basic lore consistency tracking so that the narrative maintains coherence with established facts
- Players can manually add and manage lore facts through the LoreViewer component
- AI systems receive relevant lore context to maintain narrative consistency
- Facts are automatically extracted from narrative text and stored

## Component Development
- [x] Storybook stories created/updated
- [x] Components developed in isolation first
- [x] Visual consistency verified

## Implementation Notes
### Core Components:
- **LoreStore**: Zustand store with CRUD operations, search/filtering, and AI context generation
- **LoreViewer**: React component for displaying and managing lore facts with responsive design
- **LoreIntegratedNarrativeGenerator**: Enhanced AI service that includes lore context in prompts
- **Type System**: Comprehensive TypeScript definitions for lore management

### Key Features:
- Fact categorization (characters, locations, events, rules, items, organizations)
- Source tracking (narrative, manual, AI-generated, imported)
- Advanced search and filtering capabilities
- Automatic fact extraction from narrative text
- AI integration for maintaining narrative consistency
- IndexedDB persistence for client-side storage

### Architecture:
- Follows domain-driven design principles
- Maintains strict file size limits (all files under 300 lines)
- Uses existing project patterns and utilities
- Implements proper error handling and loading states

## Testing Instructions
### Three-Stage Verification:

#### 1. Store Testing:
\`\`\`bash
npm test -- src/state/__tests__/loreStore.test.ts
npm test -- src/types/__tests__/lore.types.test.ts
\`\`\`

#### 2. Component Testing:
\`\`\`bash
npm test -- src/components/LoreViewer/__tests__/LoreViewer.test.tsx
\`\`\`

#### 3. Build Verification:
\`\`\`bash
npm run build
\`\`\`

#### 4. Manual Testing:
\`\`\`bash
npm run dev
# Navigate to a page that integrates LoreViewer
# Test CRUD operations, search, filtering
# Verify responsive design and accessibility
\`\`\`

## Checklist
- [x] Code follows the project's coding standards
- [x] File size limits respected (max 300 lines per file)
- [x] Self-review of code performed
- [x] Comments added for complex logic
- [x] Documentation updated (if required)
- [x] No new warnings generated
- [x] Accessibility considerations addressed

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

// Create the PR using gh CLI
const command = `gh pr create --title "Fix #434: Implement lore consistency tracking system" --body "${prBody.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" --base develop --head feature/issue-434`;

try {
  const result = execSync(command, { encoding: 'utf8' });
  console.log('PR created successfully:', result);
} catch (error) {
  console.error('Error creating PR:', error.message);
}
