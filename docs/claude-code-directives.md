---
title: "Claude Code Command Directives"
type: guide
category: development
tags: [claude, automation, directives]
created: 2025-05-18
updated: 2025-06-08
---

# Claude Code Command Directives

This document describes the directives used in Claude Code command files to control execution behavior.

## Overview

Claude Code commands can include special directives at the top of the file that control how they're executed. These directives must be at the very beginning of the file as comments.

## Available Directives

### Auto-Approve Directives

```
# AUTO-APPROVE: [mode]
```

Where `[mode]` can be:
- `ALL`: Automatically approve all commands in the file
- `NONE`: Require approval for all commands (default behavior)
- Specific patterns: Approve only matching commands

### Auto-Accept Edits Directives

```
# AUTO-ACCEPT-EDITS: [mode]
```

Where `[mode]` can be:
- `ALL`: Automatically accept all edit suggestions
- `NONE`: Require confirmation for all edits (default behavior)
- Specific patterns: Accept only matching edits

## Example Usage

### Fully Automatic Command (no prompts)

```
# AUTO-APPROVE: ALL
# AUTO-ACCEPT-EDITS: ALL

Command content here...
```

This configuration will run without any prompts for command approval or edit confirmation.

### Selective Auto-Approval

```
# AUTO-APPROVE: git checkout:* git pull:* git add:*
# AUTO-ACCEPT-EDITS: NONE

Command content here...
```

This configuration will automatically approve git checkout, pull, and add commands, but will require approval for all other commands and all edits.

## Usage in Narraitor Project

In the Narraitor project, we use these directives in the following ways:

- `do-issue-auto.md`: Uses `AUTO-APPROVE: ALL` and `AUTO-ACCEPT-EDITS: ALL` for completely automatic execution
- Other commands: Use default behavior (require approval for commands and edits)

## Related Configuration

In addition to these directives, the `.claude/settings.local.json` file contains pre-approved commands and patterns. For commands that need to run without prompts but aren't covered by the directives, consider adding them to the pre-approved list in this file.

## Further Reading

For more information, see the [Claude Code security documentation](https://docs.anthropic.com/en/docs/claude-code/security).
