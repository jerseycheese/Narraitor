# Shared Card Components

Cards were all over the place with different styling, button layouts, and interaction patterns. This is our unified card component system that brings consistency to how entities are displayed across the app.

## What's Available

### ActiveStateCard
The main wrapper that handles the active/inactive styling. Basically gives you that green "currently active" header and proper click handling:

```tsx
<ActiveStateCard
  isActive={isActive}
  onClick={() => handleSelect(id)}
  activeText="Currently Active World"
>
  <CardContent />
</ActiveStateCard>
```

### ActiveStateIndicator
Just the green header banner part if you want to use it independently:

```tsx
<ActiveStateIndicator text="Currently Active World" />
```

### MakeActiveButton
Standardized "make this thing active" button. Saves you from having to style the same button over and over:

```tsx
<MakeActiveButton
  onClick={handleMakeActive}
  text="Set as Active Character"
/>
```

### CardActionGroup
This one's pretty clever - handles the complexity of primary vs secondary action button layouts:

```tsx
<CardActionGroup
  primaryActions={[
    { key: 'create', text: 'Create Character', onClick: handleCreate, variant: 'primary', flex: true },
    { key: 'play', text: 'Play', onClick: handlePlay, variant: 'success', flex: true }
  ]}
  secondaryActions={[
    { key: 'view', text: 'View', onClick: handleView },
    { key: 'edit', text: 'Edit', onClick: handleEdit },
    { key: 'delete', text: 'Delete', onClick: handleDelete, variant: 'danger' }
  ]}
/>
```

### EntityBadge
For those little colored badges that show entity types and statuses:

```tsx
<EntityBadge
  type="world"
  text="Set in Middle Earth"
  icon={<Globe />}
  variant="info"
/>
```

## Real-World Example

Here's how you'd refactor an existing card component to use these shared pieces instead of rolling your own:

```tsx
import {
  ActiveStateCard,
  MakeActiveButton,
  CardActionGroup,
  EntityBadge
} from '@/components/shared/cards';

const WorldCard = ({ world, isActive, onSelect, onDelete }) => {
  const primaryActions = [
    {
      key: 'create-character',
      text: 'Create Character',
      onClick: handleCreateCharacter,
      variant: 'primary' as const,
      flex: true,
      className: 'bg-green-600 text-white hover:bg-green-700',
      icon: <PlusIcon className="w-5 h-5" />
    },
    {
      key: 'play',
      text: 'Play',
      onClick: handlePlay,
      variant: 'success' as const,
      flex: true,
      icon: <PlayIcon className="w-5 h-5" />
    }
  ];

  const secondaryActions = [
    { key: 'view', text: 'View', onClick: handleView },
    { key: 'edit', text: 'Edit', onClick: handleEdit },
    { key: 'delete', text: 'Delete', onClick: handleDelete, variant: 'danger' as const }
  ];

  return (
    <ActiveStateCard
      isActive={isActive}
      onClick={() => onSelect(world.id)}
      activeText="Currently Active World"
      hasImage={!!world.image?.url}
    >
      {/* Image section */}
      {world.image?.url && <WorldImage url={world.image.url} />}

      {/* Card content */}
      <div className="p-4">
        <h2>{world.name}</h2>

        {/* Entity badges */}
        <div className="flex gap-2">
          <EntityBadge
            text={world.theme}
            variant="primary"
          />
          <EntityBadge
            type="world"
            text={`Set in ${world.reference}`}
            variant="info"
          />
        </div>

        {/* Make active button for inactive worlds */}
        {!isActive && (
          <MakeActiveButton onClick={handleMakeActive} />
        )}

        {/* Action buttons */}
        <CardActionGroup
          primaryActions={primaryActions}
          secondaryActions={secondaryActions}
        />
      </div>
    </ActiveStateCard>
  );
};
```

## Why These Exist

The design principles behind these components:

1. **Consistency**: All cards use the same interaction patterns and styling
2. **Flexibility**: You can still customize them without breaking the design system
3. **Accessibility**: Built-in ARIA attributes and keyboard support (because we should all care about this)
4. **Type Safety**: Full TypeScript support so you can't accidentally pass the wrong data
5. **Testing**: Components include proper data-testid attributes

## Layout Integration

- **Navigation**: Cards integrate with the Navigation component for consistent world switching and actions
- **Button layout**: Primary and secondary actions are grouped separately so the main action stands out
- **PageLayout**: Cards compose with the shared PageLayout component for consistent page structure

## Related Components

These work well with:
- **PageLayout**: New shared layout component for consistent page structure
- **Navigation**: Enhanced navigation with better world switching and actions
- **ActionButtonGroup**: Improved action button layouts for cards