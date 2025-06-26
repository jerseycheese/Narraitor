---
title: React Best Practices
tags: [react, best-practices, development]
created: 2025-06-26
updated: 2025-06-26
---

# React Best Practices

KISS principle: Keep components simple, predictable, and focused on single responsibilities.

## Core Principles

1. **Simple Props** - Minimal, well-typed interfaces
2. **Flat State** - Predictable state management
3. **Clear JSX** - Readable, declarative markup
4. **Focused Effects** - Single concerns with clear dependencies

## Component Design

### Props Interface
```typescript
// ✅ Good: Focused interface
interface CharacterCardProps {
  character: Character;
  onEdit: (id: string) => void;
}

// ❌ Bad: Too many optional props
interface CharacterCardProps {
  character: Character;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showStats?: boolean;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}
```

### Single Responsibility
```typescript
// ✅ Good: One clear purpose
const CharacterCard = ({ character, onEdit }: CharacterCardProps) => (
  <div className="character-card">
    <h3>{character.name}</h3>
    <p>{character.description}</p>
    <button onClick={() => onEdit(character.id)}>Edit</button>
  </div>
);

// ❌ Bad: Multiple responsibilities
const CharacterManager = ({ characters, onEdit, onDelete, onAdd }) => {
  // Handles display, editing, deletion, creation, filtering, sorting...
};
```

## State Management

### Local State
```typescript
// ✅ Good: Flat, simple state
const [character, setCharacter] = useState<Character | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// ❌ Bad: Nested state
const [state, setState] = useState({
  character: { data: null, meta: { loading: false, error: null } }
});
```

### Store Integration
```typescript
// ✅ Good: Direct store usage
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

```typescript
// ✅ Good: Single concern per effect
useEffect(() => {
  if (characterId) {
    loadCharacter(characterId);
  }
}, [characterId]);

useEffect(() => {
  return () => cancelPendingRequests();
}, []);

// ❌ Bad: Multiple concerns in one effect
useEffect(() => {
  if (characterId) loadCharacter(characterId);
  if (worldId && !world) loadWorld(worldId);
  const interval = setInterval(autosave, 30000);
  return () => { clearInterval(interval); cleanup(); };
}, [characterId, worldId, world, character]);
```

## JSX Patterns

### Conditional Rendering
```typescript
// ✅ Good: Early returns for clarity
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
// ✅ Good: Simple mapping
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
// ❌ Unnecessary complexity
const useAdvancedCharacterState = (config: ComplexConfig) => {
  // 50 lines of complex logic
};

// ✅ Direct approach
const [character, setCharacter] = useState<Character | null>(null);
```

### Premature Optimization
```typescript
// ❌ Don't optimize until needed
const MemoizedCard = React.memo(CharacterCard, deepEqualComparison);

// ✅ Start simple
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

## Key Takeaways

- **Start simple** - Add complexity only when needed
- **Single responsibility** - One clear purpose per component
- **Predictable state** - Flat state is easier to debug
- **Clear interfaces** - Minimal props with obvious purposes
- **Early optimization is evil** - Measure before optimizing

The best code is code that doesn't need to exist. The second best is code that's easy to understand and change.