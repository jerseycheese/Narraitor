# PR Title
Improve choice quality - adds relevance padding and semantic filtering (#972)

# PR Body
This addresses issues with narrative choices feeling disconnected or semantically identical. The approach taken focuses on grounding choices in session continuity while enforcing distinctness through a multi-stage filtering process.

### Relevance & Padding (#972)
The decision retrieval now prioritizes the current session for better continuity. To avoid the "cold start" problem in new sessions, logic was added to backfill the prompt with recent world decisions up to the limit. The decision limit was also reduced to 10 to optimize the token budget.

### Handling Duplicates (#978)
Prompt engineering was used to request five distinct actions while explicitly forbidding synonyms. A Jaccard similarity filter (threshold 0.7) then prunes duplicates before the final three options are selected. This prevents the model from offering multiple rephrased versions of the same action.

### Observability & Config (#1001)
Structured logging was added to track discarded choices and similarity scores, providing data for future threshold tuning. Additionally, a new centralized configuration module handles these AI parameters, allowing for easier adjustment via environment variables.

The implementation is verified by new tests for padding logic and deduplication, with all 55 test suites passing.
