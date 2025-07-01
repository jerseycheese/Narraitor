# Subagent Task Templates for do-issue-auto Workflow

This document contains standardized Task tool templates for delegating specialized work to subagents during the do-issue-auto workflow.

## Template Usage

Use these templates with the Task tool to delegate specific work to specialized subagents. Each template is designed to provide clear scope, objectives, and return expectations.

## 1. Issue Analysis Specialist Template

```
TASK FOR ISSUE ANALYSIS SPECIALIST:
Analyze GitHub issue and create comprehensive technical specification.

OBJECTIVES:
1. Fetch GitHub issue #[ISSUE_NUMBER] from jerseycheese/narraitor repository
2. Analyze issue description, comments, and acceptance criteria
3. Create technical specification with explicit scope boundaries
4. Identify existing utilities and components to leverage  
5. Define test strategy aligned with acceptance criteria
6. Return structured analysis ready for implementation planning

SCOPE CONSTRAINTS:
- Focus only on what's explicitly requested in the issue
- Do not suggest additional features outside defined scope
- Maintain existing patterns and approaches
- Follow KISS principles (max 300 lines per file, single responsibility)
- Respect domain boundaries (World, Character, Inventory, Narrative, Journal)

DELIVERABLES:
- Technical specification in structured markdown format
- Clear scope boundaries (what IS and IS NOT included)
- Implementation plan with existing utilities to leverage
- Test strategy focused on acceptance criteria
- Success criteria checklist

TOOLS TO USE:
- GitHub MCP tools for issue fetching
- Grep/Glob for codebase analysis
- Read tool for examining existing patterns
```

## 2. Test Writing Specialist Template

```  
TASK FOR TEST WRITING SPECIALIST:
Create focused TDD tests for feature implementation.

OBJECTIVES:
1. Write tests that verify WHAT the feature does, not HOW it does it
2. Focus on acceptance criteria from technical specification
3. Create minimal test files targeting key functionality
4. Ensure tests fail initially (red phase of TDD)
5. Plan Storybook stories and test harness scenarios
6. Return test files ready for implementation

TESTING PRINCIPLES:
- Test behavior over implementation details
- Avoid testing style classes or DOM structure
- Don't test edge cases beyond MVP requirements
- Use React Testing Library user-centric queries
- Focus on component API and user interactions
- Create tests that align with acceptance criteria only

DELIVERABLES:
- Component test files (.test.tsx)
- Storybook story specifications (.stories.tsx)
- Test harness planning for /dev/[component-name]
- Coverage plan focused on acceptance criteria

AVOID:
- Testing implementation details (specific CSS classes)
- Snapshot tests without specific purpose
- Trivial render-only tests
- Testing features outside defined scope
```

## 3. UI Component Implementation Specialist Template

```
TASK FOR UI COMPONENT IMPLEMENTATION SPECIALIST:
Implement React components following project patterns.

OBJECTIVES:
1. Create React components to pass defined tests
2. Use existing shadcn/ui components where possible
3. Maintain <300 lines per component
4. Follow single responsibility principle
5. Create Storybook stories for all variants
6. Ensure accessibility is built-in

IMPLEMENTATION GUIDELINES:
- Use existing TypeScript patterns and interfaces
- Follow established component structure
- Integrate with existing utility functions
- Maintain domain boundaries
- Use existing design system components
- Implement proper error handling

DELIVERABLES:
- React component files (.tsx)
- Storybook stories with all variants
- TypeScript interfaces if needed
- Integration with existing patterns

CONSTRAINTS:
- Max 300 lines per component file
- Use existing shadcn/ui components
- Follow project naming conventions
- Stay within defined scope boundaries
```

## 4. Business Logic Implementation Specialist Template

```
TASK FOR BUSINESS LOGIC IMPLEMENTATION SPECIALIST:
Implement core functionality and state management.

OBJECTIVES:
1. Implement business logic to pass tests
2. Use existing Zustand store patterns
3. Integrate with existing utilities and helpers
4. Ensure proper error handling with recovery
5. Maintain atomic and predictable state updates
6. Follow established domain patterns

IMPLEMENTATION GUIDELINES:
- Use existing store interfaces and patterns
- Leverage existing utility functions
- Follow domain-driven design principles
- Implement proper error boundaries
- Ensure state updates are atomic
- Maintain backward compatibility

DELIVERABLES:
- Store implementations or updates
- Business logic functions
- Error handling implementations
- Integration with existing systems

CONSTRAINTS:
- Follow existing Zustand patterns
- Stay within domain boundaries
- Use existing error handling patterns
- Maintain existing API contracts
```

