#!/bin/bash
# claude-handoff.sh - Script to help with Claude App handoff process

# Configuration
PROJECT_ROOT="/Users/jackhaas/Projects/narraitor"
TEMPLATES_DIR="$PROJECT_ROOT/docs/development/workflows"
HANDOFFS_DIR="$PROJECT_ROOT/.claude-handoffs"
DEFAULT_TEMPLATE="general-continuation"

# Create handoffs directory if it doesn't exist
mkdir -p "$HANDOFFS_DIR"

# Function to display help
show_help() {
    echo "Claude App Handoff Helper"
    echo ""
    echo "Usage: claude-handoff [command] [options]"
    echo ""
    echo "Commands:"
    echo "  request [template]    Generate a handoff request for the current chat"
    echo "  start [handoff-file]  Generate a starter for a new chat"
    echo "  list                  List recent handoffs"
    echo "  templates             List available templates"
    echo ""
    echo "Templates:"
    echo "  general               General continuation template"
    echo "  analysis-impl         Analysis to Implementation handoff"
    echo "  impl-test             Implementation to Test Fixes handoff"
    echo "  test-build            Test Fixes to Build Issues handoff"
    echo "  build-cleanup         Build Issues to Cleanup handoff"
    echo ""
    echo "Examples:"
    echo "  claude-handoff request impl-test    # Generate Implementation to Test handoff"
    echo "  claude-handoff start latest         # Start new chat with latest handoff"
}

# Function to get template content
get_template() {
    template="$1"
    
    case "$template" in
        "general"|"general-continuation")
            cat "$TEMPLATES_DIR/claude-app-workflow-handoffs.md" | sed -n '/^## 5. General Continuation Template/,/^## /p' | sed '/^## /d'
            ;;
        "analysis-impl"|"analysis-implementation")
            cat "$TEMPLATES_DIR/claude-app-workflow-handoffs.md" | sed -n '/^## 1. Analysis to Implementation Handoff/,/^## /p' | sed '/^## /d'
            ;;
        "impl-test"|"implementation-test")
            cat "$TEMPLATES_DIR/claude-app-workflow-handoffs.md" | sed -n '/^## 2. Implementation to Test Fixes Handoff/,/^## /p' | sed '/^## /d'
            ;;
        "test-build"|"test-build-issues")
            cat "$TEMPLATES_DIR/claude-app-workflow-handoffs.md" | sed -n '/^## 3. Test Fixes to Build Issues Handoff/,/^## /p' | sed '/^## /d'
            ;;
        "build-cleanup"|"build-documentation")
            cat "$TEMPLATES_DIR/claude-app-workflow-handoffs.md" | sed -n '/^## 4. Build Issues to Cleanup & Documentation Handoff/,/^## /p' | sed '/^## /d'
            ;;
        *)
            echo "Unknown template: $template"
            echo "Available templates: general, analysis-impl, impl-test, test-build, build-cleanup"
            exit 1
            ;;
    esac
}

# Function to generate handoff request
generate_request() {
    template="${1:-$DEFAULT_TEMPLATE}"
    timestamp=$(date +"%Y%m%d-%H%M%S")
    output_file="$HANDOFFS_DIR/handoff-request-$timestamp.md"
    
    echo "# Handoff Request - $(date)" > "$output_file"
    echo "" >> "$output_file"
    get_template "$template" | grep -A100 "### Request in Current Chat" | sed -n '/^```$/,/^```$/p' | sed '/^```$/d' >> "$output_file"
    echo "" >> "$output_file"
    echo "Generated: $(date)" >> "$output_file"
    echo "Template: $template" >> "$output_file"
    
    echo "Handoff request copied to: $output_file"
    cat "$output_file" | pbcopy
    echo "Content copied to clipboard."
    
    # Set as latest handoff
    echo "$output_file" > "$HANDOFFS_DIR/latest-handoff.txt"
}

# Function to generate new chat starter
generate_starter() {
    handoff_file="$1"
    
    # If handoff_file is "latest", get the latest handoff file
    if [ "$handoff_file" = "latest" ]; then
        if [ -f "$HANDOFFS_DIR/latest-handoff.txt" ]; then
            handoff_file=$(cat "$HANDOFFS_DIR/latest-handoff.txt")
        else
            echo "No latest handoff found."
            exit 1
        fi
    fi
    
    # Check if handoff file exists
    if [ ! -f "$handoff_file" ]; then
        # Try with full path
        if [ ! -f "$HANDOFFS_DIR/$handoff_file" ]; then
            echo "Handoff file not found: $handoff_file"
            exit 1
        else
            handoff_file="$HANDOFFS_DIR/$handoff_file"
        fi
    fi
    
    # Get the template type from the handoff file
    template_type=$(grep "Template:" "$handoff_file" | cut -d " " -f 2)
    
    # Generate the starter content
    timestamp=$(date +"%Y%m%d-%H%M%S")
    output_file="$HANDOFFS_DIR/chat-starter-$timestamp.md"
    
    echo "# New Chat Starter - $(date)" > "$output_file"
    echo "" >> "$output_file"
    
    get_template "$template_type" | grep -A100 "### Starting the New Chat" | sed -n '/^```$/,/^```$/p' | sed '/^```$/d' >> "$output_file"
    
    echo "" >> "$output_file"
    echo "Generated: $(date)" >> "$output_file"
    echo "Based on handoff: $(basename "$handoff_file")" >> "$output_file"
    echo "Template: $template_type" >> "$output_file"
    
    echo "Chat starter copied to: $output_file"
    cat "$output_file" | pbcopy
    echo "Content copied to clipboard."
}

# Function to list recent handoffs
list_handoffs() {
    echo "Recent Handoffs:"
    ls -lt "$HANDOFFS_DIR" | grep -v latest-handoff.txt | head -10
}

# Function to list available templates
list_templates() {
    echo "Available Templates:"
    echo "  general               General continuation template"
    echo "  analysis-impl         Analysis to Implementation handoff"
    echo "  impl-test             Implementation to Test Fixes handoff"
    echo "  test-build            Test Fixes to Build Issues handoff"
    echo "  build-cleanup         Build Issues to Cleanup handoff"
}

# Main script
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

command="$1"
shift

case "$command" in
    "request")
        template="${1:-general}"
        generate_request "$template"
        ;;
    "start")
        handoff_file="${1:-latest}"
        generate_starter "$handoff_file"
        ;;
    "list")
        list_handoffs
        ;;
    "templates")
        list_templates
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
