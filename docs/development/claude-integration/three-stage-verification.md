---
title: "Three-Stage Verification Framework Guide"
type: guide
category: claude-integration
tags: [verification, testing, quality-assurance, framework]
created: 2025-05-18
updated: 2025-06-08
---

# Three-Stage Verification Framework Guide

## Overview

This guide details the Three-Stage Verification Framework used in the Narraitor project, which is a critical part of the Claude Code workflow. This framework ensures quality, prevents regressions, and validates implementation against acceptance criteria.

## Why Verification Matters

Implementation verification is not optional - it's a mandatory step in our development process. Properly implemented verification:

1. **Catches issues early**: Identify problems before they reach production
2. **Ensures quality**: Validate against acceptance criteria
3. **Prevents regressions**: Confirms existing functionality still works 
4. **Improves maintainability**: Force deeper understanding of how components interact
5. **Builds confidence**: Know that your implementation actually works

## The Three-Stage Verification Framework

Our verification process consists of three progressive stages:

### Stage 1: Storybook Verification

Focuses on the component in isolation:

- **Purpose**: Verify component appearance and behavior in isolation
- **Tool**: Storybook (`npm run storybook`)
- **Focus**: Visual appearance, states, interactive behavior
- **When**: After component implementation, before integration

#### Critical Verification Points:
- All visual states render correctly (default, loading, error, empty)
- Interactive elements work as expected (buttons, forms, etc.)
- Component responds correctly to prop changes
- Responsive design works at different breakpoints
- Accessibility features are properly implemented
- Edge cases are handled gracefully

#### Example Verification Checklist:
```
Storybook Verification - WorldCard Component:
- [ ] Default state shows all required information
- [ ] Long content truncates correctly
- [ ] Error state appears as expected
- [ ] Interactive elements (buttons) function correctly
- [ ] Responsive layout adapts to different screen sizes
- [ ] Component meets accessibility standards
```

### Stage 2: Test Harness Verification

Examines the component in a controlled but more realistic environment:

- **Purpose**: Test components with realistic data and interactions
- **Tool**: Development test harness (`npm run dev` and view `/dev/component-name`)
- **Focus**: Integration with parent components, state management, data flow
- **When**: After successful Storybook verification, before system integration

#### Critical Verification Points:
- Component integrates correctly with parent components
- State changes work with real data
- User interactions trigger expected behaviors
- Error states are triggered and handled appropriately
- Performance is acceptable with realistic data volumes
- Edge cases that depend on real data are correctly handled

#### Example Verification Checklist:
```
Test Harness Verification - WorldList Component:
- [ ] List loads and displays multiple WorldCard components
- [ ] Filtering and sorting functions work with real data
- [ ] Empty state renders correctly when no worlds are available
- [ ] Adding/removing worlds updates the list correctly
- [ ] Selection functionality works between components
- [ ] Error handling for network issues works as expected
```

### Stage 3: System Integration Verification

Tests the feature in the full application context:

- **Purpose**: Verify feature works in the complete application
- **Tool**: Full application environment (`npm run dev` and navigate to the feature)
- **Focus**: End-to-end workflows, cross-feature interactions
- **When**: After test harness verification, before PR submission

#### Critical Verification Points:
- Feature works in the full application context
- All acceptance criteria are fully met
- Cross-feature interactions work correctly
- Navigation flows work as expected
- System-level state management functions correctly
- Performance is acceptable in the full system context

#### Example Verification Checklist:
```
System Integration Verification - World Management:
- [ ] WorldList appears correctly on the dashboard
- [ ] Creating a new world adds it to the list
- [ ] Selecting a world navigates to the correct screen
- [ ] Deleting a world removes it from the system properly
- [ ] Changes persist after navigation and page refreshes
- [ ] All acceptance criteria from the issue are fully met
```

## Implementing Verification in Claude Code Workflows

The verification framework is tightly integrated into our Claude Code workflows:

### In do-issue.md and do-issue-auto.md

Both workflows include a **mandatory verification step** that cannot be bypassed:

