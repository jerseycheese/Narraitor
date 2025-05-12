// Configuration module for GitHub sync scripts
// This centralized configuration removes duplication across scripts

// GitHub repository settings
export const OWNER = 'jerseycheese';
export const REPO = 'narraitor';

// API settings
export const API_BASE_URL = 'https://api.github.com';
export const PER_PAGE = 100;

// Rate limiting parameters
export const RATE_LIMIT_PAUSE = 1000; // milliseconds to wait when approaching rate limit
export const RATE_LIMIT_THRESHOLD = 10; // remaining requests that trigger slowdown

// CSV related settings
export const CSV_USER_STORY_PATTERN = /.+-user-stories\.csv$/;
export const CSV_DEFAULT_ENCODING = 'utf8';

// Debug settings (should be false in production)
export const DEBUG_MODE = false;

// Directory paths for requirements documents
export const CORE_DIR = './docs/requirements/core';
export const UI_DIR = './docs/requirements/ui';
export const INTEGRATIONS_DIR = './docs/requirements/integrations';

// Domain types
export const DOMAIN_TYPES = {
  CORE: 'core',
  UI: 'ui',
  INTEGRATIONS: 'integrations',
};

// GitHub Issue Body Template
export const ISSUE_BODY_TEMPLATE = `<!--
  This issue was automatically generated from a user story in the Narraitor documentation.
  Please do not edit the content above the horizontal rule (---) as it will be overwritten
  the next time the sync script is run.

  To update this issue, please modify the corresponding user story in the documentation:
  [Link to the source document will be added here by the script]
-->

## User Story
As a [type of user], I want [goal/need] so that [benefit/value].

---

## Acceptance Criteria
<!-- List the specific, measurable conditions that must be met for this story to be considered complete -->
- [ ]
- [ ]
- [ ]
- [ ]

## Technical Requirements
<!-- List technical implementation details, constraints, or dependencies -->
-
-
-

## Related Documentation
<!-- Link to requirements documents and other references -->
-

## Implementation Notes
<!-- Add guidance on implementation approach, architecture considerations, etc. -->
-
-
-

## Related Issues/Stories
<!-- Link to any related GitHub issues or user stories -->
<!-- Format as #IssueNumber -->

## Estimated Complexity
<!-- Check one -->
- [ ] Small
- [ ] Medium
- [ ] Large

## Priority
<!-- Check one -->
- [ ] High (MVP)
- [ ] Medium (MVP Enhancement)
- [ ] Low (Nice to Have)
- [ ] Post-MVP
`;
