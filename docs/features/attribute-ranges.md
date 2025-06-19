---
title: "Character Attribute Ranges"
type: feature
category: character
tags: [character, attributes, ranges, configuration]
created: 2025-05-20
updated: 2025-06-08
---

# Character Attribute Ranges

This document describes how character attributes are defined and configured within the Narraitor system.

## Overview

Character attributes (such as Strength, Intelligence, etc.) form the foundation of characters within the game world. Each attribute has:

1. A name and description that defines its purpose
2. A range (min and max values) that defines the possible values it can have
3. A default value that represents the "normal" for that attribute in the world

## Range Configuration

For the MVP version of Narraitor, attribute ranges are fixed between 1-10. This provides a simple, intuitive scale that's easy for users to understand, where:

- 1 represents an extremely low value (minimal capability)
- 5-6 represents an average value (normal human capability)
- 10 represents an extremely high value (peak human capability or beyond)

### Default Values

Default values represent what's considered "normal" or "average" in the game world for that attribute. These defaults influence:

- Starting character creation
- NPC generation
- Relative difficulty of challenges

Default values can be set anywhere within the allowed range of 1-10, with the UI providing visual feedback on what the chosen value represents.

## Technical Implementation

The attribute value system is implemented through several key components:

### Data Structure

Attributes are defined in the `WorldAttribute` interface with the following key properties:

```typescript
export interface WorldAttribute extends NamedEntity {
  worldId: EntityID;
  baseValue: number; // Default value for the attribute
  minValue: number;  // Fixed at 1 for MVP
  maxValue: number;  // Fixed at 10 for MVP
  category?: string;
}
```

### UI Components

The primary UI component for configuring attribute default values is the `AttributeRangeEditor`:

- Provides a visual slider for setting values
- Shows min/max boundaries
- Displays current value with visual feedback
- Prevents setting values outside allowed range

### Integration

The attribute range configuration is integrated in:

1. `WorldAttributesForm` - For general attribute editing
2. `AttributeReviewStep` in the World Creation Wizard - For setting up initial attributes

## User Experience Considerations

When designing the attribute range system, several UX factors were considered:

- Simplicity: Fixed 1-10 range is intuitive and easy to understand
- Visual feedback: Slider and numeric display make it clear what values represent
- Constraint prevention: UI prevents setting invalid values
- Immediate feedback: Changes to values are shown immediately

## Future Enhancements

Future versions may include:

- Custom min/max ranges for different world types
- Attribute curve distributions (bell curve vs. flat distribution)
- Attribute relationships and dependencies
- Extended range options for different game styles

## Related Components

- `WorldAttributesForm`: Main form for editing world attributes
- `AttributeRangeEditor`: Specialized component for editing attribute ranges and defaults
- `AttributeReviewStep`: Step in the World Creation Wizard for reviewing attribute suggestions