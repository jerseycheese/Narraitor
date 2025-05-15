# World Creation Wizard

## Overview
The World Creation Wizard is a multi-step interface for creating new game worlds in Narraitor. It includes AI-assisted generation of attributes and skills based on the world description provided by the user.

## Features
- 5-step wizard interface with progress tracking
- AI analysis of world descriptions to suggest relevant attributes and skills
- Default attributes and skills as fallback when AI is unavailable
- Review and modification of AI suggestions
- State persistence between steps
- Validation of required fields

## Implementation

### Components
- `WorldCreationWizard.tsx` - Main wizard controller (400 lines - needs refactoring)
- `BasicInfoStep.tsx` - Collects world name and theme
- `DescriptionStep.tsx` - Gathers world description and triggers AI analysis
- `AttributeReviewStep.tsx` - Review and modify suggested attributes (max 6)
- `SkillReviewStep.tsx` - Review and modify suggested skills (max 12)
- `FinalizeStep.tsx` - Complete world creation

### Default Attributes
1. Strength - Physical power
2. Intelligence - Mental acuity
3. Agility - Speed and dexterity
4. Charisma - Social influence
5. Dexterity - Fine motor control
6. Constitution - Physical resilience

### Default Skills
1. Combat - Fighting ability (Physical)
2. Athletics - Physical activities (Physical)
3. Stealth - Moving unseen (Physical)
4. Investigation - Finding clues (Mental)
5. Research - Academic study (Mental)
6. Arcana - Magical knowledge (Mental)
7. Persuasion - Influencing others (Social)
8. Insight - Reading people (Social)
9. Deception - Misleading others (Social)
10. Survival - Wilderness skills (Practical)
11. Crafting - Creating items (Practical)
12. Performance - Entertainment skills (Social)

### AI Integration
Currently the AI integration is mocked. The actual implementation requires:
- Gemini API integration for analyzing world descriptions
- Prompt templates for extracting attributes and skills
- Error handling for API failures
- Fallback to defaults when AI is unavailable

### State Management
- Zustand store for world persistence
- Local React state for wizard progression
- Temporary localStorage usage for MVP

## Testing
- Unit tests for all steps
- Integration tests for full wizard flow
- Test harness available at `/dev/world-creation-wizard`
- All tests currently passing

## Known Issues
1. Component size exceeds 300-line limit (400 lines)
2. AI integration is currently mocked
3. No confirmation dialog on cancel
4. Navigation directly to `/worlds` without intermediate routing

## Future Enhancements
1. Actual AI integration with Gemini API
2. Component refactoring to reduce size
3. Confirmation dialog for cancel action
4. Point pool system for attributes/skills
5. Template worlds for quick setup
6. Import/export functionality
7. Visual theme editor
