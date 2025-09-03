import type { Meta, StoryObj } from '@storybook/react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * # Button Component
 * 
 * The Button component is the foundation for all button interactions. For application-level 
 * buttons, prefer using `ActionButtonGroup` which provides consistent styling and icon patterns.
 * 
 * ## Icon Usage Guidelines
 * 
 * When using icons in buttons, follow these established patterns:
 * - **Create/Add**: Plus icon (`+`)
 * - **Play/Start**: Play circle icon (▶️ in circle) 
 * - **Generate**: Lightbulb icon (💡)
 * - **Edit**: Pencil icon (✏️)
 * - **View**: Eye icon (👁️)
 * - **Delete**: Trash icon (🗑️)
 * - **Make Active**: Checkmark in circle (✅)
 * 
 * ## Related Components
 * 
 * - `ActionButtonGroup` - For application-level button groups with consistent styling
 * - `CardActionGroup` - For card-based button layouts
 * 
 * See **06-Patterns/ui-patterns/Button Styling Guidelines** for comprehensive usage patterns.
 */

const meta: Meta<typeof Button> = {
  title: '01-Atoms/buttons/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    disabled: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Button',
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Button size="sm">Small</Button>
      <Button>Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon"><Settings className="w-4 h-4" /></Button>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button>Normal</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button className="flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Create
      </Button>
      <Button className="flex items-center gap-2" variant="secondary">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Play
      </Button>
      <Button className="flex items-center gap-2" variant="outline">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Generate
      </Button>
      <Button className="flex items-center gap-2" variant="destructive">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0016.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of buttons with consistent icon usage. For production use, prefer ActionButtonGroup which handles icons automatically.'
      }
    }
  }
}