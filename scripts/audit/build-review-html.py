#!/usr/bin/env python3
"""Build the cross-theme audit review HTML (#1129).

Discovers captures under:
  scripts/audit/captures/comp-<branch>/<viewport>/<state>/<route>__<component>.png

Emits:
  scripts/audit/review/index.html  -- route list w/ live mark counts
  scripts/audit/review/<route>.html (x14)  -- one page per route
  scripts/audit/review.html  -- legacy redirect stub

Mark schema (v3):
  Storage key: narraitor-audit-marks-v3
  Value:       { marked, note, category, why, updatedAt }
  Migration: lazy v2 -> v3 on first load (v2 left untouched for rollback);
             v2 migration also chains to v1 if v3 + v2 are both absent.

Per-cell toolbar:
  - Category radios (bug | tooling | intentional | unclear)
  - Why one-line summary
  - Note (freeform scratchpad)
  - Copy re-capture command (single-route playwright-crawl invocation)
"""
import os
import json
from collections import defaultdict
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
CAPTURES_ROOT = REPO_ROOT / "scripts" / "audit" / "captures"
REVIEW_DIR = REPO_ROOT / "scripts" / "audit" / "review"
LEGACY_OUTPUT_PATH = REPO_ROOT / "scripts" / "audit" / "review.html"

# branch label -> capture subdir name under captures/
DIRS = {
    "develop": "comp-develop-default",
    "DS3": "comp-integration-ds3-light",
    "DS1": "comp-integration-ds1-light",
    "DS2": "comp-integration-ds2-light",
}

# Meta used to assemble the per-cell re-capture command. Keys mirror DIRS.
BRANCH_META = {
    "develop": {"theme": "default", "mode": "light", "branchArg": "develop-default"},
    "DS3":     {"theme": "ds3",     "mode": "light", "branchArg": "integration-ds3-light"},
    "DS1":     {"theme": "ds1",     "mode": "light", "branchArg": "integration-ds1-light"},
    "DS2":     {"theme": "ds2",     "mode": "light", "branchArg": "integration-ds2-light"},
}

VIEWPORTS = ["desktop", "mobile"]
# `mid-session` was dropped from the default pipeline — visually redundant
# with `seeded` for triage. Old marks/captures with the segment still parse.
STATES = ["empty", "seeded"]

MAPPED_COMPONENTS = {
    "global-nav": {"develop": "nav", "DS3": "nav", "DS1": "nav", "DS2": "nav"},
}
SUPPRESSED_COMPONENTS = {"nav", "header"}

ROUTE_ORDER = [
    "home", "about",
    "worlds", "worlds-detail", "worlds-edit", "worlds-create",
    "worlds-play", "worlds-play-journal",
    "characters", "characters-detail", "characters-edit", "characters-create",
    "play", "settings",
]


def route_sort_key(r):
    try:
        return (0, ROUTE_ORDER.index(r))
    except ValueError:
        return (1, r)


def component_sort_key(c):
    order = {"page": 0, "header": 1, "nav": 2, "form": 3, "main": 4}
    if c in order:
        return (order[c], 0)
    if c.startswith("main-section-"):
        try:
            return (5, int(c.replace("main-section-", "")))
        except ValueError:
            return (5, 0)
    return (9, c)


def discover():
    """Walk captures dir; return { (route, component): set(states) } and discovered branches."""
    pairs = defaultdict(set)
    branches_seen = set()
    for branch_label, subdir in DIRS.items():
        base = CAPTURES_ROOT / subdir
        if not base.is_dir():
            continue
        branches_seen.add(branch_label)
        for vp in VIEWPORTS:
            for state in STATES:
                state_dir = base / vp / state
                if not state_dir.is_dir():
                    continue
                for png in state_dir.glob("*.png"):
                    stem = png.stem
                    if "__" not in stem:
                        continue
                    route, component = stem.split("__", 1)
                    pairs[(route, component)].add(state)
    return pairs, branches_seen


def cell_id(route, component_label, viewport, state, theme):
    return f"{route}__{component_label}__{viewport}__{state}__{theme}"


def rel_capture_path(branch_subdir, viewport, state, route, component):
    """Path relative to a per-route page in review/."""
    return f"../captures/{branch_subdir}/{viewport}/{state}/{route}__{component}.png"


def absolute_capture_path(branch_subdir, viewport, state, route, component):
    return CAPTURES_ROOT / branch_subdir / viewport / state / f"{route}__{component}.png"


