#!/bin/bash

# Analyze Issue Dependencies - Basic implementation for parallel work safety
# This script analyzes GitHub issues to determine potential conflicts and dependencies
# Usage: ./analyze-issue-dependencies.sh [issue-number] [options]

set -e

# Configuration
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"

# Check for required dependencies
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo "Error: curl is required but not installed"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print usage information
usage() {
    echo "Usage: $0 [issue-number] [options]"
    echo ""
    echo "Options:"
    echo "  --format json|table    Output format (default: table)"
    echo "  --compare [issue2]     Compare two issues for conflicts"
    echo "  --batch [issue1,issue2,issue3]  Analyze multiple issues"
    echo "  --verbose              Show detailed analysis"
    echo "  --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 504                 # Analyze issue #504"
    echo "  $0 504 --compare 220   # Compare issues #504 and #220"
    echo "  $0 --batch 504,220,506 # Analyze multiple issues"
    exit 1
}

# Extract domain from issue labels and content
extract_domain() {
    local issue_data="$1"
    
    # Extract from labels
    local domain_label=$(echo "$issue_data" | jq -r '.labels[]? | select(.name | startswith("domain:")) | .name' | head -1)
    if [[ -n "$domain_label" ]]; then
        echo "$domain_label" | sed 's/domain://'
        return
    fi
    
    # Extract from body content patterns
    local body=$(echo "$issue_data" | jq -r '.body // ""')
    
    if echo "$body" | grep -qi "world\|template\|genre"; then
        echo "world"
    elif echo "$body" | grep -qi "character\|sheet\|progression"; then
        echo "character"
    elif echo "$body" | grep -qi "narrative\|story\|prompt\|ai"; then
        echo "narrative"
    elif echo "$body" | grep -qi "journal\|entry\|history"; then
        echo "journal"
    elif echo "$body" | grep -qi "inventory\|item\|equipment"; then
        echo "inventory"
    elif echo "$body" | grep -qi "ui\|component\|toast\|navigation"; then
        echo "ui"
    elif echo "$body" | grep -qi "state\|store\|persistence\|storage"; then
        echo "state-management"
    else
        echo "utilities-and-helpers"
    fi
}

# Extract complexity from issue labels
extract_complexity() {
    local issue_data="$1"
    
    local complexity=$(echo "$issue_data" | jq -r '.labels[]? | select(.name | startswith("complexity:")) | .name' | head -1)
    if [[ -n "$complexity" ]]; then
        echo "$complexity" | sed 's/complexity://'
    else
        echo "unknown"
    fi
}

# Extract priority from issue labels
extract_priority() {
    local issue_data="$1"
    
    local priority=$(echo "$issue_data" | jq -r '.labels[]? | select(.name | startswith("priority:")) | .name' | head -1)
    if [[ -n "$priority" ]]; then
        echo "$priority" | sed 's/priority://'
    else
        echo "unknown"
    fi
}

# Predict likely file paths based on issue content
predict_file_paths() {
    local issue_data="$1"
    local domain="$2"
    local title=$(echo "$issue_data" | jq -r '.title')
    local body=$(echo "$issue_data" | jq -r '.body // ""')
    
    local paths=()
    
    case "$domain" in
        "world")
            paths+=("src/app/world/" "src/components/World/" "src/state/worldStore.ts")
            ;;
        "character")
            paths+=("src/app/characters/" "src/components/Character/" "src/state/characterStore.ts")
            ;;
        "narrative")
            paths+=("src/lib/narrative/" "src/components/Narrative/" "src/state/narrativeStore.ts")
            ;;
        "journal")
            paths+=("src/app/journal/" "src/components/Journal/" "src/state/journalStore.ts")
            ;;
        "inventory")
            paths+=("src/components/Inventory/" "src/state/inventoryStore.ts")
            ;;
        "ui")
            if echo "$title $body" | grep -qi "navigation"; then
                paths+=("src/components/Navigation/")
            fi
            if echo "$title $body" | grep -qi "toast"; then
                paths+=("src/components/ui/toast/" "src/lib/hooks/")
            fi
            if echo "$title $body" | grep -qi "setting"; then
                paths+=("src/app/settings/")
            fi
            paths+=("src/components/ui/" "src/components/shared/")
            ;;
        "state-management")
            paths+=("src/state/" "src/lib/storage/" "src/lib/persistence/")
            ;;
        *)
            paths+=("src/lib/" "src/utils/")
            ;;
    esac
    
    # Add test paths
    for path in "${paths[@]}"; do
        if [[ "$path" == *"/" ]]; then
            paths+=("${path}__tests__/")
        fi
    done
    
    printf '%s\n' "${paths[@]}"
}

