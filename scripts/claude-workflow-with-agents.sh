#!/bin/bash

# claude-workflow-with-agents.sh
# Enhanced Claude Code integration for subagent delegation workflow
# This script bridges the gap between the enhanced workflow system and Claude Code execution

# AUTO-APPROVE: ALL  
# AUTO-ACCEPT-EDITS: ALL

set -e

# Configuration
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
AGENTS_DIR="$SCRIPTS_DIR/agents"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
WORKFLOW_DIR="$CLAUDE_DIR/workflow"

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

# Function to show help
show_help() {
    echo "Claude Code Workflow with Subagent Delegation"
    echo ""
    echo "Usage: claude-workflow-with-agents.sh [command] [issue_number] [phase]"
    echo ""
    echo "Commands:"
    echo "  init [issue_number]              Initialize workflow and create todos"
    echo "  delegate [issue_number] [phase]  Generate subagent delegation commands"
    echo "  status [issue_number]            Show current workflow status"
    echo "  continue [issue_number]          Continue from current phase"
    echo "  example [issue_number]           Show example commands for the issue"
    echo ""
    echo "Phases:"
    echo "  analysis          - Issue Analysis Specialist"
    echo "  test-writing      - Test Writing Specialist"
    echo "  implementation    - UI, Logic, Integration Specialists (parallel)"
    echo "  verification      - Verification Coordinator"
    echo "  code-review       - Code Review Specialist"
    echo "  documentation     - Documentation Specialist"
    echo "  github-management - Final PR creation and issue management"
    echo ""
    echo "Examples:"
    echo "  claude-workflow-with-agents.sh init 591                    # Initialize workflow for issue 591"
    echo "  claude-workflow-with-agents.sh delegate 591 analysis       # Generate analysis delegation command"
    echo "  claude-workflow-with-agents.sh continue 591                # Continue from current phase"
    echo "  claude-workflow-with-agents.sh example 591                 # Show complete example workflow"
}

# Function to initialize workflow
init_workflow() {
    local issue_number="$1"
    
    if [ -z "$issue_number" ]; then
        log_error "Issue number required for initialization"
        show_help
        exit 1
    fi
    
    log_info "Initializing subagent delegation workflow for issue #$issue_number"
    
    # Create directories
    mkdir -p "$WORKFLOW_DIR" "$AGENTS_DIR"
    
    # Generate todo creation command
    node "$AGENTS_DIR/workflow-coordinator.js" create-todos "$issue_number"
    
    # Create initial workflow state
    cat > "$WORKFLOW_DIR/issue-$issue_number-state.json" << EOF
{
  "issue_number": "$issue_number",
  "current_phase": "initialization",
  "status": "ready",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "phases_completed": [],
  "phases_pending": [
    "branch-creation-analysis",
    "define-tests", 
    "implementation",
    "build",
    "test-fixes",
    "automated-verification",
    "code-review-reusability",
    "cleanup-documentation",
    "github-issue-management"
  ]
}
EOF
    
    log_success "Workflow initialized for issue #$issue_number"
    log_info "Next step: Run the todo creation command in Claude Code"
    log_info "File: $WORKFLOW_DIR/create-todos-$issue_number.md"
    
    # Show the command to run in Claude Code
    echo ""
    echo "=== RUN THIS IN CLAUDE CODE ==="
    cat "$WORKFLOW_DIR/create-todos-$issue_number.md"
    echo "================================"
}

# Function to generate delegation commands
delegate_to_subagent() {
    local issue_number="$1"
    local phase="$2"
    
    if [ -z "$issue_number" ] || [ -z "$phase" ]; then
        log_error "Issue number and phase required for delegation"
        show_help
        exit 1
    fi
    
    log_agent "Generating delegation commands for phase: $phase"
    
    # Generate subagent commands using the workflow coordinator
    node "$AGENTS_DIR/workflow-coordinator.js" delegate "$issue_number" "$phase"
    
    log_success "Delegation commands generated for issue #$issue_number, phase: $phase"
}