SHARED_CSS = """
  :root { --col-gap: 8px; --row-gap: 16px; }
  html, body { margin: 0; padding: 0; font-family: -apple-system, system-ui, sans-serif; background: #fafafa; color: #222; }
  .sticky-shell { position: sticky; top: 0; z-index: 100; border-bottom: 1px solid #444; }
  header.top {
    background: #1a1a1a; color: #fff; padding: 12px 16px;
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  }
  header.top h1 { font-size: 14px; margin: 0; font-weight: 600; }
  header.top .legend { display: flex; gap: 12px; font-size: 12px; }
  header.top .legend .col { padding: 2px 8px; border-radius: 3px; }
  header.top .legend .develop { background: #6b7280; }
  header.top .legend .ds3 { background: #4338ca; }
  header.top .legend .ds1 { background: #92400e; }
  header.top .legend .ds2 { background: #166534; }
  header.top a.back { color: #9cf; font-size: 12px; text-decoration: none; padding: 2px 6px; border-radius: 2px; }
  header.top a.back:hover { background: #444; color: #fff; }
  header.top .nav-routes { display: flex; gap: 4px; align-items: center; font-size: 12px; }
  header.top .nav-routes a { color: #9cf; text-decoration: none; padding: 2px 8px; border-radius: 2px; background: #2a2a2a; }
  header.top .nav-routes a:hover { background: #444; color: #fff; }
  header.top .nav-routes .current { color: #fff; font-weight: 600; padding: 2px 8px; }
  main { padding: 16px; max-width: 100%; }
  section.route {
    margin-bottom: 32px; background: #fff; border-radius: 6px;
    padding: 12px 16px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  section.route h2 {
    font-size: 18px; margin: 0 0 12px; padding-bottom: 6px;
    border-bottom: 1px solid #e5e5e5;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
  }
  .component-row {
    display: grid; grid-template-columns: 180px repeat(4, 1fr);
    gap: var(--col-gap); margin-bottom: var(--row-gap);
    align-items: start;
  }
  .component-row .label {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 12px; color: #555; padding-top: 28px; line-height: 1.3;
    word-break: break-word;
  }
  .cell {
    border: 1px solid #e5e5e5; border-radius: 4px; overflow: hidden;
    background: #f3f4f6; position: relative; min-height: 100px;
    display: flex; flex-direction: column;
  }
  .cell .header {
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.04em; padding: 4px 8px; color: #fff;
    display: flex; align-items: center; gap: 8px;
  }
  .cell.develop .header { background: #6b7280; }
  .cell.ds3 .header { background: #4338ca; }
  .cell.ds1 .header { background: #92400e; }
  .cell.ds2 .header { background: #166534; }
  .cell img {
    display: block; width: auto; max-width: 100%; height: auto;
    cursor: zoom-in; background: #fff; align-self: flex-start;
  }
  body.fit-cell .cell img { width: 100%; max-width: 100%; }
  .cell.empty {
    display: flex; align-items: center; justify-content: center;
    color: #999; font-size: 12px; padding: 24px; background: #f9f9f9;
  }
  .cell.empty::after { content: "(not captured)"; }

  /* Lightbox */
  #lightbox {
    display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.92);
    z-index: 1000; align-items: center; justify-content: center; cursor: zoom-out;
  }
  #lightbox.open { display: flex; }
  #lightbox img { max-width: 96vw; max-height: 96vh; box-shadow: 0 4px 24px rgba(0,0,0,0.5); }

  .controls { display: flex; gap: 12px; align-items: center; font-size: 12px; flex-wrap: wrap; }
  .controls label { display: flex; align-items: center; gap: 4px; cursor: pointer; }
  .controls input[type=checkbox] { margin: 0; }

  .state-chips { display: inline-flex; gap: 4px; align-items: center; }
  .state-chip {
    background: #374151; color: #fff; border: 1px solid #4b5563;
    border-radius: 3px; padding: 4px 10px; font-size: 12px; cursor: pointer;
    font-family: inherit;
  }
  .state-chip.active { background: #2563eb; border-color: #1d4ed8; }
  .state-chip:hover { background: #4b5563; }
  .state-chip.active:hover { background: #1d4ed8; }

  body.hide-empty .component-row.all-empty,
  body.hide-empty .cell.empty { display: none; }
  body.compact .cell img { max-height: 360px; object-fit: cover; object-position: top; }

  .cell .mark-btn {
    margin-left: auto; background: rgba(255,255,255,0.18);
    color: #fff; border: 1px solid rgba(255,255,255,0.35);
    border-radius: 3px; font-size: 10px; font-weight: 600;
    padding: 2px 6px; cursor: pointer;
    text-transform: none; letter-spacing: 0; line-height: 1.2;
  }
  .cell .mark-btn:hover { background: rgba(255,255,255,0.28); }
  .cell.marked { border: 3px solid #dc2626; }
  .cell.marked .mark-btn { background: #dc2626; border-color: #b91c1c; color: #fff; }
  .cell.marked .mark-btn::before { content: "x "; }
  .cell.pending-recapture { animation: cellPulse 2s ease-out; }
  @keyframes cellPulse {
    0%   { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.9); border-color: #7c3aed; }
    100% { box-shadow: 0 0 0 8px rgba(124, 58, 237, 0); }
  }
  .cell .toolbar {
    display: none;
    padding: 6px 8px; background: #fef2f2; border-top: 1px solid #fecaca;
    font-size: 11px;
  }
  .cell.marked .toolbar { display: block; }
  .cell .toolbar input[type=text],
  .cell .toolbar textarea {
    width: 100%; box-sizing: border-box;
    border: 1px solid #fca5a5; border-radius: 3px;
    padding: 4px 6px; font-size: 12px; font-family: inherit;
    background: #fff;
  }
  .cell .toolbar input[type=text]:focus,
  .cell .toolbar textarea:focus { outline: 2px solid #dc2626; outline-offset: -1px; }
  .cell .toolbar .field { margin-bottom: 6px; }
  .cell .toolbar .field-label {
    display: block; font-size: 10px; font-weight: 600;
    color: #7f1d1d; text-transform: uppercase; letter-spacing: 0.04em;
    margin-bottom: 2px;
  }
  .cell .toolbar .cat-chips { display: flex; gap: 4px; flex-wrap: wrap; }
  .cell .toolbar .cat-chip {
    background: #fff; border: 1px solid #fca5a5; border-radius: 3px;
    padding: 2px 8px; font-size: 11px; cursor: pointer; font-family: inherit;
    color: #7f1d1d;
  }
  .cell .toolbar .cat-chip.active { background: #7f1d1d; color: #fff; border-color: #7f1d1d; }
  .cell .toolbar .cat-chip[data-cat="needs-design"].active { background: #6d28d9; border-color: #6d28d9; }
  .cell .toolbar .cat-chip[data-cat="bug"].active        { background: #b91c1c; border-color: #b91c1c; }
  .cell .toolbar .cat-chip[data-cat="tooling"].active    { background: #b45309; border-color: #b45309; }
  .cell .toolbar .cat-chip[data-cat="intentional"].active{ background: #15803d; border-color: #15803d; }
  .cell .toolbar .cat-chip[data-cat="unclear"].active    { background: #6b7280; border-color: #6b7280; }
  .cell .toolbar .recapture-btn {
    background: #1d4ed8; color: #fff; border: 0; border-radius: 3px;
    padding: 4px 10px; font-size: 11px; cursor: pointer;
    font-family: inherit; font-weight: 600;
  }
  .cell .toolbar .recapture-btn:hover { background: #1e40af; }
  .cell .toolbar textarea { min-height: 32px; resize: vertical; font-size: 11px; }
  .cell.cat-needs-design { border-color: #6d28d9; }
  .cell.cat-bug         { border-color: #b91c1c; }
  .cell.cat-tooling     { border-color: #b45309; }
  .cell.cat-intentional { border-color: #15803d; }
  .cell.cat-unclear     { border-color: #6b7280; }

  .marks-cluster {
    display: flex; align-items: center; gap: 8px;
    border-left: 1px solid #444; padding-left: 12px; margin-left: 4px;
    font-size: 12px;
  }
  .marks-cluster .count {
    background: #dc2626; color: #fff; border-radius: 10px;
    padding: 2px 8px; font-weight: 600; min-width: 18px; text-align: center;
  }
  .marks-cluster button {
    background: #374151; color: #fff; border: 1px solid #4b5563;
    border-radius: 3px; padding: 4px 10px; font-size: 12px; cursor: pointer;
    font-family: inherit;
  }
  .marks-cluster button:hover { background: #4b5563; }
  .marks-cluster button.danger { background: #7f1d1d; border-color: #991b1b; }
  .marks-cluster button.danger:hover { background: #991b1b; }

  body.only-marked .component-row:not(.has-marked) { display: none; }
  body.only-marked section.route:not(.has-marked) { display: none; }

  .component-row.suppressed { display: none; }
  body.show-suppressed .component-row.suppressed { display: grid; }
  .component-row.suppressed .label::after { content: " (hidden)"; color: #b91c1c; font-style: italic; }

  .component-row .label[data-mapped] { color: #1d4ed8; }
  .component-row .label[data-mapped]::after { content: " *"; }
  .mapped-tooltip {
    display: inline-block; margin-left: 4px;
    font-size: 10px; color: #6b7280; cursor: help; vertical-align: super;
  }

  .vp-badge, .state-badge {
    display: inline-block; font-size: 9px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.05em;
    padding: 1px 6px; border-radius: 8px; margin-top: 2px;
  }
  .vp-badge.desktop { background: #dbeafe; color: #1e3a8a; border: 1px solid #93c5fd; margin-right: 4px; }
  .vp-badge.mobile  { background: #fef3c7; color: #78350f; border: 1px solid #fcd34d; margin-right: 4px; }
  .state-badge.empty       { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
  .state-badge.seeded      { background: #dcfce7; color: #14532d; border: 1px solid #86efac; }
  .state-badge.mid-session { background: #ede9fe; color: #4c1d95; border: 1px solid #c4b5fd; }

  .component-row.vp-mobile { background: #fffbeb; padding: 4px; border-radius: 4px; }
  body.hide-desktop .component-row.vp-desktop { display: none; }
  body.hide-mobile .component-row.vp-mobile { display: none; }

  body.hide-state-empty       .component-row.state-empty       { display: none; }
  body.hide-state-seeded      .component-row.state-seeded      { display: none; }
  body.hide-state-mid-session .component-row.state-mid-session { display: none; }

  .overlay {
    display: none; position: fixed; inset: 0; z-index: 1100;
    background: rgba(0,0,0,0.6); align-items: center; justify-content: center;
  }
  .overlay.open { display: flex; }
  .overlay .panel {
    background: #fff; border-radius: 6px; width: min(720px, 92vw);
    max-height: 80vh; padding: 16px; display: flex; flex-direction: column; gap: 8px;
  }
  .overlay h3 { margin: 0; font-size: 14px; }
  .overlay textarea {
    flex: 1; min-height: 320px; font-family: ui-monospace, monospace; font-size: 12px;
    border: 1px solid #ddd; border-radius: 4px; padding: 8px; resize: vertical;
  }
  .overlay .actions { display: flex; gap: 8px; justify-content: flex-end; }
  .overlay button {
    background: #1a1a1a; color: #fff; border: 0; border-radius: 3px;
    padding: 6px 12px; font-size: 12px; cursor: pointer;
  }
  .overlay .hint { font-size: 11px; color: #555; }
  .overlay .err  { font-size: 12px; color: #b91c1c; min-height: 16px; }

  /* Index-page table */
  table.routes-index {
    width: 100%; border-collapse: collapse; background: #fff;
    border-radius: 6px; overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  table.routes-index th, table.routes-index td {
    padding: 8px 12px; text-align: left; font-size: 13px;
    border-bottom: 1px solid #eee;
  }
  table.routes-index th { background: #f3f4f6; font-weight: 600; }
  table.routes-index td a {
    color: #1d4ed8; text-decoration: none; font-family: ui-monospace, monospace;
  }
  table.routes-index td a:hover { text-decoration: underline; }
  table.routes-index td.num { text-align: right; font-variant-numeric: tabular-nums; }
  table.routes-index .marked-count.has-marks { color: #b91c1c; font-weight: 600; }
  table.routes-index .unresolved-count.has-unresolved { color: #b45309; font-weight: 600; }
  table.routes-index .breakdown {
    font-size: 11px; color: #555; margin-left: 6px; font-variant-numeric: tabular-nums;
  }
"""


