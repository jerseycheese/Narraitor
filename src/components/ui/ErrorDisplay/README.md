# ErrorDisplay Component

So here's the thing - we had error messages scattered all over the app, each doing their own styling and behavior. Some were red text, some were bordered boxes, some had retry buttons, some didn't. It was a mess to maintain and users got inconsistent experiences.

This component consolidates all that into one system that handles errors consistently. Basically, instead of writing custom error markup everywhere, you just pick the right variant and you're done.

## Usage

Here's how to replace the old scattered error implementations:

### Before (various implementations):
```tsx
// Inline form error
<p className="text-red-600 text-sm mt-1">{error}</p>

// Section error
<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
  <h2 className="text-lg font-semibold text-red-700 mb-2">Error</h2>
  <p className="text-red-600">{message}</p>
</div>

// Page error
<div className="flex flex-col items-center justify-center min-h-screen">
  <h1 className="text-2xl font-bold text-red-600 mb-4">Not Found</h1>
  <p className="text-gray-600">{message}</p>
</div>
```

### After (using ErrorDisplay):
```tsx
import { InlineError, SectionError, PageError } from '@/components/ui/ErrorDisplay';

// Inline form error
<InlineError message={error} fieldName="email" />

// Section error
<SectionError 
  title="Error"
  message={message}
  showRetry
  onRetry={handleRetry}
/>

// Page error
<PageError
  title="Not Found"
  message={message}
  showRetry
  onRetry={handleRetry}
/>
```

## Variants

We've got four main patterns that cover pretty much every error scenario:

- **inline**: Those little red messages under form fields when validation fails
- **section**: Bigger error blocks when a whole section can't load or has issues
- **page**: Full page errors like 404s or when the whole app breaks
- **toast**: Those notification popups that appear and disappear automatically

## Severity Levels

The color coding is pretty intuitive:

- **error**: Red theme for actual errors (this is the default)
- **warning**: Yellow theme for "hey, something's not quite right but it's not broken"
- **info**: Blue theme for informational messages that aren't really problems

## Common Use Cases

Here are the patterns you'll use most often:

### Form Validation
```tsx
<div>
  <input 
    className={hasError ? 'border-red-300' : 'border-gray-300'}
    aria-invalid={hasError}
    aria-describedby="field-error"
  />
  <InlineError 
    message="This field is required" 
    fieldName="field"
  />
</div>
```

### API Errors
```tsx
<SectionError
  title="Failed to Load Data"
  message="Unable to connect to the server. Please try again."
  severity="error"
  showRetry
  onRetry={refetchData}
/>
```

### AI Service Warnings
```tsx
<SectionError
  title="AI Suggestions Unavailable"
  message="The AI service is temporarily offline. You can continue manually."
  severity="warning"
  showDismiss
  onDismiss={() => setShowWarning(false)}
/>
```

### Success with Warnings
```tsx
<ToastError
  title="Saved with Warnings"
  message="Your changes were saved but may need review."
  severity="warning"
  showDismiss
  onDismiss={() => setShowToast(false)}
/>
```

## Props

- `variant`: 'inline' | 'section' | 'page' | 'toast'
- `severity`: 'error' | 'warning' | 'info' 
- `title`: Optional title text
- `message`: Error message (required)
- `showRetry`: Show retry button
- `onRetry`: Retry callback
- `showDismiss`: Show dismiss button
- `onDismiss`: Dismiss callback
- `fieldName`: For inline errors, associates with form field
- `className`: Additional CSS classes

## Accessibility

We've baked in all the accessibility stuff so you don't have to think about it:

- All variants get the right ARIA attributes automatically
- Toast notifications use `aria-live="assertive"` because they're urgent interruptions
- Other variants use `aria-live="polite"` since they're less disruptive
- Inline errors link to their form fields through the `fieldName` prop, which helps screen readers connect the error to the right input