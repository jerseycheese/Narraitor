# Narraitor

An AI-driven narrative RPG. A player builds a world, creates a character in it, and plays through a generated, choice-driven story. Single-player, browser-only storage, and the player's own AI provider key.

## Language

### The world and its people

**World**:
The setting a story happens in: its theme, tone, attributes, and skills. The top-level thing a player owns.
_Avoid_: setting, universe, campaign, game world

**World attribute**:
A trait every character in a world has, defined once on the world (Strength, Resolve).
_Avoid_: stat, characteristic

**World skill**:
A learnable capability defined on the world, optionally gated behind attributes.
_Avoid_: ability, proficiency

**Derived stat**:
A character number calculated from world attributes by a formula the world defines (Health, Defense).
_Avoid_: secondary stat, computed stat, vital

**Tone settings**:
A world's content rating, narrative style, and language complexity. Every prompt reads them.
_Avoid_: voice, style settings, mood

**Character**:
A person in a world, with values for that world's attributes and skills. The player controls one; the rest are NPCs.
_Avoid_: player character, PC, hero, avatar, protagonist

**Condition**:
A lasting harm written on the character ("gashed left forearm"). The scene prompt carries a character's conditions.
_Avoid_: status effect, debuff, wound, injury

**NPC**:
A character the story controls rather than the player.
_Avoid_: non-player character, actor, extra

**NPC relationship**:
How an NPC stands toward the character: a sentiment score and a trust score, updated by what happens in play.
_Avoid_: reputation, affinity, standing, disposition

### Playing

**Session**:
One continuous run of play through a world with a character. Persists, resumes, and ends.
_Avoid_: game, playthrough, campaign, save, run

**Chapter**:
A 10-turn stretch of a session that closes on a chapter recap, which opens the next chapter. Built behind the `CHAPTERS` flag, which is off by default.
_Avoid_: act, level, episode, stage

**Turn**:
One cycle of the story loop: the player picks a decision option or writes a typed action, the provider generates, the story advances. The informal unit in prose and comments; a turn is stored as a narrative segment.
_Avoid_: round, step, exchange, beat

**Narrative segment**:
One generated piece of story text with its type (scene, dialogue, action, transition, ending) and metadata. The stored unit of a session's story.
_Avoid_: beat, passage, chunk, message, entry

**Decision**:
A point in the story where the player must pick. Carries the prompt, its options, and what followed.
_Avoid_: choice point, branch, fork

**Decision option**:
One of the things a player can pick at a decision. Note the drift: the generation route and generator are named `choices`/`choiceGenerator`, and `PlayerChoice` exists in game types. Prefer decision option for the domain noun.
_Avoid_: choice, answer, action

**Typed action**:
An action the player writes instead of picking a decision option. The code also says custom input and custom action; prefer typed action.
_Avoid_: custom input, custom action, custom choice, free text

**Skill check**:
A d20 roll plus the character's skill level and attribute bonus against a difficulty, made in code before the outcome is written. It passes or fails, with a natural 20 and a natural 1 deciding by themselves.
_Avoid_: dice roll, test, save

**Alignment**:
The lawful, chaotic, or neutral lean of a decision option. Picks move the character along that axis.
_Avoid_: morality, karma, personality

**Consequence**:
What a decision changed: alignment, trust, world state, inventory.
_Avoid_: effect, result, outcome

**World cost**:
Something the world takes from the character during a turn: a condition, or an item lost to whatever took it. Using up your own item isn't a world cost.
_Avoid_: penalty, damage, price

**Ending**:
The close of a session, with a type (how it ended) and a tone (how it reads).
_Avoid_: finale, conclusion, game over

### What a story leaves behind

**Journal entry**:
A player-facing record of something that happened, written for the player to read back.
_Avoid_: log, note, history item

**Story summary**:
The player-facing "story so far" panel in a session, built from story checkpoints.
_Avoid_: recap screen, synopsis, history

**Lore fact**:
A durable statement about the world extracted from the story, used to keep later generations consistent. Each one is either private to its session or shared across the world.
_Avoid_: fact, memory, knowledge, canon entry

**Inventory item**:
A thing a character carries, with how it was acquired and what category it sorts into.
_Avoid_: object, gear, loot

**Goal**:
Something a character is working toward, tracked across a session.
_Avoid_: quest, objective, mission

**Story checkpoint**:
A generated digest of recent events, used to keep the prompt short without losing the thread.
_Avoid_: summary, save point

**Chapter recap**:
The story checkpoint written at a chapter boundary, in five labelled lines: Previously, Where it stopped, Cast, Holding, Open threads. It's the only story the next chapter starts from.
_Avoid_: hand-off note, chapter summary, previously-on

**World thread**:
One open obligation the world carries between turns: a consequence not yet paid off, an off-screen actor with somewhere to go, or a deadline that has to arrive.
_Avoid_: plot thread, storyline, quest, hook

**World clock**:
The turn arithmetic over open world threads: which are due, overdue, or landing now. It's counted in turns, never wall-clock or in-story time.
_Avoid_: timer, threat clock, world time, schedule

**Scene state**:
The facts held for a session's current scene: where it is, which NPCs are present, and which beats are done. Built and switched off behind the `SCENE_STATE` flag.
_Avoid_: staging, scene context, location state

**Continuity contract**:
A compact list of what the next narrative segment has to honor: who's present, canon facts, recent decisions, and commitments already made.
_Avoid_: guardrail, consistency rules, canon check

### Generating the story

**Provider**:
The AI service that writes the story. The player configures one and supplies its key.
_Avoid_: vendor, backend, service, model host, LLM

**Key**:
The player's credential for their provider. Never stored server-side, never logged, sent per request.
_Avoid_: credential, token, secret, API key

**Preset**:
A provider configuration that ships with the app: endpoint, default model, and what the provider can do. The type is `ProviderPreset`.
_Avoid_: provider profile, connector, template

**Provider descriptor**:
Everything one request needs to reach a provider: type, endpoint, model, key. What a route resolves and passes down.
_Avoid_: config, credential, connection

**Adapter**:
The per-provider half of a request: URL, headers, body shape, response parsing, stream frames. Everything else is provider-generic.
_Avoid_: driver, connector, integration

**Content rating**:
The world's rating (G through NC-17). A safety-filter setting on Gemini, and prompt guidance everywhere else. The two are not the same thing and the UI says so.
_Avoid_: safety level, maturity, age rating

**Prompt template**:
A governed, registered template that builds a prompt. Prompts are not written inline in generators or routes.
_Avoid_: prompt string, template string