# Calculate conflict risk between two issues
calculate_conflict_risk() {
    local domain1="$1"
    local domain2="$2"
    local paths1="$3"
    local paths2="$4"
    
    # Domain-based risk assessment
    if [[ "$domain1" == "$domain2" ]]; then
        if [[ "$domain1" == "ui" || "$domain1" == "state-management" ]]; then
            echo "MEDIUM"  # Same domain, shared infrastructure
        else
            echo "LOW"     # Same domain, but likely different components
        fi
    else
        # Check for path overlaps
        local overlap=false
        while IFS= read -r path1; do
            while IFS= read -r path2; do
                if [[ "$path1" == "$path2" ]] || [[ "$path1" == *"$path2"* ]] || [[ "$path2" == *"$path1"* ]]; then
                    overlap=true
                    break 2
                fi
            done <<< "$paths2"
        done <<< "$paths1"
        
        if $overlap; then
            echo "MEDIUM"
        else
            echo "LOW"
        fi
    fi
}

# Analyze a single issue
analyze_single_issue() {
    local issue_number="$1"
    local verbose="$2"
    
    echo -e "${BLUE}Analyzing issue #$issue_number...${NC}"
    
    # Fetch issue data using the GitHub API directly
    local issue_data
    if ! issue_data=$("$SCRIPTS_DIR/claude-github.sh" issue "$issue_number" 2>/dev/null); then
        echo -e "${RED}Error: Could not fetch issue #$issue_number${NC}"
        return 1
    fi
    
    # Extract JSON from the response (skip any header lines)
    issue_data=$(echo "$issue_data" | sed -n '/^{/,$p')
    
    # Validate JSON response
    if ! echo "$issue_data" | jq empty 2>/dev/null; then
        echo -e "${RED}Error: Invalid JSON response for issue #$issue_number${NC}"
        return 1
    fi
    
    # Extract information
    local title=$(echo "$issue_data" | jq -r '.title')
    local state=$(echo "$issue_data" | jq -r '.state')
    local domain=$(extract_domain "$issue_data")
    local complexity=$(extract_complexity "$issue_data")
    local priority=$(extract_priority "$issue_data")
    local file_paths=$(predict_file_paths "$issue_data" "$domain")
    
    # Store results for later use
    echo "$issue_data" > "/tmp/issue_${issue_number}_data.json"
    echo "$domain" > "/tmp/issue_${issue_number}_domain.txt"
    echo "$file_paths" > "/tmp/issue_${issue_number}_paths.txt"
    
    if [[ "$verbose" == "true" ]]; then
        echo "  Title: $title"
        echo "  State: $state"
        echo "  Domain: $domain"
        echo "  Complexity: $complexity"
        echo "  Priority: $priority"
        echo "  Predicted paths:"
        echo "$file_paths" | sed 's/^/    /'
        echo ""
    fi
    
    return 0
}

