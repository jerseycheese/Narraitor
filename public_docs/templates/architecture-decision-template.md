---
title: "ADR-[NUMBER]: [Decision Title]"
tags: [architecture, decision, adr]
created: [YYYY-MM-DD]
updated: [YYYY-MM-DD]
---

# ADR-[NUMBER]: [Decision Title]

**Status**: [Proposed | Accepted | Deprecated | Superseded]
**Date**: [YYYY-MM-DD]

## The Situation

Explain the context in plain language. What problem needed solving? What was the current state that prompted this decision?

Give enough background that someone reading this in six months (or someone new to the project) can understand why this even came up.

## What We Decided

State the decision clearly and directly. Don't bury it in jargon - just say what was chosen.

Then explain the approach in practical terms. What does this mean for how the code is structured or how developers will work?

## Why This Made Sense

Walk through the reasoning. This is where you explain the trade-offs and why this option won out over the alternatives.

If there were constraints (time, existing tech debt, team knowledge), mention them. Real decisions happen in context, not in a vacuum.

### What Else We Considered

List the alternatives that were seriously discussed, not every possible option. For each one, explain briefly why it didn't make the cut.

- **Option A**: What it would have involved and why it didn't work for this situation
- **Option B**: The appeal of this approach and what made us go a different direction
- **Option C**: Why this seemed promising but had deal-breaker downsides

Be honest about the trade-offs. Sometimes you pick the option that's "good enough" rather than perfect, and that's fine to acknowledge.

## What This Means Going Forward

Explain the implications, both positive and negative. Architecture decisions have ripple effects - call them out.

### Upsides

Real benefits, not vague claims. Things like "faster development because..." or "better performance when..." with actual context.

- Concrete advantage with explanation of impact
- Another benefit and why it matters
- Third benefit if relevant

### Downsides

Trade-offs, limitations, or added complexity. Being upfront about these helps future developers understand constraints.

- Limitation or complexity this introduces
- Trade-off we accepted and why it's worth it
- Technical debt or future work this creates

## Implementation Notes

Practical guidance for applying this decision. What do developers need to know or do differently?

This is where you include things like:
- "All new state stores should follow the X pattern"
- "When adding new components, check Y first"
- "The migration path for existing code is Z"

Keep it actionable. If there are gotchas or common mistakes to avoid, mention them.

## Related Decisions

Link to ADRs or docs that connect to this decision. Brief context about the relationship helps.

- [ADR-XXX: Related Decision] - How it connects or builds on this
- [Implementation Doc] - Where to see this in practice

---

**Writing Tips for ADRs:**
- Write for future readers who don't have your current context
- Explain the "why" - that's what matters six months from now
- Be honest about trade-offs and limitations
- Use conversational language, not formal documentation speak
- Keep it under 300 lines - if longer, maybe it's multiple decisions
