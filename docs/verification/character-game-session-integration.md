# Character-Game Session Integration Verification Guide

## Quick Verification Checklist

### 1. Browser Console Commands

```javascript
// Check current character in state
window.__ZUSTAND_DEVTOOLS__.get('characterStore').getState()

// Check current session state
window.__ZUSTAND_DEVTOOLS__.get('sessionStore').getState()

// Check narrative store for character references
window.__ZUSTAND_DEVTOOLS__.get('narrativeStore').getState()

// Verify character ID in current session
const session = window.__ZUSTAND_DEVTOOLS__.get('sessionStore').getState().currentSession
console.log('Character ID in session:', session?.characterId)

// Check if character data is loaded
const character = window.__ZUSTAND_DEVTOOLS__.get('characterStore').getState().characters[session?.characterId]
console.log('Character data:', character)
```

### 2. Network Tab Inspection

Look for these API calls in the Network tab:

1. **Narrative Generation Requests**
   - URL: `/api/narrative/generate` or similar
   - Method: POST
   - Request payload should include:
     ```json
     {
       "characterId": "char_xxx",
       "worldId": "world_xxx",
       "character": {
         "name": "Character Name",
         "attributes": {...},
         "skills": {...}
       }
     }
     ```

2. **Choice Generation Requests**
   - Check that character context is included
   - Look for character attributes/skills in the request

### 3. Visual UI Indicators

#### Game Session Page (`/world/[id]/play`)
- [ ] Character name displayed in session header
- [ ] Character portrait/avatar shown (if implemented)
- [ ] Character stats visible in sidebar or panel
- [ ] Character-specific choices appear in narrative

#### Character Selection
- [ ] Character selector shows available characters
- [ ] Selected character is highlighted
- [ ] "Start Session" button enabled only with character selected

### 4. Character ID Flow Verification

1. **At Session Start**
   ```javascript
   // Check URL parameters
   const urlParams = new URLSearchParams(window.location.search)
   console.log('Character ID from URL:', urlParams.get('characterId'))
   ```

2. **In Narrative Generation**
   ```javascript
   // Monitor narrative generation calls
   const narrativeStore = window.__ZUSTAND_DEVTOOLS__.get('narrativeStore').getState()
   console.log('Last prompt context:', narrativeStore.lastPromptContext)
   // Should include character data
   ```

3. **In Choice Generation**
   ```javascript
   // Check if choices consider character skills
   const choices = document.querySelectorAll('[data-testid="player-choice"]')
   choices.forEach(choice => {
     console.log('Choice text:', choice.textContent)
     // Look for character-specific options
   })
   ```

## Common Issues & Solutions

### Character Not Appearing in Session
1. Check if character exists in store
2. Verify session has characterId set
3. Check for loading states blocking render

### Character Data Not in Narrative
1. Inspect network requests for missing character data
2. Check promptContext building in narrativeGenerator
3. Verify character is passed to AI service

### Quick Debug Script
```javascript
// Paste this in console for full diagnostic
(() => {
  const stores = ['characterStore', 'sessionStore', 'narrativeStore'];
  const diagnostics = {};
  
  stores.forEach(storeName => {
    const store = window.__ZUSTAND_DEVTOOLS__.get(storeName);
    if (store) {
      const state = store.getState();
      diagnostics[storeName] = {
        hasData: Object.keys(state).length > 0,
        currentIds: {
          character: state.currentCharacterId,
          session: state.currentSessionId,
          world: state.currentWorldId
        }
      };
    }
  });
  
  console.table(diagnostics);
  
  // Check integration
  const session = window.__ZUSTAND_DEVTOOLS__.get('sessionStore').getState().currentSession;
  const character = session?.characterId ? 
    window.__ZUSTAND_DEVTOOLS__.get('characterStore').getState().characters[session.characterId] : 
    null;
    
  console.log('Integration Status:', {
    sessionHasCharacter: !!session?.characterId,
    characterLoaded: !!character,
    characterName: character?.name || 'Not loaded'
  });
})();
```

## Expected State Examples

### Properly Integrated State
```javascript
{
  sessionStore: {
    currentSession: {
      id: "session_123",
      worldId: "world_456",
      characterId: "char_789",  // ✓ Character ID present
      status: "active"
    }
  },
  characterStore: {
    characters: {
      "char_789": {  // ✓ Character data loaded
        name: "Thorin",
        attributes: {...},
        skills: {...}
      }
    },
    currentCharacterId: "char_789"  // ✓ Current character set
  }
}
```

### Broken Integration State
```javascript
{
  sessionStore: {
    currentSession: {
      id: "session_123",
      worldId: "world_456",
      characterId: null,  // ✗ No character ID
      status: "active"
    }
  }
}
```