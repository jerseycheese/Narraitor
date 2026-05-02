#!/bin/bash
# Desktop component-level capture for the cross-theme audit (#1129).
# Captures full-page + per-component (header/nav/main/form/dialog) + main-section-N
# at 1280x1200 desktop viewport.
#
# Usage:
#   scripts/audit/component-crawl.sh \
#     --theme <ds3|ds1|ds2|default> \
#     --mode <light|dark> \
#     --state <empty|seeded|mid-session> \
#     --branch <branch-label> \
#     [--base-url http://localhost:3000]
#
# Output: scripts/audit/captures/comp-<branch>/desktop/<state>/<route>__<component>.png
#
# Requires `bdg` (browser-debugger-cli) running against an open Chromium tab on
# the target dev server. Seed JSON is built via `npx tsx scripts/audit/build-seed.ts`.

# NOTE: do NOT use `set -e`. bdg returns non-zero when a selector misses (e.g.
# capturing `form` on a route without one), and we want the loop to continue.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT_DIR="${REPO_ROOT}/scripts/audit"

THEME=""
MODE="light"
STATE="seeded"
BRANCH=""
BASE_URL="http://localhost:3000"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --theme) THEME="$2"; shift 2 ;;
    --mode) MODE="$2"; shift 2 ;;
    --state) STATE="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --base-url) BASE_URL="$2"; shift 2 ;;
    -h|--help)
      grep -E "^# " "$0" | sed 's/^# \{0,1\}//' >&2
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$THEME" || -z "$BRANCH" ]]; then
  echo "Required: --theme <name> --branch <label>" >&2
  exit 1
fi

case "$STATE" in
  empty|seeded|mid-session) ;;
  *) echo "Invalid --state '$STATE' (expected: empty|seeded|mid-session)" >&2; exit 1 ;;
esac

OUTDIR="${SCRIPT_DIR}/captures/comp-${BRANCH}/desktop/${STATE}"
SEED_FILE="${SCRIPT_DIR}/seeds/${STATE}.json"

if [[ ! -f "$SEED_FILE" ]]; then
  echo "Seed file not found: $SEED_FILE" >&2
  echo "Generate it first: npx tsx scripts/audit/build-seed.ts --state ${STATE} > ${SEED_FILE}" >&2
  exit 1
fi

mkdir -p "$OUTDIR"
echo "Output: $OUTDIR"
echo "Seed:   $SEED_FILE  (state: $STATE)"

# Inject seed into IndexedDB + localStorage
SEED_JSON=$(cat "$SEED_FILE")
INJECT_SCRIPT=$(cat <<'EOF'
async function inject(payload) {
  const data = JSON.parse(payload);
  // localStorage fallback
  for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
  // IndexedDB primary
  await new Promise((resolve) => {
    const req = indexedDB.open('narraitor-state', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('narraitor-store')) db.createObjectStore('narraitor-store');
    };
    req.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(['narraitor-store'], 'readwrite');
      const store = tx.objectStore('narraitor-store');
      for (const [k, v] of Object.entries(data)) store.put({ id: k, value: JSON.parse(v) }, k);
      tx.oncomplete = () => resolve('ok');
      tx.onerror = () => resolve('err');
    };
    req.onerror = () => resolve('err');
  });
  return 'seeded';
}
EOF
)

# Set theme + color scheme on integration branches; skip on develop
if [[ "$THEME" != "default" ]]; then
  bdg dom eval "localStorage.setItem('narraitor-theme','${THEME}'); localStorage.setItem('narraitor-color-scheme','${MODE}'); 'set'" > /dev/null
fi

