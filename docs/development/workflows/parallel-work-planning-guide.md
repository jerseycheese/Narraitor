# Parallel Work Planning Guide

## Overview

This guide provides a systematic approach to safely planning and executing parallel development work on multiple GitHub issues simultaneously.

## Quick Start Workflow

### 1. Issue Selection and Analysis
```bash
# Analyze individual issues for dependencies
./scripts/check-related-issues.sh 504
./scripts/check-related-issues.sh 220

# Check current open issues and their domains
./scripts/claude-github.sh repo | jq '.open_issues_count'
```

### 2. Domain and Conflict Assessment
```bash
# Use the domain classification from story validation
node scripts/user-stories/story-validation-utils.js

# Manual assessment using safety criteria from yolo-safe-issues.md
```

### 3. Parallel Work Setup
```bash
# Set up multiple worktrees for safe parallel work
./scripts/parallel-claude-setup.sh setup

# Or individual worktree creation
./scripts/worktree-helper.sh create 504 "toast-notifications"
./scripts/worktree-helper.sh create 220 "storage-resilience"
```

### 4. Execution and Monitoring
```bash
# Monitor progress across worktrees
./scripts/worktree-helper.sh status

# Use batch processing for automation
./scripts/yolo-mode.sh batch 504,220
```

## Detailed Planning Process

### Phase 1: Issue Discovery and Filtering

#### A. Gather Candidate Issues
```bash
# Get open issues
./scripts/claude-github.sh prs | jq '.[] | select(.state == "open")'

# Analyze priority and complexity
# Look for labels: priority:high, complexity:small, priority:medium
```

#### B. Apply Initial Filters
- **Exclude blocked/dependency issues**: Check for "blocked", "needs-discussion", "wont-fix" labels
- **Prioritize MVP work**: Focus on "mvp", "priority:high", "priority:medium" labels  
- **Prefer smaller scope**: "complexity:small", "effort:trivial" preferred for parallel work

### Phase 2: Domain and Dependency Analysis

#### A. Domain Classification
Map issues to domain boundaries:

| Domain | Components | State | Typical Files |
|--------|------------|-------|---------------|
| **World** | WorldCard, WorldCreation | worldStore | `/src/app/world/`, `/src/components/World/` |
| **Character** | CharacterSheet, CharacterCreation | characterStore | `/src/app/characters/`, `/src/components/Character/` |
| **Narrative** | StoryEngine, PromptTemplates | narrativeStore | `/src/lib/narrative/`, `/src/components/Narrative/` |
| **Journal** | JournalEntry, JournalView | journalStore | `/src/app/journal/`, `/src/components/Journal/` |
| **UI/Infrastructure** | Navigation, Layout, Toast | uiStore | `/src/components/ui/`, `/src/components/shared/` |

#### B. Conflict Risk Assessment

**🟢 Low Risk - Different Domains**:
```bash
# Example: Character creation + World templates
# Minimal file overlap, different stores, different test areas
```

**🟡 Medium Risk - Same Domain, Different Components**:
```bash
# Example: WorldCard improvements + World creation workflow
# Same store, potentially shared utilities, requires analysis
```

**🔴 High Risk - Shared Components/Files**:
```bash
# Example: Navigation changes + Mobile navigation changes  
# Same files, high conflict probability, avoid parallel work
```

### Phase 3: Dependency Deep Dive

#### A. Cross-Reference Analysis
```bash
# Check for issue mentions and relationships
./scripts/check-related-issues.sh [issue-number]

# Look for:
# - "Depends on #X" or "Blocked by #X"
# - "Related to #X" or "See also #X"  
# - References in issue body or comments
```

#### B. File and Component Analysis

**Manual Analysis Checklist**:
1. **Read issue descriptions** - identify likely files to be modified
2. **Check component imports** - look for shared dependencies
3. **Review test coverage** - ensure test isolation
4. **Examine state dependencies** - check for store interactions

**Example Analysis**:
```bash
# Issue #504: Toast notifications
# Likely files: /src/components/ui/toast/, /src/lib/hooks/useToast
# Dependencies: Minimal, new UI component
# Risk level: LOW (new component, isolated)

# Issue #220: Storage resilience  
# Likely files: /src/lib/storage/, /src/state/*Store.ts
# Dependencies: All state stores, persistence layer
# Risk level: MEDIUM (touches core infrastructure)

# Conclusion: Safe for parallel work with monitoring
```

### Phase 4: Parallel Work Planning

#### A. Issue Grouping Strategies

**Strategy 1: Domain Separation**
```bash
# Group by completely different domains
Group A: World domain issues
Group B: Character domain issues  
Group C: UI/Infrastructure issues
```

**Strategy 2: Complexity Pairing**
```bash
# Pair one complex with multiple simple issues
Primary: Complex issue (3-5 day estimate)
Secondary: 2-3 simple issues (1 day each)
```

**Strategy 3: Feature Coordination**
```bash
# Group related but non-conflicting features
Example: Export functionality + Toast notifications
# Toast notifications enhance export UX, but don't conflict
```

#### B. Work Distribution Patterns

**Pattern 1: Parallel Streams**
```
Developer A: Issue #504 (Toast) → Issue #506 (Forms)
Developer B: Issue #220 (Storage) → Issue #221 (Backup)
Timeline: 2 weeks, minimal coordination needed
```

**Pattern 2: Sequential with Handoffs**
```
Week 1: Both developers work on isolated issues
Week 2: Integration and coordination phase
Week 3: Continue with next batch
```

**Pattern 3: Coordinated Sprints**
```
Sprint 1: Foundation work (parallel, isolated)
Sprint 2: Integration work (coordinated)  
Sprint 3: Polish and testing (parallel testing)
```

### Phase 5: Execution Setup

#### A. Worktree Configuration
```bash
# Setup script handles port allocation and branch management
./scripts/parallel-claude-setup.sh setup

# Manual setup for custom configuration
./scripts/worktree-helper.sh create 504 "toast-notifications-feature"
./scripts/worktree-helper.sh create 220 "storage-resilience-improvements"

# Verify setup
./scripts/worktree-helper.sh status
```

#### B. Development Environment Coordination
```bash
# Terminal organization suggestion:
# Terminal 1: Worktree A (port 3000) - Issue #504
# Terminal 2: Worktree B (port 3001) - Issue #220  
# Terminal 3: Coordination/monitoring - main branch

# Start development servers
cd ../narraitor-504
npm run dev  # Runs on port 3000

cd ../narraitor-220  
npm run dev -- --port 3001  # Runs on port 3001
```

### Phase 6: Monitoring and Coordination

#### A. Progress Tracking
```bash
# Regular status checks
./scripts/worktree-helper.sh status

# Monitor for conflicts early
git status  # In each worktree
git fetch origin develop  # Keep branches updated
```

#### B. Conflict Detection
```bash
# Before major commits, check for potential conflicts
git diff develop...HEAD --name-only  # Files changed in current branch
git diff origin/develop...HEAD --name-only  # Compare with remote

# If same files appear in multiple worktrees: coordinate immediately
```

#### C. Integration Planning
```bash
# Plan merge order based on complexity and dependencies
# 1. Merge simpler, isolated changes first
# 2. Merge complex changes with coordination
# 3. Test integration after each merge
```

## Advanced Coordination Techniques

### Continuous Integration Strategy
```bash
# Use automation to reduce coordination overhead
./scripts/yolo-mode.sh batch 504,220  # If both issues are YOLO-safe

# For mixed automation:
/project:do-issue-auto 504  # Automate simple issue
# Manual development for complex issue #220
```

### Communication Protocols
1. **Daily Sync**: 5-minute status update on progress and blockers
2. **Conflict Alerts**: Immediate notification if same files are modified
3. **Integration Windows**: Scheduled times for merging and testing
4. **Rollback Plans**: Clear process for handling integration failures

### Testing Coordination
```bash
# Isolated testing in each worktree
npm test  # Run tests for current branch only

# Integration testing after merges
npm run test:integration  # Full test suite
npm run test:e2e:critical  # Critical path verification
```

## Success Metrics and Optimization

### Track Parallel Work Effectiveness
- **Conflict Rate**: Percentage of parallel work resulting in conflicts
- **Time Savings**: Development time reduction vs sequential work
- **Quality Impact**: Bug rate and test coverage with parallel development

### Continuous Improvement
1. **Retrospectives**: Weekly analysis of parallel work outcomes
2. **Process Refinement**: Update planning criteria based on experience
3. **Tool Enhancement**: Identify gaps and improve automation
4. **Documentation Updates**: Keep guides current with lessons learned

## Troubleshooting Common Issues

### Merge Conflicts
```bash
# Resolution strategy:
1. Pause work in conflicting worktree
2. Resolve conflicts in first-to-merge branch
3. Update develop branch
4. Rebase or merge develop into second branch
5. Resume work with clean state
```

### Resource Conflicts
```bash
# Port conflicts:
./scripts/parallel-claude-setup.sh setup  # Handles automatic port allocation

# Database conflicts:
# Use separate test databases or mock data for parallel testing
```

### Integration Failures
```bash
# Recovery process:
1. Identify root cause (file conflicts, test failures, etc.)
2. Rollback problematic changes
3. Coordinate resolution between teams/issues
4. Re-implement with better coordination
5. Update planning process to prevent recurrence
```

## Conclusion

Successful parallel development requires systematic planning, clear communication, and proactive conflict detection. Start with low-risk issue combinations and gradually increase complexity as team coordination improves.

The key is balancing development speed with integration safety - err on the side of caution until parallel work patterns are well-established.