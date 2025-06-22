# Smart World Templates

AI-powered world template generation feature that creates customized world templates based on user input, genre combinations, or random generation.

## Overview

The Smart Templates feature provides three generation modes:
1. **Inspired By** - Generate templates based on user descriptions
2. **Genre Mixer** - Combine multiple genres to create unique worlds
3. **Surprise Me** - Generate completely unexpected world concepts

## Components

### SmartTemplates

The main component that orchestrates template generation with AI.

**Props:**
- `onTemplateGenerated: (template: WorldTemplate) => void` - Callback when a template is generated and selected

**Features:**
- Three generation modes with tab-based navigation
- Real-time form validation
- Loading states during AI generation
- Error handling with retry capabilities  
- Template preview modal before selection
- Integration with template history system

### TemplatePreview

Modal component for previewing generated templates before use.

**Props:**
- `template: WorldTemplate` - The template to preview
- `isOpen: boolean` - Modal visibility state
- `onUse: () => void` - Callback when template is accepted
- `onBack: () => void` - Callback to return to generation

### RecentTemplates (Shared)

Reusable component for displaying and selecting from recent AI-generated templates.

**Props:**
- `onTemplateSelect: (entry: TemplateHistoryEntry) => void` - Callback when template is selected
- `selectedTemplateId?: string | null` - Currently selected template ID
- `title?: string` - Section title (default: "Recent Templates")
- `description?: string` - Section description
- `className?: string` - Additional CSS classes
- `maxTemplates?: number` - Maximum templates to display (default: 5)

## Architecture

### AI Generation Flow

1. User selects generation mode and provides input
2. Request is sent to `/api/ai/generate-template` endpoint
3. Server calls Google Gemini API with structured prompts
4. Response is validated and normalized using `TemplateGenerator`
5. Template is added to session history via `sessionStore`
6. Template preview is shown for user approval

### Hook Integration

Uses the `useAIGeneration` hook for consistent loading states, error handling, and API interaction patterns:

```typescript
const aiGeneration = useAIGeneration<RequestType, WorldTemplate>({
  endpoint: '/api/ai/generate-template',
  onSuccess: (template) => {
    // Add to history and show preview
  },
  onError: () => {
    // Error handling managed by hook
  }
});
```

### State Management

- Template generation uses `useAIGeneration` hook
- Template history managed by `sessionStore`
- Preview state managed locally with `useState`
- Form state (user input, selected genres) managed locally

## AI Integration

### Template Generation API

**Endpoint:** `POST /api/ai/generate-template`

**Request Body:**
```typescript
{
  type: 'inspired-by' | 'genre-mix' | 'surprise-me';
  userInput?: string;     // For inspired-by mode
  genres?: string[];      // For genre-mix mode  
}
```

**Response:**
```typescript
{
  name: string;
  description: string;
  genre: string;          // Normalized genre constant
  attributes: Attribute[];
  skills: Skill[];
  explanation: string;    // AI explanation of choices
}
```

### Genre Normalization

All generated genres are normalized to valid constants using `normalizeGenre()`:
- Handles mixed case input ("Cyberpunk Fantasy" → "cyberpunk-fantasy")
- Maps legacy genre names to current constants
- Ensures consistency across the application

### Prompt Engineering

Templates use structured prompts with:
- Explicit genre constraints and examples
- Required JSON response format
- Clear attribute/skill structure requirements
- Genre-specific examples and guidance

## Usage Examples

### Basic Implementation

```tsx
import { SmartTemplates } from '@/components/world/SmartTemplates';

function WorldCreation() {
  const handleTemplateGenerated = (template: WorldTemplate) => {
    // Use the generated template
    console.log('Generated template:', template);
  };

  return (
    <SmartTemplates onTemplateGenerated={handleTemplateGenerated} />
  );
}
```

### With Recent Templates

The component automatically integrates with the Recent Templates system:

```tsx
// Recent templates are automatically displayed when available
// Users can select from previously generated templates
// Templates are stored in sessionStorage for persistence
```

### Error Handling

```tsx
// Errors are automatically handled by the useAIGeneration hook
// Error states are displayed using the ErrorDisplay component
// Users can retry failed generations
```

## Testing

### Unit Tests

Located in `SmartTemplates.test.tsx`:
- Template generation modes
- User input validation
- Loading states
- Error handling
- Template history integration
- Mobile responsiveness

### Storybook Stories

Located in `SmartTemplates.stories.tsx`:
- All three generation modes
- Loading states
- Error states
- Mobile viewport testing

### Test Harness

Available at `/dev/smart-templates`:
- Interactive testing of all features
- Real AI generation testing
- Integration with world creation wizard

## Performance Considerations

### Optimizations Applied

- `useMemo` for tab options to prevent re-renders
- `useCallback` for event handlers to prevent child re-renders
- Proper dependency arrays in hooks
- Leveraged existing `useAIGeneration` hook to avoid code duplication

### Memory Management

- Templates are stored in sessionStorage (not permanent)
- History limited to configurable maximum (default: 5 templates)
- Large template objects are cleaned up when no longer needed

## Security

### API Key Protection

- All AI generation happens server-side
- No API keys exposed to client
- Rate limiting applied at API level

### Input Validation

- User input sanitized before sending to AI
- Genre selection limited to valid constants
- Response validation ensures proper template structure

## Integration Points

### World Creation Wizard

- Integrates seamlessly with `TemplateStep` component
- Templates pre-populate wizard form fields
- Maintains wizard navigation state

### Session Store

- Templates automatically added to history
- History accessible across components
- Persistent across page reloads (sessionStorage)

### Shared Components

- Uses existing UI components (Button, Input, LoadingState, ErrorDisplay)
- Leverages shared GenreSelector component
- Follows established wizard styling patterns

## Development Guidelines

### Adding New Generation Modes

1. Add new mode to `TemplateMode` type
2. Update tab options in `SmartTemplates` component
3. Add mode-specific UI in the generation section
4. Update AI prompt generation in `templatePrompts.ts`
5. Add tests for the new mode

### Extending Template Structure

1. Update `WorldTemplate` interface
2. Modify AI prompt templates to include new fields
3. Update `TemplatePreview` component to display new fields
4. Update conversion utilities in `templateHelpers.ts`
5. Add validation for new fields in `TemplateGenerator`

### Performance Monitoring

- Monitor AI generation response times
- Track error rates and failure modes
- Monitor template history storage usage
- Check for memory leaks in template preview modals