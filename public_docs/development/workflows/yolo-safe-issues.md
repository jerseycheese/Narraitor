# YOLO Mode Safe Issue Classification Guide

## Overview

This guide helps identify which GitHub issues are safe for fully autonomous YOLO mode implementation vs. those requiring manual verification.

## Safe for YOLO Mode

Issues that can be safely implemented in YOLO mode typically have:
- Clear, objective acceptance criteria
- Automated verification possible through tests/builds
- Well-defined scope boundaries
- Minimal visual/UX judgment required

### Component Development
- Creating new components with defined props/behavior
- Adding features to existing components with clear specs
- Implementing data display components
- Form components with validation rules
- Utility components (loaders, error boundaries, etc.)

### Test Implementation
- Adding unit tests for existing functionality
- Creating Storybook stories for components
- Implementing test harnesses in `/dev/*`
- Improving test coverage
- Adding integration tests

### Bug Fixes
- Bugs with reproducible test cases
- Logic errors with clear expected behavior
- Data handling issues
- State management bugs
- Build/compilation errors

### Documentation
- API documentation updates
- README improvements
- Code comment additions
- Usage examples
- Architecture documentation

### Refactoring
- Code organization improvements
- Performance optimizations with measurable metrics
- Type safety improvements
- Dead code removal
- Consistent naming updates

### Data/State Management
- Store implementation updates
- Data model changes with migration
- API integration with mocked tests
- Persistence layer updates
- Cache implementation

## NOT Safe for YOLO Mode

Issues requiring human judgment, aesthetic evaluation, or complex user testing:

### Visual Design
- UI redesigns requiring aesthetic judgment
- Color scheme changes
- Layout modifications affecting user experience
- Animation/transition timing
- Responsive design breakpoints

### User Experience
- Workflow changes requiring user testing
- Navigation structure updates
- Accessibility improvements needing manual testing
- Error message wording/tone
- User feedback mechanisms

### Complex Integrations
- Third-party service integrations
- Authentication/authorization changes
- Payment processing
- Real-time features (WebSockets, etc.)
- External API dependencies

### Performance Critical
- Optimizations requiring benchmarking
- Memory leak fixes needing profiling
- Bundle size optimizations
- Critical rendering path changes
- Database query optimizations

### Breaking Changes
- API contract changes
- Data migration with user impact
- Deprecation of features
- Major dependency updates
- Architecture overhauls

## Issue Evaluation Checklist

Use this checklist to determine if an issue is YOLO-safe:

```
YOLO Safety Checklist:
□ Clear acceptance criteria that can be verified programmatically
□ No subjective visual/aesthetic decisions required
□ Can be fully tested with automated tests
□ Well-defined scope with explicit boundaries
□ No breaking changes to existing functionality
□ No external service dependencies
□ Not performance-critical requiring benchmarks
□ No user experience changes needing validation
```

If all boxes can be checked, the issue is likely safe for YOLO mode.

## Parallel Work Safety Assessment

For issues to be worked on simultaneously, additional criteria apply:

### Safe for Parallel Work:
- **Different domains** (World vs Character vs Narrative vs Journal)
- **Different UI components** with no shared dependencies
- **Different state stores** (worldStore vs characterStore vs journalStore)
- **Different file paths** with minimal overlap
- **Independent test coverage** areas
- **No shared configuration** files or dependencies

### Requires Analysis for Parallel Work:
- **Same domain, different components** - need dependency analysis
- **Shared utility functions** - check for conflicts in shared code
- **Similar file patterns** - analyze actual file overlap
- **Cross-domain integration** - evaluate integration points

### Anti-pattern: Unsafe for Parallel Work:
- **Same files/components** being modified
- **Shared state management** areas with writes
- **Integration tests** affecting same workflows
- **Database migrations** or schema changes
- **Breaking changes** to shared interfaces

Use `./scripts/github/check-related-issues.sh [issue-number]` to analyze dependencies before parallel work.

## Examples

### YOLO Safe Example:
```
Issue #123: Add timestamp display to WorldCard component
- Display created/updated dates in ISO format
- Show relative time for dates within 7 days
- Add unit tests for date formatting

This is YOLO safe because:
- Clear, objective requirements
- Can be verified with tests
- No aesthetic judgment needed
```

### Anti-pattern: NOT YOLO Safe Example:
```
Issue #456: Improve WorldCard visual hierarchy
- Make important information stand out more
- Improve readability on mobile devices
- Ensure good contrast ratios

This is NOT YOLO safe because:
- "Stand out more" is subjective
- Readability requires visual judgment
- Contrast needs manual verification
```

## Guidelines for Issue Authors

To make issues YOLO-compatible:

1. **Be Specific**: Replace "improve" with measurable criteria
2. **Define Outputs**: Specify exact expected behavior
3. **Include Tests**: Describe how to verify completion
4. **Set Boundaries**: Explicitly state what's out of scope
5. **Provide Examples**: Include input/output examples

## Workflow Integration

When using YOLO mode:

1. Review issue against this guide
2. If uncertain, default to manual verification
3. Add `yolo-safe` label to appropriate issues
4. Monitor YOLO implementations for quality
5. Adjust criteria based on results

## Continuous Improvement

Track YOLO success rates:
- Issues successfully completed: X%
- Issues requiring manual fixes: Y%
- Average time saved: Z hours

Use metrics to refine YOLO safety criteria over time.
