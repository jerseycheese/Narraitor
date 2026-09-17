# Shared Card Components

The pieces the worlds and characters list cards are built from. `WorldCard` and `CharacterCard` are the working examples; read those before building a new card.

## ActiveStateCard

The card wrapper. It only styles the state: an accent border and a faint wash when active. It isn't clickable, so nothing inside it needs to stop propagation.

```tsx
<ActiveStateCard isActive={isActive} hasImage className="component-world-card">
  <CardImage />
  <CardContent />
</ActiveStateCard>
```

With `hasImage`, the first child goes in the media slot and the rest follow.

## ActiveStateToggle

The one control that makes an item active. Inactive, it's a "Make Active" link, because it's an action. Active, it's an "Active" pill, because it's state, and pressing it does nothing. It's the same button in both states, so keyboard focus survives the switch.

```tsx
<ActiveStateToggle
  isActive={isActive}
  onActivate={() => setCurrentWorld(world.id)}
  testId="world-card-active-toggle"
/>
```

Put it beside the item's type label, not in the action group.

## CardActionGroup

Primary and secondary card actions. Each rendered state gets exactly one filled primary CTA. On list pages that's the page-level Create button, so per-card Play is `secondary`.

```tsx
<CardActionGroup
  primaryActions={[
    { key: 'play', text: 'Play', onClick: handlePlay, variant: 'secondary', flex: true, icon: <Play aria-hidden="true" /> },
  ]}
  secondaryActions={[
    { key: 'edit', text: 'Edit', onClick: handleEdit, variant: 'secondary', icon: <Pencil aria-hidden="true" /> },
    { key: 'delete', text: 'Delete', onClick: handleDelete, variant: 'danger', icon: <Trash aria-hidden="true" /> },
  ]}
/>
```

Buttons meet the 44px touch target through `--control-height-touch`.
