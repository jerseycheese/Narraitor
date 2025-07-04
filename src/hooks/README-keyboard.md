# Keyboard Navigation Hooks

## useKeyboardShortcuts

Hook for managing keyboard shortcuts with automatic input element detection.

### Features
- Support for modifier keys (Ctrl, Alt, Shift, Meta)
- Automatic detection of input elements to avoid conflicts
- Enable/disable functionality
- Proper event cleanup
- preventDefault and stopPropagation for matched shortcuts

### Usage
```tsx
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const shortcuts = [
  {
    key: 'Escape',
    action: () => closeModal(),
    description: 'Close modal'
  },
  {
    key: 'k',
    ctrlKey: true,
    action: () => openCommandPalette(),
    description: 'Open command palette'
  }
];

useKeyboardShortcuts(shortcuts, enabled);
```

### Input Element Detection
The hook automatically ignores shortcuts when the user is typing in:
- `<input>` elements
- `<textarea>` elements
- `<select>` elements  
- Elements with `contenteditable="true"`

This prevents keyboard shortcuts from interfering with normal text input.