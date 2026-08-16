# Blind judging rubric

Hand this file, plus a transcript, to a subagent that has seen nothing else. No world spec,
no character sheet, no knowledge of the app or what the campaign expects to find. If the
prose fails to convey the setting, that is itself the finding, and a judge who was handed
the setting separately cannot see it.

## Judge instructions

You are reading a transcript of a text adventure someone played. You have never seen this
game and know nothing about how it was built. Read the whole transcript before scoring
anything.

The transcript gives you, per turn: the turn number, the prose the game returned, the
options it offered, and which option the player took.

Score seven dimensions from 1 to 5. Score them **separately for each block of ten turns**
(1-10, 11-20, 21-30). Do not average across blocks. The question this campaign is asking is
whether the story gets worse as it goes, and that is a slope, not a number.

**Every score cites at least one turn number.** A score with no citation is not usable.

## The dimensions

### Agency - do the player's choices visibly change what happens

- **1** The passage after a choice would read the same whichever option had been taken. The
  choice is announced, then ignored.
- **3** The chosen action shows up in the next passage, but its effects stop there. Nothing
  carries forward.
- **5** Choices leave marks that surface turns later. A door left open, a person alienated,
  a resource spent, and the story remembers.

### Momentum - does each turn move, or does it circle

- **1** Turns restate the situation in new words. A reader could skip five of them and lose
  nothing.
- **3** Events occur but pressure stays flat. The scene changes without anything getting
  harder.
- **5** Each turn narrows the options or raises the cost. Something is more difficult now
  than it was ten turns ago.

### Memory - are earlier facts still true

- **1** The narrative contradicts something it established earlier. A name changes, a dead
  character speaks, geography rearranges, an item the player never had appears in hand.
- **3** No contradictions, but nothing from the first ten turns is ever mentioned again.
  The early story might as well not have happened.
- **5** Specific earlier details recur, correctly, and pay off.

### Voice - is the prose worth reading

- **1** The same sentence shapes and stock phrases turn after turn. The template is visible.
- **3** Competent and generic. Nothing wrong with it, nothing memorable in it.
- **5** A distinct register that fits the setting, with images that do not repeat.

### Stakes - can anything actually be lost

- **1** Nothing is at risk. Every attempt resolves without cost.
- **3** Threats get described but never land. The story menaces and then relents.
- **5** Something is genuinely lost or foreclosed, and the loss registers.

### Surprise - does anything land that the reader did not see coming

- **1** Every outcome is the obvious one. The story is fully predictable from the setup.
- **3** New details appear, but no reversals. Nothing recontextualizes what came before.
- **5** At least one real turn the reader did not predict, which still fits everything
  established.

### Choice quality - are the options meaningfully different

- **1** The options are one action in different words, or one option is obviously correct
  and the rest are filler.
- **3** Options differ in flavor but converge on the same outcome.
- **5** Options represent different strategies with different costs, and picking wrong
  costs something.

## Output format

For each block, report the seven scores with a cited turn number each, then two or three
sentences on what changed since the previous block. Close with the sharpest single problem
you saw across the whole transcript, stated as something a designer could act on.

## A/B discrimination protocol

Used only for the branch pair, and run by a different judge than the one who scored the
sessions.

You get two transcripts, unlabeled, that share an identical opening of eight turns and then
diverge. At the divergence point, one player took choice A and the other took choice B. You
are told what A and B were, but not which transcript followed which.

Answer three things:

1. Which transcript followed which choice, and how confident are you from 1 to 5
2. What in the text made you say that, cited by turn number
3. At what turn do the two transcripts stop being distinguishable, if they do

A judge who cannot tell them apart is the finding. Report that plainly rather than guessing
confidently.
