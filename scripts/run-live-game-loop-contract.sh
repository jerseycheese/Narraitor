#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${NARRAITOR_LIVE_GEMINI_API_KEY:-}" ]]; then
  echo 'Skipping live game-loop contracts: set NARRAITOR_LIVE_GEMINI_API_KEY to opt in.'
  exit 0
fi

npx jest --config=jest.live.config.cjs
