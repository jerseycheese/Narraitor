#!/bin/bash
# Narraitor Worktree Helper Script

NARRAITOR_MAIN="/Users/jackhaas/Projects/narraitor"
WORKTREE_DIR="/Users/jackhaas/Projects/narraitor-worktrees"

# Source color functions if available
if [ -f "$NARRAITOR_MAIN/scripts/utils/colors.sh" ]; then
    source "$NARRAITOR_MAIN/scripts/utils/colors.sh"
else
    # Fallback colors
    GREEN='\033[0;32m'
    RED='\033[0;31m'
    BLUE='\033[0;34m'
    YELLOW='\033[0;33m'
    NC='\033[0m' # No Color
fi

# Function to create a new worktree
create_worktree() {
    if [ "$#" -ne 2 ]; then
        echo "Usage: create_worktree <issue-number> <short-description>"
        echo "Example: create_worktree 504 portrait-caching"
        return 1
    fi
    
    local issue_number=$1
    local description=$2
    local branch_name="feature/issue-${issue_number}-${description}"
    local worktree_path="${WORKTREE_DIR}/issue-${issue_number}-${description}"
    
    echo -e "${BLUE}Creating worktree for issue #${issue_number}...${NC}"
    cd "$NARRAITOR_MAIN"
    
    # Check if worktree already exists
    if [ -d "$worktree_path" ]; then
        echo -e "${YELLOW}⚠️  Worktree already exists at: $worktree_path${NC}"
        echo "Use 'switch $issue_number' to navigate there"
        return 1
    fi
    
    # Fetch latest from origin
    echo -e "${BLUE}Fetching latest from origin...${NC}"
    git fetch origin
    
    # Create the worktree with a new branch
    git worktree add -b "$branch_name" "$worktree_path" origin/main
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Worktree created successfully!${NC}"
        echo -e "${GREEN}📁 Location: $worktree_path${NC}"
        
        # Run npm install in the worktree
        echo -e "${BLUE}Installing dependencies...${NC}"
        cd "$worktree_path"
        npm install
        
        # Create a .env.local if it doesn't exist
        if [ ! -f ".env.local" ] && [ -f "$NARRAITOR_MAIN/.env.local" ]; then
            cp "$NARRAITOR_MAIN/.env.local" ".env.local"
            echo -e "${GREEN}✅ Copied .env.local${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}🎯 Next steps:${NC}"
        echo -e "  1. ${BLUE}cd $worktree_path${NC}"
        echo -e "  2. ${BLUE}./scripts/claude-github.sh issue $issue_number${NC} (to review issue)"
        echo -e "  3. ${BLUE}claude${NC} (to start Claude Code)"
        echo -e "  4. ${BLUE}npm run dev${NC} (to start dev server)"
    else
        echo -e "${RED}❌ Failed to create worktree${NC}"
    fi
}

# Function to list all Narraitor worktrees
list_worktrees() {
    echo -e "${BLUE}📋 Current Narraitor worktrees:${NC}"
    cd "$NARRAITOR_MAIN"
    
    # Get worktree info
    while IFS= read -r line; do
        if [[ "$line" == *"$WORKTREE_DIR"* ]]; then
            # Extract path and branch
            path=$(echo "$line" | awk '{print $1}')
            branch=$(echo "$line" | grep -o '\[.*\]' | tr -d '[]')
            issue_num=$(echo "$path" | grep -o 'issue-[0-9]*' | grep -o '[0-9]*')
            
            echo -e "${GREEN}Issue #$issue_num${NC} - $branch"
            echo -e "  📁 $path"
            
            # Check if there are uncommitted changes
            if cd "$path" 2>/dev/null && [[ -n $(git status --porcelain) ]]; then
                echo -e "  ${YELLOW}⚠️  Has uncommitted changes${NC}"
            fi
            echo ""
        elif [[ "$line" == *"$NARRAITOR_MAIN"* ]]; then
            echo -e "${BLUE}Main Repository:${NC}"
            echo -e "  📁 $line"
            echo ""
        fi
    done < <(git worktree list)
}

# Function to switch to a worktree
switch_to_worktree() {
    if [ "$#" -ne 1 ]; then
        echo "Usage: switch_to_worktree <issue-number>"
        return 1
    fi
    
    local issue_number=$1
    local worktree_path=$(find "$WORKTREE_DIR" -name "issue-${issue_number}-*" -type d | head -1)
    
    if [ -n "$worktree_path" ]; then
        echo -e "${BLUE}📂 Switching to: $worktree_path${NC}"
        cd "$worktree_path"
        
        # Show status
        echo -e "\n${BLUE}Current branch:${NC}"
        git branch --show-current
        
        echo -e "\n${BLUE}Git status:${NC}"
        git status --short
        
        echo -e "\n${GREEN}Ready to work!${NC}"
        echo -e "Run ${BLUE}claude${NC} to start Claude Code"
        echo -e "Run ${BLUE}/project:do-issue-auto $issue_number${NC} for automated implementation"
        
        # Start new shell in worktree
        exec $SHELL
    else
        echo -e "${RED}❌ No worktree found for issue #${issue_number}${NC}"
        echo -e "${YELLOW}Available worktrees:${NC}"
        list_worktrees
    fi
}

