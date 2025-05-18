# Concrete Example: Implementing a GitHub Issue with Claude App & Claude Code

This walkthrough demonstrates the complete development process for implementing a GitHub issue in the Narraitor project, using Claude App for planning and Claude Code with the "do-issue" script for implementation, followed by the Three-Stage Verification Framework.

## Overview

We'll implement GitHub issue #123, which requests a new `CharacterCard` component for displaying character information in various contexts. This example shows how to:

1. Use Claude App for initial planning and analysis
2. Use Claude Code with the `/project:do-issue` command for implementation
3. Apply the Three-Stage Verification Framework
4. Complete the workflow with documentation and PR creation

## Step 1: Initial Planning in Claude App

Start by using Claude App to analyze the GitHub issue and create a technical specification.

**Input to Claude App:**
```
# Project Analysis Request

## Context
I'm working on the Narraitor project, a Next.js/React application for a narrative-driven RPG framework using AI.

## Request
Help me analyze GitHub issue #123 for the new CharacterCard component.

## Information Access
Please use MCP tools to:
1. Review the GitHub issue using the MCP GitHub tool to understand requirements
2. Review related components at `/Users/jackhaas/Projects/narraitor/src/components/character`
3. Check our Storybook workflow
4. Review our character types at `/Users/jackhaas/Projects/narraitor/src/types/character.ts`

## Analysis Goals
Based on this information, please:
1. Create a technical specification for the CharacterCard component
2. Provide a step-by-step implementation plan following TDD
3. Identify existing utilities/helpers that can be leveraged
4. Plan the Three-Stage Component Testing approach
```

**Claude App Response:**
*[Claude analyzes the issue and creates a technical specification with component interface, variants, and implementation plan]*

**Example Technical Specification (Artifact):**
```markdown
# CharacterCard Component Technical Specification

## Component Purpose
A reusable card component for displaying character information in various contexts, with multiple display variants and interactive features.

## Interface Definition
```typescript
interface CharacterCardProps {
  /** The character to display */
  character: Character;
  /** Display variant determining size and content density */
  variant?: 'compact' | 'standard' | 'expanded';
  /** Whether the card is selected */
  isSelected?: boolean;
  /** Called when the view details button is clicked */
  onViewDetails: (characterId: string) => void;
  /** Additional CSS class names */
  className?: string;
}
```

## Variants
1. **Compact**: Minimal information (name only), small size (48px height)
2. **Standard**: Name, avatar, top 3 skills (default, 148px height)
3. **Expanded**: Name, avatar, all attributes, top 3 skills (164px height)

## Visual States
1. Normal state: White background, subtle border
2. Hover state: Slight shadow increase
3. Selected state: Highlighted border, light blue background

## Implementation Details
- Use Tailwind for styling
- Implement responsive design principles
- Show avatar only in standard and expanded variants
- Show skills only in standard and expanded variants
- Show attributes only in expanded variant
- Sort skills by value to display top 3

## Three-Stage Testing Approach
1. **Stage 1**: Storybook isolation with all variants and states
2. **Stage 2**: Test harness at `/dev/character-card`
3. **Stage 3**: Integration in character list/selection screens

## Existing Utilities to Leverage
- Character type definitions in `/src/types/character.ts`
- Image component wrapper in `/src/components/common/Image.tsx`
- Typography components for consistent text styling
```

## Step 2: Implementation Using Claude Code with do-issue

Now that you have a technical specification, you can use Claude Code with the `/project:do-issue` command to implement the GitHub issue.

**Terminal Command:**
```bash
cd /Users/jackhaas/Projects/narraitor
claude
```

**Claude Code Input:**
```
/project:do-issue 123
```

**Claude Code Workflow:**

1. **Branch Creation:**
   ```
   Creating feature branch for issue #123...
   ```

2. **Issue Analysis:**
   ```
   Analyzing GitHub issue #123 using MCP GitHub tool...
   ```

