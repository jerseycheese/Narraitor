---
title: Data Migration Strategy
aliases: [Schema Evolution, Data Versioning]
tags: [narraitor, architecture, data, migration]
created: 2025-04-29
updated: 2025-04-29
---

# Data Migration Strategy

## Overview
This document outlines the approach for handling schema evolution, data migrations, and backward compatibility in NarrAItor. It describes how the application manages changes to data structures over time while maintaining data integrity and user experience.

## Data Versioning Approach

### Schema Versioning
- **Version Tracking**: Each domain schema has a version number
- **Version Schema**: Semantic versioning (MAJOR.MINOR.PATCH)
  - MAJOR: Breaking changes requiring migration
  - MINOR: Additive, backward-compatible changes
  - PATCH: Bug fixes, non-structural changes
- **Version Storage**: Version number stored with data in IndexedDB

```typescript
interface SchemaVersionInfo {
  world: string; // e.g., "1.0.0"
  character: string;
  narrative: string;
  journal: string;
  ui: string;
  meta: string;
}
```

### Migration Registry
- Migrations are registered by version and domain
- Each migration has up/down transformations
- Migrations are applied sequentially

```typescript
interface Migration {
  version: string; // Target version
  domain: 'world' | 'character' | 'narrative' | 'journal' | 'ui' | 'meta';
  description: string;
  up: (oldData: any) => any; // Transform to new format
  down: (newData: any) => any; // Transform back to old format
}

// Example registry
const migrations: Migration[] = [
  {
    version: "1.1.0",
    domain: "character",
    description: "Add inventory array to character schema",
    up: (oldData) => ({
      ...oldData,
      inventory: oldData.inventory || []
    }),
    down: (newData) => {
      const { inventory, ...rest } = newData;
      return rest;
    }
  },
  // Additional migrations...
];
```

## Migration Process

### Startup Migration Check
1. Application reads current schema versions from IndexedDB
2. Compares with application schema versions
3. Identifies migrations needed for each domain
4. Plans migration path

### Migration Execution
1. Data is backed up before migration (when possible)
2. Migrations are executed in version order
3. Each migration is atomic (all or nothing)
4. Version is updated after successful migration
5. User is informed of migration progress

### Rollback Mechanism
1. If migration fails, attempt to restore from backup
2. For non-critical migrations, continue with partial success
3. For critical failures, provide data export option

## Backward Compatibility Strategy

### Forward Compatibility
- New schema versions must handle missing fields gracefully
- Default values are provided for missing data
- Non-breaking additions use optional fields

### Backward Compatibility
- Old schema versions treated with migration when opened
- Unused new fields are ignored by older versions
- Interface versioning separate from schema versioning

### Graceful Degradation
- Application functions when migrations partially succeed
- Critical vs. non-critical data is identified
- Essential functions work with minimal schema version

## Data Loading Failures

### Failure Detection
- Type validation on data load
- Schema version validation
- Integrity checks on related data
- Performance monitoring for slow migrations

### Recovery Strategies

#### Strategy 1: Defaults for Missing Data
- Identify missing or corrupt data
- Apply domain-specific defaults
- Log recovery actions for auditing
- Notify user of recovery action

```typescript
// Example recovery with defaults
function recoverCharacterWithDefaults(corruptedCharacter: any, worldId: string): Character {
  // Get world configuration for defaults
  const world = getWorldById(worldId);
  
  // Create baseline character with essential defaults
  const recoveredCharacter: Character = {
    id: corruptedCharacter.id || generateUUID(),
    name: corruptedCharacter.name || "Recovered Character",
    worldId: worldId,
    attributes: {},
    skills: {},
    createdAt: corruptedCharacter.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Other essential fields with defaults
  };
  
  // Apply world defaults for attributes and skills
  if (world) {
    world.attributes.forEach(attr => {
      recoveredCharacter.attributes[attr.id] = 
        (corruptedCharacter.attributes?.[attr.id] ?? attr.defaultValue);
    });
    
    world.skills.forEach(skill => {
      recoveredCharacter.skills[skill.id] = 
        (corruptedCharacter.skills?.[skill.id] ?? skill.defaultValue);
    });
  }
  
  return recoveredCharacter;
}
```

#### Strategy 2: Partial Data Recovery
- Extract valid portions of corrupted data
- Reconstruct relationships where possible
- Skip invalid sections
- Provide report of unrecoverable data

#### Strategy 3: Complete Reset
- For catastrophic failures
- Reset domain to initial state
- Preserve unaffected domains
- Offer data export before reset

### Emergency Data Export
- JSON export of user data
- Includes version information for future import
- Available even when application state is corrupted

## Implementation Timeline

### Phase 1: Basic Schema Versioning
- Add version tracking to all domains
- Implement version checking on startup
- Add simple migration registry

### Phase 2: Migration Framework
- Implement sequential migrations
- Add backup mechanisms
- Create UI for migration progress

### Phase 3: Fallback Strategies
- Implement default-based recovery
- Add partial data recovery
- Create emergency export functionality

## Testing Strategy

### Migration Test Cases
- Upgrade path tests (v1 → v2 → v3)
- Downgrade compatibility tests
- Corrupted data tests
- Interrupted migration tests

### Performance Testing
- Migration time for large datasets
- Memory usage during migration
- IndexedDB performance with different schemas

### Recovery Testing
- Simulated corruption scenarios
- Network interruption during migration
- Browser storage limitations

## Related Documents
- [State Management Architecture](/users/jackhaas/projects/narraitor/docs/architecture/state-management.md)
- [Error Handling Strategy](/users/jackhaas/projects/narraitor/docs/architecture/error-handling.md)
- [IndexedDB Implementation](/users/jackhaas/projects/narraitor/docs/technical-guides/indexeddb-guide.md)