/**
 * @fileoverview Few-shot examples appended to narrative prompts.
 *
 * Each constant is the complete, ready-to-append block for one prompt family.
 * They are plain strings rather than a selection pass over a tagged library:
 * every call site passes fixed tags and a fixed budget, so the selection always
 * resolved to the same set. Editing an example means editing the string here.
 */

/**
 * Perspective, emphasis, and character-name examples for the base narrative
 * prompt. The widest set — the base prompt has the most room for them.
 */
export const PERSPECTIVE_AND_EMPHASIS_EXAMPLES = `

EXAMPLES:
Example 1: Correct Second Person Perspective
--------------------------------------------
You make your way through the crowded marketplace, avoiding the merchants.

Example 2: Incorrect Perspective (Avoid)
----------------------------------------
The character travels through the marketplace. (WRONG - use "you" instead)

Example 3: Markdown Emphasis for Dramatic Effect
------------------------------------------------
The *Arasaka building* looms ahead, its security pulsing like a **digital heartbeat**

Example 4: Using Character Names in Dialogue
--------------------------------------------
"Alex, are you alright?" the guard asks. (CORRECT - others use your name in dialogue)

Example 5: Emphasis Usage Guidelines
------------------------------------
Use *single asterisks* around important phrases, atmospheric details, or notable objects.
Use **double asterisks** around critical moments, intense emotions, or dramatic revelations.
Apply emphasis sparingly (2-4 times per paragraph) to maintain impact.`;

/**
 * Second-person perspective examples, shared by the scene and transition
 * prompts. Both run on a tighter budget than the base prompt, so they get the
 * perspective rules without the emphasis guidance.
 */
export const PERSPECTIVE_EXAMPLES = `

EXAMPLES:
Example 1: Correct Second Person Perspective
--------------------------------------------
You make your way through the crowded marketplace, avoiding the merchants.

Example 2: Incorrect Perspective (Avoid)
----------------------------------------
The character travels through the marketplace. (WRONG - use "you" instead)

Example 3: Using Character Names in Dialogue
--------------------------------------------
"Alex, are you alright?" the guard asks. (CORRECT - others use your name in dialogue)`;

/** Context-summary and chaotic-option examples for the player choice prompt. */
export const CHOICE_EXAMPLES = `

EXAMPLES:
Example 1: Context Summary - Stakes
-----------------------------------
A critical moment where your response could determine if the alliance forms.

Example 2: Context Summary - Tension
------------------------------------
Tension builds as you must choose how to respond to the merchant's accusation.

Example 3: Context Summary - Suspicion
--------------------------------------
The stranger's offer seems too good to be true.

Example 4: Chaotic Choice Example
---------------------------------
Examples of CHAOTIC choices:
- "Throw a fireball at the ceiling to create a distraction"
- "Start singing loudly to confuse everyone"
- "Pretend to be possessed by a spirit"
- "Challenge them to a dance-off"`;

/**
 * Skill acknowledgment examples. Both the success and failure cases ship, so
 * the model sees how to phrase either outcome regardless of which one happened.
 */
export const SKILL_ACKNOWLEDGMENT_EXAMPLES = `

EXAMPLES:
Example 1: Failure Acknowledgment
---------------------------------
Despite your efforts with the lockpicks, the mechanism remains stubbornly locked.

Example 2: Success Acknowledgment
---------------------------------
Your training in lockpicking proves invaluable as the tumblers fall into place.`;

/**
 * Whether examples earn their place in the current prompt.
 *
 * They are dropped when the token budget is too tight to fit a useful set, and
 * when the context is already long enough that the model has plenty of in-world
 * material to pattern-match against.
 */
export function shouldIncludeExamples(
  availableTokens: number,
  contextLength: number = 0
): boolean {
  if (availableTokens < 50) {
    return false;
  }

  if (contextLength > 5000) {
    return false;
  }

  return true;
}