3. **Technical Specification:**
   *[Claude Code presents a technical specification similar to what you got from Claude App, but now it's using the MCP GitHub tool to directly gather information from the issue]*

4. **Test Implementation:**
   ```
   Creating tests for CharacterCard component...
   ```
   *[Claude Code implements test files directly in your codebase]*

5. **Component Implementation:**
   ```
   Implementing CharacterCard component to make tests pass...
   ```
   *[Claude Code implements the component based on the tests and technical specification]*

6. **Storybook Integration:**
   ```
   Creating Storybook stories for CharacterCard...
   ```
   *[Claude Code adds Storybook stories for the component]*

7. **Test Harness Creation:**
   ```
   Creating test harness at /dev/character-card...
   ```
   *[Claude Code creates a test harness page for interactive testing]*

8. **Verification Checkpoint:**
   ```
   IMPORTANT: Manual verification required before proceeding.
   
   Please verify the implementation using the Three-Stage Verification Framework:
   
   1. Storybook Testing:
      - Run: npm run storybook
      - Verify all variants and states
      - [Specific verification points for CharacterCard]
   
   2. Test Harness Verification:
      - Run: npm run dev
      - Navigate to /dev/character-card
      - [Specific verification points for test harness]
   
   3. System Integration Verification:
      - [Integration verification points]
      
   Type "C" to continue after verification, or provide feedback if changes are needed.
   ```

## Step 3: Three-Stage Verification

Follow the verification steps provided by Claude Code:

### Stage 1: Storybook Testing
```bash
cd /Users/jackhaas/Projects/narraitor
npm run storybook
```
- Navigate to the CharacterCard component in Storybook
- Verify all variants (compact, standard, expanded)
- Check selected state styling
- Test interactive elements

### Stage 2: Test Harness Verification
```bash
cd /Users/jackhaas/Projects/narraitor
npm run dev
```
- Navigate to http://localhost:3000/dev/character-card
- Test with different data
- Verify all state transitions
- Test edge cases

### Stage 3: System Integration
- Integrate the component into the character selection screen
- Verify it works with actual data and state management
- Test navigation and interaction flows

Once verification is complete, type "C" to continue the workflow.

## Step 4: Documentation and PR Creation

After verification, Claude Code will:

1. **Add Documentation:**
   ```
   Adding documentation for CharacterCard component...
   ```
   *[Claude Code adds JSDoc comments and updates documentation files]*

2. **Commit Changes:**
   ```
   Committing changes with semantic message...
   ```
   *[Claude Code creates a commit with a properly formatted message]*

3. **Create PR:**
   ```
   Creating pull request using MCP GitHub tool...
   ```
   *[Claude Code creates a pull request with appropriate details, linking to the issue]*

   The PR includes:
   - Title linked to the issue
   - Description of changes
   - Testing notes
   - Implementation details
   - Verification confirmation

## Step 5: Final Documentation in Claude App

After completing the implementation and creating the PR, you can go back to Claude App for creating comprehensive documentation for your wiki or other documentation platforms.

**Input to Claude App:**
```
# Documentation Request

## Context
I've implemented the CharacterCard component and created a pull request. Here's the PR information:

[PASTE PR DETAILS]

## Request
Help me create comprehensive documentation for this component in our project wiki. The documentation should cover:
1. Component purpose and features
2. Props and usage examples
3. The Three-Stage Testing approach used
4. Any edge cases or limitations to be aware of
```

**Claude App Response:**
*[Claude creates detailed documentation for the component, including usage examples, props documentation, edge cases, and best practices]*

## Workflow Benefits

This integrated workflow offers several benefits:

### 1. Seamless GitHub Issue Integration
- MCP GitHub tools fetch issue details without permission prompts
- PR is created with proper linking to the issue
- Issue is updated with implementation status

### 2. Structured Implementation Process
- `do-issue` script provides a step-by-step guided approach
- TDD practices are enforced by default
- Three-Stage Verification is built into the workflow

### 3. Reduced Context Switching
- No need to manually copy specifications between tools
- Claude Code has direct access to your codebase
- Issue details are retrieved automatically

### 4. Mandatory Verification Framework
- Structured verification process with clear checkpoints
- Issue-specific verification checklists
- Three distinct verification stages ensure thorough testing

### 5. Documentation Consistency
- Format of technical specifications is consistent
- PR descriptions follow project templates
- Documentation is comprehensive and follows project standards

## Summary of Claude App vs. Claude Code Usage

### Claude App Used For:
- Initial analysis and planning
- Creating technical specifications
- Final documentation for wiki/knowledge base

### Claude Code Used For:
- Direct implementation in your codebase
- Testing and verification
- Git operations and PR creation
- Built-in Three-Stage Verification

This division of responsibilities leverages the strengths of each tool:
- Claude App for high-level thinking and planning
- Claude Code for hands-on implementation and operations
