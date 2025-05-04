---
title: AI Service Integration Requirements
aliases: [AI Integration Requirements]
tags: [narraitor, requirements, ai-integration]
created: 2025-04-29
updated: 2025-04-29
---

# AI Service Integration Requirements

## Overview
The AI Service Integration system provides a unified interface for interacting with AI models that power Narraitor's narrative generation, character assistance, and decision management. It handles API communication, prompt construction, response processing, and error management for all AI-dependent features.

## Core Functionality
- **API Communication**: Interface with Google Gemini or alternative AI models
- **Prompt Construction**: Build effective prompts for different use cases
- **Response Processing**: Parse and normalize AI responses
- **Context Management**: Optimize context for token efficiency
- **Error Handling**: Manage API failures with appropriate recovery
- **Service Configuration**: Allow configuration of AI service parameters
- **Fallback Systems**: Provide alternatives when AI service is unavailable
- **Content Safety**: Filter inappropriate content from responses
- **Response Caching**: Cache identical requests to reduce API usage (post-MVP)
- **Request Logging**: Log API requests and responses for debugging (post-MVP)
- **Performance Monitoring**: Track response times and success rates (post-MVP)
- **Token Usage Tracking**: Monitor and manage API token consumption (post-MVP)
- **Service Health Checks**: Verify API availability before making requests (post-MVP)

## Data Model

```typescript
interface AIServiceConfig {
  provider: 'google' | 'openai' | 'anthropic';
  modelName: string;
  apiKey: string;
  endpoint: string;
  maxRetries: number;
  timeout: number;
  temperatureSettings: {
    narrative: number;
    decisions: number;
    summaries: number;
    character: number;
    dialogue: number;
    description: number;
  };
  maxOutputTokens: {
    narrative: number;
    decisions: number;
    summaries: number;
    character: number;
    dialogue: number;
    description: number;
  };
  safetySettings: {
    blockUnsafeContent: boolean;
    contentFilters: string[];
  };
  cachingEnabled?: boolean; // Post-MVP
  cacheTTL?: number; // Post-MVP
  debug: boolean;
}

interface AIRequest {
  requestId: string;
  prompt: string;
  context?: string;
  temperature?: number;
  maxTokens?: number;
  requestType: 'narrative' | 'decision' | 'summary' | 'character' | 'dialogue' | 'description';
  timestamp: number;
  priority?: 'high' | 'normal' | 'low'; // Post-MVP
  cacheKey?: string; // Post-MVP
  worldId?: string;
  characterId?: string;
  safetyLevel?: string;
}

interface AIResponse {
  requestId: string;
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
    details?: string;
  };
  responseTime?: number; // Post-MVP
  source: 'api' | 'cache' | 'fallback';
  timestamp: number;
  safetyFilterApplied?: boolean;
  formattedContent?: string;
}

interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  description: string;
  useCase: 'narrative' | 'decision' | 'summary' | 'character' | 'dialogue' | 'description';
  requiredVariables: string[];
  optionalVariables: string[];
  examples?: string[];
  worldSpecific?: boolean;
  tokensEstimate?: number;
}

interface ServiceStatistics { // Post-MVP
  requestsTotal: number;
  requestsSucceeded: number;
  requestsFailed: number;
  averageResponseTime: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cacheHitRate?: number;
  errorsByType: Record<string, number>;
}
```

## User Interactions
- Users interact indirectly via narrative and character features
- Users see loading indicators during API requests
- Users receive error messages for non-recoverable failures
- Users can restart a generation if they're unsatisfied with results
- Users can configure basic AI service settings via settings page (post-MVP)
- Users can view token usage statistics (post-MVP)
- Users can provide feedback on AI-generated content (post-MVP)

## Integration Points
- **Narrative Engine**: Provides narrative generation capabilities
- **Character System**: Supports character creation and development
- **Journal System**: Generates summaries for journal entries
- **World System**: Uses world configuration to influence prompts
- **State Management**: Persists configuration between sessions
- **Game Session UI**: Shows loading states and error messages
- **Debug Tools**: Provides monitoring and diagnostics (post-MVP)

## MVP Scope Boundaries

### Included
- Google Gemini integration as primary AI provider with:
  - Text-only API interactions
  - Support for Gemini Pro model
  - API key configuration
  - Basic rate limiting compliance
  - Simple safety filters
- Prompt template system with:
  - Narrative generation templates
  - Decision generation templates
  - Summary generation templates
  - Character assistance templates
  - Variable substitution
  - Basic examples
- Error handling with:
  - Automatic retry for transient errors (up to 3 retries)
  - 5-second timeout with retry
  - User-friendly error messages
  - Fallback content for critical failures
  - Error classification and reporting
- Response processing that:
  - Parses JSON or structured responses when needed
  - Handles unexpected response formats
  - Sanitizes content for safety
  - Formats text for display
- Context optimization with:
  - Token counting estimation
  - Context truncation when needed
  - Prioritization of recent/important content
  - Prompt compression techniques

