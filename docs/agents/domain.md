# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root. This is a single-context repo, so there is one glossary and no `GLOSSARY-MAP.md`.
- **`public_docs/architecture/ADR-NNN-*.md`**: read the ADRs that touch the area you're about to work in. `public_docs/architecture/architecture-decisions.md` is the index. This repo keeps its ADRs there, not in `docs/adr/`.

If a doc you expect doesn't exist, **proceed silently**. Don't flag its absence; don't suggest creating it upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) adds terms and ADRs lazily when they actually get resolved.

## File structure

```
/
├── GLOSSARY.md
├── docs/agents/                       ← this folder; the rest of docs/ is private and untracked
├── public_docs/architecture/
│   ├── architecture-decisions.md      ← ADR index
│   ├── ADR-001-nextjs-app-router-typescript.md
│   └── ADR-014-browser-local-until-named-trigger.md
└── src/
```

New ADRs take the next number in `public_docs/architecture/` and a line in the index.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

The code doesn't always match the glossary. The generation route says `choices` where the glossary says decision option, and components say custom input where it says typed action. Use the glossary's term in prose, and leave existing identifiers alone unless the task is the rename.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-014 (browser-local until a named trigger fires), but worth reopening because…_
