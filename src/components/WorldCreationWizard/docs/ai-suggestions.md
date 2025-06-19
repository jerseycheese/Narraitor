# AI Suggestions Component

## Overview

The AI Suggestions feature provides intelligent attribute and skill recommendations for world creation based on the user's world description. This feature leverages Google Gemini AI through secure server-side API routes to analyze world descriptions and suggest contextually appropriate character attributes and skills.

## Features

- **Secure Analysis**: Analyzes world descriptions through secure API routes with rate limiting
- **Loading States**: Clear feedback during AI processing
- **Accept/Reject Interface**: Users can individually accept or reject each suggestion
- **Contextual Relevance**: Suggestions are tailored to match the world's theme and setting
- **Graceful Fallback**: Provides default suggestions if AI service is unavailable
- **Rate Limited**: Respects API limits (50 requests per hour per IP)

## Component Structure

### Main Components

1. **worldAnalyzer.ts**: Core AI integration that processes world descriptions through secure API routes
2. **AISuggestions.tsx**: UI component for displaying and managing suggestions
3. **WorldCreationWizard Integration**: Seamless integration into the world creation flow
4. **ClientGeminiClient**: Secure client-side proxy for API communication

### Type Definitions

```typescript
interface AttributeSuggestion {
  name: string;
  description: string;
  minValue: number;
  maxValue: number;
  category?: string;
  accepted: boolean;
}

interface SkillSuggestion {
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  linkedAttributeName?: string;
  accepted: boolean;
}
```

## Usage in World Creation Wizard

The AI suggestions feature is integrated into the World Creation Wizard workflow:

1. User enters world description in the Description step
2. System analyzes the description using AI
3. Generated suggestions are displayed in the Attribute Review step
4. User can accept/reject individual suggestions
5. Accepted suggestions are incorporated into the final world configuration

### Integration Points

- **DescriptionStep.tsx**: Triggers AI analysis when proceeding from description
- **AttributeReviewStep.tsx**: Displays AI-generated attribute suggestions
- **SkillReviewStep.tsx**: Displays AI-generated skill suggestions

## Error Handling

The system gracefully handles various error scenarios:

- **AI Service Unavailable**: Falls back to predefined default suggestions
- **Rate Limit Exceeded**: Shows clear message about 50 requests/hour limit
- **Invalid AI Response**: Attempts to parse partial responses or uses defaults
- **Network Timeouts**: Shows appropriate error messages to users
- **Server Errors**: Provides fallback suggestions when API routes fail

## Testing

The feature includes comprehensive test coverage:

- Unit tests for AI suggestion generation
- Component tests for the AISuggestions UI
- Integration tests for the World Creation Wizard flow
- Error scenario testing

## Configuration

The AI service is configured through secure server-side environment variables:

```
GEMINI_API_KEY=your-api-key
```

**Important**: API keys are now server-side only for security. The system uses secure API routes (`/api/narrative/generate`) instead of direct client-side API calls.

## Best Practices

1. **Performance**: AI analysis is triggered only when necessary
2. **User Control**: All suggestions are optional - users maintain full control
3. **Rate Limiting**: Respects API limits to prevent abuse
4. **Security**: No API keys exposed to client-side code
5. **Feedback**: Clear loading states and error messages
6. **Accessibility**: Component follows WCAG guidelines

## Security Features

- **Server-Side API Keys**: All API keys stored securely server-side
- **Rate Limiting**: 50 requests per hour per IP to prevent abuse
- **Request Validation**: Input sanitization and content filtering
- **Secure Proxy**: All requests go through Next.js API routes

## Future Enhancements

- Suggestion refinement based on user feedback
- Category-based filtering of suggestions
- Batch accept/reject functionality
- Custom suggestion parameters
- Enhanced rate limiting with user authentication