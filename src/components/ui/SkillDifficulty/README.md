# SkillDifficulty Component

This little component solves a specific problem: showing skill difficulty in a way that's immediately recognizable. You know how in RPGs, skills have difficulty ratings? We needed a consistent way to display those that users could glance at and instantly understand.

The challenge was making it both visually clear and accessible. So we went with color-coded badges that also include text, plus optional descriptions for when users need more context about what each difficulty level actually means.

## Features

Here's what makes this component useful:

- Clean badges for each difficulty level (Easy, Medium, Hard)
- Color coding that follows conventions (green = easy, blue = medium, red = hard)
- Optional descriptions that explain what each difficulty actually means in practice
- Easy to customize with your own CSS classes
- Properly tested so it won't break on you

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
  <span>Difficulty:</span>
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

The levels are defined in `@/lib/constants/skillDifficultyLevels.ts` and they're pretty self-explanatory:

- **Easy**: Quick to learn and doesn't require much practice to become proficient
- **Medium**: Requires moderate practice and dedication to master
- **Hard**: Requires extensive practice and dedication to master

## Design Considerations

We kept the design simple but effective:

- Rounded badges look modern and friendly
- Color coding is intuitive - most people expect green = easy, red = hard
- Descriptions are optional so you can use this in tight spaces too
- Works in both light and dark themes without any extra configuration