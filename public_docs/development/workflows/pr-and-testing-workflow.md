---
title: PR Creation & Testing Workflow
tags: [development, testing, pr, workflow]
created: 2025-06-26
updated: 2026-05-22
---

# PR Creation & Testing Workflow

Complete testing and PR creation process for the Narraitor project.

## Testing Strategy

### Test-Driven Development Loop
```mermaid
graph TD
    A[Write failing test] --> B[Implement minimal code]
    B --> C{Build passes?}
    C -->|No| D[Fix build errors]
    D --> B
    C -->|Yes| E{Tests pass?}
    E -->|No| F[Fix implementation]
    F --> B
    E -->|Yes| G[Refactor if needed]
    G --> H[Manual verification]
```

### Test Types & When to Use

**Unit Tests** (Always required)
- Component rendering with different props
- User interactions (clicks, input changes)
- State changes and side effects
- Error handling

**Integration Tests** (For complex features)
- Component + store interactions
- API integration with mocked endpoints
- Cross-component communication

**E2E Tests** (Critical paths only)
- Complete user workflows
- Real API interactions
- Browser-specific functionality

### Test File Structure
```typescript
// ComponentName.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  // Test what the component does, not how it does it
  test('displays data correctly', () => {
    render(<ComponentName data={mockData} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  test('handles user interaction', async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();

    render(<ComponentName onAction={onAction} />);
    await user.click(screen.getByRole('button'));

    expect(onAction).toHaveBeenCalledWith(expectedValue);
  });
});
```

### Common Testing Patterns

**Component with State**
```typescript
test('updates display when data changes', () => {
  const { rerender } = render(<Component data={initialData} />);
  expect(screen.getByText('Initial')).toBeInTheDocument();

  rerender(<Component data={updatedData} />);
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

**Error Handling**
```typescript
test('displays error message when data is invalid', () => {
  render(<Component data={invalidData} />);
  expect(screen.getByText(/error/i)).toBeInTheDocument();
});
```

**Loading States**
```typescript
test('shows loading state while data is fetching', () => {
  render(<Component loading={true} />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
```

## Running Tests

### Development Commands
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- ComponentName.test.tsx

# Run tests in watch mode
npm run test -- --watch
```

### CI/CD Requirements

A PR has to get through the full set of CI gates before it can merge. The GitHub Actions
pipeline runs these as separate jobs, so it's worth knowing what each one checks and how to run
it locally:

| Gate | Command | What it checks |
|------|---------|----------------|
| Type check | `npm run type-check` | `tsc --noEmit`, strict mode |
| Lint (ESLint) | `npm run lint` | Code lint, including JSX/markup-hygiene rules |
| Lint (Stylelint) | `npm run lint:css` | CSS design-token enforcement (no hardcoded colors) |
| Layout usage | `npm run lint:layout-usage` | Enforces non-self-closing `PageLayout` usage |
| Knip | `npm run knip` | Unused files, exports, and dependencies |
| CSS audit | `npm run audit:css` | Unused CSS selectors |
| Tests | `npm run test:ci` | Jest unit/integration with coverage |
| Build | `npm run build` | Next.js build + Storybook build |
| E2E / visual | `npm run test:e2e:critical` | Playwright, fails on visual diffs |

Knip and the CSS audit are the newer gates that came out of the dead-code cleanup work — they
fail the build on unused code or unused selectors, so cleaning up as you go matters. The
Stylelint config (`.stylelintrc.json`) bans hardcoded hex/named colors outright, which is why
the token system isn't optional.

Two more quality tools run locally rather than in CI:
- **Mutation testing** (`stryker.config.json`) targets the state, storage, and narrative layers
  to catch tests that pass without actually asserting much. Worth running when you touch those.
- **Dependency-cruiser** (`npm run deps:validate`) checks architecture boundaries against the
  baseline in `.dependency-cruiser-known-violations.json`. See the
  [dependency analysis guide](../../architecture/dependency-analysis.md).

## Pull Request Creation

### Branch Strategy
- **develop**: Main development branch (merge target)
- **main**: Production branch (protected)
- **feature/issue-123**: Feature branches from develop

### PR Requirements
1. **Target develop branch** (never main)
2. **Use PR template** from `.github/PULL_REQUEST_TEMPLATE.md`
3. **Link to GitHub issue** using "Closes #123"
4. **All tests must pass**
5. **Build must succeed**

### Manual PR Creation
```javascript
// Read PR template
const fs = require('fs');
const prBody = fs.readFileSync('.github/PULL_REQUEST_TEMPLATE.md', 'utf8')
  .replace('Closes #', 'Closes #123');

// Create PR with MCP GitHub tool
await mcp__modelcontextprotocol_server_github__server_github.createPullRequest({
  owner: "jerseycheese",
  repo: "Narraitor",
  title: "Fix #123: Brief description",
  body: prBody,
  head: "feature/issue-123",
  base: "develop"  // Always develop, never main
});
```

### PR Template Structure
The template includes:
- **Summary**: What was implemented
- **Changes**: Key technical changes
- **Testing**: How the feature was tested
- **Screenshots**: Visual changes (if applicable)
- **Checklist**: Pre-merge verification items

## Pre-Merge Checklist

### Code Quality
- [ ] All tests pass locally
- [ ] Build succeeds without warnings
- [ ] No console errors in browser
- [ ] Code follows project conventions
- [ ] No TODO/FIXME comments left behind

### Testing Coverage
- [ ] New features have unit tests
- [ ] Critical paths have integration tests
- [ ] Error scenarios are tested
- [ ] Edge cases are covered

### Documentation
- [ ] Component has Storybook story
- [ ] API changes are documented
- [ ] README updated if needed
- [ ] Breaking changes noted

### Integration Verification
- [ ] Works in Storybook
- [ ] Works in test harness
- [ ] Works in full application
- [ ] No regression in existing features

## Troubleshooting

**Tests fail in CI but pass locally**
- Check Node.js version compatibility
- Verify environment variables are set
- Check for race conditions in async tests

**Build fails with type errors**
- Run `npm run build` locally first
- Check TypeScript strict mode compliance
- Verify all imports are correctly typed

**PR template not applied**
- Manually copy from `.github/PULL_REQUEST_TEMPLATE.md`
- Ensure all placeholders are replaced

**Wrong base branch selected**
- Always target `develop`, never `main`
- Update existing PR base branch if needed
