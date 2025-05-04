---
title: Utilities and Helpers Requirements
aliases: [Core Utilities Requirements]
tags: [narraitor, requirements, utilities, helpers]
created: 2025-04-29
updated: 2025-04-30
---

# Utilities and Helpers Requirements

## Overview
The Utilities and Helpers module provides a collection of reusable functions, tools, and utilities that support various core systems across Narraitor. These utilities handle common operations, provide type safety, manage errors, and support development workflows.

## Core Functionality
- **Error Handling**: Create standardized error objects with consistent structure
- **Type Guards**: TypeScript utility functions for type narrowing and validation
- **UUID Generation**: Create unique identifiers for various entities
- **Text Processing**: Clean, normalize, and format AI-generated content
- **Debug Utilities**: Logging and debugging tools for development
- **Storage Utilities**: IndexedDB persistence helpers for local storage
- **Retry Logic**: Manage retries for asynchronous operations
- **Context Optimization**: Utilities for optimizing AI context and token management

## Utility Categories

### Core Utilities
- **Error Utils**: Standardized error creation with metadata and error classification
- **Type Guards**: TypeScript type verification for domain objects
- **UUID Generator**: Browser-compatible unique ID generation
- **Text Cleaning**: Normalize and clean AI-generated content
- **Debug Logger**: Development-focused logging with severity levels

### Storage Utilities
- **IndexedDB Wrapper**: Type-safe storage access with error handling
- **State Operations**: Safe state manipulation helpers
- **Property Extraction**: Safely access nested properties in state objects
- **Storage Migration**: Basic version handling for local storage

### AI Utilities
- **Prompt Utils**: Helper functions for prompt construction
- **Retry Logic**: Handle AI service call failures with backoff
- **Context Management**: Token counting and context optimization
- **Response Cleaning**: Remove metadata from AI responses
- **Response Validation**: Basic sanity checks for AI responses

### Development Utilities
- **Debug Console**: Development-only logging interface with severity levels
- **Performance Tracking**: Measure critical operations and component renders
- **Error Reporting**: Format and categorize errors for debugging
- **Fallback Content**: Utilities for providing content when AI fails
- **State Inspection**: Tools for examining application state
- **Window API**: Global access to debugging functions via window object

## Integration Points
- **AI Service**: Use error handling, retry logic, and text processing utilities
- **State Management**: Leverage storage utilities and state helpers
- **UI Components**: Utilize debug tools and error formatting
- **Game Logic**: Employ text processing and content normalization
- **DevTools**: Provide utility functions for the DevTools component

## Related Systems
For a comprehensive development environment, these utilities work in conjunction with the **DevTools** system which provides a UI-based debugging interface. While these utilities provide programmatic functions that can be used throughout the application, the DevTools system provides a user interface for debugging and testing. See [DevTools Requirements](./devtools.md) for more information.

## MVP Scope Boundaries

### Included
#### Error Handling
- Standardized error object creation with code, message, and retry flag
- Error type categorization (network, service, validation)
- Simple retry determination for service errors

#### Storage
- IndexedDB wrapper for type-safe persistence
- Get/set operations with error handling
- Safe access to nested properties
- Simple state manipulation helpers

#### Text Processing
- Clean metadata from AI-generated content
- Convert text to consistent formatting
- Extract relevant information from responses
- Basic content normalization

#### Debugging
- Console logging with severity levels
- Simple performance measurement
- Error reporting formatters
- Development-only debugging tools
- Basic state inspection utilities
- Window-accessible debugging API

#### AI Service Support
- Retry logic with backoff strategy
- Response validation and cleaning
- Context optimization for token efficiency
- Error handling specific to AI services

#### General Utilities
- UUID generation with browser compatibility
- Basic type guards for core domain objects
- Date and time formatting utilities
- Simple string manipulation helpers

### Excluded
- Advanced performance monitoring and visualization
- Complex state migration strategies
- Extensive testing utilities and fixtures
- Analytics integration and telemetry
- Automated documentation generation
- Advanced content validation and repair
- Multi-device synchronization
- Cloud storage integration
- Complex object diffing and patching
- Resource caching strategies
- Background processing utilities

## User Stories

1. **Error Handling**
- As a developer, I want to create standardized error objects with consistent structure so that errors can be processed uniformly across the application

   ## Priority
   - [x] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [x] Small
   - [ ] Medium
   - [ ] Large

- As a developer, I want to categorize errors by type so that appropriate recovery strategies can be applied

   ## Priority
   - [x] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [x] Small
   - [ ] Medium
   - [ ] Large

- As a developer, I want simple retry determination for service errors so that transient failures can be handled automatically

   ## Priority
   - [ ] High (MVP)
   - [x] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [x] Small
   - [ ] Medium
   - [ ] Large

  **Acceptance Criteria**:
  1. Error objects follow a consistent structure with `code`, `message`, and `retryable` properties.
  2. Error objects are categorized by type (e.g., network, service, validation) in their metadata.
  3. Error types determine appropriate recovery strategies (retry for network issues, fallback for service errors).
  4. Retryable errors have a flag that automated systems can use to determine retry behavior.

2. **Storage**
- As a developer, I want a type-safe IndexedDB wrapper so that data persistence operations are reliable and well-typed

   ## Priority
   - [x] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [ ] Small
   - [x] Medium
   - [ ] Large

