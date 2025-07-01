#!/bin/bash

# Parallel Work Planner - Unified tool for analyzing and planning parallel development
# This script orchestrates all parallel work analysis tools to provide comprehensive recommendations
# Usage: ./parallel-work-planner.sh [command] [options]

set -e

# Configuration
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
DOCS_DIR="$PROJECT_ROOT/docs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print banner
print_banner() {
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                 PARALLEL WORK PLANNER                        ║${NC}"
    echo -e "${PURPLE}║              Intelligent Issue Analysis Tool                  ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Print usage information
usage() {
    print_banner
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  analyze [issues]       Analyze issues for parallel work safety"
    echo "  recommend [count]      Get recommended issue combinations"
    echo "  setup [issues]         Set up parallel work environment"
    echo "  monitor               Monitor active parallel work"
    echo "  guide                 Show parallel work planning guide"
    echo "  help                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 analyze 504,220     # Analyze specific issues"
    echo "  $0 recommend 3         # Get 3 recommended safe combinations"
    echo "  $0 setup 504,220       # Set up worktrees for parallel work"
    echo "  $0 monitor             # Show current parallel work status"
    echo "  $0 guide               # Open planning documentation"
    exit 1
}

# Analyze issues for parallel work safety
analyze_issues() {
    local issues="$1"
    
    echo -e "${BLUE}🔍 Analyzing issues for parallel work safety...${NC}"
    echo ""
    
    if [[ "$issues" == *","* ]]; then
        # Multiple issues - run batch analysis
        "$SCRIPTS_DIR/analyze-issue-dependencies.sh" --batch "$issues"
    else
        # Single issue - show detailed analysis
        "$SCRIPTS_DIR/analyze-issue-dependencies.sh" "$issues" --verbose
    fi
    
    echo ""
    echo -e "${CYAN}💡 Next Steps:${NC}"
    echo "  • Review the conflict risk assessment above"
    echo "  • For LOW risk combinations, use: $0 setup $issues"
    echo "  • For MEDIUM risk, coordinate carefully before starting"
    echo "  • For HIGH risk, work sequentially instead"
    echo ""
    echo -e "${YELLOW}📖 For detailed guidance: $0 guide${NC}"
}

# Get recommended issue combinations
recommend_combinations() {
    local count="${1:-3}"
    
    echo -e "${BLUE}🎯 Finding recommended parallel work combinations...${NC}"
    echo ""
    
    # Get open issues with priority labels
    echo -e "${YELLOW}Fetching open issues...${NC}"
    local open_issues
    if ! open_issues=$("$SCRIPTS_DIR/claude-github.sh" prs 2>/dev/null | jq -r '.[] | select(.state == "open") | .number' | head -10); then
        echo -e "${RED}Error: Could not fetch open issues${NC}"
        return 1
    fi
    
    if [[ -z "$open_issues" ]]; then
        echo -e "${YELLOW}No open issues found for analysis${NC}"
        return 0
    fi
    
    # Convert to comma-separated list for batch analysis
    local issue_list=$(echo "$open_issues" | tr '\n' ',' | sed 's/,$//')
    
    echo -e "${BLUE}Analyzing $(echo "$open_issues" | wc -l) open issues...${NC}"
    echo ""
    
    # Run batch analysis
    "$SCRIPTS_DIR/analyze-issue-dependencies.sh" --batch "$issue_list"
    
    echo ""
    echo -e "${GREEN}✅ Analysis complete!${NC}"
    echo -e "${CYAN}💡 Use the safe combinations shown above with: $0 setup [issues]${NC}"
}

# Set up parallel work environment
setup_parallel_work() {
    local issues="$1"
    
    if [[ -z "$issues" ]]; then
        echo -e "${RED}Error: Issues required for setup${NC}"
        echo "Usage: $0 setup [issue1,issue2,...]"
        return 1
    fi
    
    echo -e "${BLUE}🚀 Setting up parallel work environment...${NC}"
    echo ""
    
    # First, analyze for safety
    echo -e "${YELLOW}Step 1: Safety Analysis${NC}"
    analyze_issues "$issues"
    
    # Ask for confirmation if there are risks
    echo ""
    read -p "Do you want to proceed with setup? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Setup cancelled by user${NC}"
        return 0
    fi
    
    echo ""
    echo -e "${YELLOW}Step 2: Worktree Setup${NC}"
    
    # Use the parallel setup script
    "$SCRIPTS_DIR/parallel-claude-setup.sh" setup
    
    echo ""
    echo -e "${GREEN}✅ Parallel work environment ready!${NC}"
    echo ""
    echo -e "${CYAN}💡 Next Steps:${NC}"
    echo "  • Monitor progress with: $0 monitor"
    echo "  • Check individual worktrees with: ./scripts/worktree-helper.sh status"
    echo "  • Coordinate integration using the planning guide: $0 guide"
}

# Monitor active parallel work
monitor_parallel_work() {
    echo -e "${BLUE}📊 Monitoring active parallel work...${NC}"
    echo ""
    
    # Show worktree status
    echo -e "${YELLOW}Active Worktrees:${NC}"
    if ! "$SCRIPTS_DIR/worktree-helper.sh" status 2>/dev/null; then
        echo "  No active worktrees found"
    fi
    
    echo ""
    
    # Show YOLO container status if available
    echo -e "${YELLOW}YOLO Automation Status:${NC}"
    if [[ -f "$SCRIPTS_DIR/yolo-mode.sh" ]]; then
        if ! "$SCRIPTS_DIR/yolo-mode.sh" status 2>/dev/null; then
            echo "  No active YOLO containers"
        fi
    else
        echo "  YOLO mode not available"
    fi
    
    echo ""
    
    # Show automation status
    echo -e "${YELLOW}General Automation Status:${NC}"
    if [[ -f "$SCRIPTS_DIR/automation-status.sh" ]]; then
        "$SCRIPTS_DIR/automation-status.sh" 2>/dev/null || echo "  No automation status available"
    else
        echo "  Automation status not available"
    fi
    
    echo ""
    echo -e "${CYAN}💡 Monitoring Tips:${NC}"
    echo "  • Check for file conflicts regularly: git status in each worktree"
    echo "  • Keep branches updated: git fetch origin develop"
    echo "  • Coordinate integration: merge simpler changes first"
}

# Show parallel work planning guide
show_guide() {
    echo -e "${BLUE}📖 Opening Parallel Work Planning Guide...${NC}"
    echo ""
    
    local guide_file="$DOCS_DIR/development/workflows/parallel-work-planning-guide.md"
    local safety_file="$DOCS_DIR/development/workflows/yolo-safe-issues.md"
    local audit_file="$DOCS_DIR/development/workflows/parallel-work-analysis-audit.md"
    
    echo -e "${YELLOW}Available Documentation:${NC}"
    echo ""
    
    if [[ -f "$guide_file" ]]; then
        echo -e "${GREEN}📋 Parallel Work Planning Guide:${NC}"
        echo "   $guide_file"
        echo "   Comprehensive guide for planning and executing parallel work"
        echo ""
    fi
    
    if [[ -f "$safety_file" ]]; then
        echo -e "${GREEN}🛡️  YOLO Safe Issues Classification:${NC}"
        echo "   $safety_file"
        echo "   Criteria for identifying safe parallel work combinations"
        echo ""
    fi
    
    if [[ -f "$audit_file" ]]; then
        echo -e "${GREEN}🔍 Parallel Work Analysis Audit:${NC}"
        echo "   $audit_file"
        echo "   Complete audit of available tools and capabilities"
        echo ""
    fi
    
    echo -e "${CYAN}💡 Quick Start Guide:${NC}"
    echo ""
    echo "1. Analyze issues: $0 analyze [issue1,issue2,...]"
    echo "2. Get recommendations: $0 recommend"
    echo "3. Set up environment: $0 setup [safe-issues]"
    echo "4. Monitor progress: $0 monitor"
    echo ""
    echo -e "${YELLOW}For detailed documentation, open the files above in your editor${NC}"
}

# Main execution
main() {
    local command="$1"
    shift || true
    
    case "$command" in
        "analyze")
            if [[ -z "$1" ]]; then
                echo -e "${RED}Error: Issues required for analysis${NC}"
                echo "Usage: $0 analyze [issue1,issue2,...]"
                exit 1
            fi
            analyze_issues "$1"
            ;;
        "recommend")
            recommend_combinations "$1"
            ;;
        "setup")
            setup_parallel_work "$1"
            ;;
        "monitor")
            monitor_parallel_work
            ;;
        "guide")
            show_guide
            ;;
        "help"|""|*)
            usage
            ;;
    esac
}

# Execute main function with all arguments
main "$@"