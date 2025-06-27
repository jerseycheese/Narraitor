#!/bin/bash

# BrowserMCP Verification Script
# Automated testing suite for do-issue workflows
# Usage: ./scripts/browsermcp-verify.sh [issue-number] [optional: test-type]

set -e

# Configuration
ISSUE_NUMBER=${1:-""}
TEST_TYPE=${2:-"full"}
DEV_SERVER_PORT=3000
DEV_SERVER_URL="http://localhost:$DEV_SERVER_PORT"
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
REPORTS_DIR="$PROJECT_ROOT/.claude/verification-reports"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Usage function
show_usage() {
    echo "Usage: $0 [issue-number] [test-type]"
    echo ""
    echo "Parameters:"
    echo "  issue-number  GitHub issue number being implemented"
    echo "  test-type     Type of testing (full|storybook|harness|integration)"
    echo ""
    echo "Examples:"
    echo "  $0 303              # Full verification for issue #303"
    echo "  $0 303 storybook    # Only Storybook testing"
    echo "  $0 303 harness      # Only test harness verification"
    echo ""
}

# Validate parameters
if [ -z "$ISSUE_NUMBER" ]; then
    log_error "Issue number is required"
    show_usage
    exit 1
fi

# Create reports directory
mkdir -p "$REPORTS_DIR"

REPORT_FILE="$REPORTS_DIR/issue-$ISSUE_NUMBER-$(date +%Y%m%d_%H%M%S).md"

# Initialize report
init_report() {
    cat > "$REPORT_FILE" << EOF
# BrowserMCP Verification Report for Issue #$ISSUE_NUMBER

**Generated**: $(date '+%Y-%m-%d %H:%M:%S')
**Test Type**: $TEST_TYPE
**Branch**: $(git rev-parse --abbrev-ref HEAD)

## Summary
- **Issue**: #$ISSUE_NUMBER
- **Status**: In Progress
- **Total Tests**: 0
- **Passed**: 0
- **Failed**: 0
- **Warnings**: 0

## Test Results

EOF
}

# Check if dev server is running
check_dev_server() {
    log_info "Checking if dev server is running on port $DEV_SERVER_PORT..."
    
    if curl -s "$DEV_SERVER_URL" > /dev/null 2>&1; then
        log_success "Dev server is running at $DEV_SERVER_URL"
        return 0
    else
        log_warning "Dev server not running. Starting dev server..."
        
        # Start dev server in background
        cd "$PROJECT_ROOT"
        npm run dev > /dev/null 2>&1 &
        DEV_SERVER_PID=$!
        
        # Wait for server to start
        log_info "Waiting for dev server to start..."
        for i in {1..30}; do
            if curl -s "$DEV_SERVER_URL" > /dev/null 2>&1; then
                log_success "Dev server started successfully"
                return 0
            fi
            sleep 2
        done
        
        log_error "Failed to start dev server"
        return 1
    fi
}

# Detect test harness for the issue
detect_test_harness() {
    local issue_number=$1
    
    # Issue-specific harness detection (primary method)
    case $issue_number in
        "303") echo "/dev/personalization-test" ;;
        "231") echo "/dev" ;; # Text formatting - general dev testing
        "259") echo "/dev" ;; # Visual distinction - general dev testing
        *) 
            # Check recent commits for clues about what was implemented
            local recent_files=$(git diff --name-only HEAD~5 HEAD | grep "src/app/dev/" | grep -v "page.tsx" | head -1)
            
            if [ -n "$recent_files" ]; then
                # Extract harness name from path
                local harness_path=$(echo "$recent_files" | sed 's|src/app/dev/||' | sed 's|/.*||')
                echo "/dev/$harness_path"
                return 0
            fi
            
            echo "/dev" # Default to dev index
            ;;
    esac
}