- As a developer, I want robust error handling for storage operations so that data integrity is maintained

   ## Priority
   - [x] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [ ] Small
   - [x] Medium
   - [ ] Large

- As a developer, I want helpers for safely accessing nested properties so that code is more robust against undefined values

   ## Priority
   - [ ] High (MVP)
   - [x] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [x] Small
   - [ ] Medium
   - [ ] Large

  **Acceptance Criteria**:
  1. The IndexedDB wrapper provides type-safe get/set operations that enforce schema types.
  2. Storage operations have proper error handling with clear error messages.
  3. Helper functions safely access nested properties without throwing errors if intermediate properties are undefined.
  4. The IndexedDB wrapper handles connection failures and retries as appropriate.

3. **Text Processing**
- As a developer, I want utilities to clean metadata from AI-generated content so that users see properly formatted text

   ## Priority
   - [x] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [x] Small
   - [ ] Medium
   - [ ] Large

- As a developer, I want tools to normalize text formats so that content appears consistent throughout the application

   ## Priority
   - [ ] High (MVP)
   - [x] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [x] Small
   - [ ] Medium
   - [ ] Large

- As a developer, I want helpers to extract relevant information from responses so that AI outputs can be processed efficiently

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
  1. Text cleaning utilities remove unwanted metadata and formatting markers from AI responses.
  2. Content normalizing functions convert text to consistent paragraph breaks and punctuation.
  3. Information extraction helpers can identify and extract structured data from text responses.
  4. Text normalization produces consistent output regardless of the input format variations.

4. **Debugging**
- As a developer, I want console logging with severity levels so that I can filter log output appropriately

   ## Priority
   - [ ] High (MVP)
   - [x] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [x] Small
   - [ ] Medium
   - [ ] Large

- As a developer, I want performance measurement utilities so that I can identify optimization opportunities

   ## Priority
   - [ ] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [x] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [x] Small
   - [ ] Medium
   - [ ] Large

- As a developer, I want access to state inspection utilities so that I can debug application state issues

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
  1. Debug logging functions accept a severity level parameter (e.g., info, warn, error).
  2. Logging is only active in development mode and can be toggled on/off.
  3. Performance utilities can measure and report execution time of specified operations.
  4. State inspection utilities provide a readable view of complex state objects during development.

5. **AI Service Support**
- As a developer, I want retry logic with backoff strategy so that AI service calls are resilient to temporary failures

   ## Priority
   - [x] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [ ] Small
   - [x] Medium
   - [ ] Large

- As a developer, I want context optimization utilities so that token usage remains within limits

   ## Priority
   - [x] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [ ] Small
   - [x] Medium
   - [ ] Large

- As a developer, I want response validation tools so that invalid AI responses can be detected and handled

   ## Priority
   - [ ] High (MVP)
   - [x] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [x] Small
   - [ ] Medium
   - [ ] Large

  **Acceptance Criteria**:
  1. Retry logic implements exponential backoff for failed API calls.
  2. The system caps maximum retry attempts to prevent infinite retry loops.
  3. Context optimization functions maintain token counts under specified limits.
  4. Response validation checks for common failure patterns in AI responses before passing to application logic.

6. **General Utilities**
- As a developer, I want UUID generation with browser compatibility so that entities have reliable unique identifiers

   ## Priority
   - [x] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [x] Small
   - [ ] Medium
   - [ ] Large

- As a developer, I want type guards for core domain objects so that runtime type checking is reliable

   ## Priority
   - [x] High (MVP)
   - [ ] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [x] Small
   - [ ] Medium
   - [ ] Large

- As a developer, I want basic string and date formatting helpers so that presentation is consistent

   ## Priority
   - [ ] High (MVP)
   - [x] Medium (MVP Enhancement)
   - [ ] Low (Nice to Have)
   - [ ] Post-MVP

   ## Estimated Complexity
   - [x] Small
   - [ ] Medium
   - [ ] Large

  **Acceptance Criteria**:
  1. UUID generation works consistently across browsers and creates reliably unique identifiers.
  2. Type guards correctly identify and narrow core domain object types at runtime.
  3. String formatting helpers standardize display of common data types.
  4. Date formatting utilities provide consistent date/time representation across the application.

## GitHub Issues
- [Implement core error handling utilities] - Link to GitHub issue
- [Create IndexedDB storage wrapper] - Link to GitHub issue
- [Build UUID generation utility] - Link to GitHub issue
- [Develop text processing utilities] - Link to GitHub issue
- [Implement debugging utilities] - Link to GitHub issue
- [Create state manipulation helpers] - Link to GitHub issue
- [Build retry logic for AI services] - Link to GitHub issue
- [Develop context optimization utilities] - Link to GitHub issue
- [Create window-accessible debug API] - Link to GitHub issue
- [Implement state inspection utilities] - Link to GitHub issue

## Implementation Approach
1. Create a centralized error handling system first
2. Implement the storage layer with proper error handling
3. Build general utilities (UUID, type guards, formatting)
4. Develop the debugging infrastructure 
5. Create the window-accessible debugging API
6. Implement text processing utilities
7. Build specialized AI service utilities
8. Add state inspection and manipulation helpers
9. Ensure all utilities have proper TypeScript definitions
10. Add comprehensive unit tests for all utility functions

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met