## 5. Integration Specialist Template

```
TASK FOR INTEGRATION SPECIALIST:
Connect components with stores and services.

OBJECTIVES:
1. Connect components with state management
2. Ensure proper data flow between systems
3. Handle edge cases within scope
4. Create test harness pages for interactive testing
5. Verify integration with existing architecture
6. Ensure cross-component compatibility

INTEGRATION POINTS:
- Component to store connections
- Data flow between domains
- Error propagation and handling
- Test harness implementation
- Existing system compatibility

DELIVERABLES:
- Component integration code
- Test harness pages at /dev/[component-name]
- Data flow validation
- Error handling integration

CONSTRAINTS:
- Respect domain boundaries
- Use existing integration patterns
- Maintain data consistency
- Follow established error handling
```

## 6. Verification Coordinator Template

```
TASK FOR VERIFICATION COORDINATOR:
Coordinate comprehensive automated testing.

OBJECTIVES:
1. Run BrowserMCP automated testing suite
2. Execute Three-Stage Verification process
3. Analyze verification reports for critical issues
4. Generate comprehensive findings report
5. Recommend fixes for blocking issues
6. Confirm acceptance criteria are met

THREE-STAGE VERIFICATION:
- Stage 1: Storybook Testing (isolation, visual, interactions)
- Stage 2: Test Harness Verification (integration, realistic data)
- Stage 3: System Integration (full context, real data)

TOOLS TO USE:
- ./scripts/browsermcp-verify.sh for automated testing
- Browser MCP tools for interactive testing
- Screenshot and content analysis tools

DELIVERABLES:
- Comprehensive verification report
- Critical issue identification
- Fix recommendations for blocking issues
- Three-stage verification confirmation

FOCUS AREAS:
- Acceptance criteria validation
- Critical functionality verification
- Integration point testing
- Error handling validation
```

## 7. Code Review Specialist Template

```
TASK FOR CODE REVIEW SPECIALIST:
Analyze code for optimization and pattern compliance.

OBJECTIVES:
1. Identify opportunities to use existing components
2. Check type safety and interface reuse
3. Find performance optimization opportunities
4. Look for extractable patterns
5. Verify adherence to project standards
6. Ensure file size compliance

ANALYSIS AREAS:
- Existing component integration opportunities
- Type safety improvements
- Performance optimization (memoization, lazy loading)
- Code pattern extraction possibilities
- Project standard compliance
- Domain boundary respect

DELIVERABLES:
- Prioritized improvement recommendations
- Specific integration opportunities
- Performance optimization suggestions
- Pattern extraction proposals
- Standards compliance checklist

CONSTRAINTS:
- Don't suggest over-engineering
- Stay within existing scope
- Maintain backward compatibility
- Follow KISS principles
```

## 8. Documentation Specialist Template

```
TASK FOR DOCUMENTATION SPECIALIST:
Create comprehensive technical documentation.

OBJECTIVES:
1. Document API/Props/Parameters for new components
2. Write usage examples demonstrating key functionality
3. Document integration with existing systems
4. Cover error handling scenarios
5. Follow project documentation standards
6. Ensure documentation is concise and AI-readable

DOCUMENTATION STANDARDS:
- 150 lines max per document
- Direct and practical tone
- Focus on implementation guidance
- Use active voice and clear headings
- Eliminate filler words

DELIVERABLES:
- Component API documentation
- Usage examples with integration patterns
- Error handling documentation
- Integration guides
- Ready-to-commit documentation files

CONSTRAINTS:
- Follow project documentation tone
- Focus on implemented functionality only
- Provide practical implementation guidance
- Maintain consistency with existing docs
```

## Usage Notes

### Parallel Execution
Some subagents can work in parallel:
- Code Review + Documentation (after implementation)
- Multiple Implementation specialists (UI + Logic + Integration)
- Verification can overlap with final documentation

### Sequential Dependencies
Some phases must complete before others:
- Issue Analysis → Test Writing
- Test Writing → Implementation  
- Implementation → Verification
- Implementation → Code Review + Documentation

### Quality Gates
Each subagent should validate their work against:
- Defined scope boundaries
- Project standards and patterns
- Acceptance criteria alignment
- Integration with existing systems

### Error Handling
If a subagent cannot complete their task:
- Document specific blockers encountered
- Recommend alternative approaches
- Identify dependencies that need resolution
- Provide partial deliverables where possible