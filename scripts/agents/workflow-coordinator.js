#!/usr/bin/env node

/**
 * Workflow Coordinator for do-issue-auto with Subagent Delegation
 * 
 * This script coordinates the execution of subagents and manages todo state
 * throughout the do-issue-auto workflow process.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_ROOT = process.cwd();
const CLAUDE_DIR = path.join(PROJECT_ROOT, '.claude');
const WORKFLOW_DIR = path.join(CLAUDE_DIR, 'workflow');
const AGENTS_DIR = path.join(PROJECT_ROOT, 'scripts', 'agents');

// Ensure directories exist
[CLAUDE_DIR, WORKFLOW_DIR, AGENTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

/**
 * Workflow phase definitions with subagent coordination
 */
const WORKFLOW_PHASES = {
    'branch-creation-analysis': {
        name: 'Branch Creation & Issue Analysis',
        priority: 'high',
        subagents: ['issue-analysis-specialist'],
        dependencies: [],
        parallel: false
    },
    'define-tests': {
        name: 'Define Tests Phase',
        priority: 'high', 
        subagents: ['test-writing-specialist'],
        dependencies: ['branch-creation-analysis'],
        parallel: false
    },
    'implementation': {
        name: 'Implementation Phase',
        priority: 'high',
        subagents: ['ui-component-specialist', 'business-logic-specialist', 'integration-specialist'],
        dependencies: ['define-tests'],
        parallel: true
    },
    'build': {
        name: 'Build Phase',
        priority: 'high',
        subagents: [],
        dependencies: ['implementation'],
        parallel: false
    },
    'test-fixes': {
        name: 'Test Fixes Phase',
        priority: 'high',
        subagents: [],
        dependencies: ['build'],
        parallel: false
    },
    'automated-verification': {
        name: 'Automated Verification Phase',
        priority: 'high',
        subagents: ['verification-coordinator'],
        dependencies: ['test-fixes'],
        parallel: false
    },
    'code-review-reusability': {
        name: 'Code Review & Reusability Analysis',
        priority: 'medium',
        subagents: ['code-review-specialist'],
        dependencies: ['implementation'],
        parallel: true
    },
    'cleanup-documentation': {
        name: 'Cleanup & Documentation Phase',
        priority: 'medium',
        subagents: ['documentation-specialist'],
        dependencies: ['automated-verification'],
        parallel: true
    },
    'github-issue-management': {
        name: 'GitHub Issue Management',
        priority: 'medium',
        subagents: [],
        dependencies: ['cleanup-documentation', 'code-review-reusability'],
        parallel: false
    }
};

/**
 * Subagent task templates for delegation
 */
