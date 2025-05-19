# WorldEditor Component

The WorldEditor component provides a comprehensive interface for editing existing worlds in the Narraitor application.

## Usage

```tsx
import WorldEditor from '@/components/WorldEditor/WorldEditor';

// In your page component
<WorldEditor worldId={worldId} />
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| worldId | string | Yes | The ID of the world to edit |

## Features

- Loads world data from the store
- Provides forms for editing all world aspects
- Handles save/cancel operations
- Shows loading and error states

## Form Sections

The editor includes four main sections:

1. **Basic Information** - Name, description, and theme
2. **Attributes** - Add, edit, and remove world attributes
3. **Skills** - Manage skills with attribute linking
4. **Settings** - Configure limits and point pools

## State Management

The component manages its own form state and only commits changes to the store when the user clicks save.

## Navigation

- Save: Commits changes and navigates to `/worlds`
- Cancel: Discards changes and navigates to `/worlds`

## Error Handling

- Shows error message if world not found
- Provides button to return to worlds list
- Handles save errors gracefully

## Example

```tsx
'use client';

import { use } from 'react';
import WorldEditor from '@/components/WorldEditor/WorldEditor';

interface EditWorldPageProps {
  params: Promise<{ id: string }>;
}

export default function EditWorldPage({ params }: EditWorldPageProps) {
  const { id } = use(params);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Edit World</h1>
      <WorldEditor worldId={id} />
    </div>
  );
}