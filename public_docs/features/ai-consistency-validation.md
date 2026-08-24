# AI Consistency Validation System

## What This Solves

Sometimes the AI forgets that your medieval world doesn't have spaceships, or starts talking about magic in a hard sci-fi campaign. This debugging tool is for figuring out what's going wrong when the AI goes off the rails.

The challenge with AI storytelling is that the AI needs constant reminders about your world's rules, and sometimes those reminders don't work as expected. This system lets you peek under the hood and see exactly how the AI is processing your lore facts and what consistency instructions it's generating for itself.

## What You See

### How Your Lore Gets Processed
The system sorts lore facts into buckets - characters, locations, world rules, historical events. Shows which facts the AI thinks are important and which it's ignoring. Helpful when the AI misses crucial details.

### The Instructions the AI Gives Itself
Shows the consistency instructions the AI generates from your lore. The AI reminds itself about world rules: "remember, in this world, magic comes from crystals" or "don't let characters teleport."

### Numbers That Actually Matter
Statistics dashboard shows lore facts per category, which are high-importance, and coverage across your world. Data about whether your lore setup works.

## How to Use This

### Getting Started
DevTools only (development mode), under "AI Tools & Validation" then "Consistency Validation". Developer tool, not visible to players.

### The Detective Work Process
Here's the typical workflow when something's gone wrong with your AI:

1. **Pick Your Problem World** - Select the world where the AI is acting weird from the dropdown
2. **Check the Numbers** - Look at the statistics panel to see if you actually have enough lore facts to work with
3. **Read the AI's Mind** - Examine those consistency instructions to see what the AI thinks it should be doing
4. **Dig Into the Details** - Check the structured context breakdown to see how your lore is being organized
5. **Find the Smoking Gun** - Review the categorization to see which facts are getting filed where

### When Things Go Wrong
The most common debugging scenarios and what to look for:

**The AI isn't following your rules**: Check if you actually have enough lore facts. The AI can't follow rules it doesn't know about.

**Facts are getting categorized wrong**: Look at your lore fact content and tags. Maybe that "magical sword" is being filed under "locations" instead of "items" because of how you described it.

**Important stuff is being ignored**: Review the importance rankings. Sometimes what you think is crucial isn't getting the weight it deserves in the algorithm.

**Instructions are gibberish**: Check the structured context output. If the raw data is messy, the instructions will be too.

## What Happens Behind the Scenes

### The Components That Do the Work
- **ConsistencyValidationSection**: The main debugging interface
- **DevToolsSection**: Keeps everything looking consistent with the rest of the DevTools
- **JsonViewer**: Makes all that structured data readable instead of just a wall of JSON

### Where It Plugs Into Everything Else
The system taps into three key places to do its job:
- **LoreStore**: Grabs your stored lore facts via `useLoreStore` - this is where all your world-building lives
- **Context Builder**: Uses `buildLoreContext` to organize that lore into something the AI can actually work with
- **Instruction Generator**: Calls `generateConsistencyInstructions` to see what the AI would actually tell itself about your world

### The Data Pipeline
It's pretty straightforward: your lore facts flow through context building, get categorized and ranked, then turn into instructions that the AI can understand. The debug display just shows you each step of that process so you can see where things might be going wrong.

## Development Notes

### Adding New Categories
To extend lore categorization:
1. Update `buildLoreContext` function
2. Add category display in categorization breakdown
3. Update statistics calculation

### Instruction Templates
Consistency instructions follow templates defined in:
- `src/lib/ai/consistencyInstructions.ts`
- Templates can be modified to change instruction format

### Performance Considerations
- Lore context building is memoized for efficiency
- Large lore datasets may impact rendering performance
- Consider pagination for very large fact collections

## Troubleshooting

### No Instructions Generated
- Verify world has lore facts
- Check if `generateConsistencyInstructions` function is working
- Ensure lore facts have proper structure

### Categorization Issues
- Review lore fact content and tags
- Check categorization logic in `buildLoreContext`
- Verify fact importance assignments

### Performance Problems
- Large lore datasets may slow rendering
- Consider using CollapsibleSection to hide unused data
- Check for memory leaks in memoized computations

## Related Documentation
- [DevTools Extension Guide](../technical-guides/extending-devtools.md)
- [Lore Tracking System](../technical-guides/lore-tracking-system.md)
- [AI Systems Overview](../features/ai-systems.md)