const SUBAGENT_TEMPLATES = {
    'issue-analysis-specialist': {
        name: 'Issue Analysis Specialist',
        description: 'Analyze GitHub issue and create technical specification',
        template: `You are an Issue Analysis Specialist subagent. Your task is to:

1. Fetch GitHub issue #{issueNumber} from jerseycheese/narraitor repository using available GitHub tools
2. Analyze the issue description, comments, and acceptance criteria 
3. Create a comprehensive technical specification with:
   - Clear scope boundaries (what's included/excluded)
   - Technical approach and implementation plan
   - Identification of existing utilities to leverage
   - Test strategy focused on acceptance criteria
   - Success criteria checklist
4. Identify which domain this issue belongs to (World, Character, Inventory, Narrative, Journal)
5. Return the analysis in structured markdown format

IMPORTANT: Focus only on what's explicitly requested in the issue. Do not suggest additional features or enhancements outside the defined scope. Follow KISS principles and maintain existing patterns.

Please analyze issue #{issueNumber} and return a complete technical specification.`
    },
    
    'test-writing-specialist': {
        name: 'Test Writing Specialist',
        description: 'Create focused TDD tests for implementation',
        template: `You are a Test Writing Specialist subagent following strict TDD principles. Your task is to:

1. Based on the technical specification, write focused tests that verify core functionality
2. Follow these guidelines:
   - Test WHAT not HOW (behavior over implementation)
   - Focus on acceptance criteria from the spec
   - Avoid testing style classes or implementation details
   - Create minimal test files targeting key functionality
   - Ensure tests are MVP-level and align with issue acceptance criteria
   - Skip trivial tests that don't add value to core functionality
3. Create test files that will fail initially (red phase of TDD)
4. Include Storybook story specifications following 'Narraitor/[Category]/[Component]' naming
5. Plan test harness scenarios for /dev/[component-name] testing

Please create focused test files and specifications that directly verify the acceptance criteria without testing implementation details.`
    },

    'ui-component-specialist': {
        name: 'UI Component Implementation Specialist',
        description: 'Implement React components following project patterns',
        template: `You are a UI Component Implementation Specialist subagent. Your task is to:

1. Create React components following project patterns from the specification
2. Use existing shadcn/ui components where possible  
3. Maintain <300 lines per component following single responsibility principle
4. Follow established TypeScript patterns and domain boundaries
5. Create Storybook stories for all component variants and states
6. Ensure accessibility is built-in, not added later

Focus only on UI component implementation to pass the defined tests. Do not add features outside the specification scope.`
    },

    'business-logic-specialist': {
        name: 'Business Logic Implementation Specialist',
        description: 'Implement core functionality and state management',
        template: `You are a Business Logic Implementation Specialist subagent. Your task is to:

1. Implement core functionality to pass tests using existing patterns
2. Use existing utilities from the codebase where possible
3. Follow established Zustand store patterns for state management
4. Ensure proper error handling with recovery mechanisms
5. Maintain atomic and predictable state updates
6. Integrate with existing domain stores appropriately

Implement the minimum business logic needed to satisfy the test requirements and acceptance criteria.`
    },

    'integration-specialist': {
        name: 'Integration Specialist',
        description: 'Connect components with stores and services',
        template: `You are an Integration Specialist subagent. Your task is to:

1. Connect components with stores/services following project patterns
2. Ensure proper data flow between components and state management
3. Handle edge cases within the defined scope
4. Create test harness pages at /dev/[component-name] for interactive testing
5. Ensure integration with existing systems follows domain boundaries

Focus on integration points and ensure all components work together seamlessly within the existing architecture.`
    },

    'verification-coordinator': {
        name: 'Verification Coordinator',
        description: 'Coordinate comprehensive automated testing',
        template: `You are a Verification Coordinator subagent responsible for comprehensive testing. Your task is to:

1. Coordinate BrowserMCP automated testing suite for issue #{issueNumber}
2. Run Three-Stage Verification process:
   - Stage 1: Storybook Testing (component isolation, visual verification, interactions)
   - Stage 2: Test Harness Verification (integration testing, realistic data, edge cases)  
   - Stage 3: System Integration (full application context, real data, cross-component interactions)
3. Use the existing ./scripts/browsermcp-verify.sh script with appropriate parameters
4. Analyze verification reports for critical issues requiring immediate attention
5. Generate comprehensive findings report with specific recommendations
6. Return verification status and prioritized list of any fixes needed

Focus on identifying blocking issues that prevent the feature from meeting acceptance criteria.`
    },

    'code-review-specialist': {
        name: 'Code Review Specialist',
        description: 'Analyze code for pattern compliance and optimization',
        template: `You are a Code Review Specialist subagent focused on pattern analysis and optimization. Your task is to:

1. Analyze implemented code for opportunities to use existing components/utilities
2. Check for type safety improvements and interface reuse opportunities
3. Identify performance optimization opportunities without over-engineering
4. Look for code patterns that could be extracted for reusability
5. Ensure adherence to project patterns and domain boundaries
6. Check file size compliance (<300 lines per component)
7. Verify error handling follows project standards

Return a prioritized list of improvements that enhance code quality while maintaining the existing scope.`
    },

    'documentation-specialist': {
        name: 'Documentation Specialist',
        description: 'Create comprehensive technical documentation',
        template: `You are a Documentation Specialist subagent focused on comprehensive technical documentation. Your task is to:

1. Create API/Props/Parameters documentation for all new components
2. Write usage examples demonstrating key functionality from the implementation
3. Document integration points with existing systems
4. Cover error handling scenarios and edge cases
5. Follow project documentation standards from CLAUDE.md
6. Ensure documentation is concise and AI-readable (150 lines max per doc)

Return documentation files ready for commit that provide comprehensive guidance for using the implemented features.`
    }
};

/**
 * Create comprehensive todo structure for workflow
 */
function createWorkflowTodos(issueNumber) {
    const todos = Object.entries(WORKFLOW_PHASES).map(([phaseId, phase], index) => ({
        id: `${phaseId}-${issueNumber}`,
        content: phase.name,
        status: 'pending',
        priority: phase.priority
    }));

    return {
        todoStructure: todos,
        claudeCommand: `Please use the TodoWrite tool to create these todos for issue #${issueNumber}:\n\n${JSON.stringify(todos, null, 2)}`
    };
}

/**
 * Phase name mapping for CLI convenience
 */
const PHASE_ALIASES = {
    'analysis': 'branch-creation-analysis',
    'test-writing': 'define-tests', 
    'implementation': 'implementation',
    'verification': 'automated-verification',
    'code-review': 'code-review-reusability',
    'documentation': 'cleanup-documentation',
    'github-management': 'github-issue-management'
};

/**
 * Generate subagent task for specific phase
 */
