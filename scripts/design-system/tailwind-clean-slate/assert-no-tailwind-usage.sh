#!/bin/bash

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "Checking for Tailwind utility usage..."

FAIL=0

# Define patterns to search for
# Note: This is a basic check and might need refinement.
# We are looking for common Tailwind patterns.

# 1. Check for composition helpers in .tsx and .ts files
echo "Checking for composition helpers (cn, clsx, twMerge)..."
COMPOSITION_MATCHES=$(grep -rE "cn\(|clsx\(|twMerge\(" src/app src/components src/stories --include="*.tsx" --include="*.ts" 2>/dev/null)

if [ -n "$COMPOSITION_MATCHES" ]; then
  echo -e "${RED}Found composition helpers usage:${NC}"
  echo "$COMPOSITION_MATCHES"
  FAIL=1
fi

# 2. Check for Tailwind utility classes in className strings
# We search for common prefixes like bg-, text-, flex, grid, p-, m-, etc.
# avoiding false positives can be tricky, but we start with a broad check for known utilities.
# Using a regex that matches common tailwind classes inside className="..." or className={`...`}
echo "Checking for Tailwind utility classes..."
# Look for 'className' followed by string containing typical tailwind tokens
# This regex looks for className= then some quote, then potentially some tailwind class.
# We'll search for specific obvious tailwind tokens to be sure.
UTILITY_MATCHES=$(grep -rE "className=.*(bg-|text-|flex|grid|space-|p-|m-|w-|h-|border-|rounded-|shadow-|hover:|focus:|sm:|md:|lg:|xl:)" src/app src/components src/stories --include="*.tsx" 2>/dev/null)

if [ -n "$UTILITY_MATCHES" ]; then
  echo -e "${RED}Found Tailwind utility classes:${NC}"
  echo "$UTILITY_MATCHES" | head -n 20 # Limit output
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
