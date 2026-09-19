# Shared Card Components

The pieces the worlds and characters list cards are built from. `WorldCard` and `CharacterCard` are the working examples; read those before building a new card.

## ActiveStateCard

The card wrapper. It only styles the state: an accent border and a faint wash when active. It isn't clickable, so nothing inside it needs to stop propagation.

```tsx
<ActiveStateCard isActive={isActive} className="component-example-card" labelledBy={titleId}>
  <CardImage />
  <CardContent />
</ActiveStateCard>
```

Children render in order; the card's own CSS places them. Pass `labelledBy` the title's id so the card is named after its item.

## ActiveStateLabel

Marks the active item with an "Active" pill. It's state, not a control: Play and the header world switcher are what change the active world or character, so list cards don't offer a separate way to do it. It renders nothing for inactive items.

```tsx
<ActiveStateLabel isActive={isActive} testId="world-card-active-label" />
```

Put it beside the item's type label.

## CardActionGroup

Primary and secondary card actions. Each rendered state gets exactly one filled primary CTA. On list pages that's the page-level Create button, so per-card Play is `accent`: bordered in accent, never filled. The rest are `quiet` text actions, and `quiet-danger` only turns red when pointed at.

A list repeats the same visible text on every card, so give each action the item's name through `ariaLabel`.

```tsx
<CardActionGroup
  primaryActions={[
    { key: 'play', text: 'Play', ariaLabel: `Play as ${name}`, onClick: handlePlay, variant: 'accent', flex: true, icon: <Play aria-hidden="true" /> },
  ]}
  secondaryActions={[
    { key: 'edit', text: 'Edit', ariaLabel: `Edit ${name}`, onClick: handleEdit, variant: 'quiet', icon: <Pencil aria-hidden="true" /> },
    { key: 'delete', text: 'Delete', ariaLabel: `Delete ${name}`, onClick: handleDelete, variant: 'quiet-danger', icon: <Trash aria-hidden="true" /> },
  ]}
/>
```

Buttons meet the 44px touch target through `--control-height-touch`.
