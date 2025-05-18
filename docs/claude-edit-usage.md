# Claude Edit Script Usage Examples

This document provides examples of how to use the `claude-edit.sh` script in Claude Code commands.

## Basic Usage

The `claude-edit.sh` script can be used to edit files without permission prompts:

```bash
./scripts/claude-edit.sh [file_path] [content]
```

## Example: Updating a Test File

Instead of directly editing a file, which would trigger a confirmation prompt:

```typescript
// Standard approach (will trigger prompt)
describe('WorldCard component', () => {
  it('should render world name and description', () => {
    const world = {
      id: '1',
      name: 'Test World',
      description: 'A test world',
      // More properties...
    };
    // Test implementation...
  });
});
```

Use the `claude-edit.sh` script:

```bash
./scripts/claude-edit.sh src/components/WorldCard.test.tsx "import React from 'react';
import { render, screen } from '@testing-library/react';
import WorldCard from './WorldCard';

describe('WorldCard component', () => {
  it('should render world name and description', () => {
    const world = {
      id: '1',
      name: 'Test World',
      description: 'A test world',
      // More properties...
    };
    // Test implementation...
  });
});
"
```

This will update the file without triggering a confirmation prompt.

## Example: Creating a New File

```bash
./scripts/claude-edit.sh src/utils/dateFormatter.ts "export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}
"
```

## Benefits

- No confirmation prompts
- Pre-approved in settings
- Creates parent directories if they don't exist
- Works for both creating new files and updating existing ones
- Can be used in auto-mode scripts for complete automation

## Limitations

- Not suitable for incremental edits (replaces entire file content)
- Must escape special characters in the content string
- Long file content can be unwieldy as command-line arguments

## When to Use

Use this script in auto-mode scripts and commands where you want to avoid edit confirmation dialogs. It's particularly useful for:

1. Creating new test files
2. Updating configuration files
3. Creating implementation files from templates
4. Any scenario where you want to edit files without prompts