### Excluded from MVP
- Configuration interface for:
  - API key management
  - Temperature settings adjustment
  - Max token limits configuration
  - Safety filter toggling
- Performance monitoring with:
  - Response time tracking
  - Success/failure rates
  - Token usage statistics
- Multi-provider support (OpenAI, Anthropic, etc.)
- Advanced prompt engineering interface
- Streaming responses
- Complex prompt chaining
- Detailed token usage analytics
- Custom model fine-tuning
- Image generation capabilities
- Voice input/output
- Model preference learning
- Dynamic model switching
- Advanced prompt optimization
- Local model support
- Advanced user feedback system
- A/B testing of different prompts
- Advanced caching strategies
- Distributed request handling
- Custom safety filters beyond provider defaults
- Response caching and cache invalidation
- Proxy server integration
- Service level agreement monitoring
- Multi-region service deployment
- Automated content quality assessment

## User Stories

1. **AI Service Configuration**
   - As an administrator, I want to configure the Google Gemini API connection so the system can generate narrative content

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
      1. The application accepts and validates a Gemini API key during initial setup with appropriate format checking.
      2. API connection settings are securely stored in the system using industry-standard encryption.
      3. The system successfully authenticates with the Google Gemini API and verifies connectivity through a test request.
      4. Basic configuration parameters like model name, timeout settings (1-60 seconds), and retry attempts (0-5) can be specified through a configuration interface.
      5. The system handles API configuration errors with clear, actionable feedback messages.

2. **Prompt Management**
   - As a developer, I want to define effective prompt templates for different use cases so the AI generates appropriate content

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
     1. The system implements a template system supporting different prompt types (narrative, decision, etc.).
     2. Each template allows for variable substitution using a standardized syntax (e.g., {{variableName}}).
     3. Templates include appropriate instructions for the AI based on their purpose.
     4. Templates can be organized and retrieved by their use case type.
     5. Templates can be validated to ensure they contain required elements before use.
   - As a developer, I want to include world and character context in prompts so the AI has relevant information

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
     1. Prompts include relevant world information (genre, description, key locations).
     2. Character information (name, attributes, skills, background) is incorporated when appropriate.
     3. The context is formatted in a structured JSON or clearly labeled sections that the AI can effectively use.
     4. The system prioritizes the most relevant context when space is limited based on predefined importance rules.
     5. The context information is automatically updated when world or character details change.
   - As a developer, I want to optimize prompts for token efficiency so we maximize API usage

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
     1. The system accurately estimates token counts for prompts before sending requests (within 5% margin of error).
     2. Context is truncated when it exceeds token limits with clear logging of truncated content.
     3. Recent and important content is prioritized in context optimization using a configurable weighting system.
     4. The system uses prompt compression techniques to maximize information within token limits.
     5. The system provides metrics on token usage efficiency for different prompt templates.
   - As a developer, I want to include examples in prompts to guide the AI's responses

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
      1. Prompt templates support including optional examples with a configurable number of examples (1-5).
      2. Examples demonstrate the desired output format and style with proper formatting.
      3. Examples are context-appropriate for the specific prompt type and world genre.
      4. Examples are included only when they add value within token constraints based on a token budget calculation.
      5. The system allows developers to manage and update the example library through a defined interface.

3. **Error Handling**
   - As a user, I want to see friendly error messages when AI requests fail so I understand what happened

       ## Priority
       - [x] High (MVP)
       - [ ] Medium (MVP Enhancement)
       - [ ] Low (Nice to Have)
       - [ ] Post-MVP

       ## Estimated Complexity
       - [x] Small
       - [ ] Medium
       - [ ] Large

       **Acceptance Criteria**:
       1. Technical API errors are translated into user-friendly messages that avoid technical jargon.
       2. Error messages suggest 1-3 specific possible actions for resolution when appropriate.
       3. Errors are displayed in the UI as non-intrusive notifications without disrupting the game flow.
       4. Different error types (network, service, timeout, authentication) have distinct, appropriate messages tailored to each situation.
       5. Error messages are displayed within 2 seconds of error detection.
   - As a user, I want the system to automatically retry failed requests so temporary issues are resolved without intervention

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
       1. The system automatically retries identified transient errors (HTTP 429, 503, network timeouts) exactly 3 times.
       2. Retries implement exponential backoff (starting at 1 second) to prevent overwhelming the API.
       3. The UI shows appropriate loading indicators during retries with visual distinction between initial request and retry attempts.
       4. Non-retryable errors (authentication failures, invalid requests) are immediately reported without retry attempts.
       5. A comprehensive error classification system correctly identifies which errors should be retried versus immediately reported.
   - As a user, I want to continue playing with fallback content if the AI service is unavailable so my experience isn't interrupted

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
       1. The system provides context-appropriate fallback content when AI is unavailable within 3 seconds of failed requests.
       2. Fallback content is clearly indicated to the user with a non-intrusive visual indicator.
       3. Fallback content maintains narrative coherence with previous content by referencing existing world and character elements.
       4. The system automatically reverts to AI generation when the service becomes available again after performing a health check.
       5. The system maintains a database of diverse fallback content options (at least 10 per narrative situation type) for different narrative situations.
   - As a user, I want the option to restart generation if I'm unhappy with the results

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
      1. A clearly visible regenerate button/option is available after content is displayed for at least 2 seconds.
      2. The regeneration request uses the same context but varies temperature parameters to ensure different results.
      3. Users can regenerate a limited number of times (maximum 3 per scene) to prevent API abuse.
      4. Users are given feedback during the regeneration process with a progress indicator.
      5. The system logs regeneration requests to identify content that frequently requires regeneration for improvement.

