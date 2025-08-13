# WorldEditor Component

This component handles editing existing worlds after they've been created. The challenge was making world editing feel as smooth as the creation wizard while dealing with much more complex state.

## The Problem We're Solving

So you've got a world created through the wizard, but now you want to tweak it. Maybe add a new skill, adjust some attributes, or just fix a typo in the description. The tricky part is that we're not starting fresh like in the wizard - we're working with existing data that might have characters and stories already attached to it.

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

## How It Works

The editor breaks editing into four logical chunks:

1. **Basic Information** - Name, description, and theme (the easy stuff)
2. **Attributes** - Add, edit, and remove world attributes
3. **Skills** - Manage skills with attribute linking (this gets complex fast)
4. **Settings** - Configure limits and point pools

## State Management Approach

Here's where it gets interesting. The component keeps all changes in its own local form state until you hit save. Why? Because we don't want half-edited worlds sitting in the store if you decide to bail out.

The flow is basically:
1. Load world data from store into local form state
2. Let user make changes to the form
3. Only commit back to store when they explicitly save
4. Discard everything if they cancel

## Navigation Logic

- **Save**: Commits changes and navigates to `/worlds`
- **Cancel**: Discards changes and navigates to `/worlds`

Both actions take you back to the worlds list because that's usually where you came from.

## Error Handling

We handle a few different error scenarios:
- World not found (shows error message with a "go back" button)
- Save errors (keeps you on the page so you can try again)
- Loading states (because nobody likes blank screens)

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