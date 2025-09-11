import type { Meta, StoryObj } from '@storybook/react'
import { Settings, Plus, Play, Sparkles, Trash } from 'lucide-react'
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
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'success', 'info', 'warning'],
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
      <Button variant="success">Action Green</Button>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Button size="sm">Small</Button>
      <Button>Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon"><Settings className="w-4 h-4" aria-hidden="true" /></Button>
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
        <Plus className="w-4 h-4" aria-hidden="true" />
        Create
      </Button>
      <Button className="flex items-center gap-2" variant="secondary">
        <Play className="w-4 h-4" aria-hidden="true" />
        Play
      </Button>
      <Button className="flex items-center gap-2" variant="outline">
        <Sparkles className="w-4 h-4" aria-hidden="true" />
        Generate
      </Button>
      <Button className="flex items-center gap-2" variant="destructive">
        <Trash className="w-4 h-4" aria-hidden="true" />
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
