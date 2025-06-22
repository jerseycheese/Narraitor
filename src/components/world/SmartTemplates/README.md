# SmartTemplates Component

Smart world template generation with AI assistance for the Narraitor application.

## Overview

The SmartTemplates component provides three AI-powered methods for generating world templates:

1. **"I want something like..."** - Generate worlds based on user descriptions
2. **Genre Mixer** - Combine 2+ genres to create unique world blends  
3. **Surprise Me** - Generate completely unexpected world concepts

## Features

- ✅ AI-powered world template generation
- ✅ Template preview before committing
- ✅ Template history (last 5 generations)
- ✅ Mobile-responsive design
- ✅ Error handling and loading states
- ✅ Integration with World Creation Wizard
- ✅ Performance optimized with React.memo and useCallback

## Components

### SmartTemplates

Main component providing the template generation interface.

```tsx
import { SmartTemplates } from '@/components/world/SmartTemplates';

<SmartTemplates onTemplateGenerated={(template) => handleTemplate(template)} />
```

**Props:**
- `onTemplateGenerated: (template: WorldTemplate) => void` - Callback when template is generated and selected

### TemplatePreview

Preview component for reviewing generated templates before use.

```tsx
import { TemplatePreview } from '@/components/world/SmartTemplates';

<TemplatePreview
  template={template}
  onUse={() => handleUse()}
  onBack={() => handleBack()}
/>
```

**Props:**
- `template: WorldTemplate` - The template to preview
- `onUse: () => void` - Callback when template is accepted
- `onBack: () => void` - Callback to return to template selection

## Integration

### World Creation Wizard

SmartTemplates is integrated into the WorldCreationWizard TemplateStep:

```tsx
// Automatic integration - no additional setup required
// Available as "AI Generate ✨" tab in template selection
```

### Template History

Templates are automatically stored in sessionStore with persistence:

```tsx
import { sessionStore } from '@/state/sessionStore';

// Access template history
const history = sessionStore.getState().templateHistory;

// Add template to history (handled automatically)
sessionStore.getState().addTemplateToHistory(entry);
```

## AI Integration

### Template Generation

Uses the extended NarrativeGenerator with TemplateGenerator:

```tsx
import { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';

const generator = new NarrativeGenerator(geminiClient);
const template = await generator.generateWorldTemplate(context);
```

### Prompt Templates

Template generation uses structured prompts from `templatePrompts.ts`:

```tsx
import { generateWorldTemplatePrompt } from '@/lib/ai/templatePrompts';

const prompt = generateWorldTemplatePrompt({
  type: 'inspired-by',
  userInput: 'Steampunk flying cities'
});
```

## Testing

### Unit Tests
```bash
npm test -- --testPathPattern="SmartTemplates"
```

### Storybook Stories
```bash
npm run storybook
# Navigate to World/SmartTemplates
```

### Test Harness
```bash
npm run dev
# Navigate to /dev/smart-templates
```

## Type Definitions

### WorldTemplate
```tsx
interface WorldTemplate {
  name: string;
  description: string;
  theme: string;
  attributes: Array<{
    name: string;
    baseValue: number;
    minValue: number;
    maxValue: number;
    category: string;
  }>;
  skills: Array<{
    name: string;
    baseValue: number;
    minValue: number;
    maxValue: number;
    difficulty: 'trivial' | 'easy' | 'moderate' | 'hard' | 'extreme';
    category: string;
  }>;
  explanation: string;
}
```

### TemplateHistoryEntry
```tsx
interface TemplateHistoryEntry {
  template: WorldTemplate;
  generatedAt: string;
  generationType: 'inspired-by' | 'genre-mix' | 'surprise-me';
  userInput?: string;
  genres?: string[];
}
```

## Performance Considerations

- Components use React.memo for re-render prevention
- History limited to 5 items for performance
- AI requests include retry logic and error handling
- Genre selection optimized with useCallback

## Accessibility

- Proper ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support

## Mobile Support

- Responsive grid layouts
- Touch-friendly button sizes
- Optimized for mobile viewports
- Gesture-friendly interactions

## Error Handling

- Network failure retry logic
- Invalid AI response handling
- User-friendly error messages
- Graceful fallback states

## Future Enhancements

- Template sharing between users
- Advanced genre filtering
- Template editing capabilities
- Export/import functionality
- Custom AI model selection