# JS shared by all pages: mark schema, migration, persistence, helpers.
# Note: Python format strings would conflict with the JS template literals,
# so we use plain string concatenation and inject only via .replace() below.
SHARED_JS_PRELUDE = r"""
  const STORAGE_KEY = 'narraitor-audit-marks-v3';
  const STORAGE_KEY_V2 = 'narraitor-audit-marks-v2';
  const STORAGE_KEY_V1 = 'narraitor-audit-marks-v1';
  // Tracks which routes have had their DS cells auto-prefilled as needs-design.
  // Once a route is in here, the auto-prefill on page load is skipped.
  const PREFILLED_KEY = 'narraitor-audit-prefilled-v1';
  const STATES = ['empty', 'seeded'];
  const VALID_CATEGORIES = ['needs-design','bug','tooling','intentional','unclear'];
  const ROUTE_ORDER = __ROUTE_ORDER__;
  const COMPONENT_ORDER = {"page":0,"header":1,"nav":2,"form":3,"main":4};
  const THEME_ORDER = ["DS3","DS1","DS2","develop"];
  const BRANCH_META = __BRANCH_META__;

  function componentSortKey(c) {
    if (c in COMPONENT_ORDER) return [COMPONENT_ORDER[c], 0];
    if (c.startsWith("main-section-")) {
      const n = parseInt(c.replace("main-section-",""), 10);
      return [5, isNaN(n) ? 0 : n];
    }
    return [9, c];
  }

  // Pre-v3 ID migration: v1 (4 segments) -> v2 (5 segments) by inserting __seeded.
  function migrateLegacyId(id) {
    const parts = id.split('__');
    if (parts.length < 4) return id;
    const last = parts[parts.length - 1];
    const second = parts[parts.length - 2];
    const third = parts[parts.length - 3];
    const isTheme = ['DS1','DS2','DS3','develop'].includes(last);
    const isViewport = ['desktop','mobile'].includes(second);
    const alreadyHasState = STATES.includes(third);
    if (isTheme && isViewport && !alreadyHasState) {
      const head = parts.slice(0, parts.length - 1).join('__');
      return head + '__seeded__' + last;
    }
    return id;
  }

  function migrateMarksV1ToV2(input) {
    const out = {};
    let migrated = 0;
    for (const [id, m] of Object.entries(input || {})) {
      const newId = migrateLegacyId(id);
      if (newId !== id) migrated++;
      out[newId] = m;
    }
    return { marks: out, migrated };
  }

  // v2 -> v3: add category, why, updatedAt; preserve marked + note.
  function upgradeV2ValueToV3(v) {
    if (!v || typeof v !== 'object') return null;
    return {
      marked: !!v.marked,
      note: typeof v.note === 'string' ? v.note : '',
      category: v.category && VALID_CATEGORIES.includes(v.category) ? v.category : null,
      why: typeof v.why === 'string' ? v.why : '',
      updatedAt: v.updatedAt || new Date().toISOString(),
    };
  }

  function migrateV2ObjectToV3(v2obj) {
    const out = {};
    for (const [id, m] of Object.entries(v2obj || {})) {
      out[id] = upgradeV2ValueToV3(m);
    }
    return out;
  }

  function loadMarks() {
    try {
      const v3 = localStorage.getItem(STORAGE_KEY);
      if (v3) return JSON.parse(v3);
      // No v3 yet — try v2 (lazy migrate; leave v2 untouched for rollback).
      const v2raw = localStorage.getItem(STORAGE_KEY_V2);
      if (v2raw) {
        const v3marks = migrateV2ObjectToV3(JSON.parse(v2raw));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(v3marks));
        console.info('[audit] migrated ' + Object.keys(v3marks).length + ' v2 marks to v3 (v2 untouched).');
        return v3marks;
      }
      // No v3 or v2 — try v1 and migrate v1 -> v2 -> v3 in one pass.
      const v1raw = localStorage.getItem(STORAGE_KEY_V1);
      if (v1raw) {
        const { marks: v2marks, migrated } = migrateMarksV1ToV2(JSON.parse(v1raw));
        const v3marks = migrateV2ObjectToV3(v2marks);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(v3marks));
        console.info('[audit] migrated ' + migrated + ' v1 IDs through to v3.');
        return v3marks;
      }
    } catch (e) { console.warn(e); }
    return {};
  }

  function saveMarks(m) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); } catch (e) {}
  }
"""


def _shared_js_prelude():
    return (
        SHARED_JS_PRELUDE
        .replace("__ROUTE_ORDER__", json.dumps(ROUTE_ORDER))
        .replace("__BRANCH_META__", json.dumps(BRANCH_META))
    )


def html_head(title, extra_css=""):
    return (
        "<!DOCTYPE html>\n"
        "<html lang=\"en\">\n"
        "<head>\n"
        "<meta charset=\"utf-8\">\n"
        f"<title>{title}</title>\n"
        f"<style>\n{SHARED_CSS}\n{extra_css}\n</style>\n"
        "</head>\n"
        "<body>\n"
    )


