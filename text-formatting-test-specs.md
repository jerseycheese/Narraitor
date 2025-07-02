# Text Formatting Test Specifications - Issue #231

## Overview
This document outlines the focused test files created for implementing readable storytelling text formatting as specified in issue #231. Tests follow TDD principles and target core functionality.

## Test Files Created

### 1. Text Formatter Unit Tests
**File**: `/src/lib/utils/__tests__/textFormatter.readable-storytelling.test.ts`

**Purpose**: Tests core text formatting functionality for readable storytelling

**Key Test Areas**:
- **Paragraph Break Formatting**: Ensures narrative text is formatted with standard paragraph breaks
- **Dialogue Formatting**: Validates proper quotation marks and attribution for dialogue
- **Emphasis Formatting**: Tests formatting of important story elements with italics
- **Visual Organization**: Ensures complex narrative text is organized for readability
- **Consistency**: Validates consistent formatting across different narrative segments

**Test Count**: 17 focused tests targeting acceptance criteria

### 2. NarrativeDisplay Integration Tests
**File**: `/src/components/Narrative/__tests__/NarrativeDisplay.readable-storytelling.test.tsx`

**Purpose**: Tests integration of text formatting within the NarrativeDisplay component

**Key Test Areas**:
- **Paragraph Break Display**: Tests visual presentation of paragraph structures
- **Dialogue Display Formatting**: Validates dialogue-specific visual styling
- **Visual Organization**: Tests different segment types maintain readability
- **Consistent Formatting**: Ensures consistent presentation across all content
- **Content Parsing Integration**: Tests formatting works with existing content parsing

**Test Count**: 15 integration tests focusing on user-visible behavior

### 3. Storybook Story Specifications
**File**: `/src/components/Narrative/NarrativeDisplay.readable-storytelling.stories.tsx`

**Purpose**: Visual documentation and testing of text formatting features

**Stories Created**:
- **FormattedParagraphs**: Shows proper paragraph break formatting
- **DialogueFormatting**: Demonstrates dialogue with quotation marks
- **ActionWithEmphasis**: Shows emphasis formatting for important elements
- **MixedContentFormatting**: Combines all formatting features
- **LongFormNarrative**: Tests consistency across longer content
- **TransitionFormatting**: Shows special formatting for transition segments

## Current Test Status

**Failing Tests (Expected in TDD Red Phase)**:
1. `should organize complex narrative text for readability` - Dialogue formatting order issue
2. `should apply consistent formatting to different types of narrative content` - Emphasis placement in dialogue
3. `should maintain consistent readability formatting regardless of content length` - Content parsing fallback behavior

**Passing Tests**: 26/29 tests pass, focusing on core functionality

## Acceptance Criteria Coverage

✅ **Narrative text is formatted with standard paragraph breaks**
- Covered by paragraph formatting tests
- Tests normalize inconsistent breaks and maintain structure

✅ **Dialogue is formatted with appropriate quotation marks and attribution**
- Covered by dialogue formatting tests
- Tests multiple speakers and various speech verbs

✅ **Important elements receive proper emphasis through formatting**
- Covered by emphasis formatting tests
- Tests asterisk-wrapped text conversion to italics

✅ **Text is visually organized for easy reading**
- Covered by visual organization tests
- Tests complex narrative combinations

✅ **Formatting is consistent across all narrative segments**
- Covered by consistency tests
- Tests different segment types and edge cases

## Implementation Requirements Identified by Tests

Based on failing tests, the implementation needs to address:

1. **Dialogue and Emphasis Order**: When dialogue contains emphasis, the formatting order needs refinement
2. **Content Length Detection**: The content parsing logic needs adjustment for short content detection
3. **Punctuation Handling**: Dialogue formatting needs better punctuation placement with emphasis

## Next Steps for Implementation

1. **Fix Text Formatter**: Address the dialogue and emphasis interaction issues
2. **Adjust Content Parsing**: Modify the logic for detecting insufficient content
3. **Run Tests**: Use tests to guide implementation until all pass
4. **Visual Testing**: Use Storybook stories to validate visual presentation
5. **Integration Testing**: Ensure formatting works properly in the full application context

## Test Design Principles Applied

- **Behavior Over Implementation**: Tests focus on what the formatting does, not how
- **Acceptance Criteria Focused**: Each test directly relates to issue requirements
- **Minimal and Focused**: Tests only cover MVP functionality without bloat
- **Red-Green-Refactor**: Tests fail initially to guide implementation
- **User-Centric**: Integration tests verify user-visible behavior

The test suite provides comprehensive coverage of the text formatting requirements while maintaining focus on the core functionality needed for readable storytelling.