# Decision Relevance Scoring System

## The Problem This Solves
Here's the challenge: your player has made 50 decisions during their adventure, but right now they're negotiating with the tavern keeper about room prices. The AI doesn't need to remember that time they chose oatmeal for breakfast three sessions ago - but it absolutely should remember when they helped that merchant earlier today, or when they had a heated argument with this same tavern keeper last week.

The AI needs to be smart about which past decisions actually matter to the current moment. This system does the heavy lifting by scoring every past decision based on how relevant it is to what's happening right now. The result? The AI focuses on the decisions that matter instead of getting overwhelmed by irrelevant history.

## How It Works

### The Core Calculator
The `DecisionRelevanceCalculator` is where the magic happens. You pass it a past decision and the current narrative context, and it spits out a relevance score between 0 and 1:

```typescript
import { DecisionRelevanceCalculator } from '@/lib/ai/decisionRelevanceCalculator';

const calculator = new DecisionRelevanceCalculator();
const score = calculator.calculateRelevanceScore(decision, currentContext);
```

Pretty straightforward to use, but there's actually quite a bit going on under the hood.

### The Five Scoring Factors

The algorithm looks at five different things when deciding how relevant a past decision is:

**Recency (25% of the final score)**
This one's pretty obvious - more recent decisions matter more. But it's not linear - there's an exponential decay, so a decision from an hour ago is way more relevant than one from yesterday. Decisions that happened in the last hour actually get a 1.5x boost because they're probably still directly affecting the current situation.

**Context Matching (30% of the final score)**
This is the biggest factor, which makes sense. It looks at whether the decision happened in the same location, involved the same characters, or was in a similar type of situation. If you made a decision about talking to the tavern keeper while in the tavern, that's super relevant if you're currently... also in that tavern talking to someone.

**Decision Impact (20% of the final score)**
Some decisions just matter more than others. Choosing to attack someone is probably more relevant to the current story than choosing what to eat for breakfast. The system classifies choices as aggressive (high impact), diplomatic (medium-high), neutral (low impact), etc.

**Tag Matching (15% of the final score)**
This looks at thematic connections. If your current situation involves mystery and investigation tags, and you made a past decision that also involved those themes, that bumps up the relevance even if the specific details are different.

**Character Relationships (10% of the final score)**
If the same characters are involved in both the past decision and current situation, that adds some relevance. It's the smallest factor because the context matching already covers a lot of this, but it helps with edge cases.

### Tweaking the Algorithm

If the default weights don't work for your specific game style, you can adjust them:

```typescript
const customConfig: RelevanceScoringConfig = {
  weights: {
    recency: 0.3,     // Make recent decisions even more important
    context: 0.4,     // Location/character matching gets more weight
    impact: 0.2,      // Decision impact stays the same
    tagMatch: 0.05,   // Theme matching becomes less important
    character: 0.05   // Character relationships become less important
  },
  recencyDecayRate: 0.1,        // How quickly old decisions become irrelevant
  maxDaysRelevant: 30,          // Ignore anything older than 30 days
  minRelevanceScore: 0.1        // Don't bother with decisions scored below 0.1
};

const calculator = new DecisionRelevanceCalculator(customConfig);
```

So if you're running a game where location really matters (like a murder mystery in a mansion), you might bump up the context weight. If you're doing a character-driven political intrigue, maybe character relationships should get more weight.

## Actually Using This Thing

The `PlayerDecisionTracker` already existed, but now it's got some new methods that use this relevance scoring:

### Getting the Most Relevant Decisions

```typescript
import { playerDecisionTracker } from '@/lib/ai/playerDecisionTracker';

// Get the top 10 most relevant decisions for the current situation
const relevantDecisions = playerDecisionTracker.getRelevantDecisions(
  currentContext, 
  10
);
```

This is probably what you'll use most often - just ask for the most relevant decisions and the system handles all the scoring behind the scenes.

### When You Need to Debug

If the relevance scoring isn't working the way you expect, you can get the full breakdown:

