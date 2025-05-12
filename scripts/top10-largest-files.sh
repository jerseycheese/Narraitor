#!/usr/bin/env bash

DIR="${1:-.}"

{
  if git rev-parse --git-dir > /dev/null 2>&1; then
    git ls-files -z --cached --others --exclude-standard -- "$DIR" | xargs -0 -n1 wc -l
  else
    find "$DIR" -type f -exec wc -l {} \;
  fi
} | sort -nr | head -n 10