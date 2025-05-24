# ErrorDisplay Component

A unified error display system that replaces various error message implementations across the application.

## Usage

Replace existing error implementations with the appropriate ErrorDisplay variant:

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

- **inline**: Small error messages for form fields
- **section**: Error blocks within a page section
- **page**: Full page error states
- **toast**: Temporary notification popups

## Severity Levels

- **error**: Red theme for errors (default)
- **warning**: Yellow theme for warnings
- **info**: Blue theme for informational messages

## Common Use Cases

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

- All variants include appropriate ARIA attributes
- Toast notifications use `aria-live="assertive"`
- Other variants use `aria-live="polite"`
- Inline errors can be associated with form fields via `fieldName`