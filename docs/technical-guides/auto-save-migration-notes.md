# Auto-Save Storage Migration Notes

The character creation auto-save switched from sessionStorage to localStorage so it actually survives browser restarts. Users were getting frustrated when they'd lose all their character work just because they closed a tab.

## What Changed

**Before**: Data was stored in sessionStorage, which meant it vanished the moment you closed the browser tab. Not great when you're halfway through creating a character.

**After**: Now using localStorage, so your character creation progress survives browser restarts, tab closures, whatever.

## The Migration

The hook automatically handles migrating any existing sessionStorage data to localStorage. If you had character data saved in the old format, it'll move it over and clean up the old version. No manual steps needed.

## For Developers

Your existing code keeps working exactly the same:

```typescript
const { data, setData, clearAutoSave, hasRecoveryData } = 
  useCharacterCreationAutoSave(worldId);
```

The only difference is `hasRecoveryData` can now be true even after browser restarts, which is the whole point.

## Storage Cleanup

Since localStorage sticks around longer than sessionStorage, the system cleans up after itself:
- Auto-save data gets cleared when character creation finishes
- Old data for deleted worlds gets cleaned up too

That's basically it. The change is invisible to users except that their progress actually persists now.