# Run BrowserMCP test harness verification
run_harness_tests() {
    local harness_url="$1"
    log_info "Running test harness verification for: $harness_url"
    
    # Call the specific harness testing script
    if [ -f "$SCRIPTS_DIR/browsermcp-test-harness.sh" ]; then
        "$SCRIPTS_DIR/browsermcp-test-harness.sh" "$harness_url" "$REPORT_FILE"
    else
        log_warning "Test harness script not found, skipping harness tests"
        echo "### ⚠️ Test Harness Verification: SKIPPED" >> "$REPORT_FILE"
        echo "Test harness script not available" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
}

# Run BrowserMCP Storybook verification
run_storybook_tests() {
    log_info "Running Storybook verification..."
    
    # Call the Storybook testing script
    if [ -f "$SCRIPTS_DIR/browsermcp-storybook.sh" ]; then
        "$SCRIPTS_DIR/browsermcp-storybook.sh" "$REPORT_FILE"
    else
        log_warning "Storybook script not found, skipping Storybook tests"
        echo "### ⚠️ Storybook Verification: SKIPPED" >> "$REPORT_FILE"
        echo "Storybook script not available" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
}

# Run integration tests
run_integration_tests() {
    log_info "Running integration verification..."
    
    # Call the integration testing script
    if [ -f "$SCRIPTS_DIR/browsermcp-integration.sh" ]; then
        "$SCRIPTS_DIR/browsermcp-integration.sh" "$ISSUE_NUMBER" "$REPORT_FILE"
    else
        log_warning "Integration script not found, skipping integration tests"
        echo "### ⚠️ Integration Verification: SKIPPED" >> "$REPORT_FILE"
        echo "Integration script not available" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
}

# Finalize report
finalize_report() {
    echo "" >> "$REPORT_FILE"
    echo "## Verification Complete" >> "$REPORT_FILE"
    echo "**Completed**: $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "### Next Steps" >> "$REPORT_FILE"
    echo "1. Review the findings above" >> "$REPORT_FILE"
    echo "2. Address any issues found" >> "$REPORT_FILE"
    echo "3. Re-run verification if changes are made" >> "$REPORT_FILE"
    echo "4. Proceed with manual verification for any remaining items" >> "$REPORT_FILE"
    
    log_success "Verification report generated: $REPORT_FILE"
}

# Main execution
main() {
    log_info "Starting BrowserMCP verification for issue #$ISSUE_NUMBER"
    
    # Initialize report
    init_report
    
    # Check dev server
    if ! check_dev_server; then
        log_error "Cannot proceed without dev server"
        exit 1
    fi
    
    # Run tests based on type
    case $TEST_TYPE in
        "full")
            log_info "Running full verification suite..."
            HARNESS_URL=$(detect_test_harness "$ISSUE_NUMBER")
            run_harness_tests "$HARNESS_URL"
            run_storybook_tests
            run_integration_tests
            ;;
        "storybook")
            log_info "Running Storybook-only verification..."
            run_storybook_tests
            ;;
        "harness")
            log_info "Running test harness-only verification..."
            HARNESS_URL=$(detect_test_harness "$ISSUE_NUMBER")
            run_harness_tests "$HARNESS_URL"
            ;;
        "integration")
            log_info "Running integration-only verification..."
            run_integration_tests
            ;;
        *)
            log_error "Unknown test type: $TEST_TYPE"
            show_usage
            exit 1
            ;;
    esac
    
    # Finalize report
    finalize_report
    
    # Display summary
    echo ""
    log_success "BrowserMCP verification completed for issue #$ISSUE_NUMBER"
    log_info "Report available at: $REPORT_FILE"
    
    # Show quick summary if report exists
    if [ -f "$REPORT_FILE" ]; then
        echo ""
        echo "Quick Summary:"
        grep -E "^- \*\*(Total Tests|Passed|Failed|Warnings)" "$REPORT_FILE" || true
    fi
}

# Cleanup function
cleanup() {
    if [ -n "$DEV_SERVER_PID" ]; then
        log_info "Stopping dev server..."
        kill $DEV_SERVER_PID 2>/dev/null || true
    fi
}

# Set up cleanup trap
trap cleanup EXIT

# Run main function
main "$@"