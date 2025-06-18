# Manual Verification Steps - Skill Requirements on Narrative Choices

This document provides step-by-step manual testing instructions for verifying the skill requirements feature implementation.

## Prerequisites

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Have a character with mixed skill levels (some high, some low)

## Test Environment Setup

### Option A: Use Existing Game Session
1. Go to `/play` and start or continue a game session
2. Ensure your character has varied skill levels

### Option B: Use Development Test Harness
1. Navigate to `/dev/game-session` 
2. Use the test harness with predefined character data

## Manual Test Cases

### Test Case 1: Basic Skill Requirement Display
**Objective**: Verify skill requirement badges appear on narrative choices

**Steps**:
1. Start a game session with a character
2. Wait for narrative choices to generate
3. Look for choices that display skill requirement badges

**Expected Results**:
- Skill requirement badges appear as `[Skill Name X+]` format
- Badges are positioned below the choice text
- Badge styling is consistent and readable

**Pass Criteria**: ✅ Skill requirements are clearly visible and properly formatted

---

### Test Case 2: Available vs Unavailable Requirements
**Objective**: Verify correct visual distinction between met and unmet requirements

**Setup**: Ensure your character has some skills at level 5+ and others below 5

**Steps**:
1. Observe choices with skill requirements
2. Compare badge colors for different requirements
3. Check if your character's skill levels match the badge states

**Expected Results**:
- **Available requirements** (character meets them): Green background (`bg-green-100`), green text (`text-green-800`)
- **Unavailable requirements** (character doesn't meet them): Gray background (`bg-gray-100`), gray text (`text-gray-500`)

**Pass Criteria**: ✅ Badge colors correctly reflect character's ability to meet requirements

---

### Test Case 3: Multiple Requirements on Single Choice
**Objective**: Test choices with multiple skill requirements

**Steps**:
1. Look for narrative choices that have multiple skill requirements
2. Verify each requirement shows its own badge
3. Check that different requirements can have different availability states

**Expected Results**:
- Multiple badges appear side by side
- Each badge independently shows available/unavailable state
- Badges don't overlap or interfere with each other

**Pass Criteria**: ✅ Multiple requirements display correctly with independent states

---

### Test Case 4: Unknown Skill Handling
**Objective**: Verify graceful handling of skills not in the world definition

**Steps**:
1. Look for choices that reference skills not defined in the current world
2. Observe how these are displayed

**Expected Results**:
- Unknown skills show as `[Unknown Skill X+]`
- Unknown skills default to unavailable state (gray styling)
- No errors or crashes occur

**Pass Criteria**: ✅ Unknown skills are handled gracefully without breaking the UI

---

### Test Case 5: Custom Input Integration
**Objective**: Verify skill requirements work alongside custom input

**Steps**:
1. Find a narrative choice section with skill requirements
2. Use the custom input field to type a custom response
3. Submit the custom response
4. Verify the game continues normally

**Expected Results**:
- Custom input field appears above choices with requirements
- Skill requirement badges don't interfere with custom input
- Custom responses can be submitted regardless of skill requirements

**Pass Criteria**: ✅ Custom input and skill requirements coexist without conflicts

---

### Test Case 6: Responsive Design
**Objective**: Test skill requirements display on different screen sizes

**Steps**:
1. View choices with skill requirements on desktop
2. Resize browser window to tablet size (~768px width)
3. Resize to mobile size (~375px width)
4. Check badge wrapping and layout

**Expected Results**:
- Badges wrap to new lines when needed
- Text remains readable at all screen sizes
- Layout doesn't break or overflow

**Pass Criteria**: ✅ Skill requirements are responsive and readable on all screen sizes

---

### Test Case 7: Performance and Loading
**Objective**: Verify skill requirements don't impact performance

**Steps**:
1. Start a new game session
2. Progress through multiple narrative choices
3. Observe loading times and responsiveness
4. Check browser console for errors

**Expected Results**:
- Choice generation times remain reasonable
- No console errors related to skill requirements
- UI remains responsive during skill evaluation

**Pass Criteria**: ✅ Feature doesn't negatively impact performance

---

## Storybook Verification

### Test Case 8: Component Isolation Testing
**Objective**: Verify components work correctly in isolation

**Steps**:
1. Run `npm run storybook`
2. Navigate to `UI/SkillRequirementBadge` section
3. Test all available stories:
   - Available
   - Unavailable  
   - UnknownSkill
4. Navigate to `Narraitor/Narrative/Input/ChoiceSelector` section
5. Test stories with skill requirements:
   - BasicChoices
   - WithCustomInput
   - AlignedChoices

**Expected Results**:
- All stories render without errors
- Interactive controls work properly
- Visual states match expectations

**Pass Criteria**: ✅ All Storybook stories work correctly

---

## Edge Cases and Error Handling

### Test Case 9: Invalid Requirement Data
**Objective**: Test robustness with malformed data

**Steps**:
1. Check browser console for any error messages
2. Verify choices still display when skill requirement data is incomplete
3. Ensure the app doesn't crash with unexpected requirement formats

**Expected Results**:
- App handles invalid data gracefully
- Fallback behavior provides reasonable user experience
- No uncaught exceptions in console

**Pass Criteria**: ✅ Robust error handling prevents crashes

---

### Test Case 10: Accessibility Testing
**Objective**: Verify screen reader and keyboard accessibility

**Steps**:
1. Use Tab key to navigate through choices with skill requirements
2. Test with screen reader (if available) or browser accessibility tools
3. Verify adequate color contrast for all badge states
4. Check that requirements are announced properly

**Expected Results**:
- All interactive elements are keyboard accessible
- Screen readers can understand skill requirements
- Color contrast meets accessibility standards
- Requirements provide meaningful context

**Pass Criteria**: ✅ Feature is fully accessible

---

## Verification Checklist

- [ ] **Test Case 1**: Basic skill requirement display ✅
- [ ] **Test Case 2**: Available vs unavailable visual states ✅
- [ ] **Test Case 3**: Multiple requirements per choice ✅
- [ ] **Test Case 4**: Unknown skill handling ✅
- [ ] **Test Case 5**: Custom input integration ✅
- [ ] **Test Case 6**: Responsive design ✅
- [ ] **Test Case 7**: Performance and loading ✅
- [ ] **Test Case 8**: Storybook component testing ✅
- [ ] **Test Case 9**: Edge cases and error handling ✅
- [ ] **Test Case 10**: Accessibility testing ✅

## Reporting Issues

If any test case fails, please document:
1. **Test case number and name**
2. **Steps to reproduce**
3. **Expected vs actual results**
4. **Browser and device information**
5. **Screenshots if applicable**

## Test Data Requirements

For comprehensive testing, ensure test characters have:
- At least 3 different skills with varying levels (e.g., Intimidation: 8, Stealth: 3, Magic: 6)
- Mix of high and low skill values to test both available and unavailable states
- Skills that correspond to world skill definitions

## Browser Compatibility

Test in at least:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)