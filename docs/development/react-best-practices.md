---
title: React Best Practices (KISS)
tags: [react, best-practices, kiss, development]
created: 2025-06-26
updated: 2025-06-26
---

# React Best Practices (KISS)

Keep It Simple, Stupid: Practical React patterns that prioritize simplicity and maintainability.

## Core Principles

1. **Simple Props** - Minimal, well-typed interfaces
2. **Simple State** - Flat, predictable state management
3. **Simple JSX** - Readable, declarative markup
4. **Simple Effects** - Clear dependencies and cleanup

## Component Design

### Props Interface
```typescript
// ✅ Good: Focused, minimal props
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
  showInventory?: boolean;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}
```

### Component Structure
```typescript
// ✅ Good: Single responsibility
const CharacterCard = ({ character, onEdit }: CharacterCardProps) => {
  return (
    <div className="character-card">
      <h3>{character.name}</h3>
      <p>{character.description}</p>
      <button onClick={() => onEdit(character.id)}>Edit</button>
    </div>
  );
};

// ❌ Bad: Multiple responsibilities
const CharacterManager = ({ characters, onEdit, onDelete, onAdd }) => {
  // Handles display, editing, deletion, creation, filtering, sorting...
  // Too much responsibility in one component
};
```

## State Management

### Local State
```typescript
// ✅ Good: Flat, simple state
const [character, setCharacter] = useState<Character | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// ❌ Bad: Nested, complex state
const [state, setState] = useState({
  character: {
    data: null,
    meta: {
      loading: false,
      error: null,
      lastUpdated: null
    }
  }
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

// ❌ Bad: Unnecessary abstraction
const CharacterList = () => {
  const characterData = useCharacterData(); // Custom hook that wraps store
  const { items, meta } = useListState(characterData); // Another abstraction
  
  return <ComplexListRenderer data={items} meta={meta} />;
};
```

## Effect Management

### Simple Effects
```typescript
// ✅ Good: Clear dependencies and purpose
useEffect(() => {
  if (characterId) {
    loadCharacter(characterId);
  }
}, [characterId]);

useEffect(() => {
  return () => {
    // Cleanup when component unmounts
    cancelPendingRequests();
  };
}, []);

// ❌ Bad: Complex effect with multiple concerns
useEffect(() => {
  if (characterId) {
    loadCharacter(characterId);
  }
  
  if (worldId && !world) {
    loadWorld(worldId);
  }
  
  const interval = setInterval(() => {
    autosave();
  }, 30000);
  
  return () => {
    clearInterval(interval);
    cancelRequests();
    cleanup();
  };
}, [characterId, worldId, world, character]); // Too many dependencies
```

## JSX Patterns

### Conditional Rendering
```typescript
// ✅ Good: Clear, readable conditions
const CharacterView = ({ character }: { character: Character | null }) => {
  if (!character) {
    return <div>No character selected</div>;
  }

  return (
    <div>
      <h1>{character.name}</h1>
      {character.description && (
        <p>{character.description}</p>
      )}
    </div>
  );
};

// ❌ Bad: Complex nested ternaries
const CharacterView = ({ character }) => (
  <div>
    {character ? (
      character.name ? (
        <h1>{character.name}</h1>
      ) : (
        <h1>Unnamed Character</h1>
      )
    ) : (
      <div>No character</div>
    )}
    {character?.description ? character.description : null}
  </div>
);
```

### List Rendering
```typescript
// ✅ Good: Simple mapping with proper keys
const CharacterList = ({ characters }: { characters: Character[] }) => (
  <div>
    {characters.map(character => (
      <CharacterCard 
        key={character.id} 
        character={character}
      />
    ))}
  </div>
);

// ❌ Bad: Complex rendering logic
const CharacterList = ({ characters }) => (
  <div>
    {characters.reduce((acc, character, index) => {
      if (character.visible) {
        acc.push(
          <CharacterCard 
            key={`${character.id}-${index}`}
            character={character}
            isEven={index % 2 === 0}
          />
        );
      }
      return acc;
    }, [])}
  </div>
);
```

## Common Patterns

### Error Boundaries
```typescript
// Simple error boundary for specific components
const CharacterErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary
      fallback={<div>Error loading character data</div>}
      onError={(error) => console.error('Character error:', error)}
    >
      {children}
    </ErrorBoundary>
  );
};
```

### Loading States
```typescript
// Simple loading pattern
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
        setError(err instanceof Error ? err.message : 'Failed to load character');
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
// Simple controlled form
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

## Anti-Patterns to Avoid

### Over-Abstraction
```typescript
// ❌ Don't create unnecessary abstractions
const useAdvancedCharacterState = (config: ComplexConfig) => {
  // 50 lines of complex logic
};

// ✅ Use simple, direct approaches
const [character, setCharacter] = useState<Character | null>(null);
```

### Premature Optimization
```typescript
// ❌ Don't optimize before it's needed
const MemoizedCharacterCard = React.memo(CharacterCard, (prev, next) => {
  return deepEqual(prev.character, next.character) && 
         prev.theme === next.theme &&
         prev.size === next.size;
});

// ✅ Start simple, optimize when needed
const CharacterCard = ({ character }: CharacterCardProps) => {
  // Simple implementation
};
```

### Complex Component Composition
```typescript
// ❌ Avoid complex render prop patterns
<DataProvider>
  {({ data, loading, error }) => (
    <StateProvider>
      {({ state, dispatch }) => (
        <ComplexRenderer 
          data={data} 
          state={state} 
          dispatch={dispatch}
        />
      )}
    </StateProvider>
  )}
</DataProvider>

// ✅ Use simple component composition
<CharacterProvider characterId="123">
  <CharacterCard />
</CharacterProvider>
```

## When to Break KISS

Sometimes complexity is justified:

1. **Performance bottlenecks** - Add optimization when measurements show need
2. **Repeated patterns** - Extract after seeing 3+ similar implementations
3. **Type safety** - Complex types are better than runtime errors
4. **Accessibility** - Complex patterns for better a11y are worth it

## Testing Simple Components

```typescript
test('CharacterCard displays character name', () => {
  const character = { id: '1', name: 'Test Character' };
  
  render(<CharacterCard character={character} onEdit={jest.fn()} />);
  
  expect(screen.getByText('Test Character')).toBeInTheDocument();
});

test('CharacterCard calls onEdit when edit button clicked', async () => {
  const character = { id: '1', name: 'Test Character' };
  const onEdit = jest.fn();
  
  render(<CharacterCard character={character} onEdit={onEdit} />);
  
  await user.click(screen.getByText('Edit'));
  
  expect(onEdit).toHaveBeenCalledWith('1');
});
```

## Key Takeaways

1. **Start simple** - Add complexity only when needed
2. **Single responsibility** - Components should do one thing well
3. **Predictable state** - Flat, simple state is easier to debug
4. **Clear interfaces** - Minimal props with clear purposes
5. **Readable JSX** - Code should read like the UI it describes

Remember: The best code is code that doesn't need to exist. The second best is code that's easy to understand and change.