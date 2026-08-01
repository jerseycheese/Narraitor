# Narraitor MVP Roadmap

## Where We Are
**Major Milestone**: The core MVP is basically complete. AI storytelling, world creation, character building, session persistence, and navigation all work, and a player can go end to end through the loop.

**Current Status**: the 1.0 endgame. The visual-finish work that made up most of this roadmap's
active queue is done, and so is the QA walkthrough. What's left in the `v1.0` milestone is four
items plus the cut itself: the release QA tracking issue (#1417), the archive/retire sweep
(#1639), this docs sweep (#1638), and tagging the release (#1635), all hanging off the tracking
issue #1320.

The big pieces that landed along the way: the three-design-system migration (DS1/DS2/DS3, see
[ADR-011](../architecture/ADR-011-three-design-systems.md)), later collapsed back to a single
design system via [ADR-013](../architecture/ADR-013-collapse-to-single-design-system-ds3.md);
bring-your-own-key provider config (#891/#892/#893), which is what makes a free public release
possible; Playwright visual-regression testing; the dashboard home page; the guided onboarding
tutorial; table views for the list screens; and the lore entity-management work (fuzzy matching,
aliases, deduplication, resolution).

1.0 ships single-player, browser-local, with the player supplying their own Gemini key. No
accounts and no server-side sync, which is a scoping decision rather than an oversight -
monetization needs auth and backend persistence that don't exist yet, so it lives on its own
track (#495) instead of blocking the launch.

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

**Priority 1: Error Handling (MVP Blocker)** — shipped (#902; see "Recently shipped" below)
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

The next release to main is **v1.0**, tracked in the `v1.0` GitHub milestone and meta-issue
**#1320**. Core MVP systems are done and the visual-finish work is done; what's left is release
hygiene and the cut. The earlier Immediate / High Priority / Medium Priority queues are kept below
as a record of what actually shipped (and what didn't), followed by the active v1.0 work. This
roadmap is a running log, not a snapshot.

### Recently shipped (prior queues, kept for history)

**Core quality & reliability**
- [x] Error handling and retry resilience (#902)
- [x] Lore entity management — fuzzy matching (#446), Unicode keys (#447), entity resolution (#448), aliases (#449)
- [x] Context-window management for long-running games (#408)
- [x] Narrative checkpoint system (#411) — see `../features/story-checkpoints.md`

**Player-facing features**
- [x] Dashboard home page (#398)
- [x] Guided onboarding tutorial (#399)
- [x] Character creation templates (#393) - since removed. The templates system was ripped out for 1.0 as too much complexity for the value (#1455, with world templates going the same way in #1454).
- [x] Character portraits foundation — custom upload (#404), avatar library (#405); the preset+upload UX is revisited in #1299, deferred to 1.1
- [x] Skill prerequisites (#392)
- [x] Table views — character lists (#808), world comparison (#810)
- [ ] Journal table view (#809) — still open, not pulled into v1.0

**Development & infrastructure**
- [x] Fixed skipped localStorage tests (#646)
- [x] AI service documentation pass (#334)
- [x] AI error-handling integration tests (#332)
- [x] Token usage tracking (#326) and token-estimation optimization (#319)
- [ ] Visual diff tooling (#652), Docker cross-platform visual consistency (#653), snapshot governance (#655), visual performance metrics (#656) — still open, not blocking 1.0

### v1.0 — active (next release to main)

Everything below is what's actually still open in the `v1.0` milestone. The dependency order
lives in #1320.

- [Tracking] v1.0 release — visual finish + launch gate (#1320)
- [Tracking] v1.0 release QA walkthrough (#1417)
- Archive/retire sweep: stale branches, dead knip config, /dev route decision (#1639)
- Docs correctness sweep across `public_docs/` (#1638)
- Cut the release: tag and fast-forward `main` (#1635)

### Shipped for v1.0

**Visual blockers (Tailwind-removal fallout)**
The post-#1097 cleanup left several shared primitives shipping unstyled in the app while the
showcase looked fine, the exact drift the canon work exists to kill. The pattern that came out of
it: style the primitive *in production*, not in the showcase.
- [x] Shared modals unstyled, no backdrop, unpositioned panel (#1316, PR #1315) — set the pattern
- [x] Remaining DS primitives unstyled: card/alert/tabs/table/checkbox/radio (#1317)
- [x] Render data-table + CollapsibleSection in the style guide for canon coverage (#1319)

**Visual-test coverage & hygiene**
- [x] Audit crawler hygiene: theme captures + seeded load + bbox cropping (#1297)
- [x] Stabilize tour & world-detail visual specs (#1198)
- [x] Split tutorial visual tests into a dedicated CI job (#1014); restore deleted tutorial coverage (#1239)

### Commercialization (#495) — post-1.0, not a launch gate
This used to sit in the v1.0 queue as "MVP Launch Preparation." It's since been rescoped to
commercialization (a paid product launch) and moved out of the 1.0 gate entirely, because
charging for anything needs accounts and server-side persistence that 1.0 deliberately doesn't
have.

### Deferred to 1.1+ (player-facing polish, not blocking 1.0)
- Preset avatars + custom portrait upload (#1299)
- Full keyboard control with focus indicators (#276)
- Session pacing and reading milestones (#805)

### Partly shipped: Multi-Provider AI (Epic #878)
The bring-your-own-key slice landed for 1.0 and the rest is still deferred, so the app launches
Gemini-only. Shipped: secure key storage (#891), provider config UI (#892), Gemini refactor to the
provider pattern (#893). Still open: provider abstraction (#890), Claude native SDK (#894),
generic OpenAI-compatible provider (#895).

## Technical Debt & Infrastructure
- Playwright visual regression testing — done (`tests/visual/`, runs in CI)
- Dead-code and architecture tooling — done (knip, CSS audit, dependency-cruiser, mutation testing, skott circular-dep budget)
- Optimize bundle size and performance
- Enhance error boundaries and recovery
- Improve TypeScript strictness
- Add logging/monitoring

## Post-MVP Features (Explicitly Deferred)
Features that are valuable but not required for initial launch:

**Multi-Provider AI Support (Epic #878), minus what already shipped**
- OpenAI-compatible provider abstraction (#890)
- Support for OpenAI, Claude, Deepseek, Mistral, and so on (#894, #895)
- Note: secure key storage and the provider config UI are done; 1.0 launches Gemini-only

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
*Last Updated: 2026-08-01 - Correctness pass as part of #1638. The Phase A visual blockers (#1316, #1317, #1319) and the supporting visual-test items (#1297, #1198, #1014, #1239) had all merged but were still listed as active work, so they moved to "Shipped for v1.0" and the active queue now matches what's actually open in the milestone. #495 was retitled to commercialization and is no longer a 1.0 gate. Noted that the character-templates system (#393) was later removed in #1455, and that #891/#892/#893 shipped out of the multi-provider epic.*
