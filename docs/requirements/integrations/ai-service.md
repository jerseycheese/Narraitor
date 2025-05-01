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
   - As an administrator, I want to adjust temperature settings for different use cases so I can control creativity vs. consistency (post-MVP)
   - As an administrator, I want to set token limits for different request types to manage API usage (post-MVP)
   - As an administrator, I want to configure safety settings to ensure appropriate content (post-MVP)

2. **Prompt Management**
   - As a developer, I want to define effective prompt templates for different use cases so the AI generates appropriate content
   - As a developer, I want to include world and character context in prompts so the AI has relevant information
   - As a developer, I want to optimize prompts for token efficiency so we maximize API usage
   - As a developer, I want to include examples in prompts to guide the AI's responses

3. **Error Handling**
   - As a user, I want to see friendly error messages when AI requests fail so I understand what happened
   - As a user, I want the system to automatically retry failed requests so temporary issues are resolved without intervention
   - As a user, I want to continue playing with fallback content if the AI service is unavailable so my experience isn't interrupted
   - As a user, I want the option to restart generation if I'm unhappy with the results

4. **Content Generation**
   - As a user, I want the AI to generate narrative content based on my world and character so I can enjoy a personalized story
   - As a user, I want the AI to create meaningful decision options so I can direct the narrative
   - As a user, I want the AI to provide character development assistance so I can create rich characters
   - As a user, I want AI responses to be appropriately formatted for display so they're easy to read

5. **Performance Monitoring** (post-MVP)
   - As an administrator, I want to track API response times so I can monitor service performance
   - As an administrator, I want to monitor token usage so I can manage API costs
   - As an administrator, I want to see success and failure rates so I can identify system issues

## Acceptance Criteria
1. The system successfully communicates with the Google Gemini API
2. API requests include properly formatted prompts with relevant context
3. The system handles API errors gracefully with appropriate retries
4. Fallback content is provided when AI service is unavailable
5. Response content is properly parsed and normalized
6. Token usage is optimized to stay within limits
7. Prompt templates effectively guide AI responses for different use cases
8. Error messages are user-friendly and informative
9. The system respects rate limits and prevents excessive API usage
10. Content safety filters block inappropriate material
11. Context optimization effectively reduces token usage without sacrificing quality
12. Different prompt types are formatted appropriately for their specific use cases

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