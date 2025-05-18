#!/bin/bash
# claude-transition.sh - Script to automate transitions between Claude App and Claude Code

# Configuration
PROJECT_ROOT="/Users/jackhaas/Projects/narraitor"
TEMP_DIR="$PROJECT_ROOT/.claude-transition"
mkdir -p "$TEMP_DIR"

# Default gate configuration
DEFAULT_GATES=(
  "test_definition:Tests must be defined before implementation"
  "implementation_review:Implementation must be reviewed before testing"
  "manual_testing:Manual testing must be completed before cleanup"
  "final_review:Final review required before PR creation"
)

# Function to show help
show_help() {
    echo "Claude Tools Transition Helper"
    echo ""
    echo "Usage: claude-transition [command] [options]"
    echo ""
    echo "Commands:"
    echo "  to-code [task_id] [context_file]    Transition from Claude App to Claude Code"
    echo "  to-app [task_id] [result_file]      Transition from Claude Code to Claude App"
    echo "  status [task_id]                    Show task status"
    echo "  gate-pass [task_id] [gate_name]     Pass a workflow gate"
    echo "  gate-fail [task_id] [gate_name]     Fail a workflow gate"
    echo "  gates [task_id]                     List gates for a task"
    echo "  setup-task [task_id] [description]  Set up a new task"
    echo ""
    echo "Examples:"
    echo "  claude-transition setup-task CC-123 \"Implement CharacterCard component\""
    echo "  claude-transition to-code CC-123 specs.md"
    echo "  claude-transition gate-pass CC-123 test_definition"
    echo "  claude-transition to-app CC-123 implementation.md"
}

# Function to set up a new task
setup_task() {
    TASK_ID="$1"
    DESCRIPTION="$2"
    
    if [ -z "$TASK_ID" ] || [ -z "$DESCRIPTION" ]; then
        echo "Error: Task ID and description are required."
        echo "Usage: claude-transition setup-task [task_id] [description]"
        exit 1
    fi
    
    TASK_DIR="$TEMP_DIR/$TASK_ID"
    
    # Create task directory if it doesn't exist
    mkdir -p "$TASK_DIR"
    
    # Create task info file
    echo "TASK_ID=$TASK_ID" > "$TASK_DIR/task_info.sh"
    echo "DESCRIPTION=\"$DESCRIPTION\"" >> "$TASK_DIR/task_info.sh"
    echo "STATUS=initialized" >> "$TASK_DIR/task_info.sh"
    echo "CREATED_AT=\"$(date)\"" >> "$TASK_DIR/task_info.sh"
    echo "UPDATED_AT=\"$(date)\"" >> "$TASK_DIR/task_info.sh"
    
    # Set up gates
    for gate in "${DEFAULT_GATES[@]}"; do
        gate_name="${gate%%:*}"
        gate_description="${gate#*:}"
        echo "$gate_name:pending:$gate_description" >> "$TASK_DIR/gates.txt"
    done
    
    # Create transition history file
    echo "$(date): Task initialized - $DESCRIPTION" > "$TASK_DIR/transitions.txt"
    
    echo "Task $TASK_ID set up successfully."
    echo "Description: $DESCRIPTION"
    echo "Initial gates configured:"
    cat "$TASK_DIR/gates.txt"
}

