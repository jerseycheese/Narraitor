# Claude Code Chrome Integration Setup

**Date**: 2026-01-28
**Purpose**: Replace Playwright/Chrome DevTools MCP with built-in Chrome integration

## Current Status

✅ **Claude Code**: v2.1.21 (meets requirement of v2.0.73+)
⚠️ **Chrome Extension**: Need to verify installed
📋 **MCP Servers to Remove**: `playwright`, `browsermcp`

## Step 1: Install Chrome Extension

1. Open Google Chrome
2. Install [Claude in Chrome extension](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn)
3. Verify it's version 1.0.36 or higher:
   - Click extension icon → Settings → About
4. Ensure you're logged into Claude with a paid plan (Pro/Team/Enterprise)

## Step 2: Test Chrome Integration

**Exit this Claude Code session** and start a new one with Chrome enabled:

```bash
claude --chrome
```

Then test with:

```
Go to http://localhost:3000, take a screenshot, and tell me what you see
```

Expected behavior:
- Chrome opens
- Navigates to localhost:3000
- Takes a screenshot
- Describes the page content

## Step 3: Remove MCP Servers

Once Chrome integration is confirmed working, edit `~/.claude/settings.local.json`:

**Remove these sections** (lines 91-96 and 59-64):

```json
{
  "mcpServers": {
    // DELETE THIS:
    "browsermcp": {
      "command": "npx",
      "args": ["@browsermcp/mcp@latest"]
    },

    // DELETE THIS:
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    },

    // KEEP THESE:
    "google-workspace": { ... },
    "google-jobs": { ... },
    "desktop-commander": { ... },
    "exa-remote": { ... },
    "semgrep": { ... },
    "filesystem": { ... }
  }
}
```

**Also remove MCP permissions** from the `permissions.allow` array (lines 14-38):

```json
{
  "permissions": {
    "allow": [
      // DELETE THESE:
      "mcp__browsermcp__browser_navigate",
      "mcp__browsermcp__browser_go_back",
      "mcp__browsermcp__browser_go_forward",
      "mcp__browsermcp__browser_snapshot",
      "mcp__browsermcp__browser_click",
      "mcp__browsermcp__browser_hover",
      "mcp__browsermcp__browser_type",
      "mcp__browsermcp__browser_select_option",
      "mcp__browsermcp__browser_press_key",
      "mcp__browsermcp__browser_wait",
      "mcp__browsermcp__browser_get_console_logs",
      "mcp__browsermcp__browser_screenshot",
      "mcp__playwright__*",

      // KEEP EVERYTHING ELSE
      "WebFetch(...)",
      "Bash(...)",
      // etc.
    ]
  }
}
```

## Step 4: Verify Cleanup

After removing the MCP servers:

```bash
claude --chrome
```

Then run:

```
/mcp
```

You should see:
- ✅ `claude-in-chrome` server (built-in)
- ❌ No `playwright` or `browsermcp` servers

## Benefits of Built-in Chrome Integration

**vs Playwright MCP**:
- Faster (no NPX startup delay)
- Better integrated with Claude Code
- Uses your actual Chrome session (logged-in state)
- Native messaging instead of MCP overhead
- Supports authenticated web apps without API connectors

**vs Chrome DevTools MCP (browsermcp)**:
- Official Anthropic support
- Better error handling
- Built-in session recording (GIFs)
- Simpler permission model

## Troubleshooting

**Extension not detected**:
1. Verify Chrome extension v1.0.36+ is installed
2. Restart Chrome
3. Restart Claude Code
4. Run `/chrome` and select "Reconnect extension"

**Permission errors**:
- Check Chrome extension permissions
- Ensure Claude Code has native messaging host installed
- Restart both Chrome and Claude Code

## Enable by Default (Optional)

To avoid typing `--chrome` every time:

```bash
claude --chrome
```

Then run `/chrome` and select "Enabled by default"

**Note**: This increases context usage since browser tools are always loaded. Only enable if you use Chrome frequently.

## Documentation

- [Claude Code Chrome Docs](https://code.claude.com/docs/en/chrome)
- [Chrome Extension Guide](https://support.anthropic.com/en/articles/12012173)

## Files to Clean Up After Removal

Once MCP servers are removed and Chrome integration is verified, you can delete:

- `/TUTORIAL_VALIDATION_RESULTS.md` (if desired - contains Playwright test results)
- `/OPTION1_FIX_RESULTS.md` (implementation notes)
- `/OPTION2_FIX_RESULTS.md` (implementation notes)
- `/CHROME_INTEGRATION_SETUP.md` (this file)

**Keep these**:
- `/KNOWN_ISSUE_TUTORIAL_TRANSITION.md` (permanent documentation of the race condition bug)
