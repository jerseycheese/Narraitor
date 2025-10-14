# Game Session UI Requirements

## Text Formatting

This document outlines the requirements for text presentation in the game session interface.

### Acceptance Criteria

- [x] Text formatting (emphasis, etc.) is rendered correctly
- [x] Paragraphs have appropriate spacing between them  
- [x] Important text elements receive proper emphasis  
- [x] Formatting is consistent throughout the experience  
- [x] Content is legible on all supported screen sizes

### Text Presentation Guidelines

#### Paragraph Rules
- Paragraphs must be separated by vertical spacing of at least 1.5rem
- Maximum paragraph width constrained to 56rem (896px) for readability
- First paragraph in a segment must not have top margin
- Last paragraph in a segment must not have bottom margin

#### Emphasis Rules
- Italic text must use `<em>` tags for semantic correctness
- Bold text must use `<strong>` tags for semantic importance
- Visual indicators for emphasis (verbally identified in accessibility descriptions)

#### Processing Rules
- Input text is processed through `textFormatter` utility
- Proper paragraph delineation (double line breaks → paragraph separation)
- Proper emphasis handling (*text* → italics, **text** → bold)
- Malformed emphasis markers handled gracefully (displayed as literal *)

### Implementation Examples

See Storybook examples:
- [FormattedNarrativeContent Stories](http://localhost:6006/?path=/story/components-narrative-formattednarrativecontent--default)

### Accessibility Requirements

- [x] All formatted text meets WCAG 2.1 AA contrast standards
- [x] Text remains readable at 200% zoom
- [x] Proper semantic HTML structure for screen readers