4. **Content Generation**
   - As a user, I want the AI to generate narrative content based on my world and character so I can enjoy a personalized story

       ## Priority
       - [x] High (MVP)
       - [ ] Medium (MVP Enhancement)
       - [ ] Low (Nice to Have)
       - [ ] Post-MVP

       ## Estimated Complexity
       - [ ] Small
       - [ ] Medium
       - [x] Large

       **Acceptance Criteria**:
       1. Generated narrative content references at least 3 specific player's world and character details in each narrative segment.
       2. The AI maintains consistent tone and style appropriate to the world genre as defined in world settings.
       3. Narrative elements respect and build upon previously established story elements without contradictions.
       4. The system filters out inappropriate content based on safety settings with 100% reliability.
       5. Narrative segments are between 100-400 words in length for optimal readability.
   - As a user, I want the AI to create meaningful decision options so I can direct the narrative

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
      1. The AI generates exactly 3-4 distinct choice options at appropriate narrative junctures.
      2. Options reflect meaningfully different possible narrative directions with distinct potential outcomes.
      3. Options consider and reference the player character's specific attributes and previous choices.
      4. Options are formatted consistently for UI presentation with each option being 10-30 words in length.
      5. Each set of options includes at least one choice that relates to the character's strengths and one that relates to their weaknesses.
   - As a user, I want the AI to provide character development assistance so I can create rich characters

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
      1. The AI suggests at least 5 appropriate attributes and 3-5 skills based on character concepts entered by the user.
      2. Character description suggestions of 75-150 words are provided when requested, highlighting personality and appearance.
      3. Suggestions demonstrably align with the selected world's theme and genre with appropriate terminology.
      4. The system provides a clear interface allowing users to accept, modify, or reject each individual AI suggestion.
      5. The AI provides at least 2 character background elements that create potential story hooks.
   - As a user, I want AI responses to be appropriately formatted for display so they're easy to read

      ## Priority
      - [x] High (MVP)
      - [ ] Medium (MVP Enhancement)
      - [ ] Low (Nice to Have)
      - [ ] Post-MVP

      ## Estimated Complexity
      - [x] Small
      - [ ] Medium
      - [ ] Large

      **Acceptance Criteria**:
      1. Generated text has proper paragraph breaks (every 3-5 sentences) and consistent formatting.
      2. Dialogue is clearly distinguished using quotation marks and speaker attribution when applicable.
      3. Response content is cleaned of any formatting artifacts from the API with 100% reliability.
      4. Text is presented with appropriate emphasis (bold, italic) for important narrative elements.
      5. Content formatting is responsive across different screen sizes with minimum font size of 14px.

## GitHub Issues
- [Implement Google Gemini API client] - Link to GitHub issue
- [Create prompt template system] - Link to GitHub issue
- [Build error handling and retry logic] - Link to GitHub issue
- [Develop response parser] - Link to GitHub issue
- [Implement context optimization] - Link to GitHub issue
- [Create fallback content system] - Link to GitHub issue
- [Implement token estimation] - Link to GitHub issue
- [Develop prompt variable substitution] - Link to GitHub issue
- [Implement content safety filters] - Link to GitHub issue
- [Build response formatting system] - Link to GitHub issue

## BootHillGM Reference Code
- The AIService class in `app/services/ai/aiService.ts` provides a proven architecture for reliable AI integration with function-specific generators
- The prompt builder in `app/services/ai/promptBuilder.ts` demonstrates effective prompt construction patterns with theme analysis and inventory formatting
- The fallback service in `app/services/ai/fallback/fallbackService.ts` offers a comprehensive model for creating context-specific backup content
- The narrative generator in `app/services/ai/fallback/narrativeGenerator.ts` shows how to create varied fallback responses based on context type
- The error handling patterns in BootHillGM provide robust recovery from API failures with standardized error objects
- The context optimization techniques demonstrate token efficiency approaches

## Implementation Approach
1. Create a centralized AIService class with specialized generator sub-components
2. Implement a robust fallback system with context-specific narratives
3. Use a template-based approach for different prompt types
4. Prioritize error recovery with standardized error objects and retry logic
5. Implement context optimization with a focus on token efficiency
6. Create a flexible prompt builder with variable substitution
7. Use request tracking to monitor in-progress API calls
8. Implement a safety layer for content filtering

## Status
- [x] Requirements defined
- [ ] GitHub issues created
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Acceptance criteria met