## Description
Implements a centralized example library system with token-aware selection to guide AI responses more effectively. This system allows developers to include examples in prompts dynamically based on token budgets, ensuring high-quality AI output without exceeding context limits.

## Related Issue
Closes #298

## Type of Change
- [x] New feature (non-breaking change which adds functionality)
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactoring (code improvements without changing functionality)
- [x] Documentation update
- [x] Test addition or improvement

## TDD Compliance
- [x] Tests written before implementation
- [x] All new code is tested
- [x] All tests pass locally
- [x] Test coverage maintained or improved

**Test Summary:**
- 24 new tests for ExampleManager (100% passing)
- All 1,630 existing tests pass
- Full coverage for example selection, filtering, priority sorting, and token budgeting

## User Stories Addressed
**As a developer**, I want to include examples in prompts to guide the AI's responses so that the output follows desired patterns and formatting.

**Acceptance Criteria Met:**
- ✅ Prompt templates support including optional examples
- ✅ Examples demonstrate the desired output format and style
- ✅ Examples are context-appropriate for the specific prompt type
- ✅ Examples are included only when they add value within token constraints
- ✅ The system allows developers to manage the example library

## Flow Diagrams
N/A - Backend/utility implementation without UI flow changes

## Component Development
- [ ] Storybook stories created/updated
- [ ] Components developed in isolation first
- [ ] Visual consistency verified

**Note:** This is a backend utility implementation without UI components.

## Implementation Notes

### Architecture
The implementation consists of four main modules:

1. **ExampleManager** (`exampleManager.ts`)
   - Core selection logic with priority-based filtering
   - Token-aware greedy algorithm for example selection
   - Configurable formatters and token budgets

2. **Example Library** (`exampleLibrary.ts`)
   - Centralized storage for 14 curated examples
   - Examples organized by category: emphasis, perspective, skill acknowledgment, choices, NPC metadata, sensory descriptions
   - Easy to extend with new examples

3. **Example Helper** (`exampleHelper.ts`)
   - `getExamplesForPrompt()` - Main convenience function
   - `shouldIncludeExamples()` - Smart decision logic for token constraints
   - Auto-initialization on module load

4. **Type Definitions** (`types.ts`)
   - Comprehensive TypeScript interfaces
   - Priority levels: critical → high → medium → low
   - Categories: scene, transition, choice, skill-acknowledgment, etc.

### Template Integration
Five templates updated to use the example system:
- **baseNarrativeTemplate**: Emphasis and formatting examples
- **transitionTemplate**: Second-person perspective examples
- **sceneTemplate**: Perspective and sensory description examples
- **skillAcknowledgmentTemplate**: Skill success/failure examples
- **playerChoiceTemplate**: Choice generation and context summary examples

### Token Management
The system intelligently manages token budgets:
- Examples excluded when < 50 tokens available
- Examples excluded when context > 5000 characters (already comprehensive)
- Priority-based selection ensures critical examples included first
- Automatic token count calculation for all examples

### Key Design Decisions
- **Greedy selection algorithm**: Prioritizes highest-priority examples first, then fills remaining budget
- **Category + tag filtering**: Flexible targeting of relevant examples
- **Singleton pattern**: Global `exampleManager` instance for easy access
- **Auto-initialization**: Example library loaded on module import
- **Non-breaking**: Existing templates work unchanged; examples are additive

## Screenshots
N/A - Backend implementation

## Code Review Summary (if applicable)
N/A - Manual implementation with TDD approach

## Playwright MCP Verification Summary (if applicable)
N/A - No browser automation required

## Quality Checks (if applicable)
- [x] Linting passed
- [x] Type checking passed
- [x] Security audit passed
- [x] No console.log statements in production code
- [x] No unhandled promises

## Testing Instructions

### Manual Testing
1. **Verify Example Selection**
   ```bash
   npm test -- src/lib/promptTemplates/examples/exampleManager.test.ts
   ```
   Expected: All 24 tests pass

2. **Verify Template Integration**
   ```bash
   npm test -- src/lib/ai
   ```
   Expected: All AI tests pass (templates use examples correctly)

3. **Verify Full Test Suite**
   ```bash
   npm test
   ```
   Expected: All 1,630 tests pass

### Three-Stage Verification

**Stage 1: Unit Testing** ✅
- ExampleManager unit tests verify selection logic
- Token budget constraints tested
- Priority filtering tested
- Tag and category filtering tested

**Stage 2: Integration Testing** ✅
- Template integration verified through AI tests
- Example formatting verified
- Token-aware selection verified in context

**Stage 3: System Integration** ⏭️
- Deploy to dev environment
- Generate narrative segments and verify examples appear in prompts when appropriate
- Verify examples excluded when token budget is tight
- Monitor AI output quality with vs without examples

## Checklist
- [x] Code follows the project's coding standards
- [x] File size limits respected (max 300 lines per file)
  - exampleManager.ts: 283 lines
  - exampleLibrary.ts: 182 lines
  - exampleHelper.ts: 88 lines
  - types.ts: 68 lines
- [x] Self-review of code performed
- [x] Comments added for complex logic
- [x] Documentation updated (if required)
  - Comprehensive README.md with usage examples
  - JSDoc comments on all public methods
  - API reference documentation
- [x] No new warnings generated
- [x] Accessibility considerations addressed (N/A - backend only)

## Additional Notes

### Future Enhancements
The example library system is designed to be extensible. Potential future improvements:
- A/B testing different examples to measure output quality impact
- Per-world or per-user example customization
- Example effectiveness metrics and analytics
- Visual example library browser/editor UI
- Dynamic example selection based on AI model performance

### Related Issues
- Builds on #295 (prompt templates)
- Supports #296 (world and character details)
- Works with #297 (token consumption management)
- Enhances #203 (prompt construction visualization)
- Integrates with #202 (narrative state inspection)
