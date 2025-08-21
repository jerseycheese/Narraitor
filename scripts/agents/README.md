# Subagent Delegation System for do-issue-auto Workflow

This directory contains the enhanced subagent delegation system that transforms your do-issue-auto workflow into a structured, automated process using specialized Task tool delegation and comprehensive TodoWrite tracking.

## Overview

The system coordinates specialized subagents through Claude Code's Task tool, where each subagent is an expert in their specific domain (issue analysis, test writing, implementation, verification, etc.). Progress is tracked through the TodoWrite system with comprehensive todo structures.

## Architecture

### Core Components

```
scripts/agents/
├── workflow-coordinator.js          # Central coordination system
├── subagent-templates.md           # Standardized task templates
├── example-workflow-591.md         # Complete workflow example
└── README.md                       # This documentation

scripts/
├── do-issue-auto-with-agents.sh    # Enhanced workflow launcher
└── claude-workflow-with-agents.sh  # Claude Code integration helper
```

### Workflow Phases

1. **Branch Creation & Issue Analysis** (Issue Analysis Specialist)
2. **Define Tests Phase** (Test Writing Specialist)
3. **Implementation Phase** (UI, Logic, Integration Specialists: parallel)
4. **Build Phase** (Automated build validation)
5. **Test Fixes Phase** (Automated test validation)
6. **Automated Verification Phase** (Verification Coordinator)
7. **Code Review & Reusability Analysis** (Code Review Specialist: parallel)
8. **Cleanup & Documentation Phase** (Documentation Specialist: parallel)
9. **GitHub Issue Management** (Automated GitHub coordination)

## Quick Start

### 1. Initialize Workflow

```bash
# Initialize workflow for issue #591
./scripts/claude-workflow-with-agents.sh init 591
```

This creates the todo structure and prepares the first subagent delegation.

### 2. Execute in Claude Code

Run the generated todo creation command in Claude Code:

```
Please use the TodoWrite tool to create these todos for issue #591:
[Generated todo structure]
```

### 3. Delegate to Specialists

```bash
# Generate issue analysis delegation
./scripts/claude-workflow-with-agents.sh delegate 591 analysis
```

Run the generated Task tool command in Claude Code:

```
Please use the Task tool to delegate this work to a specialized subagent:

Description: Analyze GitHub issue and create technical specification
Prompt: [Detailed specialist prompt]
```

### 4. Continue Through Phases

```bash
# Check current status
./scripts/claude-workflow-with-agents.sh status 591

# Continue to next phase
./scripts/claude-workflow-with-agents.sh continue 591
```

## Specialized Subagents

### Issue Analysis Specialist
- **Purpose**: GitHub issue analysis and technical specification
- **Capabilities**: Issue fetching, requirement analysis, scope definition
- **Deliverables**: Technical specification with scope boundaries

### Test Writing Specialist  
- **Purpose**: TDD-focused test creation
- **Capabilities**: Acceptance criteria testing, behavioral test design
- **Deliverables**: Component tests, Storybook stories, test harness plans

### Implementation Specialists (Parallel)
- **UI Component Specialist**: React components with shadcn/ui integration
- **Business Logic Specialist**: State management and core functionality
- **Integration Specialist**: Component connections and test harnesses

### Verification Coordinator
- **Purpose**: Automated testing coordination
- **Capabilities**: Playwright orchestration, Three-Stage Verification
- **Deliverables**: Comprehensive verification reports and fix recommendations

### Code Review Specialist
- **Purpose**: Pattern analysis and optimization
- **Capabilities**: Component reuse analysis, performance optimization
- **Deliverables**: Prioritized improvement recommendations

### Documentation Specialist
- **Purpose**: Technical documentation creation
- **Capabilities**: API documentation, usage examples, integration guides
- **Deliverables**: Ready-to-commit documentation files

## TodoWrite Integration

### Master Todo Structure
Each workflow creates a comprehensive todo hierarchy:

```json
[
  {"id": "branch-creation-analysis-591", "content": "Branch Creation & Issue Analysis", "status": "pending", "priority": "high"},
  {"id": "define-tests-591", "content": "Define Tests Phase", "status": "pending", "priority": "high"},
  {"id": "implementation-591", "content": "Implementation Phase", "status": "pending", "priority": "high"},
  // ... additional phases
]
```

### Progress Tracking
- **Real-time Updates**: Todos marked in_progress/completed as work proceeds
- **Phase Dependencies**: Clear visibility into what can run in parallel
- **Quality Gates**: Verification checkpoints at each phase
- **Scope Control**: Out-of-scope items tracked separately

## Command Reference

### Workflow Management
```bash
# Initialize new workflow
claude-workflow-with-agents.sh init [issue-number]

# Check current status  
claude-workflow-with-agents.sh status [issue-number]

# Continue from current phase
claude-workflow-with-agents.sh continue [issue-number]

# Show complete example
claude-workflow-with-agents.sh example [issue-number]
```

### Subagent Delegation
```bash
# Generate delegation commands for specific phase
claude-workflow-with-agents.sh delegate [issue-number] [phase]

# Available phases:
# analysis, test-writing, implementation, verification, 
# code-review, documentation, github-management
```

### Direct Coordinator Usage
```bash
# Create todo structure
node scripts/agents/workflow-coordinator.js create-todos [issue-number]

# Generate subagent commands
node scripts/agents/workflow-coordinator.js delegate [issue-number] [phase]

# Check workflow state
node scripts/agents/workflow-coordinator.js status [issue-number]
```

## Integration with Existing Tools

### Playwright Integration
- **Verification Coordinator** automatically runs `./scripts/playwright-verify.sh`
- **Three-Stage Verification** (Storybook → Test Harness → Integration)
- **Automated report analysis** and fix recommendations

### GitHub Integration
- Uses existing `./scripts/claude-github.sh` for API operations
- Leverages `./scripts/claude-pr.sh` for PR creation
- Integrates with `./scripts/claude-branch.sh` for branch management

### Helper Script Compatibility
- All existing helper scripts remain functional
- Enhanced scripts provide additional subagent coordination
- Backward compatibility with manual workflow approaches

## Example Workflow: Issue #591

See `example-workflow-591.md` for a complete step-by-step example showing:

1. Todo structure creation
2. Sequential subagent delegation
3. Parallel execution coordination
4. Quality gate management
5. Final GitHub integration

## Benefits

### Structured Automation
- **Systematic Progress**: Clear phases with defined entry/exit criteria
- **Quality Assurance**: Built-in verification at each stage
- **Scope Control**: Explicit boundaries prevent feature creep
- **Audit Trail**: Complete workflow logging and state tracking

### Specialized Expertise
- **Domain Focus**: Each subagent specializes in their area
- **Pattern Consistency**: Agents trained on project-specific patterns
- **Quality Standards**: Consistent adherence to established practices
- **Efficiency**: Faster execution through specialized knowledge

### Parallel Execution
- **Reduced Time**: Implementation specialists work concurrently
- **Optimized Handoffs**: Code review and documentation run in parallel
- **Resource Efficiency**: Maximum utilization of available processing

### Integration Benefits
- **Existing Tool Leverage**: Builds on established helper scripts
- **Playwright Coordination**: Automated testing with comprehensive reporting
- **GitHub Workflow**: Seamless integration with existing PR/issue management

## Troubleshooting

### Common Issues

**Missing Node.js**: Ensure Node.js is installed for workflow coordination
```bash
node --version  # Should show v14 or higher
```

**Workflow State Issues**: Reset workflow state if needed
```bash
rm .claude/workflow/issue-[number]-state.json
claude-workflow-with-agents.sh init [issue-number]
```

**Permission Issues**: Ensure scripts are executable
```bash
chmod +x scripts/claude-workflow-with-agents.sh
chmod +x scripts/do-issue-auto-with-agents.sh
chmod +x scripts/agents/workflow-coordinator.js
```

### Debug Mode
Enable detailed logging by setting environment variable:
```bash
export DEBUG_WORKFLOW=true
claude-workflow-with-agents.sh init 591
```

## Advanced Usage

### Custom Subagent Templates
Modify `subagent-templates.md` to customize specialist prompts for your specific needs.

### Workflow Extensions
Add new phases by extending the `WORKFLOW_PHASES` object in `workflow-coordinator.js`.

### Integration Hooks
Create custom integration points by modifying the workflow coordinator to call additional scripts or tools.

This subagent delegation system provides the structure, quality, and efficiency your do-issue-auto workflow needs while maintaining the high standards and patterns you've established.