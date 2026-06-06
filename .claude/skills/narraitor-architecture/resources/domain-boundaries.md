# Domain Boundaries in Narraitor

Use domain boundaries to keep state and UI decoupled across the app.

## Domain map (source of truth)
Reference `src/types/*.types.ts` and `src/state/*Store.ts` for the canonical list. Current domains include:
- Core gameplay: World, Character, Inventory, Narrative, Journal, Game
- Supporting systems: Lore, Session, AIContext, NPC, Goal, Navigation
- Content/config: Archetype, Genre, WorldTemplate, ToneSettings, SkillDifficulty, Personalization, Tutorial, StoryCheckpoint
- AI: AISuggestions, AITesting
- Infrastructure: Common, RuntimeError, Dashboard

## Where domain code lives
- Types: `src/types/<domain>.types.ts`
- Stores: `src/state/<domain>Store.ts` (some stores like `loreStore` have grown into multi-file modules: `loreStore.*.ts` with 18+ sub-files)
- Domain services/logic: `src/lib/<domain>/` (e.g., `src/lib/narrative/`, `src/lib/lore/`, `src/lib/inventory/`, `src/lib/world/`, `src/lib/tutorial/`)
- Components: `src/components/<domain>/` or feature folders that already exist for that domain

## Boundary rules
1. Do not import another domain's store inside a domain store.
2. Do not import another domain's components inside a domain component.
3. Pass IDs or typed DTOs across domains; resolve related data in parent components or route pages.
4. Keep validation and business logic in the owning domain.
5. Extract truly generic utilities to `src/lib/utils` or `src/utils`.

## Cross-domain coordination patterns
- Orchestrate in page-level components or feature coordinators.
- Use callbacks/events to request actions in another domain.
- When store coordination is required, prefer `storeEvents` in `src/lib/state/storePubSub.ts` over direct imports.

## Quick example (parent orchestration)
```tsx
// app/game/[id]/page.tsx (parent coordinates domains)
export default function GamePage({ params }: { params: { id: string } }) {
  const character = useCharacterStore(state => state.getById(params.id));
  const items = useInventoryStore(state =>
    character ? state.getCharacterItems(character.id) : []
  );

  return (
    <GameLayout>
      <CharacterPanel character={character} />
      <InventoryPanel items={items} />
    </GameLayout>
  );
}
```