def render_route_section(route, components, branches_seen):
    """Return the HTML for a single route section (the cell grid)."""
    parts = [f'<section class="route" id="route-{route}">\n  <h2>{route}</h2>\n']

    def render_row(label_text, branch_to_component, viewport, state,
                   suppressed=False, mapped=False, tooltip=""):
        row_classes = (
            f'component-row vp-{viewport} state-{state}'
            + (' suppressed' if suppressed else '')
        )
        out = [f'  <div class="{row_classes}" data-viewport="{viewport}" data-state="{state}">\n']
        label_attrs = ' data-mapped="1"' if mapped else ''
        tip_html = f'<span class="mapped-tooltip" title="{tooltip}">i</span>' if tooltip else ''
        vp_badge = f'<span class="vp-badge {viewport}">{viewport}</span>'
        state_badge = f'<span class="state-badge {state}">{state}</span>'
        out.append(
            f'    <div class="label"{label_attrs}>{label_text}{tip_html}'
            f'<br>{vp_badge}{state_badge}</div>\n'
        )
        for theme_key, subdir in DIRS.items():
            theme_class = theme_key.lower()
            src_component = branch_to_component.get(theme_key)
            if src_component is None:
                out.append('    <div class="cell empty"></div>\n')
                continue
            abs_path = absolute_capture_path(subdir, viewport, state, route, src_component)
            if abs_path.exists():
                rel = rel_capture_path(subdir, viewport, state, route, src_component)
                cid = cell_id(route, label_text, viewport, state, theme_key)
                caption = (
                    f'{theme_key} -- {route}/{label_text} '
                    f'({viewport}/{state}; src: {src_component})'
                )
                img_scale = '2' if src_component == 'page' else '1'
                out.append(
                    f'    <div class="cell {theme_class}" data-cell-id="{cid}" '
                    f'data-route="{route}" data-component="{label_text}" '
                    f'data-viewport="{viewport}" data-state="{state}" '
                    f'data-theme="{theme_key}" data-img-scale="{img_scale}">\n'
                )
                out.append(
                    f'      <div class="header"><span>{theme_key}</span>'
                    f'<button type="button" class="mark-btn" data-action="toggle-mark">Mark</button></div>\n'
                )
                out.append(
                    f'      <img src="{rel}" alt="{theme_key} {route}/{label_text}/{viewport}/{state}" '
                    f'data-caption="{caption}" loading="lazy">\n'
                )
                # New v3 toolbar: category chips, why, note, copy re-capture command
                out.append(
                    '      <div class="toolbar">\n'
                    '        <div class="field">\n'
                    '          <span class="field-label">Category</span>\n'
                    '          <div class="cat-chips" data-action="cat-chips">\n'
                    '            <button type="button" class="cat-chip" data-cat="needs-design">needs-design</button>\n'
                    '            <button type="button" class="cat-chip" data-cat="bug">bug</button>\n'
                    '            <button type="button" class="cat-chip" data-cat="tooling">tooling</button>\n'
                    '            <button type="button" class="cat-chip" data-cat="intentional">intentional</button>\n'
                    '            <button type="button" class="cat-chip" data-cat="unclear">unclear</button>\n'
                    '          </div>\n'
                    '        </div>\n'
                    '        <div class="field">\n'
                    '          <span class="field-label">Why (one-line summary)</span>\n'
                    '          <input type="text" data-action="why" placeholder="e.g. header overflows mobile viewport">\n'
                    '        </div>\n'
                    '        <div class="field">\n'
                    '          <span class="field-label">Note (freeform scratchpad)</span>\n'
                    '          <textarea data-action="note" rows="2" placeholder="extra detail (optional)..."></textarea>\n'
                    '        </div>\n'
                    '        <div class="field" style="margin-bottom:0; display:flex; justify-content:flex-end;">\n'
                    '          <button type="button" class="recapture-btn" data-action="recapture">Copy re-capture command</button>\n'
                    '        </div>\n'
                    '      </div>\n'
                )
                out.append('    </div>\n')
            else:
                out.append('    <div class="cell empty"></div>\n')
        out.append('  </div>\n')
        return ''.join(out)

    for state in STATES:
        for logical_label, branch_map in MAPPED_COMPONENTS.items():
            any_present = any(
                absolute_capture_path(DIRS[bk], "desktop", state, route, src).exists()
                for bk, src in branch_map.items()
            )
            if any_present:
                tip = "Both branches use <nav>; develop is a horizontal top bar, integration is a vertical sidebar."
                parts.append(render_row(
                    logical_label, branch_map, "desktop", state,
                    mapped=True, tooltip=tip,
                ))

        for c in components:
            same = {bk: c for bk in DIRS.keys()}
            is_suppressed = c in SUPPRESSED_COMPONENTS
            if any(absolute_capture_path(DIRS[bk], "desktop", state, route, c).exists() for bk in DIRS):
                parts.append(render_row(c, same, "desktop", state, suppressed=is_suppressed))
            if c == "page" and any(
                absolute_capture_path(DIRS[bk], "mobile", state, route, c).exists() for bk in DIRS
            ):
                parts.append(render_row(c, same, "mobile", state, suppressed=is_suppressed))

    parts.append('</section>\n')
    return ''.join(parts)


