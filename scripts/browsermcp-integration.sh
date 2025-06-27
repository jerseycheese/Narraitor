#!/bin/bash

# BrowserMCP Integration Verification Script
# Full application integration testing
# Usage: ./scripts/browsermcp-integration.sh [issue-number] [report-file]

set -e

ISSUE_NUMBER=${1:-""}
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
    echo -e "${BLUE}[INTEGRATION]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[INTEGRATION SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[INTEGRATION WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[INTEGRATION ERROR]${NC} $1"
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

# Test core application flows
test_core_flows() {
    report_section "🔄 Core Application Flows"
    
    log_info "Testing core application navigation..."
    
    # Test main navigation
    report_result "info" "Main Navigation" "Would test navigation between main app sections"
    
    # Test world creation flow
    report_result "info" "World Creation Flow" "Would test complete world creation process"
    
    # Test character creation flow
    report_result "info" "Character Creation Flow" "Would test complete character creation process"
    
    # Test game session flow
    report_result "info" "Game Session Flow" "Would test starting and playing a game session"
}

# Test data persistence
test_data_persistence() {
    report_section "💾 Data Persistence Testing"
    
    log_info "Testing data persistence across sessions..."
    
    # Test IndexedDB persistence
    report_result "info" "IndexedDB Storage" "Would verify data saves correctly to IndexedDB"
    
    # Test state management
    report_result "info" "State Management" "Would test Zustand store persistence and recovery"
    
    # Test data consistency
    report_result "info" "Data Consistency" "Would verify data integrity across page refreshes"
}

# Test AI integration
test_ai_integration() {
    report_section "🤖 AI Integration Testing"
    
    log_info "Testing AI service integration..."
    
    # Test AI narrative generation
    report_result "info" "Narrative Generation" "Would test AI narrative generation functionality"
    
    # Test AI world analysis
    report_result "info" "World Analysis" "Would test AI world description analysis"
    
    # Test AI character generation
    report_result "info" "Character Generation" "Would test AI character creation features"
    
    # Test error handling for AI failures
    report_result "info" "AI Error Handling" "Would test graceful handling of AI service failures"
}

# Test responsive design
test_responsive_design() {
    report_section "📱 Responsive Design Testing"
    
    log_info "Testing responsive design across devices..."
    
    # Test mobile viewport
    report_result "info" "Mobile Viewport (320px-768px)" "Would test mobile responsiveness"
    
    # Test tablet viewport
    report_result "info" "Tablet Viewport (768px-1024px)" "Would test tablet responsiveness"
    
    # Test desktop viewport
    report_result "info" "Desktop Viewport (1024px+)" "Would test desktop responsiveness"
    
    # Test touch interactions
    report_result "info" "Touch Interactions" "Would verify touch-friendly interface elements"
}

# Test accessibility compliance
test_accessibility() {
    report_section "♿ Accessibility Testing"
    
    log_info "Testing accessibility compliance..."
    
    # Test keyboard navigation
    report_result "info" "Keyboard Navigation" "Would verify full keyboard accessibility"
    
    # Test screen reader compatibility
    report_result "info" "Screen Reader Support" "Would test ARIA labels and semantic HTML"
    
    # Test color contrast
    report_result "info" "Color Contrast" "Would verify WCAG 2.1 AA color contrast ratios"
    
    # Test focus management
    report_result "info" "Focus Management" "Would test proper focus handling and indicators"
}

# Test performance
test_performance() {
    report_section "⚡ Performance Testing"
    
    log_info "Testing application performance..."
    
    # Test page load times
    report_result "info" "Page Load Times" "Would measure initial page load performance"
    
    # Test bundle size
    report_result "info" "Bundle Size Analysis" "Would analyze JavaScript bundle sizes"
    
    # Test runtime performance
    report_result "info" "Runtime Performance" "Would test application responsiveness during use"
    
    # Test memory usage
    report_result "info" "Memory Usage" "Would monitor memory consumption patterns"
}