```
## STEP 4: MANUAL VERIFICATION (IMPORTANT)

⚠️ **IMPORTANT: The workflow stops here until you complete your review**

### Three-Stage Manual Verification:

#### 1. Storybook Testing:
- [ ] Review all story variants in Storybook
- [ ] Test interactive controls
...

#### 2. Test Harness Verification:
- [ ] Test with realistic data inputs
- [ ] Verify state transitions work correctly
...

#### 3. System Integration Verification:
- [ ] Test within the full application context
- [ ] Verify with real data from the system
...
```

### Key Implementation Points:

1. **Mandatory Stopping Point**: The workflow explicitly stops and waits for human verification
2. **Issue-Specific Checklist**: Each verification includes issue-specific verification points
3. **No Auto-Continuation**: Claude Code will not proceed until explicit confirmation
4. **Clear Validation Steps**: Specific steps and commands are provided to validate each aspect

## Creating Effective Verification Checklists

When Claude Code generates verification checklists, they should:

1. **Be specific to the issue**: Include verification points directly related to acceptance criteria
2. **Cover all three stages**: Include separate sections for Storybook, Test Harness, and System Integration
3. **Focus on functionality**: Prioritize verifying that features actually work as intended
4. **Include edge cases**: Test both happy paths and error conditions
5. **Be actionable**: Provide clear steps that can be followed to verify each point
6. **Include helpful commands**: List the exact commands needed to run verification tools

## Example: Complete Verification Workflow

```
### Implementation Files To Verify:

**MODIFIED FILES:**
- src/components/WorldCard/WorldCard.tsx - Updated to show timestamps
- src/components/WorldList/WorldList.tsx - Updated to support sorting

**CREATED FILES:**
- src/components/WorldCard/WorldCardDetails.tsx - New component for detailed info

### Three-Stage Manual Verification:

#### 1. Storybook Testing:
- [ ] Run: `npm run storybook` and navigate to "Narraitor/World/WorldCard"
- [ ] Verify all world information (name, description, genre) is displayed
- [ ] Confirm timestamps (created/updated) appear in the specified format
- [ ] Check that responsive layout works at 320px, 768px, and 1280px widths
- [ ] Verify that important information is visually emphasized
- [ ] Test interactive elements (buttons, selection)

#### 2. Test Harness Verification:
- [ ] Run: `npm run dev` and navigate to `/dev/world-card-test`
- [ ] Test with various data inputs (long descriptions, missing fields)
- [ ] Verify state transitions (selected/unselected)
- [ ] Test with multiple world cards to ensure layout is consistent
- [ ] Verify sorting by timestamp works correctly
- [ ] Test error handling for invalid data

#### 3. System Integration Verification:
- [ ] Run: `npm run dev` and navigate to the worlds dashboard
- [ ] Verify the world list displays with the updated card format
- [ ] Create a new world and confirm the timestamps appear correctly
- [ ] Edit a world and verify the updated timestamp changes
- [ ] Confirm that all acceptance criteria are fully met:
  - [ ] Each world shows name, description, and genre
  - [ ] Timestamps for creation and updates are visible
  - [ ] Information is presented in a clean, readable format
  - [ ] Display adapts to different screen sizes
  - [ ] Important information is visually emphasized
```

## Best Practices

1. **Never Skip Verification**: Treat verification as mandatory, not optional
2. **Issue-Specific Verification**: Tailor verification points to each specific issue
3. **Full Three-Stage Process**: Always include all three verification stages
4. **Detailed Checklists**: Provide specific items to check, not general guidelines
5. **Include Commands**: List exact commands needed to run verification tools
6. **Focus on Acceptance Criteria**: Verify against the actual criteria from the issue
7. **Get Explicit Confirmation**: Only proceed after explicit verification confirmation

## Integration with Other Processes

The Three-Stage Verification Framework integrates with:

1. **TDD Process**: Tests provide the first level of verification, but don't replace manual verification
2. **Storybook Workflow**: Storybook stories should cover all states needed for verification
3. **PR Process**: The PR template includes a section confirming verification was completed
4. **Issue Completion**: Issues should be marked as verified before closing
5. **Documentation**: Document any verification-specific instructions for complex features

## Conclusion

The Three-Stage Verification Framework is a critical part of our development process. It ensures quality, prevents regressions, and validates that implementations actually meet requirements. Always include these verification steps in Claude Code workflows and never skip the verification process.
