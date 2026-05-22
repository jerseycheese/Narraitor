# Narraitor MVP Roadmap

## Where We Are
**Major Milestone**: The core MVP is basically complete. AI storytelling, world creation, character building, session persistence, and navigation all work, and a player can go end to end through the loop.

**Current Status**: Polish toward a proper 1.0. Since this roadmap was first drafted, several big pieces have landed: the three-design-system migration (DS1/DS2/DS3, see [ADR-011](../architecture/ADR-011-three-design-systems.md)), Playwright visual-regression testing, the dashboard home page, the guided onboarding tutorial, table views for the list screens, and the lore entity-management work (fuzzy matching, aliases, deduplication, resolution). The remaining work is mostly UI polish, error-handling hardening, and getting things release-ready rather than net-new core systems.

## What the MVP Does
Basically, it's a complete solo narrative RPG experience where you can:
- Create any fictional world you want with AI assistance for attributes and skills
- Build characters that actually fit your world's rules and theme
- Play through AI-generated stories that adapt to your choices and setting
- Track your progress and decisions in a persistent journal
- Pick up exactly where you left off with automatic session saving

## Development Phases

### Phase 1: Core Systems - Complete
- [x] World Creation System with AI assistance
- [x] Character System with creation wizard and editing
- [x] Narrative Engine with Gemini integration
- [x] Narrative ending detection and handling
- [x] Decision point presentation system
- [x] Journal System with categorization
- [x] State management and persistence
- [x] Navigation System improvements
- [x] Toast notification system
- [x] Keyboard navigation support
- [x] AI consistency validation tools
- [x] Character Creation Auto-Save and Recovery

### Phase 2: UI/UX Polish
Making the experience smooth. Navigation done: mobile works, loading states are responsive, state persists.

**Priority 1: Narrative Consistency & Lore**
The lore system has come a long way — storage, fact tracking, fuzzy matching, aliases,
deduplication, and entity resolution have all landed (the `loreStore.*` family plus
`src/lib/lore/`), and there's a DevTools consistency-validation panel for debugging how the AI
processes lore. Reliable AI memory still matters most for the experience, so the remaining work
is tightening consistency rather than building the foundation:
- Narrative consistency checks (#188-191)
- Decision consequence tracking (#210, #198, #196)
- Long-term story impact systems

**Priority 2: Player-Facing Polish**
- Journal system completeness (entry viewing #174-179, formatting #257-263, choice tracking, session boundaries)
- Narrative display quality (#257-268, #274-284) - story text must be readable and professional
- Character system polish (in-game reference access, post-creation modifications)
- Inventory UI (minimum viable implementation - backend complete, add basic UI)

**Priority 3: World Configuration**
- Custom attribute definition
- Attribute suggestion workflow improvements

### Phase 2.5: Developer Infrastructure
Building debugging and tooling for production support.

**Priority 1: Error Handling (MVP Blocker)**
Cannot ship without graceful error handling:
- Runtime error capture and display (#159, #158, #155)
- AI service error viewing (#201-203)
- Error boundaries and recovery

**Priority 2: Development Tools**
Useful for ongoing development but not blocking MVP:
- AI service request/response debugging tools
- Application state debugging interfaces
- Developer console access and programmatic debugging
- Performance monitoring and measurement tools

### Phase 3: Testing & Quality
The foundation is solid, so now it's about making sure everything works reliably across different environments and use cases.

- Visual regression testing for UI consistency
- E2E coverage for critical user flows
- Performance optimization (especially AI response times which can be slow)
- Accessibility audit and compliance fixes
- Cross-browser testing and compatibility

### Phase 4: Launch Preparation
This is about getting ready for broader use beyond just personal development.

- Production deployment setup and monitoring
- User onboarding flow for people who aren't me
- Documentation and help system that actually makes sense
- Analytics to understand how people use it
- Marketing website/landing page

## Current Priority Queue

### Immediate: Core Quality & Reliability
Cannot ship without these:
- Error handling and retry resilience (#902)
- Lore entity management (#446-449 - fuzzy matching, Unicode support, aliases, entity resolution)
- Context window management for long games (#408)
- Narrative checkpoint system (#411) - MVP implementation complete, see `../features/story-checkpoints.md`

### High Priority: Player-Facing Features
Core user experience:
- Dashboard home page to guide world-to-character flow (#398)
- Guided onboarding tutorial (#399)
- Character creation templates (#393)
- Character portraits (custom upload #404, avatar library #405)
- Skill prerequisites (#392)
- Table views for journal/character/world lists (#808, #809, #810)
- Session pacing and reading milestones (#805)

### Medium Priority: Development & Infrastructure
Important for quality and debugging:
- Fix skipped localStorage tests (#646)
- Visual diff review tooling (#652)
- Docker containers for cross-platform visual consistency (#653)
- Snapshot governance (#655)
- Visual performance metrics (#656)
- AI service documentation enhancements (#334)
- AI error handling integration tests (#332)
- Token usage tracking (#326)
- Token estimation optimization (#319)

### Deferred: Multi-Provider AI (Epic #878)
Valuable but can launch with Gemini-only:
- Provider abstraction layer (#890)
- Secure configuration storage (#891)
- Provider configuration UI (#892)
- Gemini refactor to provider pattern (#893)
- Claude native SDK (#894)
- Generic OpenAI-compatible provider (#895)
- See "Post-MVP Features" section for full multi-provider roadmap

## Technical Debt & Infrastructure
- Playwright visual regression testing — done (`tests/visual/`, runs in CI)
- Dead-code and architecture tooling — done (knip, CSS audit, dependency-cruiser, mutation testing)
- Optimize bundle size and performance
- Enhance error boundaries and recovery
- Improve TypeScript strictness
- Add logging/monitoring

## Post-MVP Features (Explicitly Deferred)
Features that are valuable but not required for initial launch:

**Multi-Provider AI Support (Epic #878)**
- OpenAI-compatible provider abstraction
- Support for OpenAI, Claude, Deepseek, Mistral, etc.
- Secure API key storage for user-provided keys
- Provider configuration UI
- Note: Can launch with Gemini only, add providers post-launch

**Advanced Features**
- Multiplayer/shared world support
- Economy and trading systems
- Advanced character progression systems
- Content moderation and filters
- Enhanced AI personalization
- Voice narration support
- Mobile app versions

**Infrastructure**
- Advanced CI/CD pipeline enhancements
- Dependency updates (Next.js 16, Storybook 9.x, test stack)

## Success Metrics
- All critical path issues resolved
- <3s page load time on average connection
- 100% keyboard navigable
- WCAG 2.1 AA compliance
- <5% error rate in production
- Positive user feedback from beta testing

## Launch Criteria
- [ ] All Phase 1-3 items complete
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Beta testing feedback incorporated
- [ ] Documentation complete
- [ ] Marketing materials ready

---
*Last Updated: 2026-05-22 - Reconciled status against shipped work: design-system migration, visual regression, dashboard, onboarding, table views, and lore entity management have all landed; remaining work is polish and release-readiness toward 1.0.*
