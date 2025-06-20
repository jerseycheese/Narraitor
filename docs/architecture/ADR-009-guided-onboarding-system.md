# ADR-009: Guided First-Time Experience System

## Status
Accepted - Implemented

## Context
New users visiting Narraitor faced several barriers to engagement:
- Complex world creation process requiring understanding of attributes, skills, and settings
- No clear starting point for first-time users
- High cognitive load leading to user drop-off before experiencing core features
- Lack of guided flow from world creation to character creation and gameplay

## Decision
Implement a comprehensive guided onboarding system that:

1. **Automatically detects first-time users** using session state analysis
2. **Simplifies world creation** to 2 essential steps (concept + details)
3. **Uses AI to enhance user input** with contextually appropriate defaults
4. **Provides seamless progression** from world to character creation
5. **Maintains professional UX standards** with responsive design and error handling

## Implementation Architecture

### Core Components
- **GuidedFirstTimeExperience**: Main wizard component with 3-step flow
- **Session Detection**: `shouldShowOnboarding()` logic in sessionStore
- **AI Integration**: Contextual name generation, world analysis, and image creation
- **Wizard Framework**: Reusable wizard components for consistent patterns

### Technical Decisions

#### State Management
- **Choice**: Integrate with existing sessionStore rather than separate state
- **Rationale**: Leverages existing auto-save infrastructure and persistence
- **Implementation**: Added onboarding completion tracking to session state

#### AI Integration Strategy
- **Choice**: Multiple AI enhancement points (names, attributes, skills, images)
- **Rationale**: Reduces user effort while providing rich, personalized content
- **Implementation**: 
  - Context-aware name generation using world description
  - Existing world analyzer for attributes/skills
  - Background image generation to avoid blocking UX

#### UX Pattern Consistency
- **Choice**: Use shared wizard framework and error components
- **Rationale**: Maintains design system consistency and reduces development overhead
- **Implementation**: WizardContainer, ErrorBlock, responsive placeholder patterns

#### Progressive Enhancement Approach
- **Choice**: Essential functionality works without AI, enhanced with AI
- **Rationale**: Ensures reliability even if AI services are temporarily unavailable
- **Implementation**: Fallback systems for name generation, default attributes/skills

## Benefits

### User Experience
- **Reduced Time-to-Value**: Users creating worlds within 2 minutes
- **Lower Cognitive Load**: Only 2 essential decisions required initially
- **Contextual Guidance**: Examples and hints specific to fictional universe RPGs
- **Seamless Flow**: Automatic progression from world to character creation

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
- Additional complexity in session state management
- Dependency on AI services for optimal experience
- Need to maintain onboarding flow as core features evolve

### Mitigation Strategies
- Comprehensive test coverage (26 tests) for reliability
- Graceful fallback systems for AI service failures
- Three-stage verification process for quality assurance
- Documentation and Storybook coverage for maintainability

## Alternatives Considered

### 1. Multi-page Tutorial
- **Rejected**: Would interrupt user flow and feel disconnected from actual world creation
- **Rationale**: Users prefer learning by doing rather than separate tutorial modes

### 2. Modal-based Tooltips
- **Rejected**: Would overlay complex interface, not actually simplify the process
- **Rationale**: Need to reduce complexity, not just explain existing complexity

### 3. Simplified Static Form
- **Rejected**: Would miss opportunity to demonstrate AI capabilities and personalization
- **Rationale**: AI enhancement is core value proposition of the platform

## Monitoring and Success Metrics
- User completion rate of onboarding flow
- Time from first visit to first game session started
- User retention after completing onboarding
- Error rates and support requests from new users

## Related ADRs
- ADR-003: Wizard Framework Architecture
- ADR-007: AI Integration Patterns
- ADR-008: Mobile-First Responsive Design

---
*Created: 2025-06-20*
*Status: Implemented in Issue #559*