---
title: DevTools Requirements
aliases: [Developer Tools Requirements]
tags: [narraitor, requirements, devtools, debugging]
created: 2025-04-29
updated: 2025-04-30
---

# DevTools Requirements

## Overview
The DevTools system provides a comprehensive set of development and debugging tools for Narraitor. It offers both UI-based tools and programmatic access via the browser console, enabling developers to test, monitor, and troubleshoot the application during development.

## Core Functionality
- **DevTools UI Panel**: Interactive interface for testing and debugging
- **Browser Console API**: Programmatic access to debugging functions
- **State Inspection**: View and manipulate application state
- **Narrative Testing**: Test narrative generation with different inputs
- **Decision Testing**: Generate and test decision points
- **AI Service Debugging**: Monitor AI requests and responses
- **Performance Monitoring**: Track rendering and operation performance
- **Error Reporting**: Capture and display application errors
- **Content Validation**: Analyze content for patterns and issues
- **Debug Logging**: Configurable logging for different components

## Component Architecture

```typescript
// DevTools component structure
interface DevToolsComponents {
  // Core components
  DevToolsPanel: React.FC<DevToolsPanelProps>;
  DevToolsHeader: React.FC<DevToolsHeaderProps>;
  
  // Functional sections
  GameControlSection: React.FC<GameControlSectionProps>;
  AIServiceDebugger: React.FC<AIServiceDebuggerProps>;
  StateInspector: React.FC<StateInspectorProps>;
  NarrativeDebugger: React.FC<NarrativeDebuggerProps>;
  PerformanceMonitor: React.FC<PerformanceMonitorProps>;
  ContentAnalyzer: React.FC<ContentAnalyzerProps>;
  WorldConfigDebugger: React.FC<WorldConfigDebuggerProps>;
  CharacterDebugger: React.FC<CharacterDebuggerProps>;
  
  // Supporting components
  ErrorDisplay: React.FC<ErrorDisplayProps>;
  JsonViewer: React.FC<JsonViewerProps>;
  DebugToggle: React.FC<DebugToggleProps>;
  LogViewer: React.FC<LogViewerProps>;
}

// Main DevTools panel props
interface DevToolsPanelProps {
  gameState: GameState;
  dispatch: Dispatch<AnyAction>;
  isVisible: boolean;
  toggleVisibility: () => void;
}

// Console API interface
interface DevToolsConsoleAPI {
  version: string;
  // State inspection
  getState: () => GameState;
  getCharacter: () => Character | null;
  getWorld: () => World | null;
  
  // Narrative operations
  generateNarrative: (prompt: string) => Promise<string>;
  getJournalEntries: () => JournalEntry[];
  
  // Decision operations
  triggerDecision: (context?: DecisionContext) => void;
  clearDecision: () => void;
  
  // AI service operations
  getAIRequestHistory: () => AIRequest[];
  mockAIResponse: (template: string) => void;
  
  // Debug utilities
  listComponents: () => string[];
  logPerformance: (enabled: boolean) => void;
  analyzeContent: () => ContentAnalysisResult;
}
```

## UI Components

### Core Components
- **DevToolsPanel**: Main container component with collapsible sections
- **DevToolsHeader**: Title bar with visibility toggle and version info
- **ErrorDisplay**: Shows captured errors with stack traces
- **StateInspector**: Interactive state tree viewer with edit capability
- **JsonViewer**: Expandable JSON visualization component
- **LogViewer**: Console-like interface for viewing application logs

### Functional Sections
- **GameControlSection**: Reset and initialization controls
- **AIServiceDebugger**: Monitor AI requests, responses, and errors
- **NarrativeDebugger**: Test and validate narrative generation
- **PerformanceMonitor**: Track and display performance metrics
- **ContentAnalyzer**: Analyze narrative content patterns
- **WorldConfigDebugger**: Test world configuration changes
- **CharacterDebugger**: Inspect and modify character data

