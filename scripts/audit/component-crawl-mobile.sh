#!/bin/bash
# Mobile full-page capture for the cross-theme audit (#1129).
#
# Mobile uses full-page captures only. bdg's `--selector` mode produces clipped
# images at mobile viewport (deviceScaleFactor artifact); per-component
# selector captures are unreliable, so we skip them on mobile.
#
# Usage:
#   scripts/audit/component-crawl-mobile.sh \
#     --theme <ds3|ds1|ds2|default> \
#     --mode <light|dark> \
#     --state <empty|seeded|mid-session> \
#     --branch <branch-label> \
#     [--base-url http://localhost:3000]
#
# Output: scripts/audit/captures/comp-<branch>/mobile/<state>/<route>__page.png

# NOTE: do NOT use `set -e`. bdg returns non-zero on selector misses; we want the loop to continue.
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

OUTDIR="${SCRIPT_DIR}/captures/comp-${BRANCH}/mobile/${STATE}"
SEED_FILE="${SCRIPT_DIR}/seeds/${STATE}.json"

if [[ ! -f "$SEED_FILE" ]]; then
  echo "Seed file not found: $SEED_FILE" >&2
  echo "Generate it first: npx tsx scripts/audit/build-seed.ts --state ${STATE} > ${SEED_FILE}" >&2
  exit 1
fi

mkdir -p "$OUTDIR"
echo "Output: $OUTDIR"
echo "Seed:   $SEED_FILE  (state: $STATE)"

SEED_JSON=$(cat "$SEED_FILE")
INJECT_SCRIPT=$(cat <<'EOF'
async function inject(payload) {
  const data = JSON.parse(payload);
  for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
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

if [[ "$THEME" != "default" ]]; then
  bdg dom eval "localStorage.setItem('narraitor-theme','${THEME}'); localStorage.setItem('narraitor-color-scheme','${MODE}'); 'set'" > /dev/null
fi

ESCAPED_SEED=$(printf '%s' "$SEED_JSON" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')
bdg dom eval "(${INJECT_SCRIPT})(${ESCAPED_SEED})" > /dev/null

bdg cdp Page.reload --params '{"ignoreCache":true}' > /dev/null 2>&1
/bin/sleep 3

HIDE_CSS_SCRIPT="(()=>{ if(document.getElementById('audit-hide-css')) return 'present'; const s=document.createElement('style'); s.id='audit-hide-css'; s.textContent='[data-testid=\"devtools-panel-container\"],[data-testid^=\"devtools-panel-\"]{display:none !important;}'; document.head.appendChild(s); return 'injected'; })()"

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

VIEWPORT_W=390
VIEWPORT_H=844
# deviceScaleFactor=1: keep capture widths at CSS-pixel parity (see note in
# component-crawl.sh).
VIEWPORT_PARAMS="{\"width\":${VIEWPORT_W},\"height\":${VIEWPORT_H},\"deviceScaleFactor\":1,\"mobile\":true}"

bdg cdp Emulation.setDeviceMetricsOverride --params "$VIEWPORT_PARAMS" > /dev/null 2>&1
/bin/sleep 1

for route_pair in "${ROUTES[@]}"; do
  slug="${route_pair%%:*}"
  path="${route_pair#*:}"
  echo "=== ${slug} (${STATE}) ==="

  # Re-apply viewport override before each navigation
  bdg cdp Emulation.setDeviceMetricsOverride --params "$VIEWPORT_PARAMS" > /dev/null 2>&1
  bdg cdp Page.navigate --params "{\"url\":\"${BASE_URL}${path}\"}" > /dev/null 2>&1
  /bin/sleep 4

  measured=$(bdg dom eval "window.innerWidth + 'x' + window.innerHeight" 2>/dev/null | tr -d '"' | tr -d ' ')
  if [[ "$measured" != "${VIEWPORT_W}x${VIEWPORT_H}" ]]; then
    echo "  WARN: viewport is $measured (expected ${VIEWPORT_W}x${VIEWPORT_H})"
  fi

  bdg dom eval "$HIDE_CSS_SCRIPT" > /dev/null 2>&1

  # --no-resize keeps PNG dims = CSS-px x dpr (mobile dpr 2 -> 780 wide).
  bdg dom screenshot --no-resize "${OUTDIR}/${slug}__page.png" > /dev/null 2>&1
done

bdg cdp Emulation.clearDeviceMetricsOverride > /dev/null 2>&1
echo "Total mobile captures in ${OUTDIR}: $(/bin/ls "$OUTDIR" | /usr/bin/wc -l | tr -d ' ')"