def render_route_page(route, components, branches_seen, sorted_routes):
    """Return the full HTML for one per-route page."""
    title = f'Cross-Theme Audit (#1129) — {route}'

    idx = sorted_routes.index(route)
    prev_route = sorted_routes[idx - 1] if idx > 0 else None
    next_route = sorted_routes[idx + 1] if idx < len(sorted_routes) - 1 else None

    head = html_head(title)
    body_open = '<div class="sticky-shell">\n<header class="top">\n'
    body_open += f'  <a class="back" href="index.html">&larr; Index</a>\n'
    body_open += f'  <h1>{route}</h1>\n'
    body_open += '  <div class="legend">\n'
    body_open += '    <span class="col develop">develop</span>\n'
    body_open += '    <span class="col ds3">DS3</span>\n'
    body_open += '    <span class="col ds1">DS1</span>\n'
    body_open += '    <span class="col ds2">DS2</span>\n'
    body_open += '  </div>\n'
    body_open += '  <div class="controls">\n'
    body_open += '    <span class="state-chips" role="group" aria-label="State filter">\n'
    body_open += '      <span style="font-size: 11px; color: #aaa;">State:</span>\n'
    for s in STATES:
        active = ' active' if s == 'seeded' else ''
        body_open += f'      <button type="button" class="state-chip{active}" data-state="{s}">{s}</button>\n'
    body_open += '    </span>\n'
    body_open += '    <label><input type="checkbox" id="hide-empty"> Hide missing</label>\n'
    body_open += '    <label><input type="checkbox" id="compact"> Compact</label>\n'
    body_open += '    <label title="Stretch images to cell width"><input type="checkbox" id="fit-cell"> Fit to cell</label>\n'
    body_open += '    <label><input type="checkbox" id="only-marked"> Only marked</label>\n'
    body_open += '    <label><input type="checkbox" id="show-suppressed"> Show hidden rows</label>\n'
    body_open += '    <label><input type="checkbox" id="hide-desktop"> Hide desktop</label>\n'
    body_open += '    <label><input type="checkbox" id="hide-mobile"> Hide mobile</label>\n'
    body_open += '  </div>\n'
    body_open += '  <div class="marks-cluster">\n'
    body_open += '    <span>Marked (route):</span>\n'
    body_open += '    <span class="count" id="mark-count">0</span>\n'
    body_open += '    <button id="prefill-ds-btn" type="button" title="Mark every DS cell that has no mark yet as needs-design (gap-fill, never overwrites your existing marks)">Fill DS gaps</button>\n'
    body_open += '    <button id="export-md-btn" type="button">Export markdown</button>\n'
    body_open += '    <button id="export-json-btn" type="button">Export JSON</button>\n'
    body_open += '    <button id="import-json-btn" type="button">Import JSON</button>\n'
    body_open += '    <button id="clear-route-btn" type="button" class="danger">Clear (route)</button>\n'
    body_open += '  </div>\n'
    body_open += '</header>\n'

    # prev/next nav row
    body_open += '<nav class="toc" style="background:#2a2a2a;color:#ccc;padding:6px 16px;font-size:12px;display:flex;gap:8px;align-items:center;border-top:1px solid #444;">\n'
    body_open += '  <span class="nav-routes">\n'
    if prev_route:
        body_open += f'    <a href="{prev_route}.html">&larr; {prev_route}</a>\n'
    body_open += f'    <span class="current">{route}</span>\n'
    if next_route:
        body_open += f'    <a href="{next_route}.html">{next_route} &rarr;</a>\n'
    body_open += '  </span>\n'
    body_open += '</nav>\n'
    body_open += '</div>\n<main>\n'

    section_html = render_route_section(route, components, branches_seen)

    overlays = """</main>

<div id="lightbox" class="overlay">
  <img id="lightbox-img" src="" alt="">
  <div id="lightbox-caption" style="position: fixed; top: 12px; left: 50%; transform: translateX(-50%); color: #fff; font-family: ui-monospace, monospace; font-size: 13px; background: rgba(0,0,0,0.6); padding: 6px 12px; border-radius: 4px;"></div>
</div>

<div id="md-overlay" class="overlay">
  <div class="panel">
    <h3>Audit marks (markdown) -- this route only</h3>
    <textarea id="md-text" readonly></textarea>
    <div class="actions">
      <button id="md-copy" type="button">Copy</button>
      <button class="overlay-close" data-overlay="md-overlay" type="button">Close</button>
    </div>
  </div>
</div>

<div id="json-export-overlay" class="overlay">
  <div class="panel">
    <h3>Marks (raw JSON) -- all routes</h3>
    <textarea id="json-export-text" readonly></textarea>
    <div class="actions">
      <button id="json-export-copy" type="button">Copy</button>
      <button class="overlay-close" data-overlay="json-export-overlay" type="button">Close</button>
    </div>
  </div>
</div>

<div id="json-import-overlay" class="overlay">
  <div class="panel">
    <h3>Import marks (paste raw JSON)</h3>
    <p class="hint">Paste JSON exported from another instance. Legacy IDs without a state segment are migrated to <code>__seeded</code>; v2 values are upgraded to v3 (category=null, why="", updatedAt=now). Existing marks with the same ID are overwritten.</p>
    <textarea id="json-import-text" placeholder='{"home__page__desktop__seeded__DS3":{"marked":true,"note":"...","category":"bug","why":"...","updatedAt":"..."}}'></textarea>
    <div class="err" id="json-import-err"></div>
    <div class="actions">
      <button id="json-import-apply" type="button">Apply</button>
      <button class="overlay-close" data-overlay="json-import-overlay" type="button">Close</button>
    </div>
  </div>
</div>
"""

    js = f"""<script>
{_shared_js_prelude()}

  const ROUTE = {json.dumps(route)};
  let marks = loadMarks();

  function applyMarkState(cell) {{
    const id = cell.dataset.cellId;
    const m = marks[id];
    const noteInput = cell.querySelector('textarea[data-action="note"]');
    const whyInput = cell.querySelector('input[data-action="why"]');
    const chips = cell.querySelectorAll('.cat-chip');
    cell.classList.remove('cat-bug','cat-tooling','cat-intentional','cat-unclear');
    chips.forEach(c => c.classList.remove('active'));
    if (m && m.marked) {{
      cell.classList.add('marked');
      if (noteInput) noteInput.value = m.note || '';
      if (whyInput) whyInput.value = m.why || '';
      if (m.category) {{
        cell.classList.add('cat-' + m.category);
        const chip = cell.querySelector('.cat-chip[data-cat="' + m.category + '"]');
        if (chip) chip.classList.add('active');
      }}
    }} else {{
      cell.classList.remove('marked');
      if (noteInput) noteInput.value = '';
      if (whyInput) whyInput.value = '';
    }}
  }}

  function updateRowSectionFlags() {{
    document.querySelectorAll('.component-row').forEach(row => {{
      row.classList.toggle('has-marked', !!row.querySelector('.cell.marked'));
    }});
    document.querySelectorAll('section.route').forEach(sec => {{
      sec.classList.toggle('has-marked', !!sec.querySelector('.cell.marked'));
    }});
  }}

  function updateCount() {{
    const n = Object.entries(marks).filter(([id, m]) => m && m.marked && id.startsWith(ROUTE + '__')).length;
    document.getElementById('mark-count').textContent = n;
  }}

  function writeMark(id, partial) {{
    const existing = marks[id] || {{ marked: false, note: '', category: null, why: '', updatedAt: null }};
    const next = Object.assign({{}}, existing, partial, {{ updatedAt: new Date().toISOString() }});
    if (!next.marked && !next.note && !next.why && !next.category) {{
      delete marks[id];
    }} else {{
      marks[id] = next;
    }}
    saveMarks(marks);
    updateCount();
  }}

  function buildRecaptureCommand(cell) {{
    const route = cell.dataset.route;
    const viewport = cell.dataset.viewport;
    const state = cell.dataset.state;
    const themeKey = cell.dataset.theme;
    const meta = BRANCH_META[themeKey];
    if (!meta) return null;
    return 'npx tsx scripts/audit/playwright-crawl.ts'
      + ' --branch ' + meta.branchArg
      + ' --viewport ' + viewport
      + ' --state ' + state
      + ' --theme ' + meta.theme
      + ' --mode ' + meta.mode
      + ' --route ' + route;
  }}

  function loadPrefilledFlags() {{
    try {{ return JSON.parse(localStorage.getItem(PREFILLED_KEY) || '{{}}'); }}
    catch (e) {{ return {{}}; }}
  }}
  function savePrefilledFlags(f) {{
    try {{ localStorage.setItem(PREFILLED_KEY, JSON.stringify(f)); }} catch (e) {{}}
  }}

  // Gap-fill: only adds entries for DS cells that have no existing mark.
  // Returns the count of cells filled. Develop is excluded (it's the baseline).
  function prefillDsCellsAsNeedsDesign() {{
    const dsCells = Array.from(document.querySelectorAll('.cell[data-cell-id]'))
      .filter(c => ['DS1','DS2','DS3'].includes(c.dataset.theme));
    let added = 0;
    const ts = new Date().toISOString();
    for (const cell of dsCells) {{
      const id = cell.dataset.cellId;
      if (!marks[id]) {{
        marks[id] = {{ marked: true, note: '', category: 'needs-design', why: '', updatedAt: ts }};
        added++;
      }}
    }}
    if (added > 0) saveMarks(marks);
    return added;
  }}

  // Auto-prefill on first visit per route.
  const prefillFlags = loadPrefilledFlags();
  if (!prefillFlags[ROUTE]) {{
    const added = prefillDsCellsAsNeedsDesign();
    prefillFlags[ROUTE] = true;
    savePrefilledFlags(prefillFlags);
    if (added > 0) console.info('[audit] auto-prefilled ' + added + ' DS cells for ' + ROUTE + ' as needs-design.');
  }}

  document.querySelectorAll('.cell[data-cell-id]').forEach(applyMarkState);
  updateRowSectionFlags();
  updateCount();

  // Lightbox
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbCap = document.getElementById('lightbox-caption');
  document.querySelectorAll('.cell img').forEach(img => {{
    img.addEventListener('click', () => {{
      lbImg.src = img.src;
      lbCap.textContent = img.dataset.caption || '';
      lb.classList.add('open');
    }});
  }});
  lb.addEventListener('click', () => lb.classList.remove('open'));
  document.addEventListener('keydown', e => {{
    if (e.key === 'Escape') document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
  }});

  // Mark toggle
  document.querySelectorAll('button[data-action="toggle-mark"]').forEach(btn => {{
    btn.addEventListener('click', e => {{
      e.stopPropagation();
      const cell = btn.closest('.cell');
      const id = cell.dataset.cellId;
      const isMarked = !cell.classList.contains('marked');
      writeMark(id, {{ marked: isMarked }});
      applyMarkState(cell);
      const row = cell.closest('.component-row');
      const sec = cell.closest('section.route');
      row.classList.toggle('has-marked', !!row.querySelector('.cell.marked'));
      sec.classList.toggle('has-marked', !!sec.querySelector('.cell.marked'));
      if (isMarked) {{
        const why = cell.querySelector('input[data-action="why"]');
        if (why) setTimeout(() => why.focus(), 0);
      }}
    }});
  }});

  // Why / note inputs (debounced save)
  let saveTimer = null;
  function bindInput(sel, field) {{
    document.querySelectorAll(sel).forEach(inp => {{
      const handler = () => {{
        const cell = inp.closest('.cell');
        if (!cell.classList.contains('marked')) return;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {{
          writeMark(cell.dataset.cellId, {{ [field]: inp.value }});
        }}, 250);
      }};
      inp.addEventListener('input', handler);
      inp.addEventListener('blur', () => {{
        const cell = inp.closest('.cell');
        if (cell.classList.contains('marked')) writeMark(cell.dataset.cellId, {{ [field]: inp.value }});
      }});
    }});
  }}
  bindInput('input[data-action="why"]', 'why');
  bindInput('textarea[data-action="note"]', 'note');

  // Category chips
  document.querySelectorAll('.cat-chip').forEach(chip => {{
    chip.addEventListener('click', () => {{
      const cell = chip.closest('.cell');
      if (!cell.classList.contains('marked')) {{
        // Mark the cell first so the category sticks
        writeMark(cell.dataset.cellId, {{ marked: true }});
      }}
      const cat = chip.dataset.cat;
      const isActive = chip.classList.contains('active');
      writeMark(cell.dataset.cellId, {{ category: isActive ? null : cat }});
      applyMarkState(cell);
      const row = cell.closest('.component-row');
      row.classList.toggle('has-marked', !!row.querySelector('.cell.marked'));
    }});
  }});

  // Re-capture command (copy to clipboard, flash purple)
  document.querySelectorAll('button[data-action="recapture"]').forEach(btn => {{
    btn.addEventListener('click', async () => {{
      const cell = btn.closest('.cell');
      const cmd = buildRecaptureCommand(cell);
      if (!cmd) return;
      try {{
        await navigator.clipboard.writeText(cmd);
        btn.textContent = 'Copied!';
        setTimeout(() => {{ btn.textContent = 'Copy re-capture command'; }}, 1500);
      }} catch (e) {{
        prompt('Copy this command:', cmd);
      }}
      cell.classList.remove('pending-recapture');
      void cell.offsetWidth; // force reflow so the animation restarts
      cell.classList.add('pending-recapture');
    }});
  }});

  // Toggles
  document.getElementById('hide-empty').addEventListener('change', e => document.body.classList.toggle('hide-empty', e.target.checked));
  document.getElementById('compact').addEventListener('change', e => document.body.classList.toggle('compact', e.target.checked));
  document.getElementById('fit-cell').addEventListener('change', e => document.body.classList.toggle('fit-cell', e.target.checked));
  document.getElementById('only-marked').addEventListener('change', e => document.body.classList.toggle('only-marked', e.target.checked));
  document.getElementById('show-suppressed').addEventListener('change', e => document.body.classList.toggle('show-suppressed', e.target.checked));
  document.getElementById('hide-desktop').addEventListener('change', e => document.body.classList.toggle('hide-desktop', e.target.checked));
  document.getElementById('hide-mobile').addEventListener('change', e => document.body.classList.toggle('hide-mobile', e.target.checked));

  // True-scale rendering (1x for selector captures, 0.5x for retina full-page).
  const RETINA_THRESHOLD = 1500;
  function applyTrueScale(img) {{
    if (!img.naturalWidth) return;
    const cssWidth = img.naturalWidth > RETINA_THRESHOLD
      ? Math.round(img.naturalWidth / 2)
      : img.naturalWidth;
    img.style.maxWidth = 'min(100%, ' + cssWidth + 'px)';
  }}
  document.querySelectorAll('.cell img').forEach(img => {{
    if (img.complete && img.naturalWidth > 0) applyTrueScale(img);
    else img.addEventListener('load', () => applyTrueScale(img), {{ once: true }});
  }});

  // State chips
  document.querySelectorAll('.state-chip').forEach(chip => {{
    chip.addEventListener('click', () => {{
      const state = chip.dataset.state;
      chip.classList.toggle('active');
      document.body.classList.toggle('hide-state-' + state, !chip.classList.contains('active'));
    }});
  }});
  STATES.forEach(s => {{
    const chip = document.querySelector('.state-chip[data-state="' + s + '"]');
    if (chip && !chip.classList.contains('active')) document.body.classList.add('hide-state-' + s);
  }});

  // Manual top-up: fill any DS cells that don't have a mark yet
  document.getElementById('prefill-ds-btn').addEventListener('click', () => {{
    const added = prefillDsCellsAsNeedsDesign();
    if (added > 0) {{
      document.querySelectorAll('.cell[data-cell-id]').forEach(applyMarkState);
      updateRowSectionFlags();
      updateCount();
      alert('Filled ' + added + ' missing DS cells as needs-design.');
    }} else {{
      alert('All DS cells in this route already have marks.');
    }}
  }});

  // Clear-route. Also resets the prefilled flag so a reload re-triggers auto-prefill.
  document.getElementById('clear-route-btn').addEventListener('click', () => {{
    const ids = Object.entries(marks).filter(([id, m]) => m && m.marked && id.startsWith(ROUTE + '__')).map(([id]) => id);
    if (!ids.length) {{ alert('No marks for this route.'); return; }}
    if (!confirm('Clear ' + ids.length + ' marks for route ' + ROUTE + '?\\n\\nReloading the page will re-prefill all DS cells as needs-design.')) return;
    ids.forEach(id => delete marks[id]);
    saveMarks(marks);
    const flags = loadPrefilledFlags();
    delete flags[ROUTE];
    savePrefilledFlags(flags);
    document.querySelectorAll('.cell[data-cell-id]').forEach(applyMarkState);
    updateRowSectionFlags();
    updateCount();
  }});

  function buildMarkdown() {{
    const items = [];
    Object.entries(marks).forEach(([id, m]) => {{
      if (!m || !m.marked) return;
      if (!id.startsWith(ROUTE + '__')) return;
      const parts = id.split('__');
      const themeKey = parts[parts.length - 1];
      const state = parts[parts.length - 2];
      const viewport = parts[parts.length - 3];
      const route = parts[0];
      const component = parts.slice(1, parts.length - 3).join('__');
      items.push({{ component, viewport, state, theme: themeKey,
                   note: m.note || '', why: m.why || '', category: m.category || '' }});
    }});
    items.sort((a, b) => {{
      const ak = componentSortKey(a.component);
      const bk = componentSortKey(b.component);
      if (ak[0] !== bk[0]) return ak[0] - bk[0];
      if (ak[1] !== bk[1]) return ak[1] < bk[1] ? -1 : 1;
      const sd = STATES.indexOf(a.state) - STATES.indexOf(b.state);
      if (sd !== 0) return sd;
      const td = THEME_ORDER.indexOf(a.theme) - THEME_ORDER.indexOf(b.theme);
      if (td !== 0) return td;
      return a.viewport === b.viewport ? 0 : (a.viewport === 'desktop' ? -1 : 1);
    }});
    const date = new Date().toISOString().split('T')[0];
    const lines = ['# Audit marks -- ' + ROUTE + ' -- ' + items.length + ' items -- ' + date, ''];
    items.forEach(it => {{
      const catTag = it.category ? ' [' + it.category + ']' : '';
      const whyTxt = it.why ? ': ' + it.why : '';
      const noteTxt = it.note ? '  -- ' + it.note : '';
      lines.push('- [ ] **' + it.theme + ' ' + it.component + '** [' + it.viewport + '/' + it.state + ']' + catTag + whyTxt + noteTxt);
    }});
    return lines.join('\\n');
  }}

  function openOverlay(id) {{ document.getElementById(id).classList.add('open'); }}
  function closeOverlay(id) {{ document.getElementById(id).classList.remove('open'); }}
  document.querySelectorAll('.overlay-close').forEach(b => b.addEventListener('click', () => closeOverlay(b.dataset.overlay)));
  document.querySelectorAll('.overlay').forEach(o => {{
    o.addEventListener('click', e => {{ if (e.target === o) o.classList.remove('open'); }});
  }});

  document.getElementById('export-md-btn').addEventListener('click', async () => {{
    const md = buildMarkdown();
    const ta = document.getElementById('md-text');
    ta.value = md;
    openOverlay('md-overlay');
    try {{ await navigator.clipboard.writeText(md); document.getElementById('md-copy').textContent = 'Copied!'; setTimeout(()=>{{document.getElementById('md-copy').textContent='Copy';}},1500);}}
    catch (e) {{ ta.focus(); ta.select(); }}
  }});
  document.getElementById('md-copy').addEventListener('click', async () => {{
    const ta = document.getElementById('md-text');
    try {{ await navigator.clipboard.writeText(ta.value); document.getElementById('md-copy').textContent='Copied!'; setTimeout(()=>{{document.getElementById('md-copy').textContent='Copy';}},1500);}}
    catch (e) {{ ta.focus(); ta.select(); }}
  }});

  document.getElementById('export-json-btn').addEventListener('click', () => {{
    const ta = document.getElementById('json-export-text');
    ta.value = JSON.stringify(marks, null, 2);
    openOverlay('json-export-overlay');
  }});
  document.getElementById('json-export-copy').addEventListener('click', async () => {{
    const ta = document.getElementById('json-export-text');
    try {{ await navigator.clipboard.writeText(ta.value); document.getElementById('json-export-copy').textContent='Copied!'; setTimeout(()=>{{document.getElementById('json-export-copy').textContent='Copy';}},1500);}}
    catch (e) {{ ta.focus(); ta.select(); }}
  }});

  document.getElementById('import-json-btn').addEventListener('click', () => {{
    document.getElementById('json-import-text').value = '';
    document.getElementById('json-import-err').textContent = '';
    openOverlay('json-import-overlay');
  }});
  document.getElementById('json-import-apply').addEventListener('click', () => {{
    const ta = document.getElementById('json-import-text');
    const err = document.getElementById('json-import-err');
    err.textContent = '';
    let parsed;
    try {{ parsed = JSON.parse(ta.value); }}
    catch (e) {{ err.textContent = 'Invalid JSON: ' + e.message; return; }}
    if (!parsed || typeof parsed !== 'object') {{ err.textContent = 'Expected an object.'; return; }}
    // First migrate v1 IDs (4 segments) -> v2 IDs (5 segments)
    const {{ marks: idMigrated, migrated }} = migrateMarksV1ToV2(parsed);
    // Then upgrade each value v2 -> v3 (preserves marked + note, fills new fields)
    Object.entries(idMigrated).forEach(([id, m]) => {{
      marks[id] = upgradeV2ValueToV3(m);
    }});
    saveMarks(marks);
    document.querySelectorAll('.cell[data-cell-id]').forEach(applyMarkState);
    updateRowSectionFlags();
    updateCount();
    closeOverlay('json-import-overlay');
    alert('Imported ' + Object.keys(idMigrated).length + ' marks (' + migrated + ' legacy IDs migrated to __seeded; values upgraded to v3).');
  }});
</script>
</body>
</html>
"""

    return head + body_open + section_html + overlays + js


