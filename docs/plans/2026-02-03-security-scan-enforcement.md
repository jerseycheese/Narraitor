# Security Scan Enforcement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve HIGH npm audit findings via patch updates and enforce the CI audit gate.

**Architecture:** Use `npm audit fix` to update dependencies within semver ranges, then adjust CI to fail on HIGH+ audit results while keeping the JSON report non-blocking. No runtime code changes expected.

**Tech Stack:** Node.js, npm, Next.js, GitHub Actions

---

### Task 1: Verify Branch State

**Files:**
- Modify: none
- Test: none

**Step 1: Confirm branch and clean status**

Run: `git status -sb`
Expected: `## issue/950-security-scan-enforcement` with no pending changes

---

### Task 2: Update Dependencies (npm audit fix)

**Files:**
- Modify: `package-lock.json`
- Modify: `package.json` (if Next.js patch range updates)
- Test: none

**Step 1: Apply patch-level security fixes**

Run: `npm audit fix`
Expected: npm updates patch/minor dependencies without `--force`

**Step 2: Verify audit is clean for HIGH+**

Run: `npm audit --production --audit-level=high`
Expected: `found 0 vulnerabilities`

**Step 3: Review dependency changes**

Run: `git status -sb`
Expected: `package-lock.json` (and maybe `package.json`) modified

**Step 4: Commit dependency updates**

Run:
```bash
git add package-lock.json package.json
git commit -m "Update patched dependencies from npm audit fix"
```
Expected: commit created with updated lockfile and package manifest

---

### Task 3: Enforce Security Scan in CI

**Files:**
- Modify: `.github/workflows/ci.yml`
- Test: none

**Step 1: Update the audit step to be blocking**

Edit `.github/workflows/ci.yml` to change the audit step:
```yaml
- name: Run npm audit (fails on high severity only)
  # Now enforced after resolving vulnerabilities in issue #950
  run: npm audit --production --audit-level=high | tee ci-security/npm-audit.txt
  continue-on-error: false
```

**Step 2: Keep JSON report generation non-blocking**

Ensure this block remains:
```yaml
- name: Generate npm audit JSON report
  run: npm audit --production --json > ci-security/npm-audit.json
  continue-on-error: true
```

**Step 3: Commit CI workflow change**

Run:
```bash
git add .github/workflows/ci.yml
git commit -m "Enforce npm audit in CI"
```
Expected: commit created with CI enforcement change

---

### Task 4: Local Verification

**Files:**
- Modify: none
- Test: none

**Step 1: Type check**

Run: `npm run type-check`
Expected: exit code 0

**Step 2: Lint (JS/TS)**

Run: `npm run lint`
Expected: exit code 0

**Step 3: Lint (CSS)**

Run: `npm run lint:css`
Expected: exit code 0

**Step 4: Lint (layout usage)**

Run: `npm run lint:layout-usage`
Expected: exit code 0

**Step 5: Unit tests with coverage**

Run: `npm run test:coverage`
Expected: all suites pass

**Step 6: Build**

Run: `npm run build`
Expected: build succeeds without errors

**Step 7: Build Storybook**

Run: `npm run build-storybook`
Expected: build succeeds without errors

**Step 8: Critical E2E tests**

Run (terminal 1): `npm run dev`
Expected: dev server running on port 3000

Run (terminal 2): `npm run test:e2e:critical`
Expected: all critical Playwright tests pass

---

### Task 5: Final Review

**Files:**
- Modify: none
- Test: none

**Step 1: Confirm clean status**

Run: `git status -sb`
Expected: no pending changes

---

**Notes:**
- Use @documentation-writing when preparing PR description and commit messages.
- Use @software-engineering-best-practices to keep scope tight and verification disciplined.
