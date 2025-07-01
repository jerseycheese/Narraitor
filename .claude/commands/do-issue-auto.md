# AUTO-APPROVE: ALL
# AUTO-ACCEPT-EDITS: ALL

# Narraitor Issue Implementation
# Uses project-agnostic framework with Narraitor configuration

# Set Narraitor configuration
export PROJECT_CONFIG="./narraitor-config.json"

# Load and execute project-agnostic implementation framework
cat > /tmp/do-issue-auto-narraitor.md << 'EOF'
# AUTO-APPROVE: ALL
# AUTO-ACCEPT-EDITS: ALL

# Project-Agnostic Issue Implementation Framework
# Configurable automation for implementing GitHub issues across any project

I'll implement issue #$ARGUMENTS entirely automatically, proceeding through all steps without manual stops using enhanced subagent delegation.

## CONFIGURATION LOADING

First, I'll load the project configuration to understand domain structure:

```bash
# Load project-specific configuration
PROJECT_CONFIG="${PROJECT_CONFIG:-./narraitor-config.json}"

if [[ ! -f "$PROJECT_CONFIG" ]]; then
    echo "Error: Project configuration not found at $PROJECT_CONFIG"
    echo "Please create a narraitor-config.json file or set PROJECT_CONFIG environment variable"
    exit 1
fi

# Extract project details
PROJECT_REPO=$(jq -r '.github.repository' "$PROJECT_CONFIG")
PROJECT_NAME=$(echo "$PROJECT_REPO" | cut -d'/' -f2)
DEFAULT_DOMAIN=$(jq -r '.domain.default' "$PROJECT_CONFIG")

echo "Configuration loaded for project: $PROJECT_NAME"
echo "Repository: $PROJECT_REPO"
echo "Default domain: $DEFAULT_DOMAIN"
```

## NARRAITOR-SPECIFIC FEATURES

This implementation uses Narraitor's domain structure:
- **World**: World configuration, templates, attributes
- **Character**: Character creation, sheets, progression  
- **Inventory**: Item management, effects, equipment
- **Narrative**: AI integration, prompt templates, choice system
- **Journal**: Entry tracking, categorization, filtering
- **UI**: User interface components and navigation
- **State Management**: Zustand stores and persistence
- **Utilities**: Shared utilities and helpers

## SUBAGENT DELEGATION STRATEGY

Throughout this workflow, I'll leverage specialized subagents via the Task tool for expert-level work:
- **Analysis Tasks**: Issue Analysis Specialist for GitHub issue research and specification creation
- **Test Writing**: Test Writing Specialist for TDD-focused test creation
- **Implementation**: UI Component, Business Logic, and Integration Specialists (parallel execution)
- **Verification**: Verification Coordinator for testing orchestration
- **Code Review**: Code Review Specialist for pattern analysis and optimization identification
- **Documentation**: Documentation Specialist for API/usage docs creation

Let's start by creating the comprehensive todo structure and beginning with specialized subagent delegation.

Please use the TodoWrite tool to create these workflow todos:

[
  {"id": "branch-creation-analysis-$ARGUMENTS", "content": "Branch Creation & Issue Analysis", "status": "pending", "priority": "high"},
  {"id": "define-tests-$ARGUMENTS", "content": "Define Tests Phase", "status": "pending", "priority": "high"},
  {"id": "implementation-$ARGUMENTS", "content": "Implementation Phase", "status": "pending", "priority": "high"},
  {"id": "build-$ARGUMENTS", "content": "Build Phase", "status": "pending", "priority": "high"},
  {"id": "test-fixes-$ARGUMENTS", "content": "Test Fixes Phase", "status": "pending", "priority": "high"},
  {"id": "automated-verification-$ARGUMENTS", "content": "Automated Verification Phase", "status": "pending", "priority": "high"},
  {"id": "code-review-reusability-$ARGUMENTS", "content": "Code Review & Reusability Analysis", "status": "pending", "priority": "medium"},
  {"id": "cleanup-documentation-$ARGUMENTS", "content": "Cleanup & Documentation Phase", "status": "pending", "priority": "medium"},
  {"id": "github-issue-management-$ARGUMENTS", "content": "GitHub Issue Management", "status": "pending", "priority": "medium"}
]

## STEP 1: BRANCH CREATION & ISSUE ANALYSIS

Now I'll mark the first phase as in_progress and begin the Issue Analysis.

Please update the "Branch Creation & Issue Analysis" todo to in_progress status.

First, I'll generate a descriptive branch name based on the issue title and create the feature branch:

