---
title: "ADR-009: Guided First-Time Experience System"
tags: [architecture, decision, adr, onboarding]
created: 2025-06-20
updated: 2026-08-01
---

# ADR-009: Guided First-Time Experience System

**Status**: Accepted - Implemented (#559)
**Date**: 2025-06-20

## Context
So we had a problem with new users hitting Narraitor and just bouncing. The world creation process was asking too much of them upfront - they needed to understand attributes, skills, and settings before they could even get started. There wasn't a clear path for first-time users, and the cognitive load was just too high. People were dropping off before they got to experience what the app actually does.

## Decision
Built a guided onboarding system for new users:

1. **Automatically detects first-time users** using session state analysis
2. **Simplifies world creation** to just 2 essential steps (concept + details) instead of the full complex flow
3. **Uses AI to enhance user input** with contextually appropriate defaults so they don't have to figure everything out
4. **Provides seamless progression** from world to character creation so there's no dead ends
5. **Maintains professional UX standards** with responsive design and proper error handling

## Implementation Architecture

### Core Components
- **GuidedFirstTimeExperience**: Main wizard component with 3-step flow
- **Session Detection**: `shouldShowOnboarding()` logic in sessionStore
- **AI Integration**: Contextual name generation, world analysis, and image creation
- **Wizard Framework**: Reusable wizard components for consistent patterns

### Technical Decisions

#### State Management
- **Choice**: Integrate with existing sessionStore rather than creating separate state
- **Rationale**: Why reinvent the wheel? We already had auto-save infrastructure and persistence working
- **Implementation**: Just added onboarding completion tracking to the existing session state

#### AI Integration Strategy
- **Choice**: Multiple AI enhancement points (names, attributes, skills, images)
- **Rationale**: The goal was to reduce user effort while still giving them rich, personalized content
- **Implementation**: 
  - Context-aware name generation using world description
  - Existing world analyzer for attributes/skills
  - Background image generation that happens async so it doesn't block the UX

#### UX Pattern Consistency
- **Choice**: Use shared wizard framework and error components
- **Rationale**: Keep things consistent with the design system and don't write the same code twice
- **Implementation**: WizardContainer, ErrorBlock, responsive placeholder patterns that work everywhere

#### Progressive Enhancement Approach
- **Choice**: Essential functionality works without AI, but gets better with AI
- **Rationale**: We learned from other projects that AI services can be flaky, so the core experience has to work without them
- **Implementation**: Fallback systems for name generation, default attributes/skills that make sense

## Benefits

### User Experience
- **Reduced Time-to-Value**: Users can create a world and start playing within 2 minutes instead of getting stuck in setup
- **Lower Cognitive Load**: Only 2 essential decisions required upfront instead of overwhelming them with options
- **Contextual Guidance**: Examples and hints that actually relate to fictional universe RPGs, not generic stuff
- **Seamless Flow**: Automatic progression from world to character creation so they never hit a dead end

### Technical Benefits
- **Reusable Patterns**: Wizard framework applicable to other complex flows
- **AI Integration**: Demonstrates effective use of AI for user enhancement
- **Responsive Design**: Mobile-first approach with optimized placeholder text
- **Error Handling**: Standardized patterns for consistent user experience

### Business Impact
- **Improved Conversion**: First-time users more likely to complete initial setup
- **Reduced Support**: Self-explanatory interface reduces need for documentation
- **Engagement**: Users start playing faster, increasing retention likelihood

## Consequences

### Positive
- Significantly improved first-time user experience
- Demonstrates AI capabilities early in user journey
- Establishes patterns for other complex workflows
- Reduces barrier to entry for new users

### Negative
- Additional complexity in session state management (though we kept it minimal)
- Dependency on AI services for the optimal experience (though it works without them)
- Need to maintain the onboarding flow as core features evolve (this is the big ongoing cost)

### Mitigation Strategies
- Test coverage (26 tests) because onboarding is critical and can't be broken
- Graceful fallback systems so AI service failures don't kill the experience
- Three-stage verification process (Storybook, then the test harness, then full system integration) for quality assurance
- Documentation and Storybook coverage so future developers can understand what's happening

## Alternatives Considered

### 1. Multi-page Tutorial
- **Rejected**: Would interrupt the flow and feel disconnected from actually creating a world
- **Rationale**: People want to learn by doing, not sit through a tutorial first

### 2. Modal-based Tooltips
- **Rejected**: Would just overlay the existing complex interface instead of actually simplifying it
- **Rationale**: The problem isn't explaining the complexity, it's reducing the complexity

### 3. Simplified Static Form
- **Rejected**: Would miss the chance to show off what the AI can do and provide personalization
- **Rationale**: The AI enhancement is basically our main selling point, so we need to demonstrate it early

## Monitoring and Success Metrics
- User completion rate of onboarding flow
- Time from first visit to first game session started
- User retention after completing onboarding
- Error rates and support requests from new users

## Related ADRs
- [ADR-005: Domain-driven structure](ADR-005-domain-driven-structure.md) — where the onboarding components live
- [ADR-006: Gemini behind server-side API routes](ADR-006-gemini-server-side-api.md) — the AI path this flow uses to fill in defaults
- [ADR-008: Testing & verification strategy](ADR-008-testing-and-verification-strategy.md) — how the flow is verified