## Browser Console API

The DevTools provide a global console API for programmatic debugging:

```javascript
// Access the API through the window object
window.narraiDevTools

// Get current application state
const state = window.narraiDevTools.getState();

// Generate test narrative
window.narraiDevTools.generateNarrative("A mysterious stranger enters town");

// Trigger a decision
window.narraiDevTools.triggerDecision({ type: 'character-encounter' });

// Clear current decision
window.narraiDevTools.clearDecision();

// Analyze content patterns
const analysis = window.narraiDevTools.analyzeContent();
```

## User Interactions
- Developers toggle the DevTools panel using a keyboard shortcut (Ctrl+Shift+D)
- Developers collapse/expand individual sections within the panel
- Developers use interactive controls to test application features
- Developers inspect and modify state through the state tree
- Developers analyze content patterns and validate output
- Developers monitor performance metrics during development
- Developers access debugging functions through the browser console

## Integration Points
- **Game Engine**: Access to core game state and operations
- **Narrative Engine**: Testing narrative generation and flow
- **Character System**: Character inspection and modification
- **World System**: World configuration testing
- **AI Service**: Monitoring AI requests and responses
- **Journal System**: Journal entry inspection
- **State Management**: Full state tree access and modification

## MVP Scope Boundaries

### Included
- Basic DevTools UI panel with collapsible sections
- Core state inspection capabilities
- Game reset and initialization controls
- Simple narrative testing interface
- AI service request/response monitoring
- Basic performance metrics display
- Browser console API for basic operations
- Error reporting and display
- Integration with React DevTools
- Debug-only components with visibility toggles
- Conditional logging based on environment
- DevTools keyboard shortcut (Ctrl+Shift+D)

### Excluded from MVP
- Advanced content analysis tools
- Visual state tree editing
- Complete test coverage for all systems
- Persistent configuration settings
- Theme customization for DevTools
- Exported debug reports and logs
- Network request visualization
- Automated testing through DevTools
- Remote debugging capabilities
- User permission system for DevTools
- Performance optimization suggestions
- Localized DevTools interface

## User Stories

1. **DevTools UI**
- As a developer, I want to toggle the DevTools panel with a keyboard shortcut so that I can quickly access debugging tools

  ## Priority
  - [x] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [x] Small
  - [ ] Medium
  - [ ] Large

- As a developer, I want to collapse and expand sections in the DevTools panel so that I can focus on relevant information

  ## Priority
  - [ ] High (MVP)
  - [x] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [x] Small
  - [ ] Medium
  - [ ] Large

- As a developer, I want debug-only components with visibility toggles so that I can control which debugging tools are displayed

  ## Priority
  - [ ] High (MVP)
  - [x] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

  **Acceptance Criteria**:
  1. The main `DevToolsPanel` can be toggled visible/hidden using the Ctrl+Shift+D keyboard shortcut in development environments.
  2. Individual sections within the panel (e.g., State Inspector, AI Debugger) can be collapsed and expanded.
  3. DevTools components are only rendered and included in the build when the application is run in a development environment (`NODE_ENV === 'development'`).

2. **State Inspection**
- As a developer, I want to view the complete application state so that I can understand the current system status

  ## Priority
  - [x] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

- As a developer, I want basic state modification capabilities so that I can test different state scenarios

  ## Priority
  - [ ] High (MVP)
  - [x] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

- As a developer, I want to visually explore the state tree so that I can understand state relationships

  ## Priority
  - [ ] High (MVP)
  - [x] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

  **Acceptance Criteria**:
  1. The `StateInspector` section displays the current application state (e.g., from Redux or Context).
  2. The state is displayed in a readable format (e.g., using a `JsonViewer`).
  3. Basic state values (strings, numbers, booleans) can be modified directly through the DevTools UI (MVP scope might limit this to viewing only, confirm if editing is MVP).

3. **Narrative and Decision Testing**
- As a developer, I want to test narrative generation with custom inputs so that I can verify it produces expected content

  ## Priority
  - [x] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