# Function to transition from Claude App to Claude Code
to_code() {
    TASK_ID="$1"
    CONTEXT_FILE="$2"
    
    if [ -z "$TASK_ID" ] || [ -z "$CONTEXT_FILE" ]; then
        echo "Error: Task ID and context file are required."
        echo "Usage: claude-transition to-code [task_id] [context_file]"
        exit 1
    fi
    
    TASK_DIR="$TEMP_DIR/$TASK_ID"
    
    # Check if task exists
    if [ ! -d "$TASK_DIR" ]; then
        echo "Error: Task $TASK_ID does not exist. Create it first with setup-task."
        exit 1
    fi
    
    # Check if context file exists
    if [ ! -f "$CONTEXT_FILE" ]; then
        echo "Error: Context file $CONTEXT_FILE does not exist."
        exit 1
    fi
    
    # Source task info
    source "$TASK_DIR/task_info.sh"
    
    # Update task status
    echo "STATUS=in_code" > "$TASK_DIR/task_info.sh"
    echo "DESCRIPTION=\"$DESCRIPTION\"" >> "$TASK_DIR/task_info.sh"
    echo "CREATED_AT=\"$CREATED_AT\"" >> "$TASK_DIR/task_info.sh"
    echo "UPDATED_AT=\"$(date)\"" >> "$TASK_DIR/task_info.sh"
    echo "LAST_TRANSITION=\"app_to_code\"" >> "$TASK_DIR/task_info.sh"
    
    # Copy context file to task directory
    TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
    CONTEXT_COPY="$TASK_DIR/app_to_code_$TIMESTAMP.md"
    cp "$CONTEXT_FILE" "$CONTEXT_COPY"
    
    # Update transition history
    echo "$(date): Transitioned from Claude App to Claude Code - Context: $CONTEXT_COPY" >> "$TASK_DIR/transitions.txt"
    
    # Check for gate requirements
    gate_check "$TASK_ID" "to-code"
    
    # Generate Claude Code command
    CODE_COMMAND="claude \"I'm continuing work on task $TASK_ID: $DESCRIPTION. Here's the context from Claude App. Please help me implement this based on the specification.\n\n$(cat "$CONTEXT_COPY")\""
    
    echo "Transition to Claude Code prepared."
    echo "Task: $TASK_ID - $DESCRIPTION"
    echo "Context saved to: $CONTEXT_COPY"
    echo ""
    echo "Run this command to start Claude Code with context:"
    echo "-------------------------------------------------"
    echo $CODE_COMMAND
    echo "-------------------------------------------------"
    echo ""
    
    # Option to copy command to clipboard
    read -p "Copy command to clipboard? (y/n): " copy_choice
    if [ "$copy_choice" = "y" ]; then
        echo -n "$CODE_COMMAND" | pbcopy
        echo "Command copied to clipboard."
        
        # Option to launch Claude Code automatically
        read -p "Launch Claude Code now? (y/n): " launch_choice
        if [ "$launch_choice" = "y" ]; then
            cd "$PROJECT_ROOT"
            eval "$CODE_COMMAND"
        fi
    fi
}

# Function to transition from Claude Code to Claude App
to_app() {
    TASK_ID="$1"
    RESULT_FILE="$2"
    
    if [ -z "$TASK_ID" ] || [ -z "$RESULT_FILE" ]; then
        echo "Error: Task ID and result file are required."
        echo "Usage: claude-transition to-app [task_id] [result_file]"
        exit 1
    fi
    
    TASK_DIR="$TEMP_DIR/$TASK_ID"
    
    # Check if task exists
    if [ ! -d "$TASK_DIR" ]; then
        echo "Error: Task $TASK_ID does not exist. Create it first with setup-task."
        exit 1
    fi
    
    # Check if result file exists
    if [ ! -f "$RESULT_FILE" ]; then
        echo "Error: Result file $RESULT_FILE does not exist."
        exit 1
    fi
    
    # Source task info
    source "$TASK_DIR/task_info.sh"
    
    # Update task status
    echo "STATUS=in_app" > "$TASK_DIR/task_info.sh"
    echo "DESCRIPTION=\"$DESCRIPTION\"" >> "$TASK_DIR/task_info.sh"
    echo "CREATED_AT=\"$CREATED_AT\"" >> "$TASK_DIR/task_info.sh"
    echo "UPDATED_AT=\"$(date)\"" >> "$TASK_DIR/task_info.sh"
    echo "LAST_TRANSITION=\"code_to_app\"" >> "$TASK_DIR/task_info.sh"
    
    # Copy result file to task directory
    TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
    RESULT_COPY="$TASK_DIR/code_to_app_$TIMESTAMP.md"
    cp "$RESULT_FILE" "$RESULT_COPY"
    
    # Update transition history
    echo "$(date): Transitioned from Claude Code to Claude App - Result: $RESULT_COPY" >> "$TASK_DIR/transitions.txt"
    
    # Check for gate requirements
    gate_check "$TASK_ID" "to-app"
    
    # Generate Claude App prompt
    APP_PROMPT="I'm continuing work on task $TASK_ID: $DESCRIPTION. Here are the results from Claude Code implementation. Please review these results and help me with the next steps in the workflow.\n\n$(cat "$RESULT_COPY")"
    
    echo "Transition to Claude App prepared."
    echo "Task: $TASK_ID - $DESCRIPTION"
    echo "Results saved to: $RESULT_COPY"
    echo ""
    echo "Claude App Prompt:"
    echo "-------------------------------------------------"
    echo -e "$APP_PROMPT"
    echo "-------------------------------------------------"
    echo ""
    
    # Option to copy prompt to clipboard
    read -p "Copy prompt to clipboard? (y/n): " copy_choice
    if [ "$copy_choice" = "y" ]; then
        echo -e "$APP_PROMPT" | pbcopy
        echo "Prompt copied to clipboard."
    fi
}