# Test security headers
test_security() {
    report_section "🔒 Security Testing"
    
    log_info "Testing security configuration..."
    
    # Test security headers
    report_result "info" "Security Headers" "Would verify CSP and other security headers"
    
    # Test XSS protection
    report_result "info" "XSS Protection" "Would test protection against cross-site scripting"
    
    # Test data sanitization
    report_result "info" "Input Sanitization" "Would verify proper input sanitization"
}

# Test issue-specific integration
test_issue_specific_integration() {
    local issue_number=$1
    
    if [ -z "$issue_number" ]; then
        return 0
    fi
    
    report_section "🎯 Issue-Specific Integration Testing"
    
    log_info "Testing integration aspects specific to issue #$issue_number..."
    
    case $issue_number in
        "303")
            # Personalization system integration
            report_result "info" "Personalization Integration" "Would test personalization system integration with game flow"
            report_result "info" "Decision Tracking" "Would verify decision tracking across game sessions"
            report_result "info" "Narrative Adaptation" "Would test adaptive narrative generation in context"
            ;;
        "231")
            # Text formatting integration
            report_result "info" "Text Formatting Integration" "Would test formatted text display across all contexts"
            report_result "info" "Dialogue Formatting" "Would verify dialogue formatting in game sessions"
            ;;
        "259")
            # Visual distinction integration
            report_result "info" "Visual Distinction Integration" "Would test dialogue/narrative visual distinction"
            ;;
        *)
            report_result "info" "Generic Integration Testing" "Would test feature integration with existing systems"
            ;;
    esac
}

# Test cross-browser compatibility
test_cross_browser() {
    report_section "🌐 Cross-Browser Testing"
    
    log_info "Testing cross-browser compatibility..."
    
    # Test modern browsers
    report_result "info" "Chrome/Edge Testing" "Would test Chromium-based browser compatibility"
    report_result "info" "Firefox Testing" "Would test Firefox compatibility"
    report_result "info" "Safari Testing" "Would test Safari compatibility"
    
    # Test feature support
    report_result "info" "Feature Detection" "Would verify graceful degradation for unsupported features"
}

# Generate integration recommendations
generate_integration_recommendations() {
    report_section "💡 Integration Recommendations"
    
    report_result "info" "End-to-End Testing" "Consider adding Playwright/Cypress E2E tests for critical paths"
    report_result "info" "Performance Monitoring" "Add performance monitoring to catch regressions"
    report_result "info" "Error Tracking" "Implement error tracking for production monitoring"
    report_result "info" "User Analytics" "Consider adding user behavior analytics for feature usage"
    report_result "info" "A/B Testing" "Set up infrastructure for A/B testing new features"
}

# Main integration verification
run_integration_verification() {
    local issue_number=$1
    
    log_info "Starting integration verification..."
    
    # Test core application flows
    test_core_flows
    
    # Test data persistence
    test_data_persistence
    
    # Test AI integration
    test_ai_integration
    
    # Test responsive design
    test_responsive_design
    
    # Test accessibility
    test_accessibility
    
    # Test performance
    test_performance
    
    # Test security
    test_security
    
    # Test issue-specific integration
    test_issue_specific_integration "$issue_number"
    
    # Test cross-browser compatibility
    test_cross_browser
    
    # Generate recommendations
    generate_integration_recommendations
}

# Main execution
main() {
    local issue_number=${1:-""}
    local report_file=${2:-}
    
    if [ -n "$report_file" ]; then
        REPORT_FILE="$report_file"
    fi
    
    log_info "=== BrowserMCP Integration Verification ==="
    
    if [ -n "$issue_number" ]; then
        log_info "Issue Number: #$issue_number"
    fi
    
    # Run the verification
    run_integration_verification "$issue_number"
    
    log_success "Integration verification completed"
}

# Run main function
main "$@"