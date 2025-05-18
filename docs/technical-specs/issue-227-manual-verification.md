# Manual Verification Checklist for Issue #227

## AI Suggestions Feature - Manual Testing Guide

This guide provides step-by-step instructions for manually verifying the AI suggestions functionality implemented for issue #227.

### Prerequisites
1. Storybook is running (`npm run storybook`)
2. Development server is running (`npm run dev`)
3. You have a valid Google Gemini API key configured

### 1. Storybook Verification

#### Component States
Navigate to **Narraitor/World/AISuggestions** in Storybook and verify each story:

- [ ] **Default story**: Shows attributes and skills with accept/reject buttons
- [ ] **Loading story**: Displays loading spinner animation
- [ ] **Empty story**: Shows "No suggestions available" message
- [ ] **Error story**: Displays error message properly
- [ ] **Attributes Only story**: Shows only attributes section
- [ ] **Skills Only story**: Shows only skills section
- [ ] **All Accepted story**: All suggestions show as accepted
- [ ] **Interactive story**: Click actions trigger alerts

### 2. Development Harness Testing

#### Navigate to `/dev/world-creation-wizard`

**Step 1: Template Selection**
- [ ] Select any world template
- [ ] Click "Next"

**Step 2: Basic Information**
- [ ] Enter world name: "AI Test World"
- [ ] Add theme: "Fantasy"
- [ ] Add 1-2 genre tags
- [ ] Click "Next"

**Step 3: World Description (AI Integration)**
- [ ] Enter description: "A magical realm where dragons soar above floating islands, and ancient sorcerers weave spells of incredible power. The world is filled with mystical artifacts and dangerous quests."
- [ ] Click "Next" button
- [ ] Verify loading overlay appears with spinner and "Analyzing your world description..." text
- [ ] Wait for AI analysis to complete (may take 5-10 seconds)
- [ ] Wizard automatically proceeds to the next step

**Step 4: Attribute Review (AI-Generated)**
- [ ] Verify the wizard shows "Review Attributes" step
- [ ] Check that AI-suggested attributes appear based on your description
- [ ] Each attribute should have:
  - [ ] Name and description
  - [ ] Min/Max values
  - [ ] Category
  - [ ] Checkbox for selection
- [ ] Select/deselect attributes using checkboxes
- [ ] Click "Next" to proceed

**Step 5: Skill Review (AI-Generated)**
- [ ] Verify the wizard shows "Review Skills" step
- [ ] Check that AI-suggested skills appear based on your description
- [ ] Each skill should have:
  - [ ] Name and description
  - [ ] Difficulty level
  - [ ] Category
  - [ ] Linked attribute (if applicable)
  - [ ] Checkbox for selection
- [ ] Select/deselect skills using checkboxes
- [ ] Click "Next" to proceed

**Step 6: Navigate Through Wizard**
- [ ] Click "Next" to Attribute Review
- [ ] Verify only accepted attributes appear
- [ ] Click "Next" to Skill Review
- [ ] Verify only accepted skills appear
- [ ] Complete the wizard

### 3. Error Handling Testing

**Test 1: No Description**
- [ ] Start wizard flow
- [ ] Reach description step without entering text
- [ ] Click "Get AI Suggestions"
- [ ] Verify error message appears

**Test 2: API Error Simulation**
- [ ] Disconnect internet or invalidate API key
- [ ] Enter description and request suggestions
- [ ] Verify user-friendly error message appears
- [ ] Verify retry functionality is available

### 4. Edge Cases

- [ ] Test with very short description (10 characters)
- [ ] Test with very long description (500+ characters)
- [ ] Test with non-English characters
- [ ] Test rapid clicking of accept/reject buttons
- [ ] Test browser refresh during AI loading

### 5. Integration Testing

**Full Flow Test**
1. [ ] Create a complete world using AI suggestions
2. [ ] Save the world
3. [ ] Navigate to world list
4. [ ] Verify created world appears
5. [ ] Open world details
6. [ ] Verify AI-suggested attributes and skills are saved correctly

### 6. Performance Checks

- [ ] Loading time is reasonable (< 10 seconds)
- [ ] UI remains responsive during AI processing
- [ ] No console errors during operation
- [ ] Memory usage is stable

### 7. Accessibility

- [ ] Tab navigation works through all interactive elements
- [ ] Screen reader announces loading states
- [ ] Keyboard shortcuts work (Enter/Space for buttons)
- [ ] Focus indicators are visible

### 8. Visual Verification

- [ ] Components match design requirements
- [ ] Loading animation is smooth
- [ ] Accept/reject states are clearly visible
- [ ] Error messages are properly styled
- [ ] Text is readable and well-formatted

### Known Issues/Limitations
- AI suggestions may take 5-10 seconds to generate
- Quality of suggestions depends on description detail
- Requires active internet connection

### Sign-off
- [ ] All critical paths tested
- [ ] No blocking issues found
- [ ] Feature ready for PR review

**Tested by:** _______________
**Date:** _______________
**Environment:** _______________