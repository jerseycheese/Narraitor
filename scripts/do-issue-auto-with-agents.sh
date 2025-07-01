#!/bin/bash

# do-issue-auto-with-agents.sh
# Enhanced do-issue-auto workflow with subagent delegation and comprehensive todo tracking
# Usage: ./scripts/do-issue-auto-with-agents.sh [issue-number]

# AUTO-APPROVE: ALL
# AUTO-ACCEPT-EDITS: ALL

set -e

# Configuration
ISSUE_NUMBER=${1:-""}
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
WORKFLOW_DIR="$CLAUDE_DIR/workflow"
AGENTS_DIR="$SCRIPTS_DIR/agents"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_agent() {
    echo -e "${PURPLE}[AGENT]${NC} $1"
}

# Validate parameters
if [ -z "$ISSUE_NUMBER" ]; then
    log_error "Issue number is required"
    echo "Usage: $0 [issue-number]"
    exit 1
fi

# Create necessary directories
mkdir -p "$WORKFLOW_DIR" "$AGENTS_DIR"

# Initialize workflow state
WORKFLOW_STATE_FILE="$WORKFLOW_DIR/issue-$ISSUE_NUMBER-state.json"
WORKFLOW_LOG_FILE="$WORKFLOW_DIR/issue-$ISSUE_NUMBER-log.txt"

# Function to log workflow events
log_workflow() {
    local event="$1"
    local details="$2"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $event: $details" >> "$WORKFLOW_LOG_FILE"
    log_info "$event: $details"
}

# Function to update workflow state
update_workflow_state() {
    local phase="$1"
    local status="$2"
    local details="$3"
    
    cat > "$WORKFLOW_STATE_FILE" << EOF
{
  "issue_number": "$ISSUE_NUMBER",
  "current_phase": "$phase",
  "status": "$status",
  "details": "$details",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "workflow_log": "$WORKFLOW_LOG_FILE"
}
EOF
    
    log_workflow "STATE_UPDATE" "Phase: $phase, Status: $status"
}

# Function to create comprehensive todo structure for the workflow
create_workflow_todos() {
    log_info "Creating comprehensive todo structure for issue #$ISSUE_NUMBER..."
    
    # This will be implemented as a Claude Code command that creates the todos
    # using the TodoWrite tool with the complete workflow structure
    
    cat > "$WORKFLOW_DIR/create-todos-prompt.md" << 'EOF'
Please create a comprehensive todo structure for implementing GitHub issue using the do-issue-auto workflow with subagent delegation. Use the TodoWrite tool to create todos with this structure:

## Master Workflow Todos:
1. "Branch Creation & Issue Analysis" (high priority)
2. "Define Tests Phase" (high priority) 
3. "Implementation Phase" (high priority)
4. "Build Phase" (high priority)
5. "Test Fixes Phase" (high priority)
6. "Automated Verification Phase" (high priority)
7. "Code Review & Reusability Analysis" (medium priority)
8. "Cleanup & Documentation Phase" (medium priority)
9. "GitHub Issue Management" (medium priority)

Each todo should be created with status "pending" initially, and we'll mark them in_progress and completed as we work through the phases.

Please create these todos now using the TodoWrite tool.
EOF

    log_workflow "TODO_CREATION" "Todo structure template created at $WORKFLOW_DIR/create-todos-prompt.md"
}

# Function to delegate to Issue Analysis subagent
delegate_issue_analysis() {
    log_agent "Delegating to Issue Analysis Specialist..."
    
    local prompt="You are an Issue Analysis Specialist subagent. Your task is to:

1. Fetch GitHub issue #$ISSUE_NUMBER from jerseycheese/narraitor repository using available GitHub tools
2. Analyze the issue description, comments, and acceptance criteria 
3. Create a comprehensive technical specification with:
   - Clear scope boundaries (what's included/excluded)
   - Technical approach and implementation plan
   - Identification of existing utilities to leverage
   - Test strategy focused on acceptance criteria
   - Success criteria checklist
4. Identify which domain this issue belongs to (World, Character, Inventory, Narrative, Journal)
5. Return the analysis in structured markdown format

IMPORTANT: Focus only on what's explicitly requested in the issue. Do not suggest additional features or enhancements outside the defined scope. Follow KISS principles and maintain existing patterns.

Please analyze issue #$ISSUE_NUMBER and return a complete technical specification."

    # Create the subagent task
    echo "$prompt" > "$WORKFLOW_DIR/issue-analysis-task.md"
    
    log_workflow "SUBAGENT_DELEGATED" "Issue Analysis task created for issue #$ISSUE_NUMBER"
    update_workflow_state "issue_analysis" "subagent_delegated" "Issue Analysis subagent task prepared"
    
    return 0
}

# Function to delegate to Test Writing subagent  
delegate_test_writing() {
    log_agent "Delegating to Test Writing Specialist..."
    
    local spec_file="$WORKFLOW_DIR/approved-technical-spec.md"
    
    if [ ! -f "$spec_file" ]; then
        log_error "Technical specification not found. Complete issue analysis first."
        return 1
    fi
    
    local prompt="You are a Test Writing Specialist subagent following strict TDD principles. Your task is to:

1. Based on the technical specification below, write focused tests that verify core functionality
2. Follow these guidelines:
   - Test WHAT not HOW (behavior over implementation)
   - Focus on acceptance criteria from the spec
   - Avoid testing style classes or implementation details
   - Create minimal test files targeting key functionality
   - Ensure tests are MVP-level and align with issue acceptance criteria
   - Skip trivial tests that don't add value to core functionality
3. Create test files that will fail initially (red phase of TDD)
4. Include Storybook story specifications following 'Narraitor/[Category]/[Component]' naming
5. Plan test harness scenarios for /dev/[component-name] testing

Technical Specification:
$(cat "$spec_file")

Please create focused test files and specifications that directly verify the acceptance criteria without testing implementation details."

    echo "$prompt" > "$WORKFLOW_DIR/test-writing-task.md"
    
    log_workflow "SUBAGENT_DELEGATED" "Test Writing task created based on approved specification"
    update_workflow_state "test_writing" "subagent_delegated" "Test Writing subagent task prepared"
    
    return 0
}

# Function to delegate to Implementation subagents
delegate_implementation() {
    log_agent "Delegating to Implementation Specialists..."
    
    local spec_file="$WORKFLOW_DIR/approved-technical-spec.md"
    local tests_file="$WORKFLOW_DIR/approved-tests.md"
    
    if [ ! -f "$spec_file" ] || [ ! -f "$tests_file" ]; then
        log_error "Technical specification and test definitions required. Complete previous phases first."
        return 1
    fi
    
    # Create UI Component subagent task
    local ui_prompt="You are a UI Component Implementation Specialist subagent. Your task is to:

1. Create React components following project patterns from the specification
2. Use existing shadcn/ui components where possible  
3. Maintain <300 lines per component following single responsibility principle
4. Follow established TypeScript patterns and domain boundaries
5. Create Storybook stories for all component variants and states
6. Ensure accessibility is built-in, not added later

Technical Specification:
$(cat "$spec_file")

Test Requirements:
$(cat "$tests_file")

Focus only on UI component implementation to pass the defined tests. Do not add features outside the specification scope."

    echo "$ui_prompt" > "$WORKFLOW_DIR/ui-implementation-task.md"
    
    # Create Business Logic subagent task  
    local logic_prompt="You are a Business Logic Implementation Specialist subagent. Your task is to:

1. Implement core functionality to pass tests using existing patterns
2. Use existing utilities from the codebase where possible
3. Follow established Zustand store patterns for state management
4. Ensure proper error handling with recovery mechanisms
5. Maintain atomic and predictable state updates
6. Integrate with existing domain stores appropriately

Technical Specification:
$(cat "$spec_file")

Test Requirements:
$(cat "$tests_file")

Implement the minimum business logic needed to satisfy the test requirements and acceptance criteria."

    echo "$logic_prompt" > "$WORKFLOW_DIR/logic-implementation-task.md"
    
    # Create Integration subagent task
    local integration_prompt="You are an Integration Specialist subagent. Your task is to:

1. Connect components with stores/services following project patterns
2. Ensure proper data flow between components and state management
3. Handle edge cases within the defined scope
4. Create test harness pages at /dev/[component-name] for interactive testing
5. Ensure integration with existing systems follows domain boundaries

Technical Specification:
$(cat "$spec_file")

Test Requirements:
$(cat "$tests_file")

Focus on integration points and ensure all components work together seamlessly within the existing architecture."

    echo "$integration_prompt" > "$WORKFLOW_DIR/integration-task.md"
    
    log_workflow "SUBAGENT_DELEGATED" "Implementation tasks created for UI, Logic, and Integration specialists"
    update_workflow_state "implementation" "subagent_delegated" "Implementation subagent tasks prepared"
    
    return 0
}

# Function to delegate to Verification subagent
delegate_verification() {
    log_agent "Delegating to Verification Coordinator..."
    
    local prompt="You are a Verification Coordinator subagent responsible for comprehensive testing. Your task is to:

1. Coordinate BrowserMCP automated testing suite for issue #$ISSUE_NUMBER
2. Run Three-Stage Verification process:
   - Stage 1: Storybook Testing (component isolation, visual verification, interactions)
   - Stage 2: Test Harness Verification (integration testing, realistic data, edge cases)  
   - Stage 3: System Integration (full application context, real data, cross-component interactions)
3. Use the existing ./scripts/browsermcp-verify.sh script with appropriate parameters
4. Analyze verification reports for critical issues requiring immediate attention
5. Generate comprehensive findings report with specific recommendations
6. Return verification status and prioritized list of any fixes needed

Run: ./scripts/browsermcp-verify.sh $ISSUE_NUMBER full

After testing completes, analyze the generated report and provide:
- Summary of verification results
- Any critical issues found that block the implementation
- Recommendations for fixes if issues are found
- Confirmation that all Three-Stage Verification requirements are met

Focus on identifying blocking issues that prevent the feature from meeting acceptance criteria."

    echo "$prompt" > "$WORKFLOW_DIR/verification-task.md"
    
    log_workflow "SUBAGENT_DELEGATED" "Verification coordination task created for BrowserMCP testing"
    update_workflow_state "verification" "subagent_delegated" "Verification subagent task prepared"
    
    return 0
}

# Function to delegate to Code Review subagent
delegate_code_review() {
    log_agent "Delegating to Code Review Specialist..."
    
    local prompt="You are a Code Review Specialist subagent focused on pattern analysis and optimization. Your task is to:

1. Analyze implemented code for opportunities to use existing components/utilities
2. Check for type safety improvements and interface reuse opportunities
3. Identify performance optimization opportunities without over-engineering
4. Look for code patterns that could be extracted for reusability
5. Ensure adherence to project patterns and domain boundaries
6. Check file size compliance (<300 lines per component)
7. Verify error handling follows project standards

Review the implementation for issue #$ISSUE_NUMBER and provide:
- Specific opportunities to integrate existing shadcn/ui components
- Type safety improvements and interface reuse suggestions
- Performance optimization recommendations (memoization, lazy loading, etc.)
- Code patterns that could be extracted for future reuse
- Adherence to project standards checklist

Return a prioritized list of improvements that enhance code quality while maintaining the existing scope."

    echo "$prompt" > "$WORKFLOW_DIR/code-review-task.md"
    
    log_workflow "SUBAGENT_DELEGATED" "Code Review analysis task created"
    update_workflow_state "code_review" "subagent_delegated" "Code Review subagent task prepared"
    
    return 0
}

# Function to delegate to Documentation subagent
delegate_documentation() {
    log_agent "Delegating to Documentation Specialist..."
    
    local prompt="You are a Documentation Specialist subagent focused on comprehensive technical documentation. Your task is to:

1. Create API/Props/Parameters documentation for all new components
2. Write usage examples demonstrating key functionality from the implementation
3. Document integration points with existing systems
4. Cover error handling scenarios and edge cases
5. Follow project documentation standards from CLAUDE.md
6. Ensure documentation is concise and AI-readable (150 lines max per doc)

For issue #$ISSUE_NUMBER implementation, create:
- Component API documentation with prop interfaces
- Usage examples showing integration with existing systems
- Error handling documentation for expected scenarios
- Integration guide explaining how the feature connects to existing architecture

Follow the project's documentation tone guidelines:
- Direct and practical
- Focus on implementation guidance
- Use active voice and clear headings
- Eliminate filler words and corporate language

Return documentation files ready for commit that provide comprehensive guidance for using the implemented features."

    echo "$prompt" > "$WORKFLOW_DIR/documentation-task.md"
    
    log_workflow "SUBAGENT_DELEGATED" "Documentation creation task prepared"
    update_workflow_state "documentation" "subagent_delegated" "Documentation subagent task prepared"
    
    return 0
}

# Function to coordinate GitHub issue management
coordinate_github_management() {
    log_agent "Preparing GitHub Issue Management..."
    
    local prompt="Coordinate GitHub issue management for issue #$ISSUE_NUMBER:

1. Add implementation completion comment to the GitHub issue
2. Create feature branch following naming convention: feature/issue-$ISSUE_NUMBER-[brief-description]
3. Prepare PR creation with proper template and targeting develop branch
4. Include comprehensive verification checklist in PR description
5. Link PR to issue with 'Closes #$ISSUE_NUMBER'

Use existing helper scripts:
- ./scripts/claude-github.sh for GitHub API operations
- ./scripts/claude-pr.sh for PR creation
- ./scripts/claude-branch.sh for branch management

Ensure all changes are committed with semantic commit messages and the PR is ready for review."

    echo "$prompt" > "$WORKFLOW_DIR/github-management-task.md"
    
    log_workflow "SUBAGENT_DELEGATED" "GitHub issue management task prepared"
    update_workflow_state "github_management" "subagent_delegated" "GitHub management task prepared"
    
    return 0
}

# Main workflow execution
main() {
    log_info "Starting enhanced do-issue-auto workflow with subagent delegation for issue #$ISSUE_NUMBER"
    
    # Initialize workflow
    update_workflow_state "initialization" "started" "Beginning subagent-driven workflow"
    
    # Create comprehensive todo structure
    create_workflow_todos
    
    # Phase 1: Issue Analysis
    log_info "=== PHASE 1: ISSUE ANALYSIS ==="
    delegate_issue_analysis
    log_info "Issue Analysis subagent ready. Execute the task in Claude Code, then run this script again with next phase."
    
    # Create continuation script for next phases
    cat > "$WORKFLOW_DIR/continue-workflow.sh" << EOF
#!/bin/bash
# Continuation script for remaining workflow phases

echo "=== PHASE 2: TEST WRITING ==="
./scripts/do-issue-auto-with-agents.sh $ISSUE_NUMBER test-writing

echo "=== PHASE 3: IMPLEMENTATION ==="  
./scripts/do-issue-auto-with-agents.sh $ISSUE_NUMBER implementation

echo "=== PHASE 4: VERIFICATION ==="
./scripts/do-issue-auto-with-agents.sh $ISSUE_NUMBER verification

echo "=== PHASE 5: CODE REVIEW ==="
./scripts/do-issue-auto-with-agents.sh $ISSUE_NUMBER code-review

echo "=== PHASE 6: DOCUMENTATION ==="
./scripts/do-issue-auto-with-agents.sh $ISSUE_NUMBER documentation

echo "=== PHASE 7: GITHUB MANAGEMENT ==="
./scripts/do-issue-auto-with-agents.sh $ISSUE_NUMBER github-management
EOF

    chmod +x "$WORKFLOW_DIR/continue-workflow.sh"
    
    log_success "Subagent delegation system initialized for issue #$ISSUE_NUMBER"
    log_info "Workflow state and logs available in: $WORKFLOW_DIR/"
    log_info "Execute subagent tasks in Claude Code, then use: $WORKFLOW_DIR/continue-workflow.sh"
}

# Handle specific phase execution if called with phase parameter
if [ $# -eq 2 ]; then
    PHASE="$2"
    case "$PHASE" in
        "test-writing")
            delegate_test_writing
            ;;
        "implementation")
            delegate_implementation
            ;;
        "verification")
            delegate_verification
            ;;
        "code-review")
            delegate_code_review
            ;;
        "documentation")
            delegate_documentation
            ;;
        "github-management")
            coordinate_github_management
            ;;
        *)
            log_error "Unknown phase: $PHASE"
            exit 1
            ;;
    esac
else
    # Run main workflow initialization
    main
fi

log_workflow "WORKFLOW_STEP" "Script execution completed for phase: ${2:-initialization}"