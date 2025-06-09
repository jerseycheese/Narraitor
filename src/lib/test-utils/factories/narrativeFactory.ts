/**
 * Narrative-specific test data factory
 * Provides specialized factories for narrative and game session entities
 */

import type { 
  NarrativeSegment,
  GameSession,
  Decision,
  JournalEntry,
  JournalEntryType,
  SessionState,
  NarrativeContext
} from '@/types';
import { generateUniqueId } from '@/lib/utils';

const DEFAULT_TIMESTAMP = '2023-01-01T00:00:00.000Z';

/**
 * Builder pattern factory for NarrativeSegment objects
 */
export class NarrativeSegmentFactory {
  private segment: Partial<NarrativeSegment> = {};

  static create(): NarrativeSegmentFactory {
    return new NarrativeSegmentFactory();
  }

  id(id: string): this {
    this.segment.id = id;
    return this;
  }

  worldId(worldId: string): this {
    this.segment.worldId = worldId;
    return this;
  }

  sessionId(sessionId: string): this {
    this.segment.sessionId = sessionId;
    return this;
  }

  content(content: string): this {
    this.segment.content = content;
    return this;
  }

  type(type: 'scene' | 'dialogue' | 'action' | 'transition' | 'ending'): this {
    this.segment.type = type;
    return this;
  }

  withCharacters(characterIds: string[]): this {
    this.segment.characterIds = characterIds;
    return this;
  }

  withMetadata(metadata: Partial<typeof this.segment.metadata>): this {
    this.segment.metadata = {
      location: 'Test Location',
      mood: 'neutral',
      tags: [],
      ...metadata
    };
    return this;
  }

  scene(): this {
    return this
      .type('scene')
      .content('You find yourself in a grand hall with towering columns and flickering torches.');
  }

  dialogue(): this {
    return this
      .type('dialogue')
      .content('"Welcome, traveler," says the hooded figure. "I have been expecting you."');
  }

  action(): this {
    return this
      .type('action')
      .content('You draw your sword and advance cautiously toward the mysterious door.');
  }

  description(): this {
    return this
      .type('scene')
      .content('The air is thick with an otherworldly energy, and strange symbols glow faintly on the walls.');
  }

  dramatic(): this {
    return this.withMetadata({
      mood: 'tense',
      tags: ['dramatic', 'important']
    });
  }

  peaceful(): this {
    return this.withMetadata({
      mood: 'relaxed',
      tags: ['peaceful', 'safe']
    });
  }

  mysterious(): this {
    return this.withMetadata({
      mood: 'mysterious',
      tags: ['mystery', 'investigation']
    });
  }

  build(): NarrativeSegment {
    const defaults: NarrativeSegment = {
      id: generateUniqueId('seg'),
      worldId: 'world-test-1',
      sessionId: 'session-test-1',
      content: 'Test narrative content',
      type: 'scene',
      characterIds: [],
      metadata: {
        location: 'Test Location',
        mood: 'neutral',
        tags: [],
      },
      timestamp: new Date(DEFAULT_TIMESTAMP),
      createdAt: DEFAULT_TIMESTAMP,
      updatedAt: DEFAULT_TIMESTAMP,
    };

    return { ...defaults, ...this.segment };
  }
}

/**
 * Builder pattern factory for GameSession objects
 */
export class GameSessionFactory {
  private session: Partial<GameSession> = {};

  static create(): GameSessionFactory {
    return new GameSessionFactory();
  }

  id(id: string): this {
    this.session.id = id;
    return this;
  }

  worldId(worldId: string): this {
    this.session.worldId = worldId;
    return this;
  }

  characterId(characterId: string): this {
    this.session.characterId = characterId;
    return this;
  }

  withState(state: Partial<SessionState>): this {
    this.session.state = {
      status: 'active',
      lastActivity: DEFAULT_TIMESTAMP,
      ...state
    };
    return this;
  }

  withNarrativeHistory(segments: string[]): this {
    this.session.narrativeHistory = segments;
    return this;
  }

  withContext(context: Partial<NarrativeContext>): this {
    this.session.currentContext = {
      recentSegments: [],
      activeCharacters: ['char-test-1'],
      currentLocation: 'Test Location',
      activeQuests: [],
      mood: 'neutral',
      ...context
    };
    return this;
  }

  active(): this {
    return this.withState({
      status: 'active',
      lastActivity: new Date().toISOString()
    });
  }

  paused(): this {
    return this.withState({
      status: 'paused',
      lastActivity: DEFAULT_TIMESTAMP
    });
  }

  completed(): this {
    return this.withState({
      status: 'completed',
      lastActivity: DEFAULT_TIMESTAMP
    });
  }

  newSession(): this {
    return this
      .active()
      .withNarrativeHistory([])
      .withContext({
        recentSegments: [],
        activeCharacters: [this.session.characterId || 'char-test-1'],
        currentLocation: 'Starting Location',
        activeQuests: [],
        mood: 'neutral'
      });
  }

