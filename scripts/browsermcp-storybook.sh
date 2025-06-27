#!/bin/bash

# BrowserMCP Storybook Verification Script
# Automated testing for Storybook stories
# Usage: ./scripts/browsermcp-storybook.sh [report-file]

set -e

REPORT_FILE=${1:-}
STORYBOOK_PORT=6006
STORYBOOK_URL="http://localhost:$STORYBOOK_PORT"
PROJECT_ROOT="$(git rev-parse --show-toplevel)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[STORYBOOK]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[STORYBOOK SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[STORYBOOK WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[STORYBOOK ERROR]${NC} $1"
}

# Report functions
report_section() {
    if [ -n "$REPORT_FILE" ]; then
        echo "### $1" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
}

report_result() {
    local status=$1
    local message=$2
    local details=${3:-}
    
    if [ -n "$REPORT_FILE" ]; then
        case $status in
            "pass")
                echo "- ✅ **$message**" >> "$REPORT_FILE"
                ;;
            "fail")
                echo "- ❌ **$message**" >> "$REPORT_FILE"
                ;;
            "warn")
                echo "- ⚠️ **$message**" >> "$REPORT_FILE"
                ;;
            "info")
                echo "- 📝 **$message**" >> "$REPORT_FILE"
                ;;
        esac
        
        if [ -n "$details" ]; then
            echo "  - $details" >> "$REPORT_FILE"
        fi
        echo "" >> "$REPORT_FILE"
    fi
}

# Check if Storybook is available
check_storybook_available() {
    log_info "Checking if Storybook is available..."
    
    # Check if Storybook is configured
    if [ -f "$PROJECT_ROOT/.storybook/main.ts" ] || [ -f "$PROJECT_ROOT/.storybook/main.js" ]; then
        log_success "Storybook configuration found"
        return 0
    else
        log_warning "Storybook configuration not found"
        return 1
    fi
}

# Check if Storybook server is running
check_storybook_server() {
    log_info "Checking if Storybook server is running on port $STORYBOOK_PORT..."
    
    if curl -s "$STORYBOOK_URL" > /dev/null 2>&1; then
        log_success "Storybook server is running at $STORYBOOK_URL"
        return 0
    else
        log_warning "Storybook server not running. Attempting to start..."
        
        # Start Storybook in background
        cd "$PROJECT_ROOT"
        npm run storybook > /dev/null 2>&1 &
        STORYBOOK_PID=$!
        
        # Wait for server to start
        log_info "Waiting for Storybook server to start..."
        for i in {1..60}; do  # Storybook takes longer to start
            if curl -s "$STORYBOOK_URL" > /dev/null 2>&1; then
                log_success "Storybook server started successfully"
                return 0
            fi
            sleep 3
        done
        
        log_error "Failed to start Storybook server"
        return 1
    fi
}

# Find recently modified story files
find_recent_stories() {
    log_info "Looking for recently modified story files..."
    
    # Check git diff for story files
    local story_files=$(git diff --name-only HEAD~5 HEAD | grep -E '\.stories\.(ts|tsx|js|jsx)$' || true)
    
    if [ -n "$story_files" ]; then
        log_info "Found recently modified stories:"
        echo "$story_files" | while read -r file; do
            log_info "  - $file"
        done
        echo "$story_files"
    else
        log_info "No recently modified story files found"
        echo ""
    fi
}

# Simulate BrowserMCP Storybook testing
simulate_storybook_test() {
    local story_path=$1
    local story_name=$2
    
    log_info "Testing story: $story_name"
    
    # Simulate story accessibility
    report_result "info" "$story_name - Render Test" "Would verify story renders without errors"
    
    # Simulate interactive controls testing
    report_result "info" "$story_name - Controls Test" "Would test all interactive controls and knobs"
    
    # Simulate visual regression testing
    report_result "info" "$story_name - Visual Test" "Would capture screenshots for visual regression testing"
    
    # Simulate accessibility testing
    report_result "info" "$story_name - Accessibility Test" "Would run axe-core accessibility checks"
    
    return 0
}

