#!/bin/bash
# Narraitor Safe YOLO Mode Script
# Combines worktrees with containerized Claude Code for autonomous development

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NARRAITOR_MAIN="/Users/jackhaas/Projects/narraitor"
WORKTREE_DIR="/Users/jackhaas/Projects/narraitor-worktrees"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Function to show usage
show_usage() {
    echo -e "${BLUE}Narraitor Safe YOLO Mode${NC}"
    echo -e "${BLUE}═══════════════════════${NC}"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  setup <issue> <desc>    - Create worktree and prepare YOLO container"
    echo "  launch <issue>          - Launch YOLO mode for an issue"
    echo "  status                  - Show status of all YOLO containers"
    echo "  logs <issue>            - Show logs for a YOLO container"
    echo "  stop <issue>            - Stop a YOLO container"
    echo "  cleanup <issue>         - Remove container and worktree"
    echo "  batch <issue1,issue2>   - Process multiple issues in parallel"
    echo ""
    echo "Examples:"
    echo "  $0 setup 501 portrait-generation"
    echo "  $0 launch 501"
    echo "  $0 batch 501,502,503"
}

# Function to check prerequisites
check_prerequisites() {
    local missing=()
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing+=("docker")
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker daemon is not running${NC}"
        echo "Please start Docker Desktop or the Docker daemon"
        return 1
    fi
    
    # Check main repo
    if [ ! -d "$NARRAITOR_MAIN/.git" ]; then
        echo -e "${RED}❌ Main repository not found at: $NARRAITOR_MAIN${NC}"
        return 1
    fi
    
    # Check for do-issue-auto-noverify command
    if [ ! -f "$NARRAITOR_MAIN/.claude/commands/do-issue-auto-noverify.md" ]; then
        echo -e "${YELLOW}⚠️  do-issue-auto-noverify.md not found${NC}"
        echo "This is required for YOLO mode"
        return 1
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing prerequisites: ${missing[*]}${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
    return 0
}

# Function to setup YOLO worktree
setup_yolo_worktree() {
    local issue_number=$1
    local description=$2
    
    if [ -z "$issue_number" ] || [ -z "$description" ]; then
        echo -e "${RED}Usage: setup <issue-number> <description>${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🔧 Setting up YOLO worktree for issue #$issue_number${NC}"
    
    # Create regular worktree first
    cd "$NARRAITOR_MAIN"
    ./scripts/worktree-helper.sh create "$issue_number" "$description"
    
    local worktree_path="$WORKTREE_DIR/issue-$issue_number-$description"
    
    # Build Docker image if needed
    echo -e "${BLUE}🐳 Building Docker image...${NC}"
    docker build -t "narraitor-yolo:latest" \
        -f "$NARRAITOR_MAIN/.claude/docker/Dockerfile.yolo" \
        "$NARRAITOR_MAIN"
    
    # Create container-specific image with dependencies
    docker build -t "narraitor-yolo-$issue_number:latest" \
        -f "$NARRAITOR_MAIN/.claude/docker/Dockerfile.yolo" \
        "$worktree_path"
    
    echo -e "${GREEN}✅ YOLO worktree ready for issue #$issue_number${NC}"
    echo -e "${YELLOW}Next step: $0 launch $issue_number${NC}"
}

# Function to launch YOLO mode
launch_yolo() {
    local issue_number=$1
    
    if [ -z "$issue_number" ]; then
        echo -e "${RED}Usage: launch <issue-number>${NC}"
        return 1
    fi
    
    # Find worktree path
    local worktree_path=$(find "$WORKTREE_DIR" -name "issue-${issue_number}-*" -type d | head -1)
    
    if [ -z "$worktree_path" ]; then
        echo -e "${RED}❌ No worktree found for issue #$issue_number${NC}"
        echo -e "${YELLOW}Run: $0 setup $issue_number <description> first${NC}"
        return 1
    fi
    
    echo -e "${PURPLE}🚀 Launching YOLO mode for issue #$issue_number${NC}"
    echo -e "${YELLOW}Container will run with:${NC}"
    echo -e "  • No network access (--network none)"
    echo -e "  • No permission prompts (--dangerously-skip-permissions)"
    echo -e "  • Isolated environment"
    echo -e "  • Automatic implementation and PR creation"
    
    # Run Docker container
    docker run -d \
        --name "claude-yolo-$issue_number" \
        -v "$worktree_path:/app" \
        -v "$HOME/.claude:/home/claude/.claude:ro" \
        -v "$HOME/.gitconfig:/home/claude/.gitconfig:ro" \
        -v "$HOME/.ssh:/home/claude/.ssh:ro" \
        -e "ISSUE_NUMBER=$issue_number" \
        -e "GEMINI_API_KEY=${GEMINI_API_KEY:-mock}" \
        --network none \
        "narraitor-yolo-$issue_number:latest" \
        sh -c "cd /app && claude --dangerously-skip-permissions /project:do-issue-auto-noverify $issue_number"
    
    echo -e "${GREEN}✅ YOLO container started${NC}"
    echo -e "${YELLOW}Monitor with: $0 logs $issue_number${NC}"
}

# Function to show container status
show_status() {
    echo -e "${BLUE}📊 YOLO Container Status${NC}"
    echo -e "${BLUE}═══════════════════════${NC}"
    
    # Get all YOLO containers
    local containers=$(docker ps -a --filter "name=claude-yolo-" --format "table {{.Names}}\t{{.Status}}\t{{.CreatedAt}}")
    
    if [ -z "$containers" ]; then
        echo -e "${YELLOW}No YOLO containers found${NC}"
    else
        echo "$containers"
    fi
    
    echo ""
    echo -e "${BLUE}Worktree Git Status:${NC}"
    
    # Check git status for each worktree
    while IFS= read -r container; do
        if [[ "$container" =~ claude-yolo-([0-9]+) ]]; then
            local issue_num="${BASH_REMATCH[1]}"
            local worktree_path=$(find "$WORKTREE_DIR" -name "issue-${issue_num}-*" -type d | head -1)
            
            if [ -n "$worktree_path" ] && [ -d "$worktree_path" ]; then
                echo -e "\n${GREEN}Issue #$issue_num:${NC}"
                cd "$worktree_path" 2>/dev/null
                local branch=$(git branch --show-current 2>/dev/null)
                local changes=$(git status --porcelain 2>/dev/null | wc -l)
                echo -e "  Branch: $branch"
                echo -e "  Changes: $changes files"
            fi
        fi
    done < <(docker ps -a --filter "name=claude-yolo-" --format "{{.Names}}")
    
    cd "$NARRAITOR_MAIN"
}

# Function to show logs
show_logs() {
    local issue_number=$1
    
    if [ -z "$issue_number" ]; then
        echo -e "${RED}Usage: logs <issue-number>${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📜 Logs for issue #$issue_number${NC}"
    docker logs -f "claude-yolo-$issue_number"
}

# Function to stop container
stop_container() {
    local issue_number=$1
    
    if [ -z "$issue_number" ]; then
        echo -e "${RED}Usage: stop <issue-number>${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}⏹️  Stopping YOLO container for issue #$issue_number${NC}"
    docker stop "claude-yolo-$issue_number"
    echo -e "${GREEN}✅ Container stopped${NC}"
}

# Function to cleanup
cleanup_yolo() {
    local issue_number=$1
    
    if [ -z "$issue_number" ]; then
        echo -e "${RED}Usage: cleanup <issue-number>${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}🧹 Cleaning up issue #$issue_number${NC}"
    
    # Stop and remove container
    docker stop "claude-yolo-$issue_number" 2>/dev/null || true
    docker rm "claude-yolo-$issue_number" 2>/dev/null || true
    
    # Remove Docker image
    docker rmi "narraitor-yolo-$issue_number:latest" 2>/dev/null || true
    
    # Ask about worktree removal
    echo -e "${YELLOW}Remove worktree as well? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        cd "$NARRAITOR_MAIN"
        ./scripts/worktree-helper.sh remove "$issue_number"
    fi
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Function to batch process
batch_process() {
    local issues=$1
    
    if [ -z "$issues" ]; then
        echo -e "${RED}Usage: batch <issue1,issue2,issue3>${NC}"
        return 1
    fi
    
    IFS=',' read -ra ISSUE_ARRAY <<< "$issues"
    
    echo -e "${PURPLE}🚀 Batch YOLO mode for ${#ISSUE_ARRAY[@]} issues${NC}"
    
    # Launch all containers
    for issue in "${ISSUE_ARRAY[@]}"; do
        echo -e "\n${BLUE}Processing issue #$issue${NC}"
        
        # Check if worktree exists
        if ! find "$WORKTREE_DIR" -name "issue-${issue}-*" -type d | head -1 > /dev/null; then
            echo -e "${YELLOW}⚠️  No worktree for issue #$issue, skipping${NC}"
            continue
        fi
        
        launch_yolo "$issue"
        sleep 2  # Brief pause between launches
    done
    
    echo -e "\n${GREEN}✅ All containers launched${NC}"
    echo -e "${YELLOW}Monitor with: $0 status${NC}"
}

# Main command processing
case "${1:-help}" in
    setup)
        check_prerequisites && setup_yolo_worktree "$2" "$3"
        ;;
    launch)
        check_prerequisites && launch_yolo "$2"
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$2"
        ;;
    stop)
        stop_container "$2"
        ;;
    cleanup)
        cleanup_yolo "$2"
        ;;
    batch)
        check_prerequisites && batch_process "$2"
        ;;
    help|*)
        show_usage
        ;;
esac