```typescript
// Get decisions with all the scoring details
const decisionsWithScores = playerDecisionTracker.getDecisionsWithRelevanceScores(
  currentContext
);

decisionsWithScores.forEach(({ decision, relevanceScore }) => {
  console.log(`Decision ${decision.id}:`);
  console.log(`  Overall: ${relevanceScore.overallScore}`);
  console.log(`  Recency: ${relevanceScore.recencyScore}`);
  console.log(`  Context: ${relevanceScore.contextScore}`);
  console.log(`  Impact: ${relevanceScore.impactScore}`);
});
```

This is really helpful when you're trying to figure out why a particular decision is ranking higher or lower than you'd expect.

## The Type Definitions

If you're working with this stuff directly, here's what the score objects look like:

```typescript
interface DecisionRelevanceScore {
  decisionId: EntityID;
  overallScore: number;        // The final score (0.0 to 1.0)
  recencyScore: number;        // How the time factor contributed
  contextScore: number;        // How the context matching contributed
  impactScore: number;         // How the decision impact contributed
  tagMatchScore: number;       // How the tag matching contributed
  characterScore: number;      // How the character overlap contributed
  calculatedAt: string;        // When this score was calculated
  metadata?: {
    daysSinceDecision: number; // How long ago this decision happened
    matchedTags: string[];     // Which tags actually matched
    contextSimilarity: number; // Raw context similarity before weighting
    impactCategory: string;    // What type of decision this was
  };
}
```

The metadata is optional but super useful for debugging - you can see exactly which tags matched, how similar the contexts were, etc.

And here's what you need to provide as the current context:

```typescript
interface CurrentNarrativeContext {
  location?: string;           // Where the current action is happening
  charactersPresent: string[]; // Who's involved right now
  situation?: string;          // What's currently going on
  recentEvents: string[];      // What just happened
  activeTags: string[];        // Current themes/categories
  worldId: EntityID;          // Which world we're in
  sessionId: EntityID;        // Which session this is
  timestamp: string;          // When this context applies
}
```

Most of these are optional except for the IDs and timestamp, but the more context you provide, the better the relevance scoring will be.

## Performance Notes

The performance is actually pretty good - it's O(n) complexity where n is the number of decisions, and in practice it scores 100+ decisions in under 100ms. That's fast enough to use in real-time AI context building without the player noticing any lag.

The algorithm is memory efficient too, so you don't have to worry about it eating up resources if you have a lot of decision history.

## Some Usage Examples

### Basic Scoring
```typescript
import { getTimestamp } from '@/lib/utils';

const context: CurrentNarrativeContext = {
  location: 'Town Square',
  charactersPresent: ['Guard Captain'],
  situation: 'Investigation',
  recentEvents: ['Crime reported'],
  activeTags: ['mystery', 'social'],
  worldId: 'world-1',
  sessionId: 'session-1',
  timestamp: getTimestamp()
};

const score = calculator.calculateRelevanceScore(decision, context);
console.log(`Relevance: ${(score.overallScore * 100).toFixed(1)}%`);
```

### Analyzing Multiple Decisions at Once
```typescript
const analysis = calculator.analyzeDecisionRelevance(allDecisions, context);
console.log(`Analyzed ${analysis.totalDecisions} decisions`);
console.log(`${analysis.relevantDecisions} above threshold`);
console.log(`Average score: ${(analysis.averageScore * 100).toFixed(1)}%`);
```

### Integrating with AI Context Building
This is probably the most common use case - getting the most relevant decisions to include in your AI prompts:

```typescript
// Get the top 5 most relevant decisions for the current situation
const relevantDecisions = calculator.getMostRelevantDecisions(
  playerDecisions,
  currentContext,
  5
);

// Use them when building the AI prompt
const contextPrompt = buildAIPrompt({
  currentSituation: context.situation,
  relevantHistory: relevantDecisions.map(d => d.choiceText),
  // ... other context stuff
});
```

This way the AI focuses on the decisions that actually matter instead of trying to remember every single thing the player ever did.

## Formatting Decisions for AI Context

Once you've got the most relevant decisions, you need to actually format them for the AI to read. The trick is doing this efficiently - you want to stay within token limits without losing important context. That's where `DecisionFormatter` comes in.

