---
title: [Feature/System Name] Guide
tags: [feature, guide, implementation]
created: [YYYY-MM-DD]
updated: [YYYY-MM-DD]
---

# [Feature/System Name] Guide

Start by explaining what this feature does and why it exists. Give context first - what problem does this solve? What was the situation before this existed?

Then explain what it does in practical terms. Avoid jumping straight into technical details without explaining why someone would care.

## Quick Start

Show the most common use case right away. This helps developers see if they're in the right place and gives them something to copy-paste if they just need the basics.

```typescript
// Most common usage - like 80% of the time you'll do this
import { Feature } from '@/lib/feature';

const result = Feature.doSomething();
```

## How It Works

Explain the core concepts without assuming too much prior knowledge. Define any jargon the first time you use it, then use it naturally afterwards.

Break down complex ideas into digestible pieces. Use analogies when they help: "Think of it like a cache that expires..." or "Basically what happens is..."

### The Main Component

What it does, how it fits into the bigger picture, and when you'd use it. Explain the "why" not just the "what."

### Supporting Pieces

Other components or concepts that work with the main feature. Keep the focus on how they work together, not implementation details.

## Using It in Practice

Show real examples that match actual use cases. Code examples should be complete enough to understand, but not so complex they obscure the point.

### Common Pattern: [Describe the Scenario]
```typescript
// Show how to handle this use case
// Include comments that explain the "why" not just restate the code
```

### Another Pattern: [Different Scenario]
```typescript
// Another realistic example
// Comments should add context the code doesn't provide
```

## Configuration Options

If there are config options, explain them in natural language. Don't just list parameters - explain when you'd change each one and why.

```typescript
interface Config {
  option1: string;  // What this controls and when you'd change it
  option2: boolean; // Explain the trade-offs of enabling/disabling this
}
```

## When Things Go Wrong

List actual problems people run into, not hypothetical edge cases. If you haven't seen it happen, it probably doesn't belong here.

**Problem**: Describe what the developer sees or experiences
**Fix**: Explain the solution in steps, including why it works

**Problem**: Another common issue
**Fix**: Practical solution with context

## Things Worth Knowing

Any gotchas, limitations, or non-obvious behaviors that could trip someone up. This is where you acknowledge complexity: "This gets a bit tricky because..."

## Related Documentation
- [Link to related docs with brief context about why]
- [Another related doc and how it connects]

---

**Writing Tips for This Template:**
- Write like you're explaining to a colleague, not performing for an audience
- Context first, then technical details
- Avoid corporate language like "comprehensive solution" or "leverage"
- Use "which" and varied connectors instead of repeating the same starters
- Keep it under 300 lines - if it's longer, split it up
- Focus on the developer impact, not just technical specs
