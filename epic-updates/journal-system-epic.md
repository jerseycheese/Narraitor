---
name: Epic
about: Create an epic to track a large feature or a group of related user stories
title: "[EPIC] Journal System Implementation"
labels: epic, journal-system, mvp, priority:high
assignees: ''
---

## Plain Language Summary
Create a system that tracks and displays the player's story history during gameplay.

## Epic Description
The Journal System backend is complete but needs UI components to make it accessible to players. This epic covers creating all the necessary UI components and integrating them into the gameplay experience, allowing players to review their story history, track important events, and maintain continuity across sessions.

## Domain
- [x] Journal System

## Goals
- Create comprehensive UI components for the journal system
- Enable automatic recording and display of game events
- Provide easy access to journal during gameplay
- Ensure persistent storage between sessions
- Organize entries clearly by session and chronology
- Support responsive design for all devices

## User Stories
- [ ] Create journal UI components
  - [ ] JournalPanel.tsx - Collapsible panel for gameplay view
  - [ ] JournalList.tsx - Chronological list of entries
  - [ ] JournalEntry.tsx - Detailed entry view with formatting
  - [ ] JournalHeader.tsx - Controls and entry count
  - [ ] JournalEmpty.tsx - Empty state component
  - [ ] JournalSearch.tsx - Basic search functionality (if time permits)
- [ ] Implement collapsible journal panel during gameplay (#278)
- [ ] Add responsive journal layout for mobile/tablet/desktop (#280)
- [ ] Ensure journal entries are stored permanently (#281)
- [ ] Add journal entry creation hooks for narrative events
- [ ] Create session grouping logic for better organization
- [ ] Add entry formatting system (for actions, dialogues, system messages)
- [ ] Implement journal state management integration
- [ ] Add journal entry export functionality (if time permits)

## Timeline
Weeks 2-4 of MVP development

## Definition of Done
- Journal is easily accessible during gameplay via collapsible panel
- All narrative events automatically create appropriate journal entries
- Journal data persists reliably between sessions using IndexedDB
- UI is fully responsive and works well on all device sizes
- Players can easily browse their story history
- Entries are well-formatted and easy to read
- No data loss bugs or persistence issues
- Journal integrates seamlessly with existing game flow
- Performance remains smooth even with many entries

## Additional Context
The backend for the journal system is already implemented in the journalStore. This epic focuses entirely on creating the UI layer and ensuring smooth integration with the gameplay experience. The journal is critical for player engagement as it helps them track their unique story and maintain continuity across play sessions.