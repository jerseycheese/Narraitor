---
title: "MVP Type Simplification Summary"
type: architecture
category: types
tags: [mvp, types, simplification, typescript]
created: 2025-05-13
updated: 2025-06-08
---

# MVP Type Simplification Summary

Early in development, we realized our type system was getting way too complex for an MVP. Instead of building everything we dreamed of, we stripped back to what actually matters for the first version. This is the story of what got cut and why.

## Changes Made

### 1. Inventory System - RESTORED to MVP
We almost cut inventory entirely, then realized that's like making a character sheet without equipment. So we brought it back, but kept it simple:

- Initially removed but restored after clarification
- Kept simplified version with only essential properties
- Added to Phase 1.6 in roadmap

### 2. Simplified InventoryItem
We cut out all the fancy RPG mechanics that would take months to implement properly:

**Removed Properties:**
- `weight` - Advanced encumbrance system (Post-MVP)
- `value` - Economy/trading system (Post-MVP)
- `properties` - Complex item effects (Post-MVP)

**Kept Properties:**
- `id`, `name`, `description` (from NamedEntity)
- `categoryId` - Basic organization
- `quantity` - Essential for stacking

### 3. Simplified CharacterAttribute
**Removed:**
- `modifiers` array - Complex modifier system (Post-MVP)
- `AttributeModifier` interface - Not needed for MVP

**Kept:**
- `attributeId` - Reference to world attribute
- `value` - Current attribute value

### 4. Simplified WorldSettings
**Removed:**
- `tone` - dropped from `WorldSettings`, not cut. Tone customization ships as a top-level
  `World.toneSettings` field (`src/types/world.types.ts`) and feeds the narrative generator.

**Kept:**
- Core character creation constraints
- Attribute and skill limits

### 5. Simplified NarrativeMetadata  
**Removed:**
- `pacing` - Granular pacing control (Post-MVP)

**Kept:**
- `mood` - Basic mood indication
- `tags` - Flexible categorization

### 6. Character Changes
**Removed:**
- `playerId` - Multiplayer support (Post-MVP)

**Kept:**
- All core character data including inventory

## Implementation Notes

- All type guards updated to match simplified types
- All tests updated to use simplified interfaces
- Documentation reflects MVP scope
- Roadmap updated to move inventory to Phase 1.6 (MVP)

## Type Complexity Reduction

By cutting the complex stuff, we ended up with:

- Fewer optional properties to handle
- Simpler nested structures
- No advanced feature dependencies
- Much lower overall type complexity

That leaves an MVP that's achievable now rather than a six-month type engineering project. The complex stuff can come back later, once there are users asking for it.
