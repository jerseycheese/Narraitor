---
title: PR Description Examples
tags: [documentation, pull-requests, voice-profile, guidelines]
created: 2025-08-21
updated: 2025-08-21
---

# Pull Request Description Examples

Examples of well-written PR descriptions that follow our voice and communication guidelines.

## Visual Regression Testing Implementation (PR #651)

**Updated version following voice profile guidelines:**

---

## Getting visual regression testing working properly

This addresses the visual testing gap we've had in the CI pipeline - turns out there were some interesting challenges with AI-generated content that made this more complex than expected.

## What this solves

Our CI was running placeholder E2E tests (`echo 'No Playwright tests configured yet'`), which meant visual regressions could slip through without us noticing. With AI-generated content changing between runs, we needed a testing approach that could handle dynamic content while still catching real UI issues.

## The approach we took

The core insight was that you can't treat AI-generated content the same as static UI components. We ended up with a split-tolerance strategy:

- **High tolerance (46%) for dynamic content** - pages with AI narratives, timestamps, session IDs
- **Strict tolerance (20%) for static UI** - navigation, forms, buttons, layout components  
- **Content masking** - hide the variable stuff entirely so tests focus on structure

We're also masking specific dynamic areas like narrative paragraphs and choice text, then testing the layout structure rather than content accuracy.

## What's working now

- 15 visual tests covering the main user journeys (landing, world creation, character creation, game sessions)
- Tests pass consistently in CI after working through the tolerance issues
- DevTools moved to top of page so they don't cover content in screenshots
- Proper artifact upload when visual tests fail

The most interesting piece was figuring out that AI-driven applications need content-aware visual testing strategies. Traditional approaches assume your content is static, but when half your UI changes every test run, you need to be more thoughtful about what you're actually validating.

## Testing it out

```bash
# Install browsers
npx playwright install

# Run visual tests (generates baselines first time)
npm run test:visual:update

# Run tests to check for regressions
npm run test:visual
```

Closes #384

---

## Key differences from original

**Original issues:**
- Too formal and corporate ("comprehensive visual consistency validation")
- Heavy bullet points without flow
- Technical jargon without context
- Cold opening without explaining the problem
- Excessive formatting and structured sections

**Updated approach:**
- Conversational tone explaining the actual challenge
- Context first (what problem this solves) before diving into solution
- Natural flow between paragraphs
- Technical details explained in accessible language
- Practical testing instructions at the end

This example demonstrates how to write PR descriptions that sound authentic while still covering all the necessary technical details for code review.