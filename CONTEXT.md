# Narraitor

An AI-driven narrative RPG. A player builds a world, creates a character in it, and plays through a generated, choice-driven story. Single-player, browser-only storage, and the player's own AI provider key.

## The world and its people

**World**:
The setting a story happens in — its theme, tone, attributes, and skills. The top-level thing a player owns.
_Avoid_: setting, universe, campaign, game world

**World attribute**:
A trait every character in a world has, defined once on the world (Strength, Resolve).
_Avoid_: stat, characteristic

**World skill**:
A learnable capability defined on the world, optionally gated behind attributes.
_Avoid_: ability, proficiency

**Character**:
A person in a world, with values for that world's attributes and skills. The player controls one; the rest are NPCs.
_Avoid_: player character, PC, hero, avatar, protagonist

**NPC**:
A character the story controls rather than the player.
_Avoid_: non-player character, actor, extra

## Playing

**Session**:
One continuous run of play through a world with a character. Persists, resumes, and ends.
_Avoid_: game, playthrough, campaign, save, run

**Turn**:
One cycle of the story loop — the player picks an option, the provider generates, the story advances. The informal unit in prose and comments; a turn is stored as a narrative segment.
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

**Consequence**:
What a decision changed — alignment, trust, world state, inventory.
_Avoid_: effect, result, outcome

**Ending**:
The close of a session, with a type (how it ended) and a tone (how it reads).
_Avoid_: finale, conclusion, game over

## What a story leaves behind

**Journal entry**:
A player-facing record of something that happened, written for the player to read back.
_Avoid_: log, note, history item

**Lore fact**:
A durable statement about the world extracted from the story, used to keep later generations consistent.
_Avoid_: fact, memory, knowledge, canon entry

**Inventory item**:
A thing a character carries, with how it was acquired and what category it sorts into.
_Avoid_: object, gear, loot

**Goal**:
Something a character is working toward, tracked across a session.
_Avoid_: quest, objective, mission

**Story checkpoint**:
A generated recap of recent events, used to keep the prompt short without losing the thread.
_Avoid_: summary, recap, save point

## Generating the story

**Provider**:
The AI service that writes the story. The player configures one and supplies its key.
_Avoid_: vendor, backend, service, model host, LLM

**Key**:
The player's credential for their provider. Never stored server-side, never logged, sent per request.
_Avoid_: credential, token, secret, API key

**Provider descriptor**:
Everything one request needs to reach a provider — type, endpoint, model, key. What a route resolves and passes down.
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
