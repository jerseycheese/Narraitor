#!/bin/bash
# Quick status and help for Narraitor automation

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NARRAITOR_MAIN="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKTREE_DIR="${NARRAITOR_MAIN}-worktrees"

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║           🚀 Narraitor Automation Status 🚀              ║${NC}"
echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Available Automation Modes:${NC}"
echo -e "┌─────────────────────────────────────────────────────────────┐"
echo -e "│ ${GREEN}1. Standard Mode${NC} (automated verification)                  │"
echo -e "│    └─ ${YELLOW}claude > /project:do-issue-auto 501${NC}                 │"
echo -e "│    └─ ✅ Runs tests, build, Storybook automatically        │"
echo -e "│                                                             │"
echo -e "│ ${GREEN}2. YOLO Mode${NC} (containerized, no network)                  │"
echo -e "│    └─ ${YELLOW}./scripts/yolo-mode.sh launch 501${NC}                  │"
echo -e "│    └─ 🐳 Uses do-issue-auto in Docker container           │"
echo -e "└─────────────────────────────────────────────────────────────┘"

echo -e "\n${BLUE}Automated Verification Steps:${NC}"
echo -e "  1️⃣  Storybook build verification"
echo -e "  2️⃣  Unit test suite execution"
echo -e "  3️⃣  Production build validation"
echo -e "  4️⃣  TypeScript/lint checks"
echo -e "  5️⃣  Critical E2E tests (if available)"

echo -e "\n${BLUE}Current Worktrees:${NC}"
if command -v tree &> /dev/null; then
    tree -L 1 -d "$WORKTREE_DIR" 2>/dev/null | head -10
else
    ls -la "$WORKTREE_DIR" 2>/dev/null | grep "^d" | head -10
fi

echo -e "\n${BLUE}Active YOLO Containers:${NC}"
docker ps --filter "name=claude-yolo-" --format "table {{.Names}}\t{{.Status}}" 2>/dev/null | head -10

echo -e "\n${BLUE}Quick Commands:${NC}"
echo -e "  ${GREEN}Create worktree:${NC}  ./scripts/worktree-helper.sh create 501 feature"
echo -e "  ${GREEN}Launch standard:${NC}  cd worktree && claude"
echo -e "  ${GREEN}Launch YOLO:${NC}      ./scripts/yolo-mode.sh launch 501"
echo -e "  ${GREEN}Check status:${NC}     ./scripts/yolo-mode.sh status"
echo -e "  ${GREEN}Batch process:${NC}    ./scripts/weekly-yolo.sh"

echo -e "\n${YELLOW}Pro tip: ${NC}Use YOLO mode for low-risk issues (docs, tests)"
echo -e "${YELLOW}         ${NC}Use standard mode for complex features"
echo -e "${YELLOW}         ${NC}Check docs/development/workflows/yolo-safe-issues.md"

echo -e "\n${BLUE}Test Verification:${NC}"
echo -e "  ${GREEN}Run test:${NC} ./scripts/test-automated-verification.sh"