- As a developer, I want to trigger test decisions so that I can verify decision handling

  ## Priority
  - [ ] High (MVP)
  - [x] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

- As a developer, I want to analyze narrative content patterns so that I can ensure content quality

  ## Priority
  - [ ] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [x] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

  **Acceptance Criteria**:
  1. The `NarrativeDebugger` section allows triggering narrative generation with test prompts or contexts.
  2. The `NarrativeDebugger` section allows triggering test decisions.
  3. Basic content analysis (e.g., word count, sentence count) is available (if included in MVP).

4. **AI Service Debugging**
- As a developer, I want to monitor AI service requests and responses so that I can debug integration issues

  ## Priority
  - [x] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

- As a developer, I want to view errors from AI service calls so that I can identify failure points

  ## Priority
  - [x] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

- As a developer, I want to mock AI responses so that I can test edge cases without making real API calls

  ## Priority
  - [ ] High (MVP)
  - [x] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

  **Acceptance Criteria**:
  1. The `AIServiceDebugger` section displays a log of recent AI requests and their corresponding responses (or errors).
  2. Request/response details (prompt, content, status) are viewable.
  3. Functionality exists to mock AI responses for testing purposes (if included in MVP).

5. **Performance and Error Monitoring**
- As a developer, I want to view basic performance metrics so that I can identify bottlenecks

  ## Priority
  - [ ] High (MVP)
  - [x] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

- As a developer, I want comprehensive error reporting so that I can diagnose and fix issues

  ## Priority
  - [x] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

- As a developer, I want to capture and display runtime errors so that I can trace their origin

  ## Priority
  - [x] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

  **Acceptance Criteria**:
  1. The `PerformanceMonitor` section displays basic metrics (e.g., last render time, time since last AI response).
  2. The `ErrorDisplay` component within DevTools shows runtime errors captured by the application's error boundaries.
  3. Error messages and basic stack trace information are displayed.

6. **Browser Console API**
- As a developer, I want programmatic access to debugging functions via the console so that I can automate debugging tasks

  ## Priority
  - [x] High (MVP)
  - [ ] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

- As a developer, I want to access state inspection methods via the console so that I can quickly check state values

  ## Priority
  - [ ] High (MVP)
  - [x] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [x] Small
  - [ ] Medium
  - [ ] Large

- As a developer, I want to trigger game operations via the console so that I can test functionality programmatically

  ## Priority
  - [ ] High (MVP)
  - [x] Medium (MVP Enhancement)
  - [ ] Low (Nice to Have)
  - [ ] Post-MVP

  ## Estimated Complexity
  - [ ] Small
  - [x] Medium
  - [ ] Large

  **Acceptance Criteria**:
  1. The `window.narraiDevTools` object is available in the browser console in development environments.
  2. Console API functions like `getState()`, `generateNarrative()`, `triggerDecision()` are callable and perform their intended actions.
  3. Console API functions return expected values or promises.

## Implementation Approach
1. Create a central DevTools context provider
2. Implement the browser console API first
3. Develop the main DevTools panel component
4. Add collapsible sections for major subsystems
5. Implement state inspection with JSON viewer
6. Integrate with existing system interfaces
7. Add conditional rendering based on environment

## GitHub Issues
- [Create DevTools context provider] - Link to GitHub issue
- [Implement browser console API] - Link to GitHub issue
- [Build main DevTools panel component] - Link to GitHub issue
- [Develop state inspection interface] - Link to GitHub issue
- [Create AI service debugging tools] - Link to GitHub issue
- [Implement performance monitoring] - Link to GitHub issue
- [Add error reporting and display] - Link to GitHub issue
- [Create narrative testing interface] - Link to GitHub issue
- [Integrate DevTools with existing systems] - Link to GitHub issue
- [Add keyboard shortcuts for DevTools] - Link to GitHub issue

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met