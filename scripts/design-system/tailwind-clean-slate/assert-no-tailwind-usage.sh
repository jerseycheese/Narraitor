#!/bin/bash

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "Checking for Tailwind utility usage..."

FAIL=0

# Scope gate to issue #1038 game-session surface.
TARGET_PATHS=(
  "src/app/worlds/[id]/play"
  "src/components/GameSession"
  "src/components/Narrative"
)

echo "Scoped paths:"
printf " - %s\n" "${TARGET_PATHS[@]}"

# 1. Check for composition helpers in .tsx and .ts files
echo "Checking for composition helpers (cn, clsx, twMerge)..."
# Use stricter word boundary checks
COMPOSITION_MATCHES=$(grep -rE "\bcn\(|\bclsx\(|\btwMerge\(" "${TARGET_PATHS[@]}" --include="*.tsx" --include="*.ts" 2>/dev/null)

if [ -n "$COMPOSITION_MATCHES" ]; then
  echo -e "${RED}Found composition helpers usage:${NC}"
  echo "$COMPOSITION_MATCHES"
  FAIL=1
fi

# 2. Check for Tailwind utility classes
echo "Checking for Tailwind utility classes..."
# Use regex that ensures prefix is at start of class (quote) or after space
# We check for standard prefixes and exact matches.
# [\"' ] matches quote or space.
UTILITY_MATCHES=$(grep -rE "className=.*[\"' ](bg-|text-|flex|grid|space-|p-|m-|w-|h-|border-|rounded-|shadow-|hover:|focus:|sm:|md:|lg:|xl:)" "${TARGET_PATHS[@]}" --include="*.tsx" 2>/dev/null)

if [ -n "$UTILITY_MATCHES" ]; then
  echo -e "${RED}Found Tailwind utility classes:${NC}"
  echo "$UTILITY_MATCHES" | head -n 20 
  if [ $(echo "$UTILITY_MATCHES" | wc -l) -gt 20 ]; then echo "... and more"; fi
  FAIL=1
fi

# 3. Check for Tailwind directives in globals.css
echo "Checking for Tailwind directives in globals.css..."
CSS_MATCHES=$(grep -E "@tailwind|@apply|theme\(|@layer" src/app/globals.css 2>/dev/null)

if [ -n "$CSS_MATCHES" ]; then
  echo -e "${RED}Found Tailwind directives in globals.css:${NC}"
  echo "$CSS_MATCHES"
  FAIL=1
fi

if [ $FAIL -eq 1 ]; then
  echo -e "${RED}Tailwind usage detected. Clean slate violation.${NC}"
  exit 1
else
  echo -e "${GREEN}No Tailwind usage detected! Clean slate achieved.${NC}"
  exit 0
fi
