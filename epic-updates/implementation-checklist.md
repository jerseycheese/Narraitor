# Epic Implementation Checklist

## Step 1: Create New Epics
- [ ] Create "Navigation System Improvements" epic using `navigation-improvements-epic.md`
- [ ] Create "Journal System Implementation" epic using `journal-system-epic.md`  
- [ ] Create "MVP Launch Preparation" epic using `launch-preparation-epic.md`

## Step 2: Update Existing Epics
- [ ] Update Epic #379 (Narrative Engine) following instructions in `existing-epic-updates.md`
- [ ] Update Epic #312 (Character System) following instructions in `existing-epic-updates.md`
- [ ] Update Epic #429 (Gamification) following instructions in `existing-epic-updates.md`

## Step 3: Update Related Issues
### High Priority (MVP) Issues to Verify Labels:
- [ ] #462: Narrative Ending System - ensure `mvp`, `priority:high`
- [ ] #432: World Switcher Dropdown - ensure `mvp`, `priority:high`, link to Navigation Epic
- [ ] #278: Open journal during gameplay - ensure `mvp`, `priority:high`, link to Journal Epic
- [ ] #280: Responsive journal layout - ensure `mvp`, `priority:high`, link to Journal Epic
- [ ] #281: Store journal entries permanently - ensure `mvp`, `priority:high`, link to Journal Epic
- [ ] #248: Present clear decision points - ensure `mvp`, `priority:high`
- [ ] #256: Character viewing interface - ensure `mvp`, `priority:high`
- [ ] #305: Character editing interface - ensure `mvp`, `priority:high`
- [ ] #285: Define character attributes - ensure `mvp`, `priority:high`
- [ ] #286: Build character skills - ensure `mvp`, `priority:high`
- [ ] #287: Link skills to attributes - ensure `mvp`, `priority:high`
- [ ] #340: IndexedDB persistence - ensure `mvp`, `priority:high`

### Issues to Move to Post-MVP:
- [ ] All issues under Epic #429 (Gamification)
- [ ] #384: Visual regression testing - add `post-mvp`, `priority:low`
- [ ] #303: Personalized narrative content - add `post-mvp`, `priority:low`
- [ ] Portrait generation issues - add `post-mvp`, `priority:low`
- [ ] Inventory UI issues - add `post-mvp`, `priority:low`
- [ ] Advanced AI features - add `post-mvp`, `priority:low`
- [ ] Content preference system - add `post-mvp`, `priority:low`

## Step 4: Create New Issues for Gaps
### Navigation Epic Issues:
- [ ] Create issue for "Implement keyboard navigation shortcuts"
- [ ] Create issue for "Add navigation state persistence"
- [ ] Create issue for "Improve navigation loading states"

### Journal Epic Issues:
- [ ] Create issue for "Build JournalPanel component"
- [ ] Create issue for "Build JournalList component"
- [ ] Create issue for "Build JournalEntry component"
- [ ] Create issue for "Add journal entry creation hooks"
- [ ] Create issue for "Implement session grouping logic"

### Launch Prep Epic Issues:
- [ ] Create issue for "Build marketing landing page"
- [ ] Create issue for "Set up payment integration"
- [ ] Create issue for "Write getting started guide"
- [ ] Create issue for "Configure analytics"
- [ ] Create issue for "Create Terms of Service and Privacy Policy"

## Step 5: Verify Epic Associations
- [ ] Ensure all MVP issues are associated with their parent epics
- [ ] Update epic descriptions with links to child issues
- [ ] Verify no orphaned issues without epic associations

## Step 6: Final Review
- [ ] All MVP-critical work has `mvp` and appropriate priority label
- [ ] All deferred work has `post-mvp` label
- [ ] Timeline in epics matches the 6-8 week plan
- [ ] No mobile-specific issues remain in MVP scope
- [ ] Documentation reflects web-first approach

## Success Criteria
✅ 5 active MVP epics (Navigation, Journal, Character, Narrative, Launch)
✅ 1 deferred post-MVP epic (Gamification)
✅ All issues properly labeled and associated
✅ Clear 6-8 week timeline reflected in epic descriptions
✅ Ready to start Week 1 development with Navigation + Character UI