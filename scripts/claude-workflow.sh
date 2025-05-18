#!/bin/bash
# claude-workflow.sh - Automate Claude App and Claude Code interactions

# Configuration
PROJECT_ROOT="/Users/jackhaas/Projects/narraitor"
TEMP_DIR="$PROJECT_ROOT/.claude-workflow"
NOTIFICATION_SOUND="/System/Library/Sounds/Ping.aiff"

# Create temp directory if it doesn't exist
mkdir -p "$TEMP_DIR"

# Function to show help
show_help() {
    echo "Claude Workflow Automation"
    echo ""
    echo "Usage: claude-workflow.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  analyze [issue_number]       Start project analysis (optional issue number)"
    echo "  define-tests                 Define tests based on approved spec"
    echo "  implement                    Start implementation in Claude Code"
    echo "  manual-test                  Create manual testing plan"
    echo "  finalize                     Clean up code and create PR"
    echo "  status                       Show current workflow status"
    echo "  approve [phase]              Approve current phase results"
    echo "  reject [phase] [reason]      Reject current phase results"
    echo "  test-notify                  Test notification sound"
    echo ""
    echo "Examples:"
    echo "  claude-workflow.sh analyze 123       # Analyze GitHub issue #123"
    echo "  claude-workflow.sh analyze           # Analyze project for priority task"
    echo "  claude-workflow.sh approve analysis  # Approve analysis results"
    echo "  claude-workflow.sh implement         # Start implementation in Claude Code"
}

# Function to play notification sound
notify() {
    echo "🔔 $1"
    
    # Play sound for macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        afplay "$NOTIFICATION_SOUND"
    else
        # For Linux/Unix, use beep if available
        which beep > /dev/null && beep
    fi
}

# Function to test notification
test_notify() {
    notify "This is a test notification"
    echo "If you heard a sound, notifications are working correctly."
}

# Function to get current workflow state
get_workflow_state() {
    if [ -f "$TEMP_DIR/workflow-state.txt" ]; then
        source "$TEMP_DIR/workflow-state.txt"
        echo "Current workflow state:"
        echo "Phase: $phase"
        echo "Issue: $issue"
        echo "Status: $status"
        
        # Show phase-specific information
        case "$phase" in
            "analysis")
                if [ -f "$TEMP_DIR/approved-spec.md" ]; then
                    echo "Technical spec is approved."
                else
                    echo "Technical spec is pending approval."
                fi
                ;;
            "test-definition")
                if [ -f "$TEMP_DIR/approved-tests.md" ]; then
                    echo "Test definitions are approved."
                else
                    echo "Test definitions are pending approval."
                fi
                ;;
            "implementation")
                if [ "$status" = "complete" ]; then
                    echo "Implementation is complete."
                else
                    echo "Implementation is in progress."
                fi
                ;;
            "manual-testing")
                if [ "$status" = "complete" ]; then
                    echo "Manual testing is complete."
                else
                    echo "Manual testing is in progress."
                fi
                ;;
            "finalization")
                if [ "$status" = "complete" ]; then
                    echo "PR is created and ready for review."
                else
                    echo "Finalization is in progress."
                fi
                ;;
        esac
    else
        echo "No active workflow found."
    fi
}

# Function to approve current phase
approve_phase() {
    PHASE="$1"
    
    if [ -z "$PHASE" ]; then
        # If no phase is specified, try to get current phase
        if [ -f "$TEMP_DIR/workflow-state.txt" ]; then
            source "$TEMP_DIR/workflow-state.txt"
            PHASE="$phase"
        else
            echo "Error: No phase specified and no current phase found."
            exit 1
        fi
    fi
    
    case "$PHASE" in
        "analysis")
            # Check if technical spec exists
            if [ ! -f "$TEMP_DIR/technical-spec.md" ]; then
                echo "Error: No technical specification found to approve."
                exit 1
            fi
            
            # Copy to approved spec
            cp "$TEMP_DIR/technical-spec.md" "$TEMP_DIR/approved-spec.md"
            echo "Technical specification approved. You can now run 'claude-workflow.sh define-tests'"
            ;;
            
        "test-definition")
            # Check if test definition exists
            if [ ! -f "$TEMP_DIR/test-definition.md" ]; then
                echo "Error: No test definition found to approve."
                exit 1
            fi
            
            # Copy to approved tests
            cp "$TEMP_DIR/test-definition.md" "$TEMP_DIR/approved-tests.md"
            echo "Test definitions approved. You can now run 'claude-workflow.sh implement'"
            ;;
            
        "implementation")
            # Mark implementation as approved
            source "$TEMP_DIR/workflow-state.txt"
            echo "phase=implementation" > "$TEMP_DIR/workflow-state.txt"
            echo "issue=$issue" >> "$TEMP_DIR/workflow-state.txt"
            echo "status=complete" >> "$TEMP_DIR/workflow-state.txt"
            
            echo "Implementation approved. You can now run 'claude-workflow.sh manual-test'"
            ;;
            
        "manual-testing")
            # Mark manual testing as complete
            source "$TEMP_DIR/workflow-state.txt"
            echo "phase=manual-testing" > "$TEMP_DIR/workflow-state.txt"
            echo "issue=$issue" >> "$TEMP_DIR/workflow-state.txt"
            echo "status=complete" >> "$TEMP_DIR/workflow-state.txt"
            
            echo "Manual testing approved. You can now run 'claude-workflow.sh finalize'"
            ;;
            
        *)
            echo "Unknown phase: $PHASE"
            echo "Valid phases: analysis, test-definition, implementation, manual-testing"
            exit 1
            ;;
    esac
}

