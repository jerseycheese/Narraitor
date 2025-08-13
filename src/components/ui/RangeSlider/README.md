# RangeSlider Component

This component handles all the slider needs in the app. The thing is, we needed sliders that could work with both simple numbers (like percentages) and more complex level systems (like skill proficiency). So instead of building separate components, this one does both.

The key insight was that sometimes you want a slider that just shows "1 to 10", but other times you want "Novice" to "Master" with descriptions of what each level means. This component handles both cases elegantly.

## Features

Here's what makes this slider flexible:

- Works with any min/max range you throw at it
- Can show descriptive labels instead of just numbers (like "Expert" instead of "4")
- Displays the current value clearly so users know where they are
- Optional help text and descriptions for each level
- Handles disabled states properly
- Custom formatting for values (like adding "%" or "$" symbols)
- Matches the design system styling automatically

## Usage

### Basic Usage

```tsx
import RangeSlider from '@/components/ui/RangeSlider';

function MyComponent() {
  const [value, setValue] = useState(5);
  
  return (
    <RangeSlider
      value={value}
      min={1}
      max={10}
      onChange={setValue}
    />
  );
}
```

### With Level Descriptions

```tsx
import RangeSlider, { LevelDescription } from '@/components/ui/RangeSlider';

function MyComponent() {
  const [value, setValue] = useState(3);
  
  const levelDescriptions: LevelDescription[] = [
    { value: 1, label: 'Novice', description: 'Beginner understanding' },
    { value: 2, label: 'Apprentice', description: 'Basic proficiency' },
    { value: 3, label: 'Competent', description: 'Solid performance' },
    { value: 4, label: 'Expert', description: 'Advanced mastery' },
    { value: 5, label: 'Master', description: 'Complete mastery' },
  ];
  
  return (
    <RangeSlider
      value={value}
      min={1}
      max={5}
      onChange={setValue}
      levelDescriptions={levelDescriptions}
      showLevelDescription={true}
    />
  );
}
```

### Custom Value Formatting

```tsx
import RangeSlider from '@/components/ui/RangeSlider';

function MyComponent() {
  const [percent, setPercent] = useState(50);
  
  return (
    <RangeSlider
      value={percent}
      min={0}
      max={100}
      onChange={setPercent}
      labelText="Completion"
      valueFormatter={(value) => `${value}%`}
    />
  );
}
```

## Props

| Prop                  | Type                        | Default           | Description                                           |
|-----------------------|-----------------------------|-------------------|-------------------------------------------------------|
| value                 | number                      | -                 | Current value of the slider                           |
| min                   | number                      | -                 | Minimum allowed value                                 |
| max                   | number                      | -                 | Maximum allowed value                                 |
| onChange              | (value: number) => void     | -                 | Callback when the value changes                       |
| disabled              | boolean                     | false             | Whether the slider is disabled                        |
| showLabel             | boolean                     | true              | Whether to show the header label                      |
| labelText             | string                      | 'Default Value'   | Custom label for the header                           |
| levelDescriptions     | LevelDescription[]          | []                | Level descriptions for range values                   |
| showLevelDescription  | boolean                     | false             | Whether to show the level description                 |
| valueFormatter        | (value: number) => string   | undefined         | Custom formatter for the displayed value              |
| testId                | string                      | 'range-slider'    | Test ID for the component                             |

## Level Description Interface

```ts
interface LevelDescription {
  value: number;
  label: string;
  description?: string;
}
```