# Function to remove a completed worktree
remove_worktree() {
    if [ "$#" -ne 1 ]; then
        echo "Usage: remove_worktree <issue-number>"
        return 1
    fi
    
    local issue_number=$1
    local worktree_path=$(find "$WORKTREE_DIR" -name "issue-${issue_number}-*" -type d | head -1)
    
    if [ -n "$worktree_path" ]; then
        echo -e "${YELLOW}🗑️  Removing worktree for issue #${issue_number}...${NC}"
        cd "$NARRAITOR_MAIN"
        
        # Get branch name before removal
        local branch_name=$(git worktree list | grep "$worktree_path" | grep -o '\[.*\]' | tr -d '[]')
        
        # Remove worktree
        git worktree remove "$worktree_path"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Worktree removed${NC}"
            
            # Ask about branch deletion
            echo -e "${YELLOW}Delete branch '$branch_name'? (y/n)${NC}"
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                git branch -d "$branch_name" 2>/dev/null || git branch -D "$branch_name"
                echo -e "${GREEN}✅ Branch deleted${NC}"
            fi
        fi
    else
        echo -e "${RED}❌ No worktree found for issue #${issue_number}${NC}"
    fi
}

# Function to show quick status of all worktrees
status_all() {
    echo -e "${BLUE}🔍 Worktree Status Overview${NC}"
    echo -e "${BLUE}═══════════════════════════${NC}"
    
    local count=0
    while IFS= read -r line; do
        if [[ "$line" == *"$WORKTREE_DIR"* ]]; then
            ((count++))
            path=$(echo "$line" | awk '{print $1}')
            branch=$(echo "$line" | grep -o '\[.*\]' | tr -d '[]')
            issue_num=$(echo "$path" | grep -o 'issue-[0-9]*' | grep -o '[0-9]*')
            
            echo -e "\n${GREEN}Issue #$issue_num${NC}"
            
            # Check git status
            if cd "$path" 2>/dev/null; then
                local changes=$(git status --porcelain | wc -l)
                local ahead_behind=$(git status --branch --porcelain | head -1)
                
                if [[ $changes -gt 0 ]]; then
                    echo -e "  ${YELLOW}⚠️  $changes uncommitted changes${NC}"
                else
                    echo -e "  ${GREEN}✓ Clean working directory${NC}"
                fi
                
                if [[ "$ahead_behind" == *"ahead"* ]]; then
                    echo -e "  ${YELLOW}↑ Commits not pushed${NC}"
                fi
                
                # Check if Claude Code might be running
                if lsof -p $(ps aux | grep "claude.*$issue_num" | grep -v grep | awk '{print $2}') >/dev/null 2>&1; then
                    echo -e "  ${BLUE}🤖 Claude Code may be active${NC}"
                fi
            fi
        fi
    done < <(git worktree list)
    
    cd "$NARRAITOR_MAIN"
    echo -e "\n${BLUE}Total active worktrees: $count${NC}"
}

# Function to launch Claude Code in a worktree
launch_claude() {
    if [ "$#" -ne 1 ]; then
        echo "Usage: launch <issue-number>"
        return 1
    fi
    
    local issue_number=$1
    local worktree_path=$(find "$WORKTREE_DIR" -name "issue-${issue_number}-*" -type d | head -1)
    
    if [ -n "$worktree_path" ]; then
        echo -e "${BLUE}🚀 Launching Claude Code for issue #${issue_number}...${NC}"
        cd "$worktree_path"
        
        # Create a suggested command file
        echo "/project:do-issue-auto $issue_number" > .claude-command.txt
        
        echo -e "${GREEN}Opening new terminal in: $worktree_path${NC}"
        echo -e "${YELLOW}Suggested command: /project:do-issue-auto $issue_number${NC}"
        
        # Platform-specific terminal launch
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            osascript -e "tell app \"Terminal\" to do script \"cd '$worktree_path' && echo 'Issue #$issue_number - Ready for Claude Code' && echo 'Run: claude' && echo 'Then: /project:do-issue-auto $issue_number'\""
        else
            # Linux - try common terminal emulators
            if command -v gnome-terminal &> /dev/null; then
                gnome-terminal --working-directory="$worktree_path" &
            elif command -v konsole &> /dev/null; then
                konsole --workdir "$worktree_path" &
            elif command -v xterm &> /dev/null; then
                xterm -e "cd '$worktree_path' && $SHELL" &
            else
                echo -e "${YELLOW}Could not auto-launch terminal. Please open manually.${NC}"
            fi
        fi
    else
        echo -e "${RED}❌ No worktree found for issue #${issue_number}${NC}"
    fi
}

# Main menu
if [ "$#" -eq 0 ]; then
    echo -e "${BLUE}Narraitor Worktree Helper${NC}"
    echo -e "${BLUE}════════════════════════${NC}"
    echo "Commands:"
    echo "  create <issue-number> <description>  - Create new worktree"
    echo "  list                                 - List all worktrees"
    echo "  status                               - Show status overview"
    echo "  switch <issue-number>               - Switch to worktree"
    echo "  remove <issue-number>               - Remove worktree"
    echo "  launch <issue-number>               - Launch terminal for Claude Code"
    echo ""
    echo "Example workflow:"
    echo "  $0 create 501 portrait-generation"
    echo "  $0 launch 501"
    echo "  # In new terminal: claude"
    echo "  # Then: /project:do-issue-auto 501"
    exit 0
fi

# Process commands
case "$1" in
    create)
        shift
        create_worktree "$@"
        ;;
    list)
        list_worktrees
        ;;
    status)
        status_all
        ;;
    switch)
        shift
        switch_to_worktree "$@"
        ;;
    remove)
        shift
        remove_worktree "$@"
        ;;
    launch)
        shift
        launch_claude "$@"
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo "Run without arguments to see usage"
        exit 1
        ;;
esac