### Staying Within Token Budgets

The formatter keeps an eye on token usage while making sure the important stuff doesn't get cut:

```typescript
import { DecisionFormatter } from '@/lib/ai/decisionFormatter';

const formatter = new DecisionFormatter();

// Get decisions with scores
const decisionsWithScores = playerDecisionTracker.getRelevantDecisionsWithScores(
  currentContext,
  15  // Get top 15 decisions
);

// Format with 1000 token budget
const decisions = decisionsWithScores.map(item => item.decision);
const scores = decisionsWithScores.map(item => item.relevanceScore);
const formattedContext = formatter.formatDecisions(decisions, scores, 1000);
```

### How Much Detail to Include

The formatter adjusts how much detail it includes based on each decision's relevance score:

**High Relevance (≥0.7)** - Full detail:
```
- At Dragon Lair (Tense negotiation) with Ancient Dragon, Wise Sage, you negotiate peacefully (diplomatic)
```

**Medium Relevance (0.4-0.69)** - Compact format:
```
- At Market, you help the merchant (helpful)
```

**Low Relevance (<0.4)** - Minimal format:
```
- go left (neutral)
```

So critical decisions get the detail they deserve, while less important ones stay brief to save tokens.

### Some Decisions Always Matter

Certain decision types get prioritized even if their relevance scores aren't super high:

- `aggressive` - Combat and confrontation choices
- `diplomatic` - Major social decisions
- `chaotic` - Disruptive or unpredictable actions

These get included first when the formatter's building the context, which means they won't get cut even if the token budget is tight.

### How This Works in Practice

The `NarrativeGenerator` handles all of this automatically when it's building AI prompts:

```typescript
// This happens internally in narrativeGenerator.ts
const decisionsWithScores = playerDecisionTracker.getRelevantDecisionsWithScores(
  currentContext,
  15,
  { worldId, sessionId }
);

const decisions = decisionsWithScores.map(item => item.decision);
const scores = decisionsWithScores.map(item => item.relevanceScore);
const decisionHistory = this.decisionFormatter.formatDecisions(decisions, scores, 1000);
```

The formatted decisions show up in the AI prompt like this:

```
RECENT PLAYER DECISIONS:
- At Dragon Lair (Tense negotiation) with Ancient Dragon, you negotiate peacefully (diplomatic)
- At Market, you help the merchant (helpful)
- go left (neutral)
```

## Why This Actually Helps

### Better AI Responses
The AI gets to focus on the decisions that actually matter to the current situation instead of getting overwhelmed by irrelevant history. That means more consistent storytelling and better narrative flow.

### Easier Debugging
When the AI is doing something weird, you can actually see which past decisions it's paying attention to and whether that makes sense. The score breakdowns make it easy to figure out if the relevance algorithm needs tweaking.

### Performance That Doesn't Suck
The whole thing is designed to be fast enough for real-time use. You can score hundreds of decisions without the player noticing any lag, which means you can be more aggressive about including relevant context.

## Testing

This thing has pretty comprehensive testing - 39 tests across 3 different test suites that cover all the acceptance criteria, performance benchmarks, edge cases, and configuration options. The tests actually validate that the scoring makes sense, not just that the code runs without errors.

## Future Ideas

There's some stuff that could make this even better down the road:

**Machine Learning Integration** - Eventually you could train models on player behavior to learn better relevance patterns specific to different types of games or players.

**Semantic Analysis** - Right now the context matching is pretty basic string comparison. Could enhance that with actual semantic understanding of what the situations mean.

**Adaptive Weights** - The algorithm could learn to adjust the weights based on what actually works well for a particular game or player.

**Visual Debugging Tools** - A UI for seeing relevance scores and understanding why certain decisions are ranking high or low would be pretty useful for game masters.

**Smart Caching** - For decisions that get scored frequently, some intelligent caching could make things even faster.

## Related Stuff

If you're working with this system, you'll probably also want to look at:
- Player Decision Tracking System (the base system this builds on)
- AI Context Management (how this integrates with AI prompt building)  
- Personalization Engine (the broader context of how we personalize narratives)