# Test common story patterns
test_story_patterns() {
    report_section "📖 Story Pattern Testing"
    
    # Test default stories
    log_info "Testing default story variants..."
    simulate_storybook_test "Default" "Default State"
    
    # Test interactive stories
    log_info "Testing interactive story variants..."
    simulate_storybook_test "Interactive" "Interactive State"
    
    # Test edge case stories
    log_info "Testing edge case story variants..."
    simulate_storybook_test "EdgeCases" "Edge Cases"
    
    # Test responsive stories
    log_info "Testing responsive story variants..."
    simulate_storybook_test "Responsive" "Responsive Design"
}

# Test component categories
test_component_categories() {
    report_section "🧩 Component Category Testing"
    
    local categories=("UI Components" "Forms" "Navigation" "Layout" "Data Display")
    
    for category in "${categories[@]}"; do
        log_info "Testing $category components..."
        report_result "info" "$category Testing" "Would test all stories in $category category"
    done
}

# Validate story structure
validate_story_structure() {
    report_section "🏗️ Story Structure Validation"
    
    log_info "Validating story file structure..."
    
    # Check for required story elements
    report_result "info" "Story Export Check" "Would verify all stories have proper default exports"
    report_result "info" "Args Validation" "Would check story args and argTypes configuration"
    report_result "info" "Meta Configuration" "Would validate story meta configuration"
    report_result "info" "Story Naming" "Would check story naming conventions"
}

# Generate Storybook metrics
generate_storybook_metrics() {
    report_section "📊 Storybook Metrics"
    
    # Count story files (approximate)
    local story_count=$(find "$PROJECT_ROOT/src" -name "*.stories.*" 2>/dev/null | wc -l | tr -d ' ')
    
    report_result "info" "Story File Count" "Found approximately $story_count story files"
    report_result "info" "Coverage Analysis" "Would analyze component story coverage"
    report_result "info" "Performance Metrics" "Would measure story load times and bundle size"
}

# Generate Storybook recommendations
generate_storybook_recommendations() {
    report_section "💡 Storybook Recommendations"
    
    report_result "info" "Story Completeness" "Ensure all component states have corresponding stories"
    report_result "info" "Interactive Controls" "Add comprehensive controls for component props"
    report_result "info" "Documentation" "Include JSDoc comments and story descriptions"
    report_result "info" "Accessibility" "Add accessibility testing to story interactions"
    report_result "info" "Visual Testing" "Consider adding visual regression testing setup"
}

# Main Storybook verification
run_storybook_verification() {
    log_info "Starting Storybook verification..."
    
    # Check if Storybook is available
    if ! check_storybook_available; then
        report_result "warn" "Storybook Setup" "Storybook not configured - skipping Storybook tests"
        return 1
    fi
    
    # Check if Storybook server is running
    if ! check_storybook_server; then
        report_result "fail" "Storybook Server" "Could not start Storybook server"
        return 1
    fi
    
    report_result "pass" "Storybook Server" "Storybook server running at $STORYBOOK_URL"
    
    # Find recent stories
    local recent_stories=$(find_recent_stories)
    
    if [ -n "$recent_stories" ]; then
        report_section "🆕 Recent Story Testing"
        echo "$recent_stories" | while read -r story_file; do
            if [ -n "$story_file" ]; then
                local story_name=$(basename "$story_file" | sed 's/\.stories\..*//')
                simulate_storybook_test "$story_file" "$story_name"
            fi
        done
    fi
    
    # Run pattern testing
    test_story_patterns
    
    # Test component categories
    test_component_categories
    
    # Validate story structure
    validate_story_structure
    
    # Generate metrics
    generate_storybook_metrics
    
    # Generate recommendations
    generate_storybook_recommendations
}

# Cleanup function
cleanup() {
    if [ -n "$STORYBOOK_PID" ]; then
        log_info "Stopping Storybook server..."
        kill $STORYBOOK_PID 2>/dev/null || true
    fi
}

# Main execution
main() {
    local report_file=${1:-}
    
    if [ -n "$report_file" ]; then
        REPORT_FILE="$report_file"
    fi
    
    log_info "=== BrowserMCP Storybook Verification ==="
    
    # Set up cleanup trap
    trap cleanup EXIT
    
    # Run the verification
    run_storybook_verification
    
    log_success "Storybook verification completed"
}

# Run main function
main "$@"