def render_index_page(sorted_routes, route_to_components, branches_seen):
    """Return the index page HTML."""
    title = 'Cross-Theme Audit (#1129) — Index'
    head = html_head(title)

    # Compute static cell counts per route (used for the 'Cells' column).
    # A cell exists if there's at least one capture for (route, component, viewport, state, branch).
    cell_counts = {}
    for r in sorted_routes:
        components = sorted(route_to_components[r], key=component_sort_key)
        n = 0
        for state in STATES:
            for branch_label in DIRS:
                # mapped (global-nav) — desktop only
                for logical_label, branch_map in MAPPED_COMPONENTS.items():
                    src = branch_map.get(branch_label)
                    if src and absolute_capture_path(DIRS[branch_label], "desktop", state, r, src).exists():
                        n += 1
            for c in components:
                for branch_label in DIRS:
                    if absolute_capture_path(DIRS[branch_label], "desktop", state, r, c).exists():
                        n += 1
                if c == "page":
                    for branch_label in DIRS:
                        if absolute_capture_path(DIRS[branch_label], "mobile", state, r, c).exists():
                            n += 1
        cell_counts[r] = n

    body = '<div class="sticky-shell">\n<header class="top">\n'
    body += '  <h1>Narraitor Cross-Theme Audit (#1129) -- Index</h1>\n'
    body += '  <div class="legend">\n'
    body += '    <span class="col develop">develop (baseline)</span>\n'
    body += '    <span class="col ds3">DS3</span>\n'
    body += '    <span class="col ds1">DS1</span>\n'
    body += '    <span class="col ds2">DS2</span>\n'
    body += '  </div>\n'
    body += '  <div class="marks-cluster">\n'
    body += '    <span>Total marked:</span>\n'
    body += '    <span class="count" id="total-marked">0</span>\n'
    body += '    <button id="export-json-btn" type="button">Export JSON</button>\n'
    body += '    <button id="import-json-btn" type="button">Import JSON</button>\n'
    body += '    <button id="clear-all-btn" type="button" class="danger">Clear all</button>\n'
    body += '  </div>\n'
    body += '</header>\n'
    body += '</div>\n<main>\n'

    body += '<table class="routes-index">\n'
    body += '  <thead><tr>\n'
    body += '    <th>Route</th><th class="num">Cells</th><th class="num">Marked</th>'
    body += '<th class="num">Unresolved</th><th>Categories</th>\n'
    body += '  </tr></thead>\n  <tbody>\n'
    for r in sorted_routes:
        n = cell_counts[r]
        body += f'    <tr data-route="{r}">\n'
        body += f'      <td><a href="{r}.html">{r}</a></td>\n'
        body += f'      <td class="num cells-count">{n}</td>\n'
        body += f'      <td class="num marked-count">0</td>\n'
        body += f'      <td class="num unresolved-count">0</td>\n'
        body += f'      <td class="cat-breakdown" style="font-family:ui-monospace,monospace;font-size:11px;color:#555;"></td>\n'
        body += f'    </tr>\n'
    body += '  </tbody>\n</table>\n'
    body += '<p style="margin-top:16px;font-size:12px;color:#555;">Marked counts read from <code>narraitor-audit-marks-v3</code> in this browser. Unresolved = marked cells with no category set or category=unclear.</p>\n'

    overlays = """</main>

<div id="json-export-overlay" class="overlay">
  <div class="panel">
    <h3>Marks (raw JSON) -- all routes</h3>
    <textarea id="json-export-text" readonly></textarea>
    <div class="actions">
      <button id="json-export-copy" type="button">Copy</button>
      <button class="overlay-close" data-overlay="json-export-overlay" type="button">Close</button>
    </div>
  </div>
</div>

<div id="json-import-overlay" class="overlay">
  <div class="panel">
    <h3>Import marks (paste raw JSON)</h3>
    <p class="hint">Legacy IDs without state segments are migrated to <code>__seeded</code>; v2 values are upgraded to v3.</p>
    <textarea id="json-import-text"></textarea>
    <div class="err" id="json-import-err"></div>
    <div class="actions">
      <button id="json-import-apply" type="button">Apply</button>
      <button class="overlay-close" data-overlay="json-import-overlay" type="button">Close</button>
    </div>
  </div>
</div>
"""

    js = f"""<script>
{_shared_js_prelude()}

  let marks = loadMarks();

  function recompute() {{
    const perRoute = {{}};
    let total = 0;
    Object.entries(marks).forEach(([id, m]) => {{
      if (!m || !m.marked) return;
      total++;
      const route = id.split('__')[0];
      if (!perRoute[route]) perRoute[route] = {{ marked: 0, unresolved: 0, cats: {{}} }};
      perRoute[route].marked++;
      const cat = m.category;
      if (!cat || cat === 'unclear') perRoute[route].unresolved++;
      const key = cat || 'unset';
      perRoute[route].cats[key] = (perRoute[route].cats[key] || 0) + 1;
    }});
    document.getElementById('total-marked').textContent = total;
    document.querySelectorAll('tr[data-route]').forEach(tr => {{
      const route = tr.dataset.route;
      const r = perRoute[route] || {{ marked: 0, unresolved: 0, cats: {{}} }};
      const mc = tr.querySelector('.marked-count');
      const uc = tr.querySelector('.unresolved-count');
      const cb = tr.querySelector('.cat-breakdown');
      mc.textContent = r.marked;
      mc.classList.toggle('has-marks', r.marked > 0);
      uc.textContent = r.unresolved;
      uc.classList.toggle('has-unresolved', r.unresolved > 0);
      const catParts = [];
      ['needs-design','bug','tooling','intentional','unclear','unset'].forEach(c => {{
        if (r.cats[c]) catParts.push(c + ':' + r.cats[c]);
      }});
      cb.textContent = catParts.join('  ');
    }});
  }}

  recompute();
  // Recompute when localStorage changes in another tab (per-route page edits).
  window.addEventListener('storage', e => {{
    if (e.key === STORAGE_KEY) {{
      marks = loadMarks();
      recompute();
    }}
  }});
  // Manual refresh on focus (same tab can't get a 'storage' event for itself).
  window.addEventListener('focus', () => {{
    marks = loadMarks();
    recompute();
  }});

  function openOverlay(id) {{ document.getElementById(id).classList.add('open'); }}
  function closeOverlay(id) {{ document.getElementById(id).classList.remove('open'); }}
  document.querySelectorAll('.overlay-close').forEach(b => b.addEventListener('click', () => closeOverlay(b.dataset.overlay)));
  document.querySelectorAll('.overlay').forEach(o => {{
    o.addEventListener('click', e => {{ if (e.target === o) o.classList.remove('open'); }});
  }});

  document.getElementById('export-json-btn').addEventListener('click', () => {{
    document.getElementById('json-export-text').value = JSON.stringify(marks, null, 2);
    openOverlay('json-export-overlay');
  }});
  document.getElementById('json-export-copy').addEventListener('click', async () => {{
    const ta = document.getElementById('json-export-text');
    try {{ await navigator.clipboard.writeText(ta.value); document.getElementById('json-export-copy').textContent='Copied!'; setTimeout(()=>{{document.getElementById('json-export-copy').textContent='Copy';}},1500);}}
    catch (e) {{ ta.focus(); ta.select(); }}
  }});

  document.getElementById('import-json-btn').addEventListener('click', () => {{
    document.getElementById('json-import-text').value = '';
    document.getElementById('json-import-err').textContent = '';
    openOverlay('json-import-overlay');
  }});
  document.getElementById('json-import-apply').addEventListener('click', () => {{
    const ta = document.getElementById('json-import-text');
    const err = document.getElementById('json-import-err');
    err.textContent = '';
    let parsed;
    try {{ parsed = JSON.parse(ta.value); }}
    catch (e) {{ err.textContent = 'Invalid JSON: ' + e.message; return; }}
    if (!parsed || typeof parsed !== 'object') {{ err.textContent = 'Expected an object.'; return; }}
    const {{ marks: idMigrated, migrated }} = migrateMarksV1ToV2(parsed);
    Object.entries(idMigrated).forEach(([id, m]) => {{ marks[id] = upgradeV2ValueToV3(m); }});
    saveMarks(marks);
    recompute();
    closeOverlay('json-import-overlay');
    alert('Imported ' + Object.keys(idMigrated).length + ' marks (' + migrated + ' legacy IDs migrated; values upgraded to v3).');
  }});

  document.getElementById('clear-all-btn').addEventListener('click', () => {{
    const n = Object.values(marks).filter(m => m && m.marked).length;
    if (!n) {{ alert('No marks to clear.'); return; }}
    if (!confirm('Clear all ' + n + ' marks across every route? This cannot be undone.')) return;
    marks = {{}};
    saveMarks(marks);
    recompute();
  }});
</script>
</body>
</html>
"""

    return head + body + overlays + js