# Function to reject current phase
reject_phase() {
    PHASE="$1"
    REASON="$2"
    
    if [ -z "$PHASE" ]; then
        # If no phase is specified, try to get current phase
        if [ -f "$TEMP_DIR/workflow-state.txt" ]; then
            source "$TEMP_DIR/workflow-state.txt"
            PHASE="$phase"
        else
            echo "Error: No phase specified and no current phase found."
            exit 1
        fi
    fi
    
    if [ -z "$REASON" ]; then
        read -p "Enter reason for rejection: " REASON
    fi
    
    case "$PHASE" in
        "analysis")
            # Mark analysis for revision
            source "$TEMP_DIR/workflow-state.txt"
            echo "phase=analysis" > "$TEMP_DIR/workflow-state.txt"
            echo "issue=$issue" >> "$TEMP_DIR/workflow-state.txt"
            echo "status=rejected" >> "$TEMP_DIR/workflow-state.txt"
            echo "reject_reason=\"$REASON\"" >> "$TEMP_DIR/workflow-state.txt"
            
            echo "Technical specification rejected. You can run 'claude-workflow.sh analyze' again."
            ;;
            
        "test-definition")
            # Mark test definition for revision
            source "$TEMP_DIR/workflow-state.txt"
            echo "phase=test-definition" > "$TEMP_DIR/workflow-state.txt"
            echo "issue=$issue" >> "$TEMP_DIR/workflow-state.txt"
            echo "status=rejected" >> "$TEMP_DIR/workflow-state.txt"
            echo "reject_reason=\"$REASON\"" >> "$TEMP_DIR/workflow-state.txt"
            
            echo "Test definitions rejected. You can run 'claude-workflow.sh define-tests' again."
            ;;
            
        "implementation")
            # Mark implementation for revision
            source "$TEMP_DIR/workflow-state.txt"
            echo "phase=implementation" > "$TEMP_DIR/workflow-state.txt"
            echo "issue=$issue" >> "$TEMP_DIR/workflow-state.txt"
            echo "status=rejected" >> "$TEMP_DIR/workflow-state.txt"
            echo "reject_reason=\"$REASON\"" >> "$TEMP_DIR/workflow-state.txt"
            
            echo "Implementation rejected. You can run 'claude-workflow.sh implement' again."
            ;;
            
        "manual-testing")
            # Mark manual testing for revision
            source "$TEMP_DIR/workflow-state.txt"
            echo "phase=manual-testing" > "$TEMP_DIR/workflow-state.txt"
            echo "issue=$issue" >> "$TEMP_DIR/workflow-state.txt"
            echo "status=rejected" >> "$TEMP_DIR/workflow-state.txt"
            echo "reject_reason=\"$REASON\"" >> "$TEMP_DIR/workflow-state.txt"
            
            echo "Manual testing results rejected. You can run 'claude-workflow.sh implement' again to fix issues."
            ;;
            
        *)
            echo "Unknown phase: $PHASE"
            echo "Valid phases: analysis, test-definition, implementation, manual-testing"
            exit 1
            ;;
    esac
}

