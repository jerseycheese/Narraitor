---
title: React Best Practices
tags: [react, best-practices, development]
created: 2025-06-26
updated: 2025-06-26
---

# React Best Practices

The KISS principle applies especially well to React components. Simple, predictable components are easier to debug, test, and maintain. Focus on single responsibilities and avoid clever abstractions.

## What Works

**Simple Props** - Keep interfaces minimal and well-typed. If you need more than 5-6 props, consider breaking the component down or grouping related props into objects.

**Flat State** - Avoid deeply nested state. React's reconciliation works better with flat structures, and they're easier to debug.

**Clear JSX** - Readable, declarative markup that explains what's happening. If you need comments to explain JSX, consider extracting components.

**Focused Effects** - One concern per effect, with clear dependencies. Makes debugging much easier.

## Component Design

**Props Interfaces** - Keep them focused. Too many optional props usually means the component is doing too much:

```typescript
// Good: Clear, focused interface
interface CharacterCardProps {
  character: Character;
  onEdit: (id: string) => void;
}

// Avoid: Swiss army knife component: break this down
interface CharacterCardProps {
  character: Character;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showStats?: boolean;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}
```

**Single Responsibility** - Components should have one clear job:

```typescript
// Good: One purpose: display a character card
const CharacterCard = ({ character, onEdit }: CharacterCardProps) => (
  <div className="character-card">
    <h3>{character.name}</h3>
    <p>{character.description}</p>
    <button onClick={() => onEdit(character.id)}>Edit</button>
  </div>
);

// Avoid: Too many jobs: split this into smaller components
const CharacterManager = ({ characters, onEdit, onDelete, onAdd }) => {
  // Handles display, editing, deletion, creation, filtering, sorting...
  // This is asking for bugs
};
```

## State Management

**Keep state flat**. Nested state objects are harder to update and debug:

```typescript
// Good: Simple, predictable updates
const [character, setCharacter] = useState<Character | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Avoid: Nested state: harder to update safely
const [state, setState] = useState({
  character: { data: null, meta: { loading: false, error: null } }
});
```

**Store integration** should be straightforward. Components grab what they need and render accordingly:

```typescript
// Good: Direct, clear store usage
const CharacterList = () => {
  const { characters, loading, error } = useCharacterStore();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {characters.map(character => (
        <CharacterCard key={character.id} character={character} />
      ))}
    </div>
  );
};
```

## Effect Management

**One concern per effect**. This makes debugging so much easier when something breaks:

```typescript
// Good: Clear, focused effects
useEffect(() => {
  if (characterId) {
    loadCharacter(characterId);
  }
}, [characterId]);

useEffect(() => {
  return () => cancelPendingRequests();
}, []);

// Avoid: Kitchen sink effect: nightmare to debug
useEffect(() => {
  if (characterId) loadCharacter(characterId);
  if (worldId && !world) loadWorld(worldId);
  const interval = setInterval(autosave, 30000);
  return () => { clearInterval(interval); cleanup(); };
}, [characterId, worldId, world, character]);  // Too many dependencies
```

When an effect has more than 2-3 dependencies, it's usually doing too much.

## JSX Patterns

### Conditional Rendering
```typescript
// Good: Good: Early returns for clarity
const CharacterView = ({ character }: { character: Character | null }) => {
  if (!character) {
    return <div>No character selected</div>;
  }

  return (
    <div>
      <h1>{character.name}</h1>
      {character.description && <p>{character.description}</p>}
    </div>
  );
};
```

### List Rendering
```typescript
// Good: Good: Simple mapping
const CharacterList = ({ characters }: { characters: Character[] }) => (
  <div>
    {characters.map(character => (
      <CharacterCard key={character.id} character={character} />
    ))}
  </div>
);
```

## Common Patterns

### Loading Pattern
```typescript
const useCharacterData = (characterId: string) => {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCharacter(characterId);
        setCharacter(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [characterId]);

  return { character, loading, error };
};
```

### Form Handling
```typescript
const CharacterForm = ({ character, onSave }: CharacterFormProps) => {
  const [name, setName] = useState(character?.name || '');
  const [description, setDescription] = useState(character?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Character name"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />
      <button type="submit">Save</button>
    </form>
  );
};
```

## Anti-Patterns

### Over-Abstraction
```typescript
// Avoid: Unnecessary complexity
const useAdvancedCharacterState = (config: ComplexConfig) => {
  // 50 lines of complex logic
};

// Good: Direct approach
const [character, setCharacter] = useState<Character | null>(null);
```

### Premature Optimization
```typescript
// Avoid: Don't optimize until needed
const MemoizedCard = React.memo(CharacterCard, deepEqualComparison);

// Good: Start simple
const CharacterCard = ({ character }: CharacterCardProps) => {
  // Simple implementation
};
```

## When Complexity is Justified

1. **Performance bottlenecks** - Measured performance issues
2. **Repeated patterns** - 3+ similar implementations
3. **Type safety** - Complex types prevent runtime errors
4. **Accessibility** - Complex patterns for better a11y

## Testing

```typescript
test('displays character name', () => {
  const character = { id: '1', name: 'Test Character' };
  render(<CharacterCard character={character} onEdit={jest.fn()} />);
  expect(screen.getByText('Test Character')).toBeInTheDocument();
});

test('calls onEdit when clicked', async () => {
  const character = { id: '1', name: 'Test' };
  const onEdit = jest.fn();
  render(<CharacterCard character={character} onEdit={onEdit} />);
  await user.click(screen.getByText('Edit'));
  expect(onEdit).toHaveBeenCalledWith('1');
});
```
