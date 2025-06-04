# PageLayout Component

A reusable page layout component that provides consistent structure and styling across all application pages. Part of the shared component library.

## Overview

The PageLayout component standardizes page structure with a header containing title, optional description, action buttons, and a content area with configurable max width. It ensures consistent spacing, responsive design, and semantic HTML structure throughout the application.

## Features

- **Consistent Header Structure**: Title, description, and action buttons
- **Responsive Design**: Mobile-first approach with proper breakpoints
- **Configurable Width**: Multiple max-width options for different content types
- **Semantic HTML**: Proper `main`, `header`, and `section` elements for accessibility
- **Action Button Area**: Dedicated space for page-level actions
- **Flexible Content**: Any React content can be placed in the main area

## Basic Usage

### Simple Page
```tsx
import { PageLayout } from '@/components/shared/PageLayout';

function MyPage() {
  return (
    <PageLayout 
      title="My Page" 
      description="This is my page description"
    >
      <div>Page content goes here</div>
    </PageLayout>
  );
}
```

### With Action Buttons
```tsx
<PageLayout 
  title="Worlds" 
  description="Manage your game worlds"
  actions={
    <>
      <button>Create World</button>
      <button>Generate World</button>
    </>
  }
>
  <WorldList />
</PageLayout>
```

### Custom Width
```tsx
<PageLayout 
  title="Wide Content" 
  maxWidth="6xl"
  description="Page with wider content area"
>
  <DataTable />
</PageLayout>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | **Required** | The main page title displayed in the header |
| `description` | `string` | `undefined` | Optional description text below the title |
| `actions` | `React.ReactNode` | `undefined` | Optional action buttons displayed in the header |
| `children` | `React.ReactNode` | **Required** | The main page content |
| `maxWidth` | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '4xl' \| '6xl' \| '7xl'` | `'4xl'` | Maximum width constraint for content |
| `className` | `string` | `''` | Additional CSS classes for the main container |

## Examples

### Worlds Page
```tsx
<PageLayout 
  title="My Worlds" 
  description="Use the 'Make Active' button to set your current world, then create characters and start your adventure."
  actions={
    <>
      <button className="btn-primary">Create World</button>
      <button className="btn-secondary">Generate World</button>
    </>
  }
>
  <WorldList />
</PageLayout>
```

### Characters Page
```tsx
<PageLayout 
  title="My Characters" 
  description="Fantasy Realm • Create unique characters for your interactive narrative adventures."
  actions={
    <>
      <button className="btn-primary">Start Playing</button>
      <button className="btn-secondary">Create Character</button>
      <button className="btn-secondary">Generate Character</button>
    </>
  }
>
  <CharacterList />
</PageLayout>
```

## Integration

The PageLayout component is used throughout the application:

- **Worlds Page** (`/src/app/worlds/page.tsx`): Main worlds listing
- **Characters Page** (`/src/app/characters/page.tsx`): Character management
- **World Details**: Individual world view pages
- **Character Details**: Individual character view pages

## Related Components

- **Navigation**: Page-level navigation and breadcrumbs
- **BackNavigation**: Back button for sub-pages
- **SectionWrapper**: Content section organization
- **ActionButtonGroup**: Standardized action button layouts