def render_legacy_redirect():
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Audit review moved</title>
<meta http-equiv="refresh" content="0; url=review/index.html">
<style>body{font-family:-apple-system,system-ui,sans-serif;padding:24px;}</style>
</head>
<body>
<h1>Moved</h1>
<p>The audit review now lives at <a href="review/index.html">review/index.html</a>.</p>
</body>
</html>
"""


def render_html():
    pairs, branches_seen = discover()

    routes = defaultdict(set)
    for (route, component), states in pairs.items():
        routes[route].add(component)

    sorted_routes = sorted(routes.keys(), key=route_sort_key)

    REVIEW_DIR.mkdir(exist_ok=True)

    # Per-route pages
    for r in sorted_routes:
        components = sorted(routes[r], key=component_sort_key)
        page = render_route_page(r, components, branches_seen, sorted_routes)
        (REVIEW_DIR / f"{r}.html").write_text(page)

    # Index page
    index_html = render_index_page(sorted_routes, routes, branches_seen)
    (REVIEW_DIR / "index.html").write_text(index_html)

    # Legacy redirect stub at the old review.html path
    LEGACY_OUTPUT_PATH.write_text(render_legacy_redirect())

    print(f"Wrote {REVIEW_DIR}/ ({len(sorted_routes)} per-route pages + index.html)")
    print(f"Branches discovered: {sorted(branches_seen)}")
    print(f"Legacy stub at: {LEGACY_OUTPUT_PATH}")


if __name__ == '__main__':
    render_html()