# Function to check gates
gate_check() {
    TASK_ID="$1"
    TRANSITION_TYPE="$2"
    
    TASK_DIR="$TEMP_DIR/$TASK_ID"
    GATES_FILE="$TASK_DIR/gates.txt"
    
    # Define which gates are required for which transitions
    if [ "$TRANSITION_TYPE" = "to-code" ]; then
        # Check if test_definition gate passed for implementation
        if grep -q "implementation_review:pending:" "$GATES_FILE"; then
            if ! grep -q "test_definition:passed:" "$GATES_FILE"; then
                echo "WARNING: Test definition gate has not been passed yet."
                read -p "Continue anyway? (y/n): " continue_choice
                if [ "$continue_choice" != "y" ]; then
                    echo "Transition aborted."
                    exit 1
                fi
            fi
        fi
    elif [ "$TRANSITION_TYPE" = "to-app" ]; then
        # Check relevant gates for app transition
        if grep -q "manual_testing:pending:" "$GATES_FILE"; then
            if ! grep -q "implementation_review:passed:" "$GATES_FILE"; then
                echo "WARNING: Implementation review gate has not been passed yet."
                read -p "Continue anyway? (y/n): " continue_choice
                if [ "$continue_choice" != "y" ]; then
                    echo "Transition aborted."
                    exit 1
                fi
            fi
        fi
    fi
}

# Function to pass a gate
gate_pass() {
    TASK_ID="$1"
    GATE_NAME="$2"
    
    if [ -z "$TASK_ID" ] || [ -z "$GATE_NAME" ]; then
        echo "Error: Task ID and gate name are required."
        echo "Usage: claude-transition gate-pass [task_id] [gate_name]"
        exit 1
    fi
    
    TASK_DIR="$TEMP_DIR/$TASK_ID"
    GATES_FILE="$TASK_DIR/gates.txt"
    
    # Check if task exists
    if [ ! -d "$TASK_DIR" ]; then
        echo "Error: Task $TASK_ID does not exist."
        exit 1
    fi
    
    # Check if gate exists
    if ! grep -q "^$GATE_NAME:" "$GATES_FILE"; then
        echo "Error: Gate $GATE_NAME does not exist for task $TASK_ID."
        exit 1
    fi
    
    # Get gate description
    GATE_DESCRIPTION=$(grep "^$GATE_NAME:" "$GATES_FILE" | cut -d':' -f3)
    
    # Update gate status
    sed -i "" "s/^$GATE_NAME:pending:/$GATE_NAME:passed:/" "$GATES_FILE"
    
    # Update transition history
    echo "$(date): Gate $GATE_NAME passed - $GATE_DESCRIPTION" >> "$TASK_DIR/transitions.txt"
    
    echo "Gate $GATE_NAME passed for task $TASK_ID."
    echo "Description: $GATE_DESCRIPTION"
    
    # Update task info
    source "$TASK_DIR/task_info.sh"
    echo "STATUS=in_progress" > "$TASK_DIR/task_info.sh"
    echo "DESCRIPTION=\"$DESCRIPTION\"" >> "$TASK_DIR/task_info.sh"
    echo "CREATED_AT=\"$CREATED_AT\"" >> "$TASK_DIR/task_info.sh"
    echo "UPDATED_AT=\"$(date)\"" >> "$TASK_DIR/task_info.sh"
    
    # Check if all gates are passed
    if ! grep -q ":pending:" "$GATES_FILE"; then
        echo "All gates have been passed for task $TASK_ID!"
        echo "STATUS=complete" > "$TASK_DIR/task_info.sh"
        echo "DESCRIPTION=\"$DESCRIPTION\"" >> "$TASK_DIR/task_info.sh"
        echo "CREATED_AT=\"$CREATED_AT\"" >> "$TASK_DIR/task_info.sh"
        echo "UPDATED_AT=\"$(date)\"" >> "$TASK_DIR/task_info.sh"
        echo "COMPLETED_AT=\"$(date)\"" >> "$TASK_DIR/task_info.sh"
    fi
}

