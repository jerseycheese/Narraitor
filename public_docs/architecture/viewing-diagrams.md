# Viewing Architecture Diagrams

> **⚠️ First Time Setup:** Diagrams are not committed to git. Generate them first:
> ```bash
> npm run deps:diagram:all  # Mermaid + SVG + folder view
> npm run deps:diagram:interactive  # Interactive HTML (recommended!)
> ```
> This creates all diagram files in `public_docs/architecture/`. They're ignored by git and must be regenerated after pulling updates.

## Working with Known Violations

The project uses dependency-cruiser's **ignore-known violations** mechanism to manage existing violations while preventing new ones.

### Initial Setup (Already Done)

The baseline file `.dependency-cruiser-known-violations.json` captures all current violations and is tracked in git.

### Daily Workflow

```bash
# Normal validation (ignores known violations)
npm run deps:validate
# ✅ Pass: No new violations
# ⚠️  82 known violations ignored

# Strict validation (shows everything)
npm run deps:validate:strict
# Shows all 82+ violations including known ones
```

### When You Fix Violations

After fixing violations, regenerate the baseline to track progress:

```bash
npm run deps:baseline
git add .dependency-cruiser-known-violations.json
git commit -m "fix: resolve circular dependencies in state stores"
```

The baseline file size will decrease as violations are fixed, providing visible progress metrics.

All diagram files come in multiple formats optimized for different use cases.

## 🎯 Recommended: Interactive HTML

**Best for:** Exploration and understanding relationships

```bash
npm run deps:diagram:interactive
open public_docs/architecture/dependency-graph-interactive.html
```

**Features:**
- ✅ Hover over any module to see incoming/outgoing dependencies
- ✅ Click to highlight and "pin" relationships
- ✅ Self-contained HTML file (works offline)
- ✅ No size limits - handles large codebases
- ✅ Press ESC to clear highlights

This is dependency-cruiser's most powerful visualization option!

## Recommended: Mermaid Live Editor

**Best for:** All diagrams, especially large ones

1. Copy diagram content:
```bash
# Copy any diagram to clipboard
cat public_docs/architecture/component-dependencies.mmd | pbcopy
```

2. Visit https://mermaid.live
3. Paste and explore interactively
4. Export as PNG/SVG if needed

**Advantages:**
- Handles large diagrams
- Interactive pan/zoom
- Export capabilities
- No installation needed

## VS Code Extension

**Best for:** Quick previews of smaller diagrams

1. Install: "Markdown Preview Mermaid Support" or "Mermaid Editor"
2. Open `.mmd` file
3. Run: `Cmd+Shift+V` (Markdown Preview)

**Limitations:**
- May fail on complex diagrams (1000+ lines)
- Error "Cannot set properties of undefined" = diagram too big
- Use Mermaid Live Editor for these cases

## GitHub

**Best for:** Documentation and sharing

Embed in markdown:
````markdown
```mermaid
<!-- paste .mmd file contents -->
```
````

GitHub renders Mermaid automatically in:
- README.md files
- Pull request descriptions
- Issue comments
- Wiki pages

## Mac Native Apps

### GraphViz (for SVG/PDF generation)

If you want high-resolution exports:

```bash
# Install graphviz
brew install graphviz

# Generate SVG
npm run deps:diagram:svg
```

Creates `public_docs/architecture/dependency-graph.svg` that opens in any browser.

## Diagram Files Overview

The diagrams are generated at **multiple zoom levels** to avoid rendering issues:

### Full Project Dependencies

| File | Format | Lines | VS Code | Description |
|------|--------|-------|---------|-------------|
| `dependency-graph-interactive.html` | HTML | N/A | ➖ | **Interactive** - Hover/click exploration |
| `dependency-graph-folders.svg` | SVG | ~200 | ➖ | **Folder-level** - Directory dependencies only |
| `dependency-graph-domains.mmd` | Mermaid | ~54 | ✅ | **Start here** - Domain level (state, components, lib, etc.) |
| `dependency-graph-detailed.mmd` | Mermaid | ~5000+ | ❌ | All files - Use Mermaid Live only |

### Focused Views

| File | Lines | VS Code | Description |
|------|-------|---------|-------------|
| `component-dependencies.mmd` | ~112 | ✅ | High-level component folders |
| `stores-dependencies.mmd` | ~275 | ✅ | Zustand store relationships |

**Recommendation:** 
- **VS Code:** Use `*-domains.mmd` and focused views
- **Deep dive:** Use `*-detailed.mmd` in Mermaid Live Editor
- **Quick overview:** Always start with domains view

## Troubleshooting

### "Syntax error in text" in VS Code
- Diagram is too complex for VS Code
- Use Mermaid Live Editor instead
- Or regenerate with `--collapse` flag for simpler view

### Diagram not rendering in GitHub
- Check for syntax errors: paste into Mermaid Live first
- Ensure proper code fence: \`\`\`mermaid not \`\`\`
- GitHub has 2MB limit per file

### Want higher detail?
Remove the `--collapse` flag from npm scripts to see all files:
```bash
# See every file instead of folders
npx depcruise src/components --include-only '^src/components' --output-type mermaid
```

Warning: Output can be 1000+ lines and may not render in VS Code.
