#!/bin/bash
# Example: Process This Week's Issues in YOLO Mode

set -e

# Configuration
MAX_PARALLEL=3
NARRAITOR_DIR="/Users/jackhaas/Projects/narraitor"
WORKTREE_DIR="/Users/jackhaas/Projects/narraitor-worktrees"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🚀 Narraitor Weekly YOLO Processing${NC}"
echo -e "${PURPLE}══════════════════════════════════${NC}"

# Step 1: Get open issues
echo -e "\n${BLUE}📋 Fetching open issues...${NC}"
cd "$NARRAITOR_DIR"

# This would normally fetch from GitHub
# For demo, using example issues
ISSUES=(510 511 512 513 514)

echo -e "${GREEN}Found ${#ISSUES[@]} issues to process${NC}"

# Step 2: Create worktrees for all issues
echo -e "\n${BLUE}🌳 Creating worktrees...${NC}"
for issue in "${ISSUES[@]}"; do
    if [ ! -d "$WORKTREE_DIR/issue-$issue-"* ]; then
        echo -e "Creating worktree for issue #$issue"
        ./scripts/worktree-helper.sh create "$issue" "yolo-week-$(date +%U)"
    else
        echo -e "${YELLOW}Worktree for issue #$issue already exists${NC}"
    fi
done

# Step 3: Build YOLO Docker image if needed
echo -e "\n${BLUE}🐳 Preparing Docker environment...${NC}"
if ! docker images | grep -q "narraitor-yolo.*latest"; then
    docker build -t narraitor-yolo:latest -f .claude/docker/Dockerfile.yolo .
fi

# Step 4: Launch YOLO containers with parallelism control
echo -e "\n${PURPLE}🚀 Launching YOLO mode with max $MAX_PARALLEL parallel containers${NC}"

process_issue() {
    local issue=$1
    echo -e "${BLUE}Starting YOLO for issue #$issue${NC}"
    ./scripts/yolo-mode.sh launch "$issue"
    
    # Wait for container to finish
    while docker ps | grep -q "claude-yolo-$issue"; do
        sleep 30
    done
    
    # Check exit status
    if docker ps -a | grep "claude-yolo-$issue" | grep -q "Exited (0)"; then
        echo -e "${GREEN}✅ Issue #$issue completed successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Issue #$issue may have encountered issues${NC}"
    fi
}

# Export function for parallel execution
export -f process_issue
export GREEN BLUE YELLOW PURPLE NC

# Use GNU parallel if available, otherwise fall back to sequential
if command -v parallel &> /dev/null; then
    echo -e "${GREEN}Using GNU parallel for concurrent execution${NC}"
    printf '%s\n' "${ISSUES[@]}" | parallel -j "$MAX_PARALLEL" process_issue {}
else
    echo -e "${YELLOW}GNU parallel not found, processing sequentially${NC}"
    for issue in "${ISSUES[@]}"; do
        process_issue "$issue"
    done
fi

# Step 5: Summary report
echo -e "\n${BLUE}📊 YOLO Processing Summary${NC}"
echo -e "${BLUE}═════════════════════════${NC}"

successful=0
failed=0

for issue in "${ISSUES[@]}"; do
    if docker ps -a | grep "claude-yolo-$issue" | grep -q "Exited (0)"; then
        ((successful++))
        echo -e "${GREEN}✅ Issue #$issue: Success${NC}"
    else
        ((failed++))
        echo -e "${YELLOW}⚠️  Issue #$issue: Needs review${NC}"
    fi
done

echo -e "\n${BLUE}Results:${NC}"
echo -e "  Successful: ${GREEN}$successful${NC}"
echo -e "  Need Review: ${YELLOW}$failed${NC}"
echo -e "  Success Rate: ${GREEN}$(( successful * 100 / ${#ISSUES[@]} ))%${NC}"

# Step 6: Cleanup option
echo -e "\n${YELLOW}Clean up completed containers? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    for issue in "${ISSUES[@]}"; do
        if docker ps -a | grep "claude-yolo-$issue" | grep -q "Exited"; then
            docker rm "claude-yolo-$issue" 2>/dev/null || true
        fi
    done
    echo -e "${GREEN}✅ Cleanup complete${NC}"
fi

echo -e "\n${PURPLE}🎉 YOLO processing complete!${NC}"
echo -e "${BLUE}Check your GitHub PRs for review${NC}"

# Optional: Open GitHub PR page
echo -e "\n${YELLOW}Open GitHub PR page? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    open "https://github.com/jerseycheese/narraitor/pulls"
fi
