#!/usr/bin/env bash
#
# Copy ignored local env files from the primary checkout into a linked worktree.
# These files are intentionally untracked, but local dev worktrees need the same
# server-side keys and feature flags as the main checkout.
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$repo_root" ]; then
  exit 0
fi

current_root="$(cd "$repo_root" && pwd -P)"
primary_root="$(
  git worktree list --porcelain |
    awk '/^worktree / { print substr($0, 10); exit }'
)"

if [ -z "$primary_root" ]; then
  exit 0
fi

primary_root="$(cd "$primary_root" && pwd -P)"
if [ "$primary_root" = "$current_root" ]; then
  exit 0
fi

shopt -s nullglob
for source_env in "$primary_root"/.env*.local; do
  env_name="$(basename "$source_env")"
  target_env="$current_root/$env_name"

  if [ -e "$target_env" ]; then
    continue
  fi

  if ! git -C "$current_root" check-ignore -q "$env_name"; then
    echo "Skipping $env_name because it is not ignored by git"
    continue
  fi

  cp -p "$source_env" "$target_env"
  echo "Copied $env_name from primary checkout"
done
