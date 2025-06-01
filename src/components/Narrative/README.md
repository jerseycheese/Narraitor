# Narrative Component System

The Narrative components are responsible for generating, displaying, and managing AI-powered narrative content within game sessions. This system dynamically generates world-specific narrative content that adapts to the game world's theme, attributes, and player choices.

## Components Overview

### NarrativeController

The main controller component that handles the generation of narrative segments and stores them.

**Props:**
- `worldId` (string, required): The ID of the current world
- `sessionId` (string, required): The ID of the current game session
- `onNarrativeGenerated` (function, optional): Callback when a new narrative segment is generated
- `onChoicesGenerated` (function, optional): Callback when AI-generated player choices are available
- `triggerGeneration` (boolean, optional): Flag to control when generation should occur, defaults to `true`
- `choiceId` (string, optional): ID of the player choice that triggers a narrative response
- `generateChoices` (boolean, optional): Whether to generate player choices after narrative segments, defaults to `true`
- `className` (string, optional): Additional CSS classes

**Behavior:**
- Automatically generates an initial narrative when mounted if no existing narrative is found
- Generates new narrative segments in response to player choices
- **AI Choice Generation**: Automatically generates contextual player choices after narrative segments (when `generateChoices` is enabled)
- Prevents duplicate generations through session tracking and choice tracking
- Ensures segments are deduplicated in local state
- Persists narrative segments and generated choices to the narrativeStore
- Provides rich narrative context to AI choice generation system

### NarrativeDisplay

A component that renders a single narrative segment with appropriate styling.

**Props:**
- `segment` (NarrativeSegment | null): The narrative segment to display
- `isLoading` (boolean, optional): Whether narrative is being generated, defaults to `false`
- `error` (string, optional): Error message if narrative generation failed

**Behavior:**
- Displays different segment types with appropriate styling
- Shows loading animation when narrative is being generated
- Shows error messages if generation fails
- Handles content parsing to extract narrative from JSON responses
- Displays location metadata when available

### NarrativeHistory

A component that displays a history of narrative segments.

**Props:**
- `segments` (NarrativeSegment[]): Array of narrative segments to display
- `isLoading` (boolean, optional): Whether more segments are being loaded, defaults to `false`
- `error` (string, optional): Error message to display
- `className` (string, optional): Additional CSS classes

**Behavior:**
- Renders all narrative segments in sequence
- Shows loading indicator when loading more segments
- Shows error messages if segment loading fails
- Maintains stable height to prevent layout shifts

### NarrativeHistoryManager

A component that manages the display of existing narrative segments without generating new ones.

**Props:**
- `sessionId` (string, required): The ID of the current game session
- `className` (string, optional): Additional CSS classes

**Behavior:**
- Loads existing narrative segments from the narrativeStore
- Deduplicates narrative segments to prevent duplicates
- Handles initial scene deduplication specifically
- Ensures stable rendering of narrative content without flashing

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

## World-Specific Narrative Generation

The narrative generation system adapts to the specific world's theme and attributes:

- **Theme-Based Content**: Narrative segments reflect the world's theme (Fantasy, Western, Sci-Fi, etc.)
- **Location Adaptation**: Starting locations are automatically selected based on world theme (e.g., "Frontier Town" for Western, "Enchanted Forest" for Fantasy)
- **Tone Matching**: The narrative tone matches the world description
- **Attribute Integration**: World attributes influence the generated content
- **Context Preservation**: Each narrative segment maintains context from previous segments

## Performance Considerations

- The system uses a combination of local state and global store to maintain narrative history
- Only one narrative segment is generated at a time
- Segments are deduplicated to prevent unnecessary storage
- Components prevent unnecessary re-renders through careful state management
- JSON parsing optimization handles different response formats from the AI service

## AI Choice Generation System

The narrative system now includes integrated AI choice generation:

### Core Features
- **Contextual Choice Generation**: AI generates player choices based on recent narrative context
- **World-Aware Choices**: Generated options reflect the world's theme and setting
- **Fallback Mechanisms**: System provides default choices when AI generation fails
- **Smart Context Assembly**: Uses last 5 narrative segments to provide rich context

### Technical Integration
- **Choice Generation Pipeline**: Automatically triggered after narrative segments
- **Context Management**: Assembles world data, recent narrative, and character information
- **Error Resilience**: Graceful fallbacks ensure game continuity
- **Store Integration**: Generated choices are persisted in narrativeStore

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

1. Navigate to `/dev/narrative-system` in development mode
2. Use the controls to generate initial narrative and see how it adapts to the world theme
3. Make choices to see how the narrative continues and maintains context
4. **Test AI Choice Generation**: Enable choice generation to see contextual choices appear
5. Try creating new sessions to verify proper initialization

For programmatic testing, the system includes unit tests for the core NarrativeGenerator service and ChoiceGenerator system.