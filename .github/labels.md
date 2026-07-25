# GitHub Issue Labels

This file documents the labels used in the Narraitor repository. You can use a tool like [github-label-sync](https://github.com/Financial-Times/github-label-sync) to set up these labels in your repository.

## Type Labels

- `bug` - Something isn't working correctly
- `enhancement` - Improvement to an existing feature
- `user-story` - New feature described from a user's perspective
- `epic` - Large feature that contains multiple user stories
- `documentation` - Improvements or additions to documentation

## Domain Labels

- `domain:world-configuration` - Related to the World Configuration system
- `domain:character-system` - Related to the Character System
- `domain:decision-relevance-system` - Related to the Decision Relevance System
- `domain:narrative-engine` - Related to the Narrative Engine
- `domain:journal-system` - Related to the Journal System
- `domain:state-management` - Related to the State Management system
- `domain:infrastructure` - Related to project infrastructure, build, or deployment
- `domain:utilities-and-helpers` - Related to utility functions and helper modules
- `domain:inventory-system` - Related to the Inventory System
- `domain:lore-management-system` - Related to the Lore Management System
- `domain:player-decision-system` - Related to the Player Decision System
- `domain:devtools` - Related to developer tools and debugging
- `domain:ai-service` - Related to AI service integration
- `domain:character-interface` - Related to character UI/UX
- `domain:game-session` - Related to game session UI/UX
- `domain:journal-interface` - Related to journal UI/UX
- `domain:world-interface` - Related to world configuration UI/UX

## Priority Labels

- `priority:high` - High priority items for MVP
- `priority:medium` - Medium priority items
- `priority:low` - Low priority items
- `priority:post-mvp` - Items intentionally planned for after MVP

## Complexity Labels

- `complexity:small` - Small complexity (1-2 days of effort)
- `complexity:medium` - Medium complexity (3-5 days of effort)
- `complexity:large` - Large complexity (1+ week of effort)

## Model Power Labels

Model Power measures a **different axis than Complexity**. Complexity estimates
*time/scope* (how many days, how many files). Model Power estimates *reasoning
difficulty* — how much ambiguity, judgment, and tradeoff-weighing the work
requires, independent of how long it takes or how many files it touches.

The two are orthogonal: a `complexity:large` issue can be `model-power:light`
if it's mechanical repetition across many files (a bulk rename, a
well-specified dependency bump touching 30 files). A `complexity:small` issue
can be `model-power:frontier` if it's one file but requires genuine
architectural or creative judgment with no clear right answer. Assess them
independently — don't infer one from the other.

These tiers describe reasoning capability in the abstract, not any specific AI
provider or model name. `model-power:frontier` means "needs the most capable
model available," not "must use model X."

- `model-power:light` - Mechanical, narrow, unambiguous (rename, copy tweak, dependency bump per changelog)
- `model-power:standard` - Typical well-scoped fix/feature, follows an existing pattern (default tier)
- `model-power:advanced` - Cross-cutting or judgment-heavy; several viable approaches, real tradeoffs
- `model-power:frontier` - High-ambiguity, architecture-level or creative-judgment work, high blast radius

## Status Labels

- `status:backlog` - In the backlog, not yet scheduled
- `status:ready` - Ready for implementation
- `status:in-progress` - Currently being implemented
- `status:in-review` - Implementation complete, awaiting review
- `status:blocked` - Blocked by another issue or external factor

## Label Colors

For consistent visual styling, use these hex colors for labels:

- Bug: `#d73a4a` (red)
- Enhancement: `#a2eeef` (cyan)
- User Story: `#0075ca` (blue)
- Epic: `#6f42c1` (purple)
- Documentation: `#0075ca` (blue)
- Domain labels: `#5319e7` (purple)
- Priority labels: `#f9d0c4` (salmon)
- Complexity labels: `#bfd4f2` (light blue)
- Model Power labels: `#fbca04` (gold)
- Status labels: `#c2e0c6` (light green)