# Function to fail a gate
gate_fail() {
    TASK_ID="$1"
    GATE_NAME="$2"
    REASON="$3"
    
    if [ -z "$TASK_ID" ] || [ -z "$GATE_NAME" ]; then
        echo "Error: Task ID and gate name are required."
        echo "Usage: claude-transition gate-fail [task_id] [gate_name] [reason]"
        exit 1
    fi
    
    TASK_DIR="$TEMP_DIR/$TASK_ID"
    GATES_FILE="$TASK_DIR/gates.txt"
    
    # Check if task exists
    if [ ! -d "$TASK_DIR" ]; then
        echo "Error: Task $TASK_ID does not exist."
        exit 1
    fi
    
    # Check if gate exists
    if ! grep -q "^$GATE_NAME:" "$GATES_FILE"; then
        echo "Error: Gate $GATE_NAME does not exist for task $TASK_ID."
        exit 1
    fi
    
    # Get gate description
    GATE_DESCRIPTION=$(grep "^$GATE_NAME:" "$GATES_FILE" | cut -d':' -f3)
    
    # Update gate status to pending (keeps it at the same stage)
    sed -i "" "s/^$GATE_NAME:passed:/$GATE_NAME:pending:/" "$GATES_FILE"
    
    # Update transition history
    if [ -z "$REASON" ]; then
        read -p "Enter reason for gate failure: " REASON
    fi
    
    echo "$(date): Gate $GATE_NAME failed - Reason: $REASON" >> "$TASK_DIR/transitions.txt"
    
    echo "Gate $GATE_NAME failed for task $TASK_ID."
    echo "Description: $GATE_DESCRIPTION"
    echo "Reason: $REASON"
    
    # Update task info
    source "$TASK_DIR/task_info.sh"
    echo "STATUS=blocked" > "$TASK_DIR/task_info.sh"
    echo "DESCRIPTION=\"$DESCRIPTION\"" >> "$TASK_DIR/task_info.sh"
    echo "CREATED_AT=\"$CREATED_AT\"" >> "$TASK_DIR/task_info.sh"
    echo "UPDATED_AT=\"$(date)\"" >> "$TASK_DIR/task_info.sh"
    echo "BLOCKED_REASON=\"Gate $GATE_NAME failed: $REASON\"" >> "$TASK_DIR/task_info.sh"
}

# Function to list gates for a task
list_gates() {
    TASK_ID="$1"
    
    if [ -z "$TASK_ID" ]; then
        echo "Error: Task ID is required."
        echo "Usage: claude-transition gates [task_id]"
        exit 1
    fi
    
    TASK_DIR="$TEMP_DIR/$TASK_ID"
    GATES_FILE="$TASK_DIR/gates.txt"
    
    # Check if task exists
    if [ ! -d "$TASK_DIR" ]; then
        echo "Error: Task $TASK_ID does not exist."
        exit 1
    fi
    
    echo "Gates for task $TASK_ID:"
    echo "-------------------------"
    
    # Read gates and format output
    while IFS=: read -r name status description; do
        if [ "$status" = "passed" ]; then
            echo "[✅] $name - $description"
        else
            echo "[❌] $name - $description"
        fi
    done < "$GATES_FILE"
}

# Function to show task status
show_status() {
    TASK_ID="$1"
    
    if [ -z "$TASK_ID" ]; then
        echo "Error: Task ID is required."
        echo "Usage: claude-transition status [task_id]"
        exit 1
    fi
    
    TASK_DIR="$TEMP_DIR/$TASK_ID"
    
    # Check if task exists
    if [ ! -d "$TASK_DIR" ]; then
        echo "Error: Task $TASK_ID does not exist."
        exit 1
    fi
    
    # Source task info
    source "$TASK_DIR/task_info.sh"
    
    echo "Task Status: $TASK_ID"
    echo "--------------------"
    echo "Description: $DESCRIPTION"
    echo "Status: $STATUS"
    echo "Created: $CREATED_AT"
    echo "Updated: $UPDATED_AT"
    
    if [ "$STATUS" = "complete" ]; then
        echo "Completed: $COMPLETED_AT"
    fi
    
    if [ "$STATUS" = "blocked" ]; then
        echo "Blocked: $BLOCKED_REASON"
    fi
    
    echo ""
    list_gates "$TASK_ID"
    
    echo ""
    echo "Transition History:"
    cat "$TASK_DIR/transitions.txt"
}

# Main script logic
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

command="$1"
shift

case "$command" in
    "setup-task")
        setup_task "$1" "$2"
        ;;
    "to-code")
        to_code "$1" "$2"
        ;;
    "to-app")
        to_app "$1" "$2"
        ;;
    "gate-pass")
        gate_pass "$1" "$2"
        ;;
    "gate-fail")
        gate_fail "$1" "$2" "$3"
        ;;
    "gates")
        list_gates "$1"
        ;;
    "status")
        show_status "$1"
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