  inProgress(): this {
    return this
      .active()
      .withNarrativeHistory(['seg-1', 'seg-2', 'seg-3'])
      .withContext({
        recentSegments: ['seg-2', 'seg-3'],
        activeCharacters: [this.session.characterId || 'char-test-1'],
        currentLocation: 'Adventure Location',
        activeQuests: ['quest-1'],
        mood: 'adventurous'
      });
  }

  longSession(): this {
    const manySegments = Array.from({ length: 20 }, (_, i) => `seg-${i + 1}`);
    return this
      .active()
      .withNarrativeHistory(manySegments)
      .withContext({
        recentSegments: manySegments.slice(-5),
        activeCharacters: [this.session.characterId || 'char-test-1'],
        currentLocation: 'Deep in Adventure',
        activeQuests: ['quest-1', 'quest-2', 'quest-3'],
        mood: 'epic'
      });
  }

  build(): GameSession {
    const defaults: GameSession = {
      id: generateUniqueId('session'),
      worldId: 'world-test-1',
      characterId: 'char-test-1',
      state: {
        status: 'active',
        lastActivity: DEFAULT_TIMESTAMP,
      },
      narrativeHistory: [],
      currentContext: {
        recentSegments: [],
        activeCharacters: ['char-test-1'],
        currentLocation: 'Test Location',
        activeQuests: [],
        mood: 'neutral',
      },
      createdAt: DEFAULT_TIMESTAMP,
      updatedAt: DEFAULT_TIMESTAMP,
    };

    return { ...defaults, ...this.session };
  }
}

/**
 * Builder pattern factory for Decision objects
 */
export class DecisionFactory {
  private decision: Partial<Decision> = {};

  static create(): DecisionFactory {
    return new DecisionFactory();
  }

  id(id: string): this {
    this.decision.id = id;
    return this;
  }

  prompt(prompt: string): this {
    this.decision.prompt = prompt;
    return this;
  }

  withOptions(options: Array<{ text: string; hint?: string }>): this {
    this.decision.options = options.map((option, index) => ({
      id: `opt-${index + 1}`,
      text: option.text,
      hint: option.hint
    }));
    return this;
  }

  selectedOption(optionId: string): this {
    this.decision.selectedOptionId = optionId;
    return this;
  }

  simpleChoice(): this {
    return this
      .prompt('What do you want to do?')
      .withOptions([
        { text: 'Go north', hint: 'Toward the mountains' },
        { text: 'Go south', hint: 'Toward the forest' },
        { text: 'Stay here', hint: 'Rest and observe' }
      ]);
  }

  combatChoice(): this {
    return this
      .prompt('The orc raises its weapon! What is your response?')
      .withOptions([
        { text: 'Attack with sword', hint: 'Direct physical assault' },
        { text: 'Cast a spell', hint: 'Use magic if available' },
        { text: 'Try to negotiate', hint: 'Attempt to avoid combat' },
        { text: 'Flee', hint: 'Run away from danger' }
      ]);
  }

  socialChoice(): this {
    return this
      .prompt('The merchant seems suspicious of your intentions. How do you respond?')
      .withOptions([
        { text: 'Be honest about your quest', hint: 'Tell the truth' },
        { text: 'Offer to pay extra', hint: 'Use money to gain trust' },
        { text: 'Intimidate them', hint: 'Use fear to get what you want' },
        { text: 'Walk away', hint: 'Leave without buying anything' }
      ]);
  }

  build(): Decision {
    const defaults: Decision = {
      id: generateUniqueId('decision'),
      prompt: 'What do you want to do?',
      options: [
        { id: 'opt-1', text: 'Option 1', hint: 'Hint for option 1' },
        { id: 'opt-2', text: 'Option 2' },
        { id: 'opt-3', text: 'Option 3' },
      ],
      selectedOptionId: undefined,
    };

    return { ...defaults, ...this.decision };
  }
}

/**
 * Builder pattern factory for JournalEntry objects
 */
export class JournalEntryFactory {
  private entry: Partial<JournalEntry> = {};

  static create(): JournalEntryFactory {
    return new JournalEntryFactory();
  }

  id(id: string): this {
    this.entry.id = id;
    return this;
  }

  sessionId(sessionId: string): this {
    this.entry.sessionId = sessionId;
    return this;
  }

  worldId(worldId: string): this {
    this.entry.worldId = worldId;
    return this;
  }

  characterId(characterId: string): this {
    this.entry.characterId = characterId;
    return this;
  }

  type(type: JournalEntryType): this {
    this.entry.type = type;
    return this;
  }

  title(title: string): this {
    this.entry.title = title;
    return this;
  }

  content(content: string): this {
    this.entry.content = content;
    return this;
  }

  significance(significance: 'minor' | 'major'): this {
    this.entry.significance = significance;
    return this;
  }

  read(): this {
    this.entry.isRead = true;
    return this;
  }

  unread(): this {
    this.entry.isRead = false;
    return this;
  }

  withMetadata(metadata: Partial<typeof this.entry.metadata>): this {
    this.entry.metadata = {
      tags: [],
      automaticEntry: false,
      ...metadata
    };
    return this;
  }

