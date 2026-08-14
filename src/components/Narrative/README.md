# Narrative Component System

Turns your choices into new story segments while keeping things consistent with your world's tone and rules — the goal was something that feels like a game master who remembers everything.

## Components Overview

### NarrativeController

This is the orchestrator that turns your choices into new story content. So when you pick "Investigate the mysterious door," it takes that choice, combines it with everything that's happened so far, and generates the next part of your story. It also creates new choices for you automatically, which keeps the game flowing without awkward pauses.

**Props:**
- `worldId` (string, required): The ID of the current world
- `sessionId` (string, required): The ID of the current game session
- `onNarrativeGenerated` (function, optional): Callback when a new narrative segment is generated
- `onChoicesGenerated` (function, optional): Callback when AI-generated player choices are available
- `triggerGeneration` (boolean, optional): Flag to control when generation should occur, defaults to `true`
- `choiceId` (string, optional): ID of the player choice that triggers a narrative response
- `generateChoices` (boolean, optional): Whether to generate player choices after narrative segments, defaults to `true`
- `className` (string, optional): Additional CSS classes

**How it behaves:**
- Creates an opening scene automatically when you start a new session
- Takes your choices and generates the next story beat
- **Contextual choice generation**: After each story segment, it creates new options that make sense in context (when enabled)
- Prevents duplicates through careful tracking - you won't see the same story segment twice
- Saves everything to the store so your progress is never lost
- Feeds rich context to the AI so it knows what's happened and can make better choices

### NarrativeDisplay

This handles showing individual story segments with the right formatting and style: it takes a piece of generated narrative and renders it as readable prose.

**Props:**
- `segment` (NarrativeSegment | null): The story segment to show
- `isLoading` (boolean, optional): Whether we're waiting for AI generation
- `error` (string, optional): Error message if something went wrong

**What it does:**
- Formats different types of content appropriately (description, dialogue, action)
- Shows a nice loading animation while the AI is thinking
- Shows clear error messages instead of a blank screen
- Parses content that comes back as JSON and extracts the actual story text
- Displays location info when the AI includes it

### NarrativeHistory

This shows your complete story so far - all the segments in order, like reading through a conversation log or game transcript.

**Props:**
- `segments` (NarrativeSegment[]): The story segments to display
- `isLoading` (boolean, optional): Whether we're loading more content
- `error` (string, optional): Error message if loading fails
- `className` (string, optional): Additional styling

**What it does:**
- Displays all your story segments in chronological order
- Shows loading indicators without disrupting the flow
- Handles errors without breaking the reading experience
- Keeps stable layout so the page doesn't jump around as content loads

### NarrativeHistoryManager

This loads and displays your existing story without generating anything new. It's for when you want to see what's happened so far without triggering more AI content.

**Props:**
- `sessionId` (string, required): Which game session to load
- `className` (string, optional): Additional styling

**What it handles:**
- Pulls existing story segments from storage
- Removes duplicates so you don't see the same content twice
- Deals with edge cases like duplicate opening scenes
- Renders everything smoothly without flashing or layout jumps

## Usage Examples

### Basic Narrative Generation

```tsx
<NarrativeController 
  worldId="world-123"
  sessionId="session-456"
  triggerGeneration={true}
/>
```

### Responding to Player Choices with AI Choice Generation

```tsx
<NarrativeController 
  worldId="world-123"
  sessionId="session-456"
  choiceId="choice-789"
  generateChoices={true}
  onNarrativeGenerated={(segment) => {
    // Do something with the new segment
    console.log('New narrative segment:', segment);
  }}
  onChoicesGenerated={(decision) => {
    // Handle AI-generated player choices
    console.log('AI generated choices:', decision.options);
  }}
/>
```

### Display-Only Mode

```tsx
<NarrativeHistoryManager 
  sessionId="session-456" 
  className="narrative-container"
/>
```

## Error Handling

The narrative components handle several error cases:

1. **API Errors**: If the AI service fails to generate content, the error is displayed to the user with a message
2. **JSON Parsing Errors**: If the narrative content is malformed JSON, fallback parsing is attempted
3. **Duplicate Segments**: Multiple safeguards prevent duplicate segment generation and display
4. **Component Unmount During Generation**: All async operations check if the component is still mounted before updating state

## How It Adapts to Your World

The system actually pays attention to the world you've created and generates content that fits:

**Theme awareness** - If you're in a Western setting, you get saloons and sheriffs, not wizards and dragons. The AI reads your world's theme and generates appropriate content.

**Setting-appropriate starting locations** - First scenes automatically pick sensible places: frontier towns for Westerns, space stations for sci-fi, enchanted forests for fantasy. You don't start your cowboy adventure in a castle.

**Tone matching** - Serious worlds stay serious, humorous ones stay light. The AI tries to match the mood you've established in your world description.

**Integrated attributes** - World-specific skills and attributes actually matter in the stories. If your world has "Hacking" as a skill, the AI will create situations where that's relevant.

**Memory consistency** - Each new segment remembers what came before. Characters maintain their personalities, plot threads continue, and the world feels coherent.

## Performance Notes

**State management** - Uses local state for immediate UI updates and global store for persistence. This keeps the interface responsive while ensuring nothing gets lost.

**Sequential generation** - Only generates one story segment at a time to avoid overwhelming the AI or creating conflicting content.

**Deduplication** - Automatically prevents duplicate content from being stored or displayed, which keeps sessions clean.

**Optimized rendering** - Components are built to avoid unnecessary re-renders, which keeps things smooth even with long story histories.

**Flexible parsing** - Accepts different AI response formats, so slight variations in the AI's output don't break the experience.

## AI Choice Generation

The system also creates your next set of choices automatically, which keeps the game flowing smoothly:

### How It Works
**Context-aware generation** - The AI looks at what just happened and creates choices that make sense. If you just entered a tavern, you might get options like "Order a drink," "Ask about rumors," or "Look for a quiet corner."

**World-appropriate options** - Choices fit your world's theme and rules. A sci-fi world generates different options than a fantasy one, even in similar situations.

**Choice fallbacks** - If the AI choice generation fails for any reason, the system provides reasonable default options so you're never stuck.

**Rich context** - Uses the last several story segments to understand the current situation, not just the most recent one.

### Technical Details
**Automatic pipeline** - Choice generation happens automatically after each story segment, no manual trigger needed.

**Complete context** - Assembles world data, recent narrative history, and character info to give the AI the full picture.

**Resilient design** - One broken AI call doesn't stop your game; it retries or falls back instead.

**Persistent storage** - Generated choices are saved to the store so they survive page refreshes and can be referenced later.

### Usage with GameSession
The AI choice generation is primarily used through `GameSessionActiveWithNarrative`:

```tsx
<GameSessionActiveWithNarrative
  worldId="world-123"
  sessionId="session-456"
  onChoiceSelected={(choiceId) => {
    // Handle player choice selection
    // This triggers new narrative generation
  }}
/>
```

## Testing

To manually test the narrative generation system:

1. Navigate to `/dev/game-session` in development mode
2. Use the controls to generate initial narrative and see how it adapts to the world theme
3. Make choices to see how the narrative continues and maintains context
4. **Test AI Choice Generation**: Enable choice generation to see contextual choices appear
5. Try creating new sessions to verify proper initialization

For programmatic testing, the system includes unit tests for the core NarrativeGenerator service and ChoiceGenerator system.