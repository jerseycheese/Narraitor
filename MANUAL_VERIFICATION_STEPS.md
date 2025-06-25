# Manual Verification Steps - Test Stabilization & Critical Bug Fixes

This document provides simple manual verification steps to ensure no regressions were introduced during the test stabilization work and critical bug fixes.

## Overview

**PR**: Test stabilization and critical runtime bugs  
**Scope**: Test suite stabilized, infinite loop bugs fixed, build reliability improved  
**Risk Areas**: Runtime crashes, infinite loops, test failures

---

## 🎯 Critical Flow Verification

### 1. Home Page Load ⭐ **HIGH PRIORITY**

**Why Critical**: Previously caused infinite loop crashes

**Steps**:
1. Navigate to `/` (home page)
2. Verify page loads without errors
3. Check browser console for any "Maximum update depth exceeded" errors
4. Verify QuickPlay component renders correctly
5. If first-time user, verify onboarding flow works

**Expected**: Smooth page load, no infinite loops, no console errors

---

### 2. World Creation Workflow ⭐ **HIGH PRIORITY**

**Why Critical**: Core user journey, complex form state management

**Steps**:
1. Navigate to `/world/create`
2. **Template Selection**:
   - Verify template cards display correctly
   - Click different templates → should show selection state
   - Try "Generate" tab → AI template generation should work
   - Try "Create My Own World" → should skip to basic info
3. **Basic Information**:
   - Fill in world name, description, genre
   - Verify form validation on empty fields
   - Click "Next" → should advance to attributes step
4. **Attributes Configuration**:
   - Verify AI-suggested attributes display correctly
   - Select/deselect attributes using "Selected ✓" / "Excluded" buttons
   - Try "Customize" on an attribute → should allow editing name, description, base value
   - Try "Add Custom Attribute" → should open attribute editor
   - Verify attribute slot limit (6 total attributes maximum)
   - Click "Next" → should advance to skills step
5. **Skills Configuration**:
   - Verify AI-suggested skills display correctly
   - Select/deselect skills using "Selected ✓" / "Excluded" buttons  
   - Try "Add Custom Skill" → should open skill editor
   - Link skills to attributes using checkboxes
   - Try deleting a custom skill → should remove from list
   - Verify skill limit (12 total skills maximum)
   - Click "Next" → should advance to final step
6. **Review & Create**:
   - Verify all entered data appears correctly
   - Click "Create World" → should create world and redirect

**Expected**: Smooth progression through all steps, form data persists between steps, validation works correctly

---

### 3. DevTools Panel ⭐ **HIGH PRIORITY**

**Why Critical**: Previously caused infinite loop crashes in development

**Steps**:
1. Ensure you're in development mode (`NODE_ENV=development`)
2. Check that DevTools panel appears at bottom of screen
3. Click "Show DevTools" / "Hide DevTools" button multiple times
4. Verify no infinite loops or console errors
5. Check that panel state persists correctly

**Expected**: DevTools panel toggles smoothly, no infinite re-renders, no console errors

---

### 4. Character Creation Workflow ⭐ **MEDIUM PRIORITY**

**Why Critical**: Second most important user flow, complex form state management

**Steps**:
1. Navigate to `/characters/create` (or from within a world)
2. **Basic Information**:
   - Enter character name and description
   - Verify validation on empty name field
3. **Attribute Assignment**:
   - Verify world's attributes display
   - Assign points to attributes → point pool should decrease
   - Try exceeding point pool → should show validation error
4. **Skill Assignment**:
   - Verify world's skills display
   - Assign points to skills → point pool should decrease
   - Verify attribute-linked skills show requirements
5. **Portrait Generation** (if available):
   - Click "Generate Portrait" → should show loading state
   - Verify portrait appears or error handling works
6. **Save Character**:
   - Click "Create Character" → should save and redirect

**Expected**: Form state managed correctly, point pools update properly, validation prevents invalid submissions

---

## 🔍 Quick Smoke Tests

### Build & Test Verification
```bash
# Verify build works
npm run build

# Verify tests pass
npm test

# Verify linting
npm run lint

# Start development server
npm run dev
```

### Infinite Loop Detection
- **Home page**: Load `/` and check console for errors
- **DevTools**: Toggle DevTools panel repeatedly
- **World creation**: Navigate through wizard steps
- **Browser performance**: Check for memory leaks during long sessions

### Error Handling
- **Network Errors**: Disconnect internet, try AI generation
- **Validation Errors**: Submit forms with invalid data
- **Recovery**: Error states should allow retry/recovery

### Loading States
- **AI Generation**: Template generation, portrait generation, narrative generation
- **Data Loading**: World lists, character lists, game session loading
- **Transitions**: Page transitions should show appropriate loading states

---

## 🚨 Red Flags to Watch For

### Performance Issues
- **Infinite Loops**: Check browser console for repeated log messages or "Maximum update depth exceeded"
- **Memory Leaks**: Long sessions should not degrade performance
- **Slow Rendering**: Forms should respond immediately to input

### Build Issues
- **TypeScript Errors**: Build should complete without compilation errors
- **Test Failures**: All tests should pass (some may be skipped)
- **Lint Errors**: Code should pass ESLint checks

### Runtime Issues
- **Console Errors**: No JavaScript errors in browser console
- **Component Crashes**: All components should render without errors
- **State Management**: UI should reflect actual data state consistently

---

## 📝 Manual Test Checklist

Copy this checklist for each verification session:

**Critical Flows:**
- [ ] Home page loads without infinite loops
- [ ] DevTools panel works without crashes
- [ ] World Creation (end-to-end)
- [ ] Character Creation (end-to-end)

**Build & Test Verification:**
- [ ] Build completes successfully (`npm run build`)
- [ ] Tests pass without critical failures (`npm test`)
- [ ] ESLint clean (`npm run lint`)
- [ ] Development server starts normally (`npm run dev`)

**Performance:**
- [ ] No console errors/warnings
- [ ] No infinite loops or memory leaks
- [ ] Responsive component interactions
- [ ] Proper state persistence

---

## 🎯 Success Criteria

**✅ Verification Complete** when:
1. Home page loads without infinite loop errors
2. DevTools panel functions without crashes
3. Core workflows work end-to-end without errors
4. Build and test commands complete successfully
5. No "Maximum update depth exceeded" errors in any component

**🚨 Requires Investigation** if:
- Any infinite loops or "Maximum update depth exceeded" errors detected
- Build fails with TypeScript compilation errors
- Critical workflows fail to complete
- Performance degradation in any component
- Unexpected console errors or warnings

---

*This verification should take approximately 10-15 minutes to complete all critical flows.*