# Inject seed (escape backticks/dollars for the eval payload)
ESCAPED_SEED=$(printf '%s' "$SEED_JSON" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')
bdg dom eval "(${INJECT_SCRIPT})(${ESCAPED_SEED})" > /dev/null

# Reload to pick up the new state
bdg cdp Page.reload --params '{"ignoreCache":true}' > /dev/null 2>&1
/bin/sleep 3

# CSS injected before each capture to hide visual noise (dev panel, etc.)
HIDE_CSS_SCRIPT="(()=>{ if(document.getElementById('audit-hide-css')) return 'present'; const s=document.createElement('style'); s.id='audit-hide-css'; s.textContent='[data-testid=\"devtools-panel-container\"],[data-testid^=\"devtools-panel-\"]{display:none !important;}'; document.head.appendChild(s); return 'injected'; })()"

# 14 production routes
ROUTES=(
  "home:/"
  "about:/about"
  "worlds:/worlds"
  "worlds-detail:/worlds/world-cyberpunk-2077"
  "worlds-edit:/worlds/world-cyberpunk-2077/edit"
  "worlds-create:/worlds/create"
  "worlds-play:/worlds/world-cyberpunk-2077/play"
  "worlds-play-journal:/worlds/world-cyberpunk-2077/play/journal"
  "characters:/characters"
  "characters-detail:/characters/char-cyberpunk-hacker"
  "characters-edit:/characters/char-cyberpunk-hacker/edit"
  "characters-create:/characters/create"
  "play:/play"
  "settings:/settings"
)

SELECTORS=(
  "header:header"
  "nav:nav"
  "main:main"
  "form:form"
  "dialog:[role=\"dialog\"]"
)

VIEWPORT_W=1320
VIEWPORT_H=900
# deviceScaleFactor=1: full-page and selector captures both render at 1:1 with
# CSS pixels. With dsf=2, full-page would be 2x retina but selector captures
# stay at 1x — mixed regimes that complicate the review page.
VIEWPORT_PARAMS="{\"width\":${VIEWPORT_W},\"height\":${VIEWPORT_H},\"deviceScaleFactor\":1,\"mobile\":false}"

bdg cdp Emulation.setDeviceMetricsOverride --params "$VIEWPORT_PARAMS" > /dev/null 2>&1
/bin/sleep 1

for route_pair in "${ROUTES[@]}"; do
  slug="${route_pair%%:*}"
  path="${route_pair#*:}"
  echo "=== ${slug} (${STATE}) ==="

  # Re-apply viewport override before each navigation. CDP can drop it across nav.
  bdg cdp Emulation.setDeviceMetricsOverride --params "$VIEWPORT_PARAMS" > /dev/null 2>&1
  bdg cdp Page.navigate --params "{\"url\":\"${BASE_URL}${path}\"}" > /dev/null 2>&1
  /bin/sleep 4

  # Verify the viewport landed where we expected
  measured=$(bdg dom eval "window.innerWidth + 'x' + window.innerHeight" 2>/dev/null | tr -d '"' | tr -d ' ')
  if [[ "$measured" != "${VIEWPORT_W}x${VIEWPORT_H}" ]]; then
    echo "  WARN: viewport is $measured (expected ${VIEWPORT_W}x${VIEWPORT_H})"
  fi

  # Hide DevTools panel + similar visual-noise widgets via injected CSS
  bdg dom eval "$HIDE_CSS_SCRIPT" > /dev/null 2>&1

  # --no-resize: skip bdg's auto-resize so widths match CSS-px x dpr exactly.
  # Full-page / viewport captures are at 2x retina; selector captures are at 1x.
  bdg dom screenshot --no-resize "${OUTDIR}/${slug}__page.png" > /dev/null 2>&1

  for sel_pair in "${SELECTORS[@]}"; do
    name="${sel_pair%%:*}"
    selector="${sel_pair#*:}"
    OUT="${OUTDIR}/${slug}__${name}.png"
    bdg dom screenshot --no-resize --selector "$selector" "$OUT" > /dev/null 2>&1
    if [[ -f "$OUT" ]] && [[ $(/usr/bin/stat -f%z "$OUT" 2>/dev/null || /bin/stat --printf='%s' "$OUT" 2>/dev/null) -gt 1000 ]]; then
      echo "  ${name} -> captured"
    else
      /bin/rm -f "$OUT"
    fi
  done

  IDX=0
  while [[ $IDX -lt 8 ]]; do
    OUT="${OUTDIR}/${slug}__main-section-${IDX}.png"
    bdg dom screenshot --no-resize --selector "main > *:nth-child($((IDX + 1)))" "$OUT" > /dev/null 2>&1
    if [[ -f "$OUT" ]] && [[ $(/usr/bin/stat -f%z "$OUT" 2>/dev/null || /bin/stat --printf='%s' "$OUT" 2>/dev/null) -gt 1000 ]]; then
      IDX=$((IDX + 1))
    else
      /bin/rm -f "$OUT"
      break
    fi
  done
done

bdg cdp Emulation.clearDeviceMetricsOverride > /dev/null 2>&1
echo "Total captures in ${OUTDIR}: $(/bin/ls "$OUTDIR" | /usr/bin/wc -l | tr -d ' ')"