# Compare two issues for conflicts
compare_issues() {
    local issue1="$1"
    local issue2="$2"
    local format="$3"
    
    echo -e "${BLUE}Comparing issues #$issue1 and #$issue2 for conflicts...${NC}"
    echo ""
    
    # Analyze both issues
    analyze_single_issue "$issue1" false
    analyze_single_issue "$issue2" false
    
    # Read analysis results
    local domain1=$(cat "/tmp/issue_${issue1}_domain.txt" 2>/dev/null || echo "unknown")
    local domain2=$(cat "/tmp/issue_${issue2}_domain.txt" 2>/dev/null || echo "unknown")
    local paths1=$(cat "/tmp/issue_${issue1}_paths.txt" 2>/dev/null || echo "")
    local paths2=$(cat "/tmp/issue_${issue2}_paths.txt" 2>/dev/null || echo "")
    
    # Calculate conflict risk
    local risk=$(calculate_conflict_risk "$domain1" "$domain2" "$paths1" "$paths2")
    
    if [[ "$format" == "json" ]]; then
        cat << EOF
{
  "comparison": {
    "issue1": $issue1,
    "issue2": $issue2,
    "domain1": "$domain1",
    "domain2": "$domain2",
    "conflict_risk": "$risk",
    "safe_for_parallel": $([ "$risk" == "LOW" ] && echo "true" || echo "false"),
    "shared_paths": $(comm -12 <(echo "$paths1" | sort) <(echo "$paths2" | sort) | jq -R . | jq -s .)
  }
}
EOF
    else
        echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║                     CONFLICT ANALYSIS                       ║${NC}"
        echo -e "${YELLOW}╠══════════════════════════════════════════════════════════════╣${NC}"
        printf "${YELLOW}║${NC} Issue #%-3s Domain: %-20s                    ${YELLOW}║${NC}\n" "$issue1" "$domain1"
        printf "${YELLOW}║${NC} Issue #%-3s Domain: %-20s                    ${YELLOW}║${NC}\n" "$issue2" "$domain2"
        echo -e "${YELLOW}╠══════════════════════════════════════════════════════════════╣${NC}"
        
        case "$risk" in
            "LOW")
                echo -e "${YELLOW}║${NC} ${GREEN}✅ CONFLICT RISK: LOW - Safe for parallel work${NC}          ${YELLOW}║${NC}"
                ;;
            "MEDIUM")
                echo -e "${YELLOW}║${NC} ${YELLOW}⚠️  CONFLICT RISK: MEDIUM - Requires coordination${NC}       ${YELLOW}║${NC}"
                ;;
            "HIGH")
                echo -e "${YELLOW}║${NC} ${RED}❌ CONFLICT RISK: HIGH - Avoid parallel work${NC}             ${YELLOW}║${NC}"
                ;;
        esac
        
        echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        
        # Show shared paths if any
        local shared_paths=$(comm -12 <(echo "$paths1" | sort) <(echo "$paths2" | sort))
        if [[ -n "$shared_paths" ]]; then
            echo -e "${YELLOW}Potentially shared file paths:${NC}"
            echo "$shared_paths" | sed 's/^/  /'
            echo ""
        fi
        
        # Recommendations
        echo -e "${BLUE}Recommendations:${NC}"
        case "$risk" in
            "LOW")
                echo "  ✅ These issues are safe to work on in parallel"
                echo "  ✅ Minimal coordination needed"
                echo "  ✅ Can use automated workflows"
                ;;
            "MEDIUM")
                echo "  ⚠️  Coordinate before starting work"
                echo "  ⚠️  Monitor for file conflicts during development"
                echo "  ⚠️  Plan integration and testing carefully"
                ;;
            "HIGH")
                echo "  ❌ Work on these issues sequentially"
                echo "  ❌ High probability of merge conflicts"
                echo "  ❌ Consider combining into single issue"
                ;;
        esac
    fi
    
    # Cleanup temp files
    rm -f "/tmp/issue_${issue1}_"*.{json,txt} "/tmp/issue_${issue2}_"*.{json,txt}
}