```bash
# Use Narraitor's issue analyzer to get issue details and branch name
./scripts/fetch-github-issue.sh $ARGUMENTS > /tmp/issue_details.json

# Extract branch name from issue title
ISSUE_TITLE=$(jq -r '.title' /tmp/issue_details.json)
BRANCH_NAME="feature/issue-$ARGUMENTS-$(echo "$ISSUE_TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g' | cut -c1-50)"

echo "Creating branch: $BRANCH_NAME"

# Ensure we're on the latest develop branch (Narraitor uses develop)
git checkout develop 2>/dev/null || git checkout main
git pull origin $(git rev-parse --abbrev-ref HEAD)

# Delete branch if it exists (for clean start)
git branch -D "$BRANCH_NAME" 2>/dev/null || true

# Create and checkout new branch
git checkout -b "$BRANCH_NAME"
echo "✅ Created branch: $BRANCH_NAME"
```

All changes will be made on this feature branch, allowing easy rollback if needed.

### SUBAGENT: Issue Analysis Specialist

I'll now delegate the issue analysis to a specialized subagent using the Task tool:

Please use the Task tool to delegate this work to a specialized subagent:

Description: Analyze GitHub issue and create technical specification
Prompt: You are an Issue Analysis Specialist subagent for the Narraitor project. Your task is to:

1. Fetch GitHub issue #$ARGUMENTS from jerseycheese/Narraitor repository using available GitHub tools
2. Analyze the issue description, comments, and acceptance criteria 
3. Create a comprehensive technical specification with:
   - Clear scope boundaries (what's included/excluded)
   - Technical approach and implementation plan
   - Identification of existing utilities to leverage from Narraitor codebase
   - Test strategy focused on acceptance criteria
   - Success criteria checklist
4. Identify which Narraitor domain this issue belongs to (World, Character, Inventory, Narrative, Journal, UI, State Management, Utilities)
5. Return the analysis in structured markdown format

IMPORTANT: Focus only on what's explicitly requested in the issue. Do not suggest additional features or enhancements outside the defined scope. Follow KISS principles and maintain existing Narraitor patterns.

Please analyze issue #$ARGUMENTS and return a complete technical specification.

First, let me fetch the issue details using Narraitor's GitHub tools:

```javascript
// Fetch GitHub issue using MCP GitHub tool
try {
  const issue = await mcp__modelcontextprotocol_server_github__server_github.getIssue({
    owner: "jerseycheese",
    repo: "Narraitor",
    issueNumber: parseInt($ARGUMENTS)
  });
  
  console.log(`Successfully fetched issue #${issue.number}: ${issue.title}`);
  
  // Continue with issue analysis using the fetched data
} catch (error) {
  // Fall back to helper script if MCP tool fails
  console.log("Falling back to helper script:");
  console.log("./scripts/fetch-github-issue.sh $ARGUMENTS");
}
```

Based on the issue details, I'll create a technical specification with explicit scope boundaries:

# Technical Specification for Issue #$ARGUMENTS

## Issue Summary
- Title: [Issue title]
- Description: [Brief description]
- Labels: [Labels]
- Priority: [High/Medium/Low]
- **Narraitor Domain**: [Domain classification]

## Scope Boundaries
What IS included:
- [Specific functionality 1]
- [Specific functionality 2]
- [Specific functionality 3]

What is NOT included:
- [Out of scope functionality 1]
- [Out of scope functionality 2]
- [Out of scope functionality 3]

## Problem Statement
[1-2 paragraphs explaining the problem]

## Technical Approach
[Detailed technical approach using Narraitor patterns]

## Implementation Plan
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Test Plan
Focus on key acceptance criteria with targeted tests following Narraitor testing guidelines:
1. Unit Tests:
   - Core functionality test: [key scenario]
   - Edge case: [important edge case directly related to acceptance criteria]
2. Component Tests (if applicable):
   - Render test: [key component rendering scenario]
   - User interaction test: [critical user interaction]
3. Storybook Stories (if UI components):
   - Default state story
   - Interactive states story

## Files to Modify
- [file path]: [changes]

## Files to Create
- [file path]: [purpose]

## Existing Narraitor Utilities to Leverage
- [utility name/path]: [purpose]

## Success Criteria
- [ ] [criterion 1]
- [ ] [criterion 2]

## Out of Scope
- [item 1]
- [item 2]

The rest of the workflow continues following the Narraitor Three-Stage Verification framework and development patterns...

[Continue with all other steps from the project-agnostic template, adapted for Narraitor-specific patterns]
EOF

# Execute the customized template
cat /tmp/do-issue-auto-narraitor.md | sed "s/\$ARGUMENTS/$ARGUMENTS/g"