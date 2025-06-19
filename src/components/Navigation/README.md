# Navigation Component

## Overview
The Navigation component provides the main application navigation with integrated loading states, responsive design, and accessibility features.

## Features
- **Integrated Loading States**: Automatic loading indicators for navigation actions
- **Responsive Design**: Adaptive layout for desktop and mobile devices
- **Current World Context**: Dynamic navigation based on active world
- **Accessibility**: Keyboard navigation and screen reader support
- **Loading Integration**: Pre-integrated with NavigationLoadingProvider

## Usage

### Basic Navigation
```tsx
import { Navigation } from '@/components/Navigation';

function Layout({ children }) {
  return (
    <div>
      <Navigation />
      <main>{children}</main>
    </div>
  );
}
```

### With Loading Provider
```tsx
import { NavigationLoadingProvider } from '@/components/shared';
import { Navigation } from '@/components/Navigation';

function App() {
  return (
    <NavigationLoadingProvider>
      <Navigation />
      {/* Other components */}
    </NavigationLoadingProvider>
  );
}
```

## Features

### Auto-Loading Navigation
Navigation buttons automatically show loading states:
- **World Links**: Show "Loading world..." when navigating to world pages
- **Character Links**: Show "Loading characters..." for character navigation
- **Play Buttons**: Show "Starting [World Name]..." for game sessions

### Responsive Behavior
- **Desktop**: Full navigation bar with all options visible
- **Mobile**: Collapsible menu with essential navigation hints

### World Context
- **Active World**: Displays current world name and quick actions
- **No World**: Shows "Create Your First World" call-to-action
- **Multiple Worlds**: Provides world switching capabilities

### Navigation Items
1. **Worlds**: Navigate to world management
2. **Characters**: Access character creation and management
3. **Play Button**: Quick start for current world (desktop)
4. **World Info**: Current world details and actions

## Loading States

### Automatic Loading
All navigation buttons use `navigateWithLoading`:
```tsx
// Automatically handled by Navigation component
<button onClick={() => navigateWithLoading('/worlds', 'Loading worlds...')}>
  Worlds
</button>
```

### Custom Loading Messages
- **World Navigation**: "Loading world details..."
- **Character Navigation**: "Loading characters..."
- **Game Start**: "Starting [World Name]..."
- **World Creation**: "Setting up world creation..."

## Accessibility

### Keyboard Navigation
- **Tab Order**: Logical tab sequence through all navigation items
- **Enter/Space**: Activate navigation buttons
- **Escape**: Cancel loading operations (when applicable)

### Screen Reader Support
- **ARIA Labels**: Descriptive labels for all interactive elements
- **Live Regions**: Loading state announcements
- **Semantic HTML**: Proper nav structure with role attributes

### Focus Management
- **Visible Focus**: Clear focus indicators
- **Focus Trapping**: During loading states (via LoadingOverlay)
- **Skip Links**: (Can be added for enhanced accessibility)

## State Management

### World Store Integration
```tsx
const currentWorld = useWorldStore(state => state.getCurrentWorld());
const worlds = useWorldStore(state => state.entities);
```

### Loading Context
```tsx
const { navigateWithLoading } = useNavigationLoading();
```

## Styling

### Responsive Classes
- **Desktop**: `hidden sm:inline-flex` for desktop-only elements
- **Mobile**: Responsive grid and flex layouts
- **Hover States**: Interactive feedback for all clickable elements

### Theme Integration
- **Colors**: Uses theme colors for consistency
- **Dark Mode**: Supports light/dark theme switching
- **Brand Colors**: Consistent with application color palette

## Testing

### Component Tests
- **Rendering**: Proper navigation structure
- **Interactions**: Button clicks and navigation
- **Loading States**: Integration with loading system

### Accessibility Tests
- **Screen Reader**: NVDA/JAWS compatibility
- **Keyboard**: Full keyboard navigation
- **Focus Management**: Proper focus flow

## Development

### Storybook
```bash
npm run storybook
# Navigate to Components > Navigation > Navigation
```

### Test Harness
Visit `/dev/navigation-loading` to test navigation loading states.

## Related Components
- [NavigationLoadingProvider](../shared/NavigationLoadingProvider.md)
- [LoadingOverlay](../shared/LoadingOverlay.md)
- [Breadcrumbs](./Breadcrumbs.tsx)

## Migration Notes

### From Basic Navigation
If upgrading from a basic navigation implementation:
1. Wrap app with NavigationLoadingProvider
2. Replace manual loading states with built-in navigation loading
3. Update tests to account for loading states
4. Verify accessibility improvements