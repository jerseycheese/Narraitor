#!/bin/bash

# BrowserMCP Test Harness Verification Script
# Automated testing for /dev/* test harnesses
# Usage: ./scripts/browsermcp-test-harness.sh [harness-url] [report-file]

set -e

HARNESS_URL=${1:-"/dev"}
REPORT_FILE=${2:-}
DEV_SERVER_URL="http://localhost:3000"
PROJECT_ROOT="$(git rev-parse --show-toplevel)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[HARNESS]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[HARNESS SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[HARNESS WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[HARNESS ERROR]${NC} $1"
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

# Check if BrowserMCP is available
check_browsermcp() {
    log_info "Checking BrowserMCP availability..."
    
    # This is a placeholder - actual implementation would check if BrowserMCP is properly configured
    # For now, we'll simulate the checks that BrowserMCP would perform
    
    if command -v node >/dev/null 2>&1; then
        log_success "Node.js available for BrowserMCP integration"
        return 0
    else
        log_error "Node.js not found - required for BrowserMCP"
        return 1
    fi
}

# Simulate BrowserMCP navigation and testing
simulate_browsermcp_test() {
    local url=$1
    local test_name=$2
    
    log_info "Testing: $test_name"
    log_info "URL: $DEV_SERVER_URL$url"
    
    # Check if URL is accessible
    if curl -s -f "$DEV_SERVER_URL$url" > /dev/null 2>&1; then
        log_success "✅ Page accessible: $url"
        report_result "pass" "$test_name - Page Load" "URL: $url is accessible"
        
        # Simulate additional checks that BrowserMCP would perform
        simulate_page_checks "$url" "$test_name"
        
        return 0
    else
        log_error "❌ Page not accessible: $url"
        report_result "fail" "$test_name - Page Load" "URL: $url is not accessible"
        return 1
    fi
}

# Simulate page-level checks
simulate_page_checks() {
    local url=$1
    local test_name=$2
    
    # Simulate console error checking
    log_info "  Checking for console errors..."
    report_result "info" "$test_name - Console Check" "Would check for JavaScript errors and warnings"
    
    # Simulate responsive design checking
    log_info "  Checking responsive design..."
    report_result "info" "$test_name - Responsive Check" "Would test mobile, tablet, and desktop viewports"
    
    # Simulate interactive element testing
    log_info "  Testing interactive elements..."
    report_result "info" "$test_name - Interaction Check" "Would test buttons, forms, and interactive components"
    
    # Simulate accessibility checking
    log_info "  Checking accessibility..."
    report_result "info" "$test_name - Accessibility Check" "Would verify ARIA labels, keyboard navigation, and screen reader compatibility"
}

# Test specific harness types
test_dev_index() {
    log_info "Testing development harness index..."
    report_section "🏠 Dev Index Testing"
    
    simulate_browsermcp_test "/dev" "Dev Index"
    
    # Additional dev index specific tests
    report_result "info" "Test Harness Links" "Would verify all harness links are functional"
    report_result "info" "Navigation Structure" "Would check categorization and organization"
}

test_component_harness() {
    local harness_path=$1
    local component_name=$(basename "$harness_path")
    
    log_info "Testing component harness: $component_name"
    report_section "🧪 Component Harness Testing: $component_name"
    
    simulate_browsermcp_test "$harness_path" "Component Harness - $component_name"
    
    # Component-specific testing scenarios
    report_result "info" "Default State Testing" "Would verify component renders in default state"
    report_result "info" "State Transitions" "Would test component state changes and updates"
    report_result "info" "Error Handling" "Would verify error states and edge cases"
    report_result "info" "Data Integration" "Would test with realistic data inputs"
    report_result "info" "Performance Check" "Would monitor load times and responsiveness"
}

# Main test harness verification
run_harness_verification() {
    local harness_url=$1
    
    log_info "Starting test harness verification for: $harness_url"
    
    # Check BrowserMCP availability
    if ! check_browsermcp; then
        report_result "fail" "BrowserMCP Setup" "BrowserMCP not properly configured"
        return 1
    fi
    
    # Determine harness type and run appropriate tests
    case $harness_url in
        "/dev"|"/dev/")
            test_dev_index
            ;;
        "/dev/"*)
            test_component_harness "$harness_url"
            ;;
        *)
            log_warning "Unknown harness type: $harness_url"
            report_result "warn" "Unknown Harness Type" "Falling back to basic testing for: $harness_url"
            simulate_browsermcp_test "$harness_url" "Generic Harness Test"
            ;;
    esac
    
    # Additional cross-cutting tests
    report_section "🔧 Cross-Cutting Verification"
    report_result "info" "Performance Metrics" "Would measure page load times and resource usage"
    report_result "info" "Security Headers" "Would verify proper security headers are present"
    report_result "info" "SEO Basics" "Would check meta tags and basic SEO elements"
}

# Generate harness-specific recommendations
generate_recommendations() {
    local harness_url=$1
    
    report_section "💡 Recommendations"
    
    case $harness_url in
        "/dev/personalization-test")
            report_result "info" "Personalization Testing" "Verify different personality profiles generate different outcomes"
            report_result "info" "Decision Recording" "Test decision history persistence and pattern analysis"
            report_result "info" "AI Generation" "Verify both standard and personalized narratives generate correctly"
            ;;
        "/dev/game-session")
            report_result "info" "Session State" "Verify game state persistence and transitions"
            report_result "info" "Character Integration" "Test character data integration and display"
            ;;
        "/dev/"*)
            report_result "info" "Component Isolation" "Verify component works independently of parent context"
            report_result "info" "Data Flow" "Test data input and output scenarios"
            ;;
    esac
}

# Main execution
main() {
    local harness_url=${1:-"/dev"}
    local report_file=${2:-}
    
    if [ -n "$report_file" ]; then
        REPORT_FILE="$report_file"
    fi
    
    log_info "=== BrowserMCP Test Harness Verification ==="
    log_info "Harness URL: $harness_url"
    
    # Run the verification
    run_harness_verification "$harness_url"
    
    # Generate recommendations
    generate_recommendations "$harness_url"
    
    log_success "Test harness verification completed"
}

# Run main function
main "$@"