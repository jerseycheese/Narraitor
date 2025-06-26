---
title: Naming Conventions
tags: [naming, conventions, code]
created: 2025-04-30
updated: 2025-06-26
---

# Naming Conventions

## Files & Components
- **React Components**: PascalCase (`DevToolsPanel.tsx`, `WorldCard.tsx`)
- **Utility Modules**: kebab-case (`csv-utils.js`, `parser-utils.js`)  
- **Store Files**: camelCase (`worldStore.ts`, `characterStore.ts`)

## CSS & Testing
- **CSS Classes**: Use Tailwind utilities or shadcn/ui classes
- **Test IDs**: kebab-case (`world-card`, `delete-button`)
- **HTML IDs**: camelCase (`mainContentArea`, `worldEditor`)

## Best Practices
- Keep names descriptive and consistent
- Use ARIA attributes for accessibility
- Ensure unique IDs across application