# SkillDifficulty Component

A reusable component for displaying skill difficulty levels with appropriate styling and optional descriptions.

## Features

- Visual badges for each difficulty level (Easy, Medium, Hard)
- Color-coded for quick recognition (green, blue, red)
- Optional descriptions that explain what each difficulty level means
- Customizable with className and testId props
- Fully tested with Jest and React Testing Library

## Usage

```tsx
import SkillDifficulty from '@/components/ui/SkillDifficulty';

// Basic usage
<SkillDifficulty difficulty="medium" />

// With description
<SkillDifficulty 
  difficulty="hard" 
  showDescription={true} 
/>

// In a form or list context
<div className="flex justify-between items-center">
  <span>Learning Curve:</span>
  <SkillDifficulty difficulty="easy" />
</div>
```

## Props

| Prop             | Type                       | Default           | Description                                |
|------------------|----------------------------|-------------------|--------------------------------------------|
| difficulty       | 'easy' \| 'medium' \| 'hard' | -                 | The difficulty level to display (required) |
| showDescription  | boolean                    | false             | Whether to show the description text        |
| className        | string                     | ''                | Additional CSS classes to apply             |
| testId           | string                     | 'skill-difficulty' | Test ID for testing purposes                |

## Difficulty Levels

These difficulty levels are defined in `@/lib/constants/skillDifficultyLevels.ts`:

- **Easy**: Quick to learn and doesn't require much practice to become proficient
- **Medium**: Requires moderate practice and dedication to master
- **Hard**: Requires extensive practice and dedication to master

## Design Considerations

- Uses badges with rounded corners for a modern UI appearance
- Color-coded for intuitive recognition of difficulty levels
- Descriptions are optional to allow for compact UI when needed
- Works well in both light and dark themes