# Function to start analysis
start_analysis() {
    ISSUE_NUM="$1"
    
    echo "Starting project analysis..."
    
    # Reset or initialize workflow state
    echo "phase=analysis" > "$TEMP_DIR/workflow-state.txt"
    echo "issue=$ISSUE_NUM" >> "$TEMP_DIR/workflow-state.txt"
    echo "status=in_progress" >> "$TEMP_DIR/workflow-state.txt"
    
    if [ -n "$ISSUE_NUM" ]; then
        echo "Analyzing GitHub issue #$ISSUE_NUM"
        
        # Fetch issue details using GitHub CLI
        if command -v gh &>/dev/null; then
            gh issue view "$ISSUE_NUM" --json title,body,labels > "$TEMP_DIR/issue-$ISSUE_NUM.json"
            
            # Check if the issue exists
            if [ ! -s "$TEMP_DIR/issue-$ISSUE_NUM.json" ]; then
                echo "Error: Issue #$ISSUE_NUM not found."
                exit 1
            fi
            
            # Extract issue title and body for Claude
            ISSUE_TITLE=$(cat "$TEMP_DIR/issue-$ISSUE_NUM.json" | jq -r '.title')
            ISSUE_BODY=$(cat "$TEMP_DIR/issue-$ISSUE_NUM.json" | jq -r '.body')
            
            # Create a prompt for Claude App
            cat > "$TEMP_DIR/analysis-prompt.md" << EOL
# Project Analysis Request

## Context
I'm working on the Narraitor project, a Next.js/React application for a narrative-driven RPG framework using AI.

## Request
Help me analyze GitHub issue #$ISSUE_NUM: "$ISSUE_TITLE" and create a technical specification.

## Issue Details
$ISSUE_BODY

## Preferred MCP Tools
When using these prompt templates, the AI is encouraged to leverage the following MCP tools:
- **sequentialthinking**: For planning and structuring responses.
- **mcp-obsidian**: For referencing project documentation and notes.
- **memory**: For building and querying context.
- **@modelcontextprotocol-server-github**: For GitHub interaction.
- **brave-search**: For research and finding best practices.

## Information Access
Please use MCP tools to:
1. Use @modelcontextprotocol/server-github and review the Github issue details
2. Review the roadmap at \`/Users/jackhaas/Projects/narraitor/docs/development-roadmap.md\`
3. Check project documentation in \`/Users/jackhaas/Projects/narraitor/docs\`
4. Check project structure at \`/Users/jackhaas/Projects/narraitor/src\`
5. Review existing utilities and helpers in \`/Users/jackhaas/Projects/narraitor/src/lib\`
6. Review our Storybook workflow for component development

## Scope Constraints
- Focus only on this issue without adding enhancements
- Do not propose architectural changes unless explicitly requested
- Maintain existing patterns and approaches
- Don't suggest additional libraries or dependencies
- Follow KISS principles (max 300 lines per file, single responsibility, etc.)

## Output Format
Please present your analysis as a markdown document with this structure:

TASK ANALYSIS
GitHub Issue: #$ISSUE_NUM $ISSUE_TITLE
Labels: [labels]
Description: [1-2 sentences]
Priority: [High/Medium/Low] ([reasoning])
Current State: [1-2 sentences]

TECHNICAL DESIGN
Data Flow:
- [flow point 1]
- [flow point 2]

Core Changes:
1. [Change Area 1]
   - Location: [file]
   - Details: [specifics]
   
2. [Change Area 2]
   - Location: [file]
   - Details: [specifics]

INTERFACES
[Interface definitions]

IMPLEMENTATION STEPS
1. [ ] Define test cases (TDD approach)
2. [ ] Create Storybook stories (following our workflow guide)
3. [ ] Implement minimum code to pass tests
4. [ ] Create test harness pages (/dev/[component-name])
5. [ ] Integration testing
6. [ ] [Additional steps]

Existing Utilities to Leverage:
- [utility/helper path]: [purpose and usage]

Files to Modify:
- [path]: [changes]
Files to Create:
- [path]: [purpose]

TEST PLAN
1. Unit Tests:
   - [test scenario]
2. Storybook Stories:
   - [story variants]
3. Test Harness:
   - [interactive testing scenarios]
4. Integration Tests:
   - [test scenario]

SUCCESS CRITERIA
- [ ] [criterion]
- [ ] [criterion]
- [ ] Stories follow 'Narraitor/[Category]/[Component]' naming

TECHNICAL NOTES
- [technical detail]
- [technical detail]

OUT OF SCOPE
- [feature/enhancement to exclude]
- [pattern/approach to avoid]

FUTURE TASKS
- [ ] [future task]
- [ ] [future task]
EOL

            echo "Created analysis prompt for issue #$ISSUE_NUM. Open Claude App and paste the contents of $TEMP_DIR/analysis-prompt.md."
            
            # Offer to open the prompt in a text editor
            read -p "Would you like to open the analysis prompt now? (y/n): " open_prompt
            if [ "$open_prompt" = "y" ]; then
                if command -v open &>/dev/null; then
                    # macOS
                    open -t "$TEMP_DIR/analysis-prompt.md"
                elif command -v xdg-open &>/dev/null; then
                    # Linux
                    xdg-open "$TEMP_DIR/analysis-prompt.md"
                else
                    echo "Could not open the file automatically. Please open it manually at: $TEMP_DIR/analysis-prompt.md"
                fi
            fi
            
            # Automatically copy to clipboard
            if command -v pbcopy &>/dev/null; then
                # macOS
                cat "$TEMP_DIR/analysis-prompt.md" | pbcopy
                echo "Analysis prompt copied to clipboard."
            elif command -v xclip &>/dev/null; then
                # Linux with xclip
                cat "$TEMP_DIR/analysis-prompt.md" | xclip -selection clipboard
                echo "Analysis prompt copied to clipboard."
            elif command -v clip &>/dev/null; then
                # Windows
                cat "$TEMP_DIR/analysis-prompt.md" | clip
                echo "Analysis prompt copied to clipboard."
            else
                echo "Could not copy to clipboard automatically. Please copy from the file."
            fi
            
            notify "Analysis prompt ready for Claude App!"
            
            echo "After Claude App generates the technical specification, save it to a file and run:"
            echo "cp [your-file] $TEMP_DIR/technical-spec.md"
            echo "Then run: claude-workflow.sh approve analysis"
        else
            echo "Error: GitHub CLI (gh) not found. Please install it to fetch issue details."
            exit 1
        fi
    else
        echo "Analyzing project for next priority task..."
        
        # Create a prompt for Claude App to analyze the project
        cat > "$TEMP_DIR/analysis-prompt.md" << EOL
# Project Analysis Request

## Context
I'm working on the Narraitor project, a Next.js/React application for a narrative-driven RPG framework using AI.

## Request
Help me select and analyze the next task to implement, following KISS principles.

## Preferred MCP Tools
When using these prompt templates, the AI is encouraged to leverage the following MCP tools:
- **sequentialthinking**: For planning and structuring responses.
- **mcp-obsidian**: For referencing project documentation and notes.
- **memory**: For building and querying context.
- **@modelcontextprotocol-server-github**: For GitHub interaction.
- **brave-search**: For research and finding best practices.

## Information Access
Please use MCP tools to:
1. Use @modelcontextprotocol/server-github and 
	1. review the Github project at https://github.com/users/jerseycheese/projects/3
	2. review open issues at https://github.com/jerseycheese/narraitor/issues
2. Review the roadmap at \`/Users/jackhaas/Projects/narraitor/docs/development-roadmap.md\`
3. Check project documentation in \`/Users/jackhaas/Projects/narraitor/docs\`
4. Check project structure at \`/Users/jackhaas/Projects/narraitor/src\`
5. Review existing utilities and helpers in \`/Users/jackhaas/Projects/narraitor/src/lib\`
6. Review our Storybook workflow for component development at \`/Users/jackhaas/Projects/narraitor/docs/development/workflows/storybook-workflow.md\`

## Scope Constraints
- Focus only on the current issue without adding enhancements
- Do not propose architectural changes unless explicitly requested
- Maintain existing patterns and approaches
- Don't suggest additional libraries or dependencies
- Follow KISS principles (max 300 lines per file, single responsibility, etc.)

## Analysis Goals
Based on this information, please:
1. Identify the highest priority tasks
	1. Don't limit yourself to looking at the first page of open issues in my issue queue.
	2. Review the Github project's Backlog and any epic issues in progress
2. Assess implementation complexity and dependencies
3. Evaluate value to effort ratios
4. Check alignment with roadmap goals
5. Create a technical specification for implementation
6. Provide a clear, step-by-step plan following TDD principles
7. Identify existing utilities/helpers that can be leveraged
8. Plan the Three-Stage Component Testing approach (Storybook → Test Harness → Integration)

## Output Format
Please present your analysis as a markdown document with this structure:

TASK ANALYSIS
GitHub Issue: #[number] [title]
Labels: [labels]
Description: [1-2 sentences]
Priority: [High/Medium/Low] ([reasoning])
Current State: [1-2 sentences]

TECHNICAL DESIGN
Data Flow:
- [flow point 1]
- [flow point 2]

Core Changes:
1. [Change Area 1]
   - Location: [file]
   - Details: [specifics]
   
2. [Change Area 2]
   - Location: [file]
   - Details: [specifics]

INTERFACES
[Interface definitions]

IMPLEMENTATION STEPS
1. [ ] Define test cases (TDD approach)
2. [ ] Create Storybook stories (following our workflow guide)
3. [ ] Implement minimum code to pass tests
4. [ ] Create test harness pages (/dev/[component-name])
5. [ ] Integration testing
6. [ ] [Additional steps]

Existing Utilities to Leverage:
- [utility/helper path]: [purpose and usage]

Files to Modify:
- [path]: [changes]
Files to Create:
- [path]: [purpose]

TEST PLAN
1. Unit Tests:
   - [test scenario]
2. Storybook Stories:
   - [story variants]
3. Test Harness:
   - [interactive testing scenarios]
4. Integration Tests:
   - [test scenario]

SUCCESS CRITERIA
- [ ] [criterion]
- [ ] [criterion]
- [ ] Stories follow 'Narraitor/[Category]/[Component]' naming

TECHNICAL NOTES
- [technical detail]
- [technical detail]

OUT OF SCOPE
- [feature/enhancement to exclude]
- [pattern/approach to avoid]

FUTURE TASKS
- [ ] [future task]
- [ ] [future task]
EOL

        echo "Created analysis prompt for project priority analysis. Open Claude App and paste the contents of $TEMP_DIR/analysis-prompt.md."
        
        # Offer to open the prompt in a text editor
        read -p "Would you like to open the analysis prompt now? (y/n): " open_prompt
        if [ "$open_prompt" = "y" ]; then
            if command -v open &>/dev/null; then
                # macOS
                open -t "$TEMP_DIR/analysis-prompt.md"
            elif command -v xdg-open &>/dev/null; then
                # Linux
                xdg-open "$TEMP_DIR/analysis-prompt.md"
            else
                echo "Could not open the file automatically. Please open it manually at: $TEMP_DIR/analysis-prompt.md"
            fi
        fi
        
        # Automatically copy to clipboard
        if command -v pbcopy &>/dev/null; then
            # macOS
            cat "$TEMP_DIR/analysis-prompt.md" | pbcopy
            echo "Analysis prompt copied to clipboard."
        elif command -v xclip &>/dev/null; then
            # Linux with xclip
            cat "$TEMP_DIR/analysis-prompt.md" | xclip -selection clipboard
            echo "Analysis prompt copied to clipboard."
        elif command -v clip &>/dev/null; then
            # Windows
            cat "$TEMP_DIR/analysis-prompt.md" | clip
            echo "Analysis prompt copied to clipboard."
        else
            echo "Could not copy to clipboard automatically. Please copy from the file."
        fi
        
        notify "Analysis prompt ready for Claude App!"
        
        echo "After Claude App generates the technical specification, save it to a file and run:"
        echo "cp [your-file] $TEMP_DIR/technical-spec.md"
        echo "Then run: claude-workflow.sh approve analysis"
    fi
}

# Function to define tests
define_tests() {
    echo "Starting test definition phase..."
    
    # Load current state
    if [ ! -f "$TEMP_DIR/workflow-state.txt" ]; then
        echo "Error: No active workflow found. Please start with 'claude-workflow.sh analyze'."
        exit 1
    fi
    
    source "$TEMP_DIR/workflow-state.txt"
    
    # Check if we're in the right phase
    if [ "$phase" != "analysis" ] || [ "$status" != "complete" ]; then
        echo "Error: Analysis phase must be completed and approved first."
        echo "Current phase: $phase, Status: $status"
        echo "Please complete the analysis phase before defining tests."
        exit 1
    fi
    
    # Get the approved technical spec
    SPEC_FILE="$TEMP_DIR/approved-spec.md"
    
    if [ ! -f "$SPEC_FILE" ]; then
        echo "Error: No approved technical specification found."
        echo "Please run 'claude-workflow.sh approve analysis' after saving the technical spec."
        exit 1
    fi
    
    # Update workflow state
    echo "phase=test-definition" > "$TEMP_DIR/workflow-state.txt"
    echo "issue=$issue" >> "$TEMP_DIR/workflow-state.txt"
    echo "status=in_progress" >> "$TEMP_DIR/workflow-state.txt"
    
    # Create a prompt for Claude App
    cat > "$TEMP_DIR/test-definition-prompt.md" << EOL
# Test Definition Request

## Context
I'm implementing this technical spec:

$(cat "$SPEC_FILE")

## Request
Help me define the MVP tests for this feature before implementation, following strict TDD principles and the Three-Stage Component Testing approach.

## Preferred MCP Tools
When using these prompt templates, the AI is encouraged to leverage the following MCP tools:
- **sequentialthinking**: For planning and structuring responses.
- **mcp-obsidian**: For referencing project documentation and notes.
- **memory**: For building and querying context.
- **@modelcontextprotocol-server-github**: For GitHub interaction.
- **brave-search**: For research and finding best practices.

## Information Access
Please use MCP tools to:
1. Review existing test patterns at \`/Users/jackhaas/Projects/narraitor/tests\`
2. Check component test examples at \`/Users/jackhaas/Projects/narraitor/docs/technical-guides/component-testing.md\`
3. Review existing utilities and helpers in \`/Users/jackhaas/Projects/narraitor/src/lib\` and test utilities
4. Follow the Storybook workflow at \`/Users/jackhaas/Projects/narraitor/docs/development/workflows/storybook-workflow.md\`

## Test Requirements
1. Write tests before implementation (TDD approach)
2. Only test what's in scope (as defined in the spec)
3. Follow our naming conventions in \`/Users/jackhaas/Projects/narraitor/docs/technical-guides/coding-naming-conventions.md\`
4. Use data-testid attributes for element selection
5. Keep tests focused and minimal (KISS approach)
6. Plan for Three-Stage Component Testing:
   - Stage 1: Storybook isolation
   - Stage 2: Test harness integration
   - Stage 3: System integration

## Output Format
Please provide:
1. A test specification with:
   - Test file structure
   - Test cases covering functionality
   - Clear data-testid names following our convention
   - Storybook story definitions (following 'Narraitor/[Category]/[Component]' naming)
   - Test harness plan (/dev/[component-name])
2. An explanation of your testing approach
3. A verification list of what is covered and what is not

Please only test what's explicitly in the spec - don't test edge cases or features outside the defined scope.
EOL

    echo "Created test definition prompt. Open Claude App and paste the contents of $TEMP_DIR/test-definition-prompt.md."
    
    # Offer to open the prompt in a text editor
    read -p "Would you like to open the test definition prompt now? (y/n): " open_prompt
    if [ "$open_prompt" = "y" ]; then
        if command -v open &>/dev/null; then
            # macOS
            open -t "$TEMP_DIR/test-definition-prompt.md"
        elif command -v xdg-open &>/dev/null; then
            # Linux
            xdg-open "$TEMP_DIR/test-definition-prompt.md"
        else
            echo "Could not open the file automatically. Please open it manually at: $TEMP_DIR/test-definition-prompt.md"
        fi
    fi
    
    # Automatically copy to clipboard
    if command -v pbcopy &>/dev/null; then
        # macOS
        cat "$TEMP_DIR/test-definition-prompt.md" | pbcopy
        echo "Test definition prompt copied to clipboard."
    elif command -v xclip &>/dev/null; then
        # Linux with xclip
        cat "$TEMP_DIR/test-definition-prompt.md" | xclip -selection clipboard
        echo "Test definition prompt copied to clipboard."
    elif command -v clip &>/dev/null; then
        # Windows
        cat "$TEMP_DIR/test-definition-prompt.md" | clip
        echo "Test definition prompt copied to clipboard."
    else
        echo "Could not copy to clipboard automatically. Please copy from the file."
    fi
    
    notify "Test definition prompt ready for Claude App!"
    
    echo "After Claude App generates the test definition, save it to a file and run:"
    echo "cp [your-file] $TEMP_DIR/test-definition.md"
    echo "Then run: claude-workflow.sh approve test-definition"
}

# Function to start implementation
start_implementation() {
    echo "Starting implementation in Claude Code..."
    
    # Load current state
    if [ ! -f "$TEMP_DIR/workflow-state.txt" ]; then
        echo "Error: No active workflow found. Please start with 'claude-workflow.sh analyze'."
        exit 1
    fi
    
    source "$TEMP_DIR/workflow-state.txt"
    
    # Check if we're in the right phase
    if [ "$phase" != "test-definition" ] || [ "$status" != "complete" ]; then
        echo "Error: Test definition phase must be completed and approved first."
        echo "Current phase: $phase, Status: $status"
        echo "Please complete the test definition phase before implementation."
        exit 1
    fi
    
    # Get the approved test spec
    TEST_SPEC_FILE="$TEMP_DIR/approved-tests.md"
    
    if [ ! -f "$TEST_SPEC_FILE" ]; then
        echo "Error: No approved test specifications found."
        echo "Please run 'claude-workflow.sh approve test-definition' after saving the test definition."
        exit 1
    fi
    
    # Get the approved technical spec
    TECH_SPEC_FILE="$TEMP_DIR/approved-spec.md"
    
    # Update workflow state
    echo "phase=implementation" > "$TEMP_DIR/workflow-state.txt"
    echo "issue=$issue" >> "$TEMP_DIR/workflow-state.txt"
    echo "status=in_progress" >> "$TEMP_DIR/workflow-state.txt"
    
    # Create a prompt for Claude Code
    cat > "$TEMP_DIR/implementation-prompt.md" << EOL
I'm implementing a feature based on the following technical specification and test definitions.

Technical Specification:
$(cat "$TECH_SPEC_FILE")

Test Definitions:
$(cat "$TEST_SPEC_FILE")

Please help me implement this feature following a TDD approach. First create the test files, verify they fail correctly, then implement the minimum code needed to make the tests pass. Follow all the scope constraints and KISS principles defined in the specification.

For UI components, please also create:
1. Storybook stories for all variants and states
2. A test harness page at /dev/[component-name]

After implementation, run the tests to verify everything passes. The implementation should strictly adhere to the specifications with no additional features or enhancements outside the defined scope.
EOL

    echo "Created implementation prompt for Claude Code. Starting Claude Code in the project directory..."
    
    # Change to project directory
    cd "$PROJECT_ROOT"
    
    # Launch Claude Code with context
    echo "Running: claude \"$(cat "$TEMP_DIR/implementation-prompt.md")\""
    
    # Offer to launch Claude Code
    read -p "Would you like to launch Claude Code now? (y/n): " launch_claude
    if [ "$launch_claude" = "y" ]; then
        claude "$(cat "$TEMP_DIR/implementation-prompt.md")"
    else
        echo "You can launch Claude Code manually with:"
        echo "cd $PROJECT_ROOT"
        echo "claude \"$(head -c 100 "$TEMP_DIR/implementation-prompt.md")... (prompt truncated)\""
        
        # Copy to clipboard
        if command -v pbcopy &>/dev/null; then
            # macOS
            cat "$TEMP_DIR/implementation-prompt.md" | pbcopy
            echo "Implementation prompt copied to clipboard."
        elif command -v xclip &>/dev/null; then
            # Linux with xclip
            cat "$TEMP_DIR/implementation-prompt.md" | xclip -selection clipboard
            echo "Implementation prompt copied to clipboard."
        elif command -v clip &>/dev/null; then
            # Windows
            cat "$TEMP_DIR/implementation-prompt.md" | clip
            echo "Implementation prompt copied to clipboard."
        else
            echo "Could not copy to clipboard automatically. Please copy from the file."
        fi
    fi
    
    notify "Implementation has started in Claude Code!"
    
    echo "When the implementation is complete, review it and run:"
    echo "claude-workflow.sh approve implementation"
}

# Function to create a manual testing plan
create_manual_test_plan() {
    echo "Creating manual testing plan..."
    
    # Load current state
    if [ ! -f "$TEMP_DIR/workflow-state.txt" ]; then
        echo "Error: No active workflow found. Please start with 'claude-workflow.sh analyze'."
        exit 1
    fi
    
    source "$TEMP_DIR/workflow-state.txt"
    
    # Check if we're in the right phase
    if [ "$phase" != "implementation" ] || [ "$status" != "complete" ]; then
        echo "Error: Implementation phase must be completed and approved first."
        echo "Current phase: $phase, Status: $status"
        echo "Please complete and approve the implementation before creating a manual testing plan."
        exit 1
    fi
    
    # Update workflow state
    echo "phase=manual-testing" > "$TEMP_DIR/workflow-state.txt"
    echo "issue=$issue" >> "$TEMP_DIR/workflow-state.txt"
    echo "status=in_progress" >> "$TEMP_DIR/workflow-state.txt"
    
    # Create a prompt for Claude App
    cat > "$TEMP_DIR/manual-testing-prompt.md" << EOL
# Manual Testing Request

## Context
I've implemented this feature and all automated tests are now passing:

$(cat "$TEMP_DIR/approved-spec.md")

## Request
Help me plan manual testing steps to verify this implementation works as expected in real usage, given the current state of the codebase.

## Preferred MCP Tools
When using these prompt templates, the AI is encouraged to leverage the following MCP tools:
- **sequentialthinking**: For planning and structuring responses.
- **mcp-obsidian**: For referencing project documentation and notes.
- **memory**: For building and querying context.
- **@modelcontextprotocol-server-github**: For GitHub interaction.
- **brave-search**: For research and finding best practices.

## Scope Boundaries
- Only test functionality within the defined scope
- Focus on user experience and edge cases automated tests might miss
- Do not suggest testing features outside the implemented scope

## Three-Stage Manual Testing
1. **Storybook Testing**:
   - Review all story variants
   - Test interactive controls
   - Verify visual appearance

2. **Test Harness Testing** (/dev/[component-name]):
   - Test with more realistic data
   - Verify state transitions
   - Check edge cases interactively

3. **System Integration Testing**:
   - Test within the full application
   - Verify with real data
   - Check parent component interactions

## Output Format
Please provide a testing plan including:
1. Storybook scenarios to verify
2. Test harness interactions to check
3. Integration points to validate
4. User scenarios to test
5. Edge cases to verify
6. Visual/UX aspects to check
7. Potential issues to watch for

These steps will help ensure the implementation works correctly in the real application environment.
EOL

    echo "Created manual testing prompt. Open Claude App and paste the contents of $TEMP_DIR/manual-testing-prompt.md."
    
    # Offer to open the prompt in a text editor
    read -p "Would you like to open the manual testing prompt now? (y/n): " open_prompt
    if [ "$open_prompt" = "y" ]; then
        if command -v open &>/dev/null; then
            # macOS
            open -t "$TEMP_DIR/manual-testing-prompt.md"
        elif command -v xdg-open &>/dev/null; then
            # Linux
            xdg-open "$TEMP_DIR/manual-testing-prompt.md"
        else
            echo "Could not open the file automatically. Please open it manually at: $TEMP_DIR/manual-testing-prompt.md"
        fi
    fi
    
    # Automatically copy to clipboard
    if command -v pbcopy &>/dev/null; then
        # macOS
        cat "$TEMP_DIR/manual-testing-prompt.md" | pbcopy
        echo "Manual testing prompt copied to clipboard."
    elif command -v xclip &>/dev/null; then
        # Linux with xclip
        cat "$TEMP_DIR/manual-testing-prompt.md" | xclip -selection clipboard
        echo "Manual testing prompt copied to clipboard."
    elif command -v clip &>/dev/null; then
        # Windows
        cat "$TEMP_DIR/manual-testing-prompt.md" | clip
        echo "Manual testing prompt copied to clipboard."
    else
        echo "Could not copy to clipboard automatically. Please copy from the file."
    fi
    
    notify "Manual testing prompt ready for Claude App!"
    
    echo "After Claude App generates the manual testing plan, perform the tests and run:"
    echo "claude-workflow.sh approve manual-testing"
}

# Function to finalize implementation
finalize_implementation() {
    echo "Starting finalization process..."
    
    # Load current state
    if [ ! -f "$TEMP_DIR/workflow-state.txt" ]; then
        echo "Error: No active workflow found. Please start with 'claude-workflow.sh analyze'."
        exit 1
    fi
    
    source "$TEMP_DIR/workflow-state.txt"
    
    # Check if we're in the right phase
    if [ "$phase" != "manual-testing" ] || [ "$status" != "complete" ]; then
        echo "Error: Manual testing phase must be completed and approved first."
        echo "Current phase: $phase, Status: $status"
        echo "Please complete and approve manual testing before finalizing."
        exit 1
    fi
    
    # Update workflow state
    echo "phase=finalization" > "$TEMP_DIR/workflow-state.txt"
    echo "issue=$issue" >> "$TEMP_DIR/workflow-state.txt"
    echo "status=in_progress" >> "$TEMP_DIR/workflow-state.txt"
    
    # Create a prompt for Claude Code
    cat > "$TEMP_DIR/finalization-prompt.md" << EOL
I've completed implementation and manual testing for this feature:

$(cat "$TEMP_DIR/approved-spec.md")

Now I need you to:

1. Clean up the code (remove debug statements, improve comments, optimize imports)
2. Ensure all tests still pass after cleanup
3. Create a feature branch (feature/${issue}-$(echo "$TEMP_DIR/approved-spec.md" | grep -i "GitHub Issue" | sed -E 's/.*#([0-9]+).*/\1/')-$(echo "$TEMP_DIR/approved-spec.md" | grep -i "GitHub Issue" | sed -E 's/.*#[0-9]+ (.*)/\1/' | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | head -c 20))
4. Create a commit with a semantic commit message
5. Create a draft PR that references the issue

Follow our standard conventions for commit messages and PR descriptions. Make sure to include "Closes #${issue}" in the PR description.
EOL

    echo "Created finalization prompt for Claude Code. Starting Claude Code in the project directory..."
    
    # Change to project directory
    cd "$PROJECT_ROOT"
    
    # Launch Claude Code with context
    echo "Running: claude \"$(cat "$TEMP_DIR/finalization-prompt.md")\""
    
    # Offer to launch Claude Code
    read -p "Would you like to launch Claude Code now? (y/n): " launch_claude
    if [ "$launch_claude" = "y" ]; then
        claude "$(cat "$TEMP_DIR/finalization-prompt.md")"
    else
        echo "You can launch Claude Code manually with:"
        echo "cd $PROJECT_ROOT"
        echo "claude \"$(head -c 100 "$TEMP_DIR/finalization-prompt.md")... (prompt truncated)\""
        
        # Copy to clipboard
        if command -v pbcopy &>/dev/null; then
            # macOS
            cat "$TEMP_DIR/finalization-prompt.md" | pbcopy
            echo "Finalization prompt copied to clipboard."
        elif command -v xclip &>/dev/null; then
            # Linux with xclip
            cat "$TEMP_DIR/finalization-prompt.md" | xclip -selection clipboard
            echo "Finalization prompt copied to clipboard."
        elif command -v clip &>/dev/null; then
            # Windows
            cat "$TEMP_DIR/finalization-prompt.md" | clip
            echo "Finalization prompt copied to clipboard."
        else
            echo "Could not copy to clipboard automatically. Please copy from the file."
        fi
    fi
    
    notify "Finalization has started in Claude Code!"
    
    echo "When the PR is created, mark the workflow as complete:"
    echo "claude-workflow.sh approve finalization"
}

# Main workflow command function
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

command="$1"
shift

case "$command" in
    "analyze")
        start_analysis "$1"
        ;;
    "define-tests")
        define_tests
        ;;
    "implement")
        start_implementation
        ;;
    "manual-test")
        create_manual_test_plan
        ;;
    "finalize")
        finalize_implementation
        ;;
    "status")
        get_workflow_state
        ;;
    "approve")
        approve_phase "$1"
        ;;
    "reject")
        reject_phase "$1" "$2"
        ;;
    "test-notify")
        test_notify
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        echo "Unknown command: $command"
        show_help
        exit 1
        ;;
esac

exit 0
