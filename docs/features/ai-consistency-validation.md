# AI Consistency Validation System

## Overview

The AI Consistency Validation system provides debugging tools for analyzing how the AI processes lore facts and generates consistency instructions for narrative generation. This DevTools-only feature helps developers understand and troubleshoot the consistency validation pipeline.

## Features

### Lore Context Analysis
- **Real-time Processing**: View how lore facts are categorized and structured
- **Importance Ranking**: Validate the AI's importance assessment of lore elements
- **Categorization View**: See how facts are organized into characters, locations, world rules, and historical events

### Consistency Instructions
- **Live Generation**: Preview the AI-generated consistency instructions based on lore context
- **Template Validation**: Verify that instructions follow the expected format and structure
- **Context Sensitivity**: Observe how different lore combinations affect instruction generation

### Statistics Dashboard
- **Fact Counts**: Overview of total lore facts per category
- **Importance Metrics**: High-importance item counts and distribution
- **World Coverage**: Analysis of lore coverage across different worlds

## Usage

### Accessing the Tool
1. Enable DevTools (development mode only)
2. Navigate to "AI Tools & Validation" section
3. Expand "Consistency Validation"

### Basic Workflow
1. **Select World**: Choose a world with existing lore facts from the dropdown
2. **Review Statistics**: Check the lore statistics panel for overview metrics
3. **Analyze Instructions**: Examine the generated consistency instructions
4. **Inspect Context**: View the structured lore context breakdown
5. **Debug Categorization**: Review how individual facts are categorized

### Debugging Scenarios
- **Missing Instructions**: Check if world has sufficient lore facts
- **Incorrect Categorization**: Verify lore fact content and tags
- **Importance Issues**: Review how facts are ranked for importance
- **Context Problems**: Examine the structured lore context output

## Technical Architecture

### Components
- **ConsistencyValidationSection**: Main debugging interface
- **DevToolsSection**: Reusable UI component for consistent styling
- **JsonViewer**: Displays structured data with syntax highlighting

### Integration Points
- **LoreStore**: Accesses stored lore facts via `useLoreStore`
- **Context Builder**: Uses `buildLoreContext` to structure lore data
- **Instruction Generator**: Calls `generateConsistencyInstructions` for live preview

### Data Flow
```
Lore Facts (Store) → Context Building → Categorization → Instruction Generation → Debug Display
```

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
- [DevTools Extension Guide](../devtools/extending-devtools.md)
- [Lore Management System](../lore/lore-system.md)
- [AI Integration Architecture](../ai/ai-integration.md)