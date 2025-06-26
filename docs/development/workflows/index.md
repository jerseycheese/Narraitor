---
title: Development Workflows
tags: [development, workflow, process]
created: 2025-01-01
updated: 2025-06-26
---

# Development Workflows

Development processes and workflow guidelines for Narraitor.

## Core Workflows

### TDD Workflow
1. **Analyze task** - Understand requirements and acceptance criteria
2. **Write tests first** - Define expected behavior through tests
3. **Implement** - Write minimal code to pass tests
4. **Refactor** - Clean up code while keeping tests green
5. **Manual testing** - Verify functionality works as expected
6. **Commit** - Push changes and close GitHub issue

### Component Development
1. **Create Storybook stories** - Define component variants
2. **Develop in isolation** - Build component in Storybook
3. **Write component tests** - Test behavior and edge cases
4. **Test in harness** - Verify integration with realistic data
5. **Integrate** - Add to application with proper tests

### PR Workflow
1. **Create branch** from develop
2. **Implement feature** following TDD
3. **Run tests** - Ensure all tests pass
4. **Create PR** targeting develop branch
5. **Review and merge** - No direct commits to main branches

## Development Checklist

**Before Starting:**
- ✅ Create GitHub issue from user story
- ✅ Create feature branch from develop
- ✅ Understand acceptance criteria

**During Development:**
- ✅ Write tests before implementation
- ✅ Keep files under 300 lines
- ✅ Follow KISS principles
- ✅ Use TypeScript for type safety
- ✅ Manual testing in dev harnesses

**Before Committing:**
- ✅ All tests pass
- ✅ No build errors
- ✅ Code follows conventions
- ✅ Documentation updated if needed
- ✅ Manual verification complete

## Testing Strategy

### Unit Tests
- Test individual functions and hooks
- Focus on business logic and edge cases
- Use Jest and React Testing Library

### Component Tests
- Test component behavior and rendering
- Verify props handling and user interactions
- Test error states and loading conditions

### Integration Tests
- Test component compositions
- Verify store interactions
- Test complete user workflows

### Manual Testing
- Use development test harnesses (`/dev/*`)
- Test in Storybook for component isolation
- Verify responsive design and accessibility

## Related Workflows
- [Core Development Workflow](./core-development-workflow.md)
- [PR and Testing Workflow](./pr-and-testing-workflow.md)
- [Storybook Workflow](./storybook-workflow-streamlined.md)