  characterEvent(): this {
    return this
      .type('character_event')
      .title('Character Event')
      .content('Something significant happened to the character')
      .significance('major');
  }

  questUpdate(): this {
    return this
      .type('achievement')
      .title('Quest Progress')
      .content('Made progress on an important quest')
      .significance('major');
  }

  worldEvent(): this {
    return this
      .type('world_event')
      .title('World Event')
      .content('Something important happened in the world')
      .significance('major');
  }

  discovery(): this {
    return this
      .type('discovery')
      .title('Important Discovery')
      .content('Discovered something significant')
      .significance('major');
  }

  note(): this {
    return this
      .type('discovery')
      .title('Personal Note')
      .content('A note about recent events')
      .significance('minor');
  }

  automatic(): this {
    return this.withMetadata({
      automaticEntry: true,
      tags: ['auto-generated']
    });
  }

  manual(): this {
    return this.withMetadata({
      automaticEntry: false,
      tags: ['player-created']
    });
  }

  build(): JournalEntry {
    const defaults: JournalEntry = {
      id: generateUniqueId('journal'),
      sessionId: 'session-test-1',
      worldId: 'world-test-1',
      characterId: 'char-test-1',
      type: 'character_event',
      title: 'Test Journal Entry',
      content: 'Something happened in the test',
      significance: 'minor',
      isRead: false,
      relatedEntities: [],
      metadata: {
        tags: [],
        automaticEntry: false,
      },
      createdAt: DEFAULT_TIMESTAMP,
      updatedAt: DEFAULT_TIMESTAMP,
    };

    return { ...defaults, ...this.entry };
  }
}

/**
 * Collection factory for creating narrative scenarios
 */
export class NarrativeCollectionFactory {
  static createNarrativeSequence(sessionId: string, length: number = 5): NarrativeSegment[] {
    const segments: NarrativeSegment[] = [];
    const types = ['scene', 'dialogue', 'action', 'transition'] as const;

    for (let i = 0; i < length; i++) {
      const type = types[i % types.length];
      const segment = NarrativeSegmentFactory.create()
        .id(`seg-${i + 1}`)
        .sessionId(sessionId)
        .type(type)
        .content(`Narrative segment ${i + 1}: ${type} content`)
        .build();
      
      segments.push(segment);
    }

    return segments;
  }

  static createSessionHistory(sessionId: string, worldId: string, characterId: string): {
    session: GameSession;
    segments: NarrativeSegment[];
    entries: JournalEntry[];
    decisions: Decision[];
  } {
    const session = GameSessionFactory.create()
      .id(sessionId)
      .worldId(worldId)
      .characterId(characterId)
      .inProgress()
      .build();

    const segments = this.createNarrativeSequence(sessionId, 10);

    const entries = [
      JournalEntryFactory.create()
        .sessionId(sessionId)
        .characterEvent()
        .title('Adventure Begins')
        .content('Started a new adventure in the mysterious realm')
        .build(),
      
      JournalEntryFactory.create()
        .sessionId(sessionId)
        .discovery()
        .title('Ancient Artifact Found')
        .content('Discovered a glowing crystal with unknown powers')
        .build(),
      
      JournalEntryFactory.create()
        .sessionId(sessionId)
        .questUpdate()
        .title('Quest Progress')
        .content('Made significant progress toward the main objective')
        .read()
        .build()
    ];

    const decisions = [
      DecisionFactory.create()
        .id('decision-1')
        .simpleChoice()
        .selectedOption('opt-1')
        .build(),
      
      DecisionFactory.create()
        .id('decision-2')
        .combatChoice()
        .selectedOption('opt-2')
        .build(),
      
      DecisionFactory.create()
        .id('decision-3')
        .socialChoice()
        .build() // No selection yet
    ];

    return { session, segments, entries, decisions };
  }

  static createJournalEntries(sessionId: string, count: number): JournalEntry[] {
    const entries: JournalEntry[] = [];
    const entryTypes = [
      () => JournalEntryFactory.create().characterEvent(),
      () => JournalEntryFactory.create().questUpdate(),
      () => JournalEntryFactory.create().worldEvent(),
      () => JournalEntryFactory.create().discovery(),
      () => JournalEntryFactory.create().note()
    ];

    for (let i = 0; i < count; i++) {
      const factory = entryTypes[i % entryTypes.length];
      const entry = factory()
        .id(`journal-${i + 1}`)
        .sessionId(sessionId)
        .title(`Entry ${i + 1}`)
        .content(`Content for journal entry ${i + 1}`)
        .build();
      
      entries.push(entry);
    }

    return entries;
  }

  static createDecisionSequence(count: number): Decision[] {
    const decisions: Decision[] = [];
    const decisionTypes = [
      () => DecisionFactory.create().simpleChoice(),
      () => DecisionFactory.create().combatChoice(),
      () => DecisionFactory.create().socialChoice()
    ];

    for (let i = 0; i < count; i++) {
      const factory = decisionTypes[i % decisionTypes.length];
      const decision = factory()
        .id(`decision-${i + 1}`)
        .build();
      
      decisions.push(decision);
    }

    return decisions;
  }
}