# Shared Card Components

This directory contains reusable card components for consistent card layouts and interactions across the application.

## Components

### ActiveStateCard
A wrapper component that provides consistent active/inactive state styling for cards.

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
Displays a green header banner to indicate active state.

```tsx
<ActiveStateIndicator text="Currently Active World" />
```

### MakeActiveButton
Standardized button for making an entity active.

```tsx
<MakeActiveButton 
  onClick={handleMakeActive}
  text="Set as Active Character"
/>
```

### CardActionGroup
Handles button layouts for card actions with primary and secondary groupings.

```tsx
<CardActionGroup
  primaryActions={[
    { key: 'create', text: 'Create Character', onClick: handleCreate, variant: 'primary', flex: true },
    { key: 'play', text: 'Play', onClick: handlePlay, variant: 'primary', flex: true }
  ]}
  secondaryActions={[
    { key: 'view', text: 'View', onClick: handleView },
    { key: 'edit', text: 'Edit', onClick: handleEdit },
    { key: 'delete', text: 'Delete', onClick: handleDelete, variant: 'danger' }
  ]}
/>
```

### EntityBadge
Displays entity type badges with consistent styling.

```tsx
<EntityBadge 
  type="world" 
  text="Set in Middle Earth" 
  icon="🌍"
  variant="info"
/>
```

## Usage Example

Here's how to refactor an existing card component to use these shared components:

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
      variant: 'primary' as const,
      flex: true,
      className: 'bg-indigo-600 text-white hover:bg-indigo-700',
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

## Design Principles

1. **Consistency**: All cards should use these shared components for consistent behavior
2. **Flexibility**: Components accept custom classes and props for specific needs
3. **Accessibility**: All interactive elements have proper ARIA attributes and keyboard support
4. **Type Safety**: Full TypeScript support with exported types
5. **Testing**: Components include data-testid attributes for easy testing

## Recent Improvements

These shared card components have been enhanced as part of walkthrough improvements:

- **Better Navigation Integration**: Cards now work seamlessly with the improved Navigation component
- **Enhanced Visual Design**: Updated button styling and spacing for better user experience
- **Improved Action Button Layouts**: More intuitive action button groupings
- **PageLayout Integration**: Cards work well within the new PageLayout component structure

## Related Components

- **PageLayout**: New shared layout component for consistent page structure
- **Navigation**: Enhanced navigation with better world switching and actions
- **ActionButtonGroup**: Improved action button layouts for cards