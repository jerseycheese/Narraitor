---
name: Enhancement
about: Suggest an enhancement to an existing feature
title: "Add custom player input option to choice system"
labels: enhancement, epic:narrative-engine
assignees: ''
---

## Plain Language Summary
Add the ability for players to type their own custom responses instead of only selecting from pre-generated choices, enhancing player agency and creativity.

## Current Feature
The player choice system (implemented in #304) currently generates AI-driven contextual choices for players to select. Players are limited to choosing from these pre-generated options only.

## Domain
- [ ] World Configuration
- [ ] Character System
- [ ] Decision Tracking System
- [ ] Decision Relevance System
- [x] Narrative Engine
- [ ] Journal System
- [ ] State Management
- [ ] Other: _________

## Enhancement Description
Add a "Custom response..." option at the top of the choice list that, when selected, reveals a text input field where players can type their own response. This custom input would be processed by the narrative engine to generate the next scene, just like a pre-generated choice.

The enhancement would include:
1. Adding a special "custom" option at the top of every choice list
2. Implementing a text input UI that appears when this option is selected
3. Creating a submit mechanism for the custom text
4. Updating the narrative generation system to process custom player inputs
5. Storing custom responses in the narrative history for continuity

## Reason for Enhancement
This enhancement will:
- Increase player agency and creative expression
- Allow players to respond in ways not anticipated by the AI
- Create a more open-ended, interactive narrative experience
- Reduce frustration when none of the provided choices match what the player wants to do
- More closely mirror tabletop RPG experiences where players can attempt any action

## Possible Implementation
1. Modify the `PlayerChoiceSelector` component to:
   - Always include a special "Custom response..." option
   - Show/hide a text input field when this option is selected
   - Include a "Submit" button for sending the custom input

2. Update the choice handling logic in `GameSessionActive` to:
   - Detect when a custom choice is selected
   - Process the text input differently from pre-generated choices

3. Enhance the `NarrativeGenerator` to:
   - Accept free-text player input as a parameter
   - Generate appropriate narrative responses to custom actions

4. Modify the `narrativeStore` to:
   - Store custom player inputs in the narrative history
   - Display custom inputs distinctly in the narrative flow

## Alternatives Considered
1. **Voice input**: Could allow players to speak their responses, but this adds complexity with speech recognition.
2. **Hybrid approach**: Pre-written options plus a "fill in the blank" option for customization.
3. **AI-assisted custom input**: Suggest completions as the player types their custom response.

## Additional Context
This feature builds directly on the foundation established in issue #304, which implemented the basic choice system. It represents a natural evolution toward a more flexible narrative experience while maintaining the structured approach when players prefer it.

The custom input feature is common in modern narrative games like AI Dungeon and would significantly enhance the interactive storytelling capabilities of Narraitor.