# Test world: Camp Crystal Lake

The control world. A 1980s summer-camp slasher in the Friday the 13th vein, first used for
the v1.0 QA walkthrough (issue #1417). Re-running the same world each release keeps rubric
scores comparable across rounds, which is the whole reason it stays fixed. Do not improve
it between rounds.

This world has a built-in threat engine: something is hunting you, so the narrative can
borrow momentum instead of manufacturing it. Pair it with `harrowgate-council.md`, which
takes that crutch away.

## World, manual create path

Wizard fields, in order:

- Template step: pick "Start from scratch" and skip the templates
- **World Name**: `Camp Crystal Lake`
- **Genre**: `Horror`
- **World Type**: `Inspired By`, with **Existing Setting** `Friday the 13th`
- **Tone Settings** on the Basic Info step:
  - Content rating: `R`
  - Narrative style: `Mysterious`
  - Language complexity: `Moderate`
  - Custom instructions: `tense, dread-soaked 1980s slasher; sudden violence, earned not gratuitous`
- **Full Description**:

  > Summer, 1984. Camp Crystal Lake reopens despite the stories - the drownings, the
  > disappearances, the name locals won't say after dark. You're among the counselors who
  > came up early to ready the cabins before the kids arrive. The woods are too quiet, the
  > radio's dead, the nearest town is forty minutes of dirt road away, and something out
  > there is watching the firelight. Survive the night. Get whoever's left out alive.

- **Attributes** and **Skills** steps: the wizard suggests these from the description.
  Verify they land near the targets below and edit toward them.

**Attribute targets:** Vigor, Agility, Awareness, Nerve, Cunning

**Skill targets:** Athletics, Stealth, First Aid, Improvised Weapons, Survival/Woodcraft,
Perception, Persuasion

## World, AI generate path

The `/worlds` Generate flow uses a different field set:

- **World Type**: `Inspired By`
- **Existing Setting**: `Friday the 13th`
- **Additional Details**: `1980s summer camp on a cursed lake; a masked killer stalking the counselors at night`
- Name, if the flow shows one: `Camp Crystal Lake`

## Character: Jamie Holt

Custom character wizard:

- **Name**: `Jamie Holt`
- **Character description**: `A returning camp counselor who grew up nearby and knows the grounds cold.`
- **Physical description**: `Nineteen, wiry and quick; worn camp hoodie, flashlight clipped to her belt.`
- **Attributes**: most points into Agility and Awareness, a survivor build, spend the full pool
- **Skills**: top points into Stealth, Athletics, First Aid
- **History**: `Nineteen, second summer on staff. Grew up forty minutes down the road, so the camp's ghost stories were bedtime stories. Knows the trails, the boathouse, which cabin doors don't lock.`
- **Personality**: `Level-headed, protective, hates being the one who panics.`
- **Motivation**: `Get everyone out of the camp alive before dawn.`
- **Goals**: `Get every camper and counselor out alive` and `Make it to morning`
- **Portrait**: skip, it costs a generation and nothing in the rubric scores it

## Facts to plant and check later

The Memory dimension needs specific early facts to test recall against. These come out of
the world description and the character sheet, so they should be established by turn 5
without any prompting:

1. The nearest town is forty minutes away by dirt road
2. The radio is dead
3. Jamie grew up locally and knows which cabin doors don't lock
4. The kids have not arrived yet, only counselors are on site
5. It is summer 1984

At turn 30, check whether the narrative still holds these, contradicts them, or has quietly
forgotten them. A contradiction scores Memory at 1. Silence scores 3.