# Analyze multiple issues in batch
analyze_batch() {
    local issues="$1"
    local format="$2"
    
    echo -e "${BLUE}Batch analysis of issues: $issues${NC}"
    echo ""
    
    IFS=',' read -ra ISSUE_ARRAY <<< "$issues"
    local issue_count=${#ISSUE_ARRAY[@]}
    
    if [[ $issue_count -lt 2 ]]; then
        echo -e "${RED}Error: Batch analysis requires at least 2 issues${NC}"
        exit 1
    fi
    
    # Analyze all issues first
    for issue in "${ISSUE_ARRAY[@]}"; do
        analyze_single_issue "$issue" false
    done
    
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}                    BATCH CONFLICT MATRIX                       ${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    
    # Create conflict matrix
    printf "%-8s" "Issue"
    for issue in "${ISSUE_ARRAY[@]}"; do
        printf "%-8s" "#$issue"
    done
    echo ""
    
    for i in "${!ISSUE_ARRAY[@]}"; do
        local issue1="${ISSUE_ARRAY[$i]}"
        printf "%-8s" "#$issue1"
        
        for j in "${!ISSUE_ARRAY[@]}"; do
            local issue2="${ISSUE_ARRAY[$j]}"
            
            if [[ $i -eq $j ]]; then
                printf "%-8s" "  -  "
            elif [[ $i -gt $j ]]; then
                printf "%-8s" "     "
            else
                local domain1=$(cat "/tmp/issue_${issue1}_domain.txt" 2>/dev/null || echo "unknown")
                local domain2=$(cat "/tmp/issue_${issue2}_domain.txt" 2>/dev/null || echo "unknown")
                local paths1=$(cat "/tmp/issue_${issue1}_paths.txt" 2>/dev/null || echo "")
                local paths2=$(cat "/tmp/issue_${issue2}_paths.txt" 2>/dev/null || echo "")
                local risk=$(calculate_conflict_risk "$domain1" "$domain2" "$paths1" "$paths2")
                
                case "$risk" in
                    "LOW") printf "${GREEN}%-8s${NC}" " LOW  " ;;
                    "MEDIUM") printf "${YELLOW}%-8s${NC}" " MED  " ;;
                    "HIGH") printf "${RED}%-8s${NC}" " HIGH " ;;
                esac
            fi
        done
        echo ""
    done
    
    echo ""
    echo -e "${BLUE}Parallel Work Recommendations:${NC}"
    
    # Find safe parallel combinations
    local safe_combinations=()
    for i in "${!ISSUE_ARRAY[@]}"; do
        for j in "${!ISSUE_ARRAY[@]}"; do
            if [[ $i -lt $j ]]; then
                local issue1="${ISSUE_ARRAY[$i]}"
                local issue2="${ISSUE_ARRAY[$j]}"
                local domain1=$(cat "/tmp/issue_${issue1}_domain.txt")
                local domain2=$(cat "/tmp/issue_${issue2}_domain.txt")
                local paths1=$(cat "/tmp/issue_${issue1}_paths.txt")
                local paths2=$(cat "/tmp/issue_${issue2}_paths.txt")
                local risk=$(calculate_conflict_risk "$domain1" "$domain2" "$paths1" "$paths2")
                
                if [[ "$risk" == "LOW" ]]; then
                    safe_combinations+=("#$issue1 + #$issue2")
                fi
            fi
        done
    done
    
    if [[ ${#safe_combinations[@]} -gt 0 ]]; then
        echo -e "${GREEN}✅ Safe parallel combinations:${NC}"
        for combo in "${safe_combinations[@]}"; do
            echo "  $combo"
        done
    else
        echo -e "${YELLOW}⚠️  No completely safe parallel combinations found${NC}"
        echo "   Consider working on issues sequentially or with careful coordination"
    fi
    
    # Cleanup temp files
    for issue in "${ISSUE_ARRAY[@]}"; do
        rm -f "/tmp/issue_${issue}_"*.{json,txt}
    done
}

# Main execution
main() {
    local issue_number=""
    local compare_issue=""
    local batch_issues=""
    local format="table"
    local verbose=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --format)
                format="$2"
                shift 2
                ;;
            --compare)
                compare_issue="$2"
                shift 2
                ;;
            --batch)
                batch_issues="$2"
                shift 2
                ;;
            --verbose)
                verbose=true
                shift
                ;;
            --help)
                usage
                ;;
            -*)
                echo "Unknown option $1"
                usage
                ;;
            *)
                if [[ -z "$issue_number" ]]; then
                    issue_number="$1"
                fi
                shift
                ;;
        esac
    done
    
    # Validate format
    if [[ "$format" != "json" && "$format" != "table" ]]; then
        echo -e "${RED}Error: Invalid format. Use 'json' or 'table'${NC}"
        exit 1
    fi
    
    # Execute based on mode
    if [[ -n "$batch_issues" ]]; then
        analyze_batch "$batch_issues" "$format"
    elif [[ -n "$compare_issue" ]]; then
        if [[ -z "$issue_number" ]]; then
            echo -e "${RED}Error: Issue number required for comparison${NC}"
            usage
        fi
        compare_issues "$issue_number" "$compare_issue" "$format"
    elif [[ -n "$issue_number" ]]; then
        analyze_single_issue "$issue_number" "$verbose"
    else
        echo -e "${RED}Error: Issue number or batch required${NC}"
        usage
    fi
}

# Execute main function with all arguments
main "$@"