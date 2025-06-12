#!/bin/bash
# Batch worktree setup for parallel Claude Code sessions

# Source the main worktree helper
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/worktree-helper.sh" >/dev/null 2>&1

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Narraitor Parallel Development Setup${NC}"
echo -e "${BLUE}═════════════════════════════════════${NC}"

# Function to setup multiple worktrees
batch_setup() {
    echo -e "\n${YELLOW}How many issues would you like to work on in parallel?${NC}"
    read -p "Number of issues (1-5): " num_issues
    
    if ! [[ "$num_issues" =~ ^[1-5]$ ]]; then
        echo -e "${RED}Please enter a number between 1 and 5${NC}"
        return 1
    fi
    
    local issues=()
    
    echo -e "\n${YELLOW}Enter the issue numbers:${NC}"
    for ((i=1; i<=num_issues; i++)); do
        read -p "Issue #$i: " issue_num
        read -p "Short description for #$issue_num: " desc
        issues+=("$issue_num:$desc")
    done
    
    echo -e "\n${BLUE}Creating worktrees...${NC}"
    for issue_data in "${issues[@]}"; do
        IFS=':' read -r issue_num desc <<< "$issue_data"
        create_worktree "$issue_num" "$desc"
        echo ""
    done
    
    echo -e "${GREEN}✅ All worktrees created!${NC}"
    echo -e "\n${BLUE}Next steps:${NC}"
    
    local port=3000
    for issue_data in "${issues[@]}"; do
        IFS=':' read -r issue_num desc <<< "$issue_data"
        echo -e "\n${YELLOW}Terminal $issue_num:${NC}"
        echo "  cd $WORKTREE_DIR/issue-$issue_num-$desc"
        echo "  claude"
        echo "  > /project:do-issue-auto $issue_num"
        if [ $port -ne 3000 ]; then
            echo "  # Dev server: npm run dev -- --port $port"
        else
            echo "  # Dev server: npm run dev"
        fi
        ((port++))
    done
}

# Function to show parallel workflow tips
show_tips() {
    echo -e "\n${BLUE}💡 Parallel Development Tips${NC}"
    echo -e "${BLUE}═══════════════════════════${NC}"
    
    echo -e "\n${YELLOW}1. Terminal Organization:${NC}"
    echo "   - Use iTerm2 split panes or tmux for multiple terminals"
    echo "   - Label each terminal with the issue number"
    echo "   - Keep one terminal for the main repo (PR reviews)"
    
    echo -e "\n${YELLOW}2. Port Management:${NC}"
    echo "   - Issue 1: npm run dev (port 3000)"
    echo "   - Issue 2: npm run dev -- --port 3001"
    echo "   - Issue 3: npm run dev -- --port 3002"
    echo "   - Storybook: Similar pattern (6006, 6007, 6008)"
    
    echo -e "\n${YELLOW}3. Verification Workflow:${NC}"
    echo "   - Check '${BLUE}$0 status${NC}' to see which need verification"
    echo "   - Open browser tabs for each dev server"
    echo "   - Verify in parallel, then type VERIFIED"
    
    echo -e "\n${YELLOW}4. Resource Usage:${NC}"
    echo "   - Each worktree uses ~500MB for node_modules"
    echo "   - Monitor CPU if running multiple builds"
    echo "   - Close dev servers when not actively testing"
}

# Function to check system readiness
check_readiness() {
    echo -e "\n${BLUE}🔍 System Readiness Check${NC}"
    echo -e "${BLUE}════════════════════════${NC}"
    
    # Check if main repo exists
    if [ ! -d "$NARRAITOR_MAIN/.git" ]; then
        echo -e "${RED}❌ Main repository not found at: $NARRAITOR_MAIN${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ Main repository found${NC}"
    
    # Check if worktree directory exists
    if [ ! -d "$WORKTREE_DIR" ]; then
        echo -e "${YELLOW}Creating worktree directory...${NC}"
        mkdir -p "$WORKTREE_DIR"
    fi
    echo -e "${GREEN}✓ Worktree directory ready${NC}"
    
    # Check for Claude Code
    if command -v claude &> /dev/null; then
        echo -e "${GREEN}✓ Claude Code installed${NC}"
    else
        echo -e "${YELLOW}⚠️  Claude Code not found in PATH${NC}"
        echo "  Install from: https://claude.ai/download"
    fi
    
    # Check for required commands
    if [ -f "$NARRAITOR_MAIN/.claude/commands/do-issue-auto.md" ]; then
        echo -e "${GREEN}✓ do-issue-auto command available${NC}"
    else
        echo -e "${RED}❌ do-issue-auto command not found${NC}"
        echo "  Expected at: $NARRAITOR_MAIN/.claude/commands/do-issue-auto.md"
    fi
    
    # Check available disk space
    available_space=$(df -h "$WORKTREE_DIR" | awk 'NR==2 {print $4}')
    echo -e "${BLUE}ℹ️  Available disk space: $available_space${NC}"
    
    # Show current worktrees
    cd "$NARRAITOR_MAIN"
    local worktree_count=$(git worktree list | grep -c "$WORKTREE_DIR")
    if [ $worktree_count -gt 0 ]; then
        echo -e "${YELLOW}📊 Existing worktrees: $worktree_count${NC}"
    fi
}

# Main menu
case "${1:-menu}" in
    setup)
        check_readiness
        batch_setup
        ;;
    tips)
        show_tips
        ;;
    check)
        check_readiness
        ;;
    menu|*)
        echo ""
        echo "Commands:"
        echo "  ${BLUE}setup${NC}  - Set up multiple worktrees for parallel work"
        echo "  ${BLUE}check${NC}  - Check system readiness"
        echo "  ${BLUE}tips${NC}   - Show parallel development tips"
        echo ""
        echo "Quick start:"
        echo "  ${GREEN}$0 setup${NC}"
        ;;
esac