# Function to show current status
show_status() {
    local issue_number="$1"
    
    if [ -z "$issue_number" ]; then
        log_error "Issue number required for status check"
        show_help
        exit 1
    fi
    
    log_info "Checking workflow status for issue #$issue_number"
    
    # Show status using workflow coordinator
    node "$AGENTS_DIR/workflow-coordinator.js" status "$issue_number"
    
    # Show available workflow files
    if [ -d "$WORKFLOW_DIR" ]; then
        echo ""
        echo "Available workflow files:"
        find "$WORKFLOW_DIR" -name "*$issue_number*" -type f | head -10
    fi
}

# Function to continue workflow from current phase
continue_workflow() {
    local issue_number="$1"
    
    if [ -z "$issue_number" ]; then
        log_error "Issue number required to continue workflow"
        show_help
        exit 1
    fi
    
    local state_file="$WORKFLOW_DIR/issue-$issue_number-state.json"
    
    if [ ! -f "$state_file" ]; then
        log_error "No workflow state found for issue #$issue_number. Run 'init' first."
        exit 1
    fi
    
    # Read current state and suggest next phase
    local current_phase=$(cat "$state_file" | grep -o '"current_phase": "[^"]*"' | cut -d '"' -f 4)
    
    log_info "Current phase: $current_phase"
    
    # Suggest next phase based on current state
    case "$current_phase" in
        "initialization")
            log_info "Next: Start with analysis phase"
            echo "Run: claude-workflow-with-agents.sh delegate $issue_number analysis"
            ;;
        "branch-creation-analysis")
            log_info "Next: Define tests phase"
            echo "Run: claude-workflow-with-agents.sh delegate $issue_number test-writing"
            ;;
        "define-tests")
            log_info "Next: Implementation phase"
            echo "Run: claude-workflow-with-agents.sh delegate $issue_number implementation"
            ;;
        "implementation")
            log_info "Next: Build and test fixes"
            echo "Run build and test commands, then:"
            echo "claude-workflow-with-agents.sh delegate $issue_number verification"
            ;;
        "automated-verification")
            log_info "Next: Parallel code review and documentation"
            echo "Run: claude-workflow-with-agents.sh delegate $issue_number code-review"
            echo "Run: claude-workflow-with-agents.sh delegate $issue_number documentation"
            ;;
        *)
            log_info "Workflow status unclear. Check current state:"
            show_status "$issue_number"
            ;;
    esac
}

# Function to show example workflow
show_example() {
    local issue_number="$1"
    
    if [ -z "$issue_number" ]; then
        log_error "Issue number required for example"
        show_help
        exit 1
    fi
    
    log_info "Showing example workflow execution for issue #$issue_number"
    
    if [ -f "$AGENTS_DIR/example-workflow-591.md" ]; then
        # Show the example with issue number substitution
        sed "s/591/$issue_number/g" "$AGENTS_DIR/example-workflow-591.md"
    else
        log_warning "Example workflow file not found at: $AGENTS_DIR/example-workflow-591.md"
    fi
}

# Function to run pre-flight checks
run_preflight_checks() {
    log_info "Running pre-flight checks..."
    
    # Check if workflow coordinator exists
    if [ ! -f "$AGENTS_DIR/workflow-coordinator.js" ]; then
        log_error "Workflow coordinator not found at: $AGENTS_DIR/workflow-coordinator.js"
        exit 1
    fi
    
    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed"
        exit 1
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Must be run from within a git repository"
        exit 1
    fi
    
    log_success "Pre-flight checks passed"
}

# Main execution
main() {
    local command="$1"
    local issue_number="$2"
    local phase="$3"
    
    # Run pre-flight checks
    run_preflight_checks
    
    # Handle commands
    case "$command" in
        "init")
            init_workflow "$issue_number"
            ;;
        "delegate")
            delegate_to_subagent "$issue_number" "$phase"
            ;;
        "status")
            show_status "$issue_number"
            ;;
        "continue")
            continue_workflow "$issue_number"
            ;;
        "example")
            show_example "$issue_number"
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"