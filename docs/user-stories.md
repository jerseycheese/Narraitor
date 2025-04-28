---
title: NarrAItor User Stories
aliases: [User Stories]
tags: [narraitor, documentation, planning]
created: 2025-04-28
updated: 2025-04-28
---

# NarrAItor User Stories

## Overview
This document contains the core user stories that drive the development of NarrAItor. They are organized by domain and prioritized for MVP implementation.

## World Configuration

### High Priority (MVP)
- As a game master, I want to create a custom world with specific themes and tone so that I can play in a setting tailored to my interests.
- As a player, I want to select from pre-made world templates so that I can quickly start a new game without extensive setup.
- As a user, I want to define attributes and skills for my world so that characters will have appropriate abilities for the setting.
- As a user, I want to export my world configuration so that I can share it with others or back it up.
- As a user, I want to import a world configuration so that I can use worlds created by others.

### Medium Priority
- As a user, I want to customize the visual theme of my world so that the interface reflects the world's aesthetic.
- As a user, I want to define specialized mechanics for my world so that gameplay matches the genre expectations.
- As a user, I want to create world-specific prompts and context so that the AI narrative feels authentic to the setting.

### Low Priority
- As a user, I want to include reference images for my world so that I can visualize the setting.
- As a user, I want to define a world map with locations so that I can track where events take place.
- As a user, I want to create factions and organizations within my world so that the narrative can include political elements.

## Character System

### High Priority (MVP)
- As a player, I want to create a character for a specific world so that I can participate in the narrative.
- As a player, I want to assign attributes and skills to my character so that they reflect my desired gameplay approach.
- As a player, I want to write a basic backstory for my character so that the AI can incorporate it into the narrative.
- As a player, I want to view my character sheet so that I can track their capabilities.

### Medium Priority
- As a player, I want to use AI to generate a portrait for my character so that I can visualize them.
- As a player, I want to track relationships between my character and NPCs so that I can remember important connections.
- As a player, I want to update my character's abilities and skills over time so that they can develop through the narrative.

### Low Priority
- As a player, I want to manage my character's inventory so that I can track important items.
- As a player, I want to create multiple characters in the same world so that I can experience different storylines.
- As a player, I want to set character goals and motivations so that the narrative can incorporate them.

## Decision Tracking System

### High Priority (MVP)
- As a player, I want the system to present me with clear narrative choices so I can make meaningful decisions that affect the story.
- As a player, I want my major decisions to be recorded in the game so they can influence future narrative development.
- As a player, I want to see immediate narrative consequences from my decisions so that my choices feel impactful.
- As a system designer, I want decision points to have configurable importance levels so that critical moments have appropriate weight in the narrative.

### Medium Priority
- As a player, I want to review a history of my key decisions so I can track how I've shaped the story.
- As a player, I want decision options to include hints about potential consequences so I can make informed choices.
- As a player, I want decisions to be tagged with relevant context information so they can be properly referenced in appropriate situations.

### Low Priority
- As a player, I want to add personal notes to my decisions so I can remember my reasoning.
- As a system designer, I want to set expiration timestamps for certain decisions so their relevance naturally fades at appropriate story points.
- As a player, I want to see visualizations of my decision history and their impacts so I can understand how I've shaped the narrative.

## Decision Relevance System

### High Priority (Post-MVP)
- As a system designer, I want a basic relevance scoring system for past decisions so the narrative can reference the most important choices.
- As a player, I want the narrative to occasionally reference my most important past decisions so the story feels cohesive and responsive.
- As a system designer, I want to implement simple recency and importance factors in decision relevance so older or minor decisions don't overwhelm the narrative.

### Medium Priority (Post-MVP)
- As a system designer, I want to implement a configurable weighting system for decision relevance so different world types can emphasize different factors.
- As a system designer, I want decisions to be context-aware using tags so they're only referenced when relevant to the current situation.
- As a player, I want the impact of my decisions to decay naturally over time so that the narrative feels dynamic and evolving.

### Low Priority (Post-MVP)
- As a system designer, I want to track narrative impacts across multiple dimensions (character relationships, world state, etc.) so decisions have nuanced consequences.
- As a player, I want to see how my decisions have shaped the narrative world so I can understand my influence on the story.
- As a system designer, I want an advanced algorithm combining recency, context, importance, and impact for decision relevance so the narrative feels natural and cohesive.

## Narrative Engine

### High Priority (MVP)
- As a player, I want to start a narrative session in a selected world so that I can experience a story in that setting.
- As a player, I want to receive narrative text that is appropriate to the world's theme and tone so that the experience feels immersive.
- As a player, I want to select from multiple options to advance the narrative so that I have agency in the story.
- As a player, I want the narrative to remember my previous choices so that the story remains coherent.
- As a player, I want narrative text to be properly formatted and presented in a readable way so that I can easily follow the story.

### Medium Priority
- As a player, I want to see occasional images that represent key scenes so that I can better visualize the narrative.
- As a player, I want to input custom actions beyond the provided choices so that I have more freedom in the story.
- As a player, I want the narrative to adapt to my character's abilities so that the story feels personalized.
- As a player, I want the narrative to reference past events at appropriate moments so the story feels connected and continuous.
- As a system designer, I want to manage context windows efficiently so the AI generates relevant and coherent narrative content.

### Low Priority
- As a player, I want to experience different narrative branches based on my world's specific features so that each world feels unique.
- As a player, I want to receive audio narration for story segments so that I can experience the narrative more immersively.
- As a player, I want to introduce plot elements or themes so that I can co-create the narrative.
- As a player, I want the narrative to adapt its writing style based on the world context so each universe feels unique.
- As a player, I want the system to recognize recurring themes in my choices so the narrative can emphasize elements I'm interested in.

## Journal System

### High Priority (MVP)
- As a player, I want key narrative events to be automatically recorded so that I can review them later.
- As a player, I want to view my adventure journal so that I can recall what happened in previous sessions.
- As a player, I want journal entries to be organized chronologically so that I can follow the narrative flow.
- As a player, I want journal entries to be categorized by type (narrative, discovery, interaction, etc.) so I can easily find specific information.

### Medium Priority
- As a player, I want to add my own notes to journal entries so that I can record my thoughts and plans.
- As a player, I want to filter journal entries by type or keyword so that I can find specific information.
- As a player, I want journal entries to include relevant entity information (characters, locations, items) so I can remember important elements.
- As a player, I want concise summaries of journal entries so I can quickly review key points without reading everything.

### Low Priority
- As a player, I want to export my journal as a document so that I can read or share it outside the application.
- As a player, I want journal entries to include location information so that I can track my journey.
- As a player, I want to see a visual timeline of events so that I can understand the narrative flow.
- As a player, I want to mark journal entries as favorites or important so I can easily find key information.

## State Management

### High Priority (MVP)
- As a user, I want my game progress to be automatically saved so that I don't lose my narrative progress.
- As a user, I want to resume a previous game session so that I can continue my story.
- As a user, I want to manage multiple save files so that I can maintain different stories simultaneously.

### Medium Priority
- As a user, I want to create manual save points in addition to auto-saves so that I can mark important moments.
- As a user, I want to export my game data so that I can back it up or transfer it to another device.
- As a user, I want to delete old save files so that I can manage storage space.

### Low Priority
- As a user, I want to duplicate a save file to create a branching narrative so that I can explore different choices from the same point.
- As a user, I want to synchronize my save files across devices so that I can switch between them seamlessly.
- As a user, I want to share a save file with others so that they can continue my story with my character.

## Feature Flags (Future Implementation)

- As a developer, I want to implement feature flags for new capabilities so that features can be developed and tested without affecting the main application experience.
- As a developer, I want to enable experimental features for specific users so that feedback can be gathered before full release.
- As a developer, I want to gradually roll out new features to users so that stability can be maintained.
- As a user, I want to enable experimental features in my settings so that I can try new functionality.
- As a user, I want to provide feedback on experimental features so that I can contribute to their improvement.

## Key Features from BootHillGM

This section provides a comprehensive list of the most valuable features from BootHillGM that could be incorporated into NarrAItor.

### Player Decision Tracking System
- Decision recording with importance levels (critical, significant, moderate, minor)
- Decision options with impact descriptions and tags
- Decision history tracking with timestamps
- Decision context preservation
- Player choice recording with selected options
- Decision metadata (location, characters involved)

### Decision Relevance System
- Relevance scoring algorithm based on multiple factors
- Recency weighting for decisions (more recent = more relevant)
- Tag matching for contextual relevance
- Importance weighting based on decision significance
- Impact assessment based on narrative consequences
- Configurable weighting system
- Decision expiration timestamps
- Context-aware decision filtering

### Journal System
- Multiple entry types (narrative, discovery, interaction, etc.)
- Automatic entry generation from gameplay events
- AI-generated narrative summaries
- Entry metadata (timestamp, location, entities)
- Entry searching and filtering
- Chronological organization
- Integration with other systems (AI, State)
- Entry categorization and tagging

### Narrative System
- Story point management with branching options
- Narrative arc structures across multiple points
- Context-aware narrative generation
- Decision presentation with multiple options
- Impact tracking across different dimensions (reputation, relationships, world state)
- Character-aware narrative generation
- Themed formatting based on world context

### Advanced Integration Features
- AI context preparation for prompt engineering
- Decision history formatting for AI context
- Relevant decision selection for narrative continuation
- Journal integration with decision tracking
- State persistence across game sessions
- Context window management for AI models
