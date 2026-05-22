# SmartTemplates Component

This is where the magic happens - AI-powered world template generation that actually understands what you're trying to build. The idea was to give people three different ways to get inspiration when they're stuck staring at a blank world creation form.

## The Three Approaches

We settled on three different generation methods because people think about worlds differently:

1. **"I want something like..."** - For when you know exactly what you want ("like Game of Thrones but steampunk")
2. **Genre Mixer** - For when you want to experiment ("what if we mixed cyberpunk with medieval fantasy?")
3. **Surprise Me** - For when you just want the AI to go wild and show you something unexpected

## What It Does

The component handles all the complexity of AI world generation while keeping the UI simple:

- Generates complete world templates with attributes, skills, and detailed explanations
- Lets you preview templates before committing (because AI sometimes gets creative in unexpected ways)
- Keeps a history of your last 5 generations so you can go back to that cool idea from earlier
- Works great on mobile (world building doesn't just happen at desks)
- Handles errors gracefully (AI services can be finicky)
- Integrates seamlessly with the World Creation Wizard
- Performance optimized because nobody likes laggy UIs

## Components

### SmartTemplates

This is the main component that handles the generation interface. Pretty straightforward to use:

```tsx
import { SmartTemplates } from '@/components/world/SmartTemplates';

<SmartTemplates onTemplateGenerated={(template) => handleTemplate(template)} />
```

**Props:**
- `onTemplateGenerated: (template: WorldTemplate) => void` - Gets called when user picks a template

### TemplatePreview

The preview component is crucial because AI can generate some... interesting results. Always let users see what they're getting:

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
- `onUse: () => void` - Called when user accepts the template
- `onBack: () => void` - Called when user wants to generate something else

## Integration

### World Creation Wizard

SmartTemplates is integrated into the WorldCreationWizard TemplateStep:

```tsx
// Automatic integration: no additional setup required
// Available as the "AI Generate" tab in template selection
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