function generateSubagentTask(phaseId, issueNumber, context = {}) {
    // Map alias to actual phase ID
    const actualPhaseId = PHASE_ALIASES[phaseId] || phaseId;
    const phase = WORKFLOW_PHASES[actualPhaseId];
    if (!phase) {
        throw new Error(`Unknown phase: ${phaseId} (mapped to: ${actualPhaseId})`);
    }

    const tasks = phase.subagents.map(subagentId => {
        const template = SUBAGENT_TEMPLATES[subagentId];
        if (!template) {
            throw new Error(`Unknown subagent: ${subagentId}`);
        }

        return {
            subagentId,
            name: template.name,
            description: template.description,
            task: template.template.replace(/#{issueNumber}/g, issueNumber),
            parallel: phase.parallel
        };
    });

    return {
        phase: phase.name,
        tasks,
        canRunInParallel: phase.parallel,
        dependencies: phase.dependencies
    };
}

/**
 * Get current workflow state
 */
function getWorkflowState(issueNumber) {
    const stateFile = path.join(WORKFLOW_DIR, `issue-${issueNumber}-state.json`);
    
    if (!fs.existsSync(stateFile)) {
        return null;
    }
    
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
}

/**
 * Update workflow state
 */
function updateWorkflowState(issueNumber, updates) {
    const stateFile = path.join(WORKFLOW_DIR, `issue-${issueNumber}-state.json`);
    const currentState = getWorkflowState(issueNumber) || {};
    
    const newState = {
        ...currentState,
        ...updates,
        issue_number: issueNumber,
        updated_at: new Date().toISOString()
    };
    
    fs.writeFileSync(stateFile, JSON.stringify(newState, null, 2));
    return newState;
}

/**
 * Generate Claude Code command for todo creation
 */
function generateTodoCreationCommand(issueNumber) {
    const { todoStructure, claudeCommand } = createWorkflowTodos(issueNumber);
    
    const commandFile = path.join(WORKFLOW_DIR, `create-todos-${issueNumber}.md`);
    fs.writeFileSync(commandFile, claudeCommand);
    
    return {
        commandFile,
        command: claudeCommand,
        todos: todoStructure
    };
}

/**
 * Generate subagent delegation commands for a phase
 */
function generateSubagentCommands(phaseId, issueNumber) {
    const taskSpec = generateSubagentTask(phaseId, issueNumber);
    
    const commands = taskSpec.tasks.map(task => {
        const commandFile = path.join(WORKFLOW_DIR, `${task.subagentId}-${issueNumber}.md`);
        
        const claudeCommand = `Please use the Task tool to delegate this work to a specialized subagent:

Description: ${task.description}
Prompt: ${task.task}`;

        fs.writeFileSync(commandFile, claudeCommand);
        
        return {
            subagentId: task.subagentId,
            name: task.name,
            commandFile,
            command: claudeCommand
        };
    });
    
    return {
        phase: taskSpec.phase,
        commands,
        canRunInParallel: taskSpec.canRunInParallel
    };
}

/**
 * CLI interface
 */
function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const issueNumber = args[1];
    const phase = args[2];

    if (!command || !issueNumber) {
        console.log('Usage: node workflow-coordinator.js <command> <issue-number> [phase]');
        console.log('Commands:');
        console.log('  create-todos    - Create todo structure for workflow');
        console.log('  delegate        - Generate subagent delegation commands');
        console.log('  status          - Show current workflow status');
        process.exit(1);
    }

    switch (command) {
        case 'create-todos':
            const todoResult = generateTodoCreationCommand(issueNumber);
            console.log(`Todo creation command generated: ${todoResult.commandFile}`);
            console.log('Run this in Claude Code:');
            console.log(todoResult.command);
            break;

        case 'delegate':
            if (!phase) {
                console.log('Available phases:');
                Object.keys(WORKFLOW_PHASES).forEach(id => {
                    console.log(`  ${id}: ${WORKFLOW_PHASES[id].name}`);
                });
                process.exit(1);
            }
            
            const delegationResult = generateSubagentCommands(phase, issueNumber);
            console.log(`Subagent commands generated for phase: ${delegationResult.phase}`);
            
            if (delegationResult.canRunInParallel) {
                console.log('These tasks can be run in parallel:');
            } else {
                console.log('These tasks should be run sequentially:');
            }
            
            delegationResult.commands.forEach(cmd => {
                console.log(`\n${cmd.name}:`);
                console.log(`File: ${cmd.commandFile}`);
                console.log('Command to run in Claude Code:');
                console.log(cmd.command);
            });
            break;

        case 'status':
            const state = getWorkflowState(issueNumber);
            if (state) {
                console.log(`Workflow status for issue #${issueNumber}:`);
                console.log(JSON.stringify(state, null, 2));
            } else {
                console.log(`No workflow state found for issue #${issueNumber}`);
            }
            break;

        default:
            console.log(`Unknown command: ${command}`);
            process.exit(1);
    }
}

// Export for use as module
export {
    WORKFLOW_PHASES,
    SUBAGENT_TEMPLATES,
    createWorkflowTodos,
    generateSubagentTask,
    generateSubagentCommands,
    getWorkflowState,
    updateWorkflowState
};

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}