# Technical Specification: Store World Facts for Developer Tools

## Issue #182 Implementation Spec

### Problem Statement
While the LoreStore exists with basic fact storage from previous issues (#185, #186), developers lack proper tools to manually manage, inspect, and debug world facts. The system needs developer-facing interfaces for fact management and debugging utilities.

### Current State
- **Existing**: LoreStore with persistence, categorization, and AI integration
- **Existing**: Read-only LoreViewer component for display
- **Existing**: ConsistencyValidationSection for AI debugging
- **Missing**: Manual fact creation/editing interface
- **Missing**: Duplicate detection and validation
- **Missing**: Developer debugging tools

### Technical Solution

#### 1. Enhanced LoreStore Methods
```typescript
interface LoreStore {
  // Existing methods...
  
  // New developer-facing methods
  updateFact: (id: EntityID, updates: Partial<LoreFact>) => void;
  deleteFact: (id: EntityID) => void;
  validateFactUniqueness: (worldId: EntityID, key: string, value: string) => boolean;
  searchFacts: (query: string, options?: LoreSearchOptions) => LoreFact[];
  exportFacts: (worldId: EntityID) => string; // JSON export
  importFacts: (worldId: EntityID, jsonData: string) => void;
  getFactHistory: (id: EntityID) => LoreFact[]; // For debugging
}
```

#### 2. Developer Tools Components

**LoreManagementSection Component**
- Main interface for fact management in DevTools
- Tabs: Create, Browse, Search, Import/Export
- Real-time duplicate detection
- Fact validation feedback

**FactEditor Component**
- Form for creating/editing facts
- Category selection with descriptions
- Metadata fields (importance, tags, relationships)
- Duplicate checking with visual feedback

**FactInspector Component**
- Detailed view of fact metadata
- Usage tracking (which sessions referenced it)
- Relationship visualization
- Edit/Delete actions

#### 3. Validation & Duplicate Detection

**Duplicate Detection Strategy**
- Exact match: Same key + value for world
- Similar match: Fuzzy matching with threshold
- Category-specific rules (e.g., character names must be unique)

**Validation Rules**
- Required fields: key, value, category, worldId
- Key format: alphanumeric with underscores
- Value length: min 1, max 500 characters
- Category must be valid enum value

### Implementation Approach

#### Phase 1: Store Enhancements (Step 3.1)
- Add CRUD methods to loreStore
- Implement validation logic
- Add search functionality
- Create import/export utilities

#### Phase 2: Basic UI (Step 3.2)
- Create LoreManagementSection component
- Implement FactEditor form
- Add to DevToolsPanel
- Wire up to store

#### Phase 3: Advanced Features (Step 3.3)
- Duplicate detection UI
- Search interface
- Import/export UI
- Fact inspector

#### Phase 4: Testing & Polish (Steps 4-5)
- Comprehensive test coverage
- Storybook stories
- Documentation
- Performance optimization

### File Structure
```
src/
  state/
    loreStore.ts (enhanced with new methods)
  components/
    devtools/
      LoreManagementSection/
        LoreManagementSection.tsx
        LoreManagementSection.test.tsx
        LoreManagementSection.stories.tsx
        FactEditor.tsx
        FactInspector.tsx
        DuplicateDetector.tsx
        index.ts
  lib/
    lore/
      validation.ts (duplicate detection logic)
      export.ts (import/export utilities)
```

### Testing Strategy
1. **Unit Tests**: All new store methods
2. **Component Tests**: Form validation, user interactions
3. **Integration Tests**: Full fact lifecycle
4. **E2E Tests**: Developer workflow scenarios

### Acceptance Criteria Mapping
- ✅ New `LoreFact` objects can be created → FactEditor component
- ✅ Each fact includes ID, content, category, timestamps → Store validation
- ✅ Facts properly indexed by category → Already exists, enhanced search
- ✅ Prevents duplicate fact content → DuplicateDetector component
- ✅ Facts persist using IndexedDB → Already implemented

### Performance Considerations
- Debounced duplicate checking (300ms)
- Lazy loading for large fact lists
- Virtual scrolling for fact browser
- Optimized search with indexing

### User Experience
- Clear visual feedback for validation
- Inline help text for fields
- Keyboard shortcuts for quick entry
- Auto-save with visual confirmation

### Success Metrics
- All acceptance criteria met
- 90%+ test coverage on new code
- No performance regression
- Developer workflow documented