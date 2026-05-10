# Release Process

Narraitor's release model is intentionally lightweight. `develop` is where all the merge-in-progress work lives, and `main` only ever moves forward when a release is tagged. This doc covers when to cut a release and the exact mechanics for doing it.

## When to cut a release

A release should mark something meaningful that a public user would care about — the design system migration shipping, structural theme differentiation landing, an MVP milestone closing. It's not a per-PR thing. If a stargazer pulled `main` today, they should be able to tell from the release notes what shifted since last time.

Rule of thumb: if there's a clean story to tell about what's in this slice of work, it's release-worthy.

## Version naming

Tags follow `vMAJOR.MINOR.PATCH[-suffix]`. Pre-1.0 the version numbers are loose — they signal scope, not a stability promise. The optional suffix is for tags that benefit from a one-word label, like `v0.4.0-pre-design-system` or `v0.6.0-theme-differentiation`. Skip the suffix when the version is self-explanatory.

## Cutting the release

The process has three moving parts: write the release notes, tag the commit, and fast-forward `main`. Doing them in that order avoids the awkward state where `main` points at a tag that has no release notes yet.

1. **Update `RELEASES.md`.** Add a new section at the top with the version, the date, a scope summary, what's known incomplete, and what's next. Link PRs and issues directly.
2. **Tag `develop` HEAD.** From an up-to-date `develop`:
   ```
   git tag -a vX.Y.Z -m "Release notes summary here." <sha>
   git push origin vX.Y.Z
   ```
3. **Fast-forward `main`.** This should always be a clean fast-forward — if it isn't, something has gone sideways and the release shouldn't proceed until that's understood.
   ```
   git checkout main
   git pull --ff-only
   git merge --ff-only vX.Y.Z
   git push origin main
   ```
4. **Publish the GitHub release.** Either paste the matching section from `RELEASES.md` or pipe it in:
   ```
   gh release create vX.Y.Z --title "vX.Y.Z" --notes-file <path-to-notes-fragment>
   ```

That's it. The release is live, `main` reflects it, and the next round of work continues on `develop`.

## What's intentionally not in scope

Automated tooling (release-please, semantic-release, conventional-commits enforcement) is a deliberate skip — the solo-dev cadence doesn't need the overhead yet. Same goes for pre-release channels like alpha or beta; one stable channel keeps things simple.
