import type { Meta, StoryObj } from '@storybook/react'
import { primitiveColors, semanticColors, endingTones, loreCategories } from '@/lib/design-tokens'

const meta: Meta = {
  title: '00-Foundation/Design Tokens',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Color Swatch Component
const ColorSwatch = ({ color, name, description }: { color: string; name: string; description?: string }) => (
  <div className="flex items-center gap-3 p-3 border rounded-lg">
    <div className="w-12 h-12 rounded border shadow-sm flex-shrink-0 overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 48 48" role="img" aria-label={`${name} swatch`}>
        <rect x="0" y="0" width="48" height="48" fill={color} />
      </svg>
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-medium text-sm">{name}</div>
      <div className="text-xs text-muted-foreground font-mono">{color}</div>
      {description && <div className="text-xs text-muted-foreground mt-1">{description}</div>}
    </div>
  </div>
)

// Color Scale Component
const ColorScale = ({ colors, name }: { colors: Record<string, string>; name: string }) => (
  <div className="space-y-3">
    <h3 className="font-semibold text-lg">{name}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {Object.entries(colors).map(([shade, color]) => (
        <ColorSwatch key={`${name}-${shade}`} color={color} name={`${name}-${shade}`} />
      ))}
    </div>
  </div>
)

export const PrimitiveTokens: Story = {
  name: 'Primitive Tokens',
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Primitive Color Tokens</h2>
        <p className="text-muted-foreground mb-6">
          Foundation colors that are genre-neutral and used as building blocks for semantic tokens.
        </p>
      </div>
      
      <ColorScale colors={primitiveColors.gray} name="Gray Scale" />
      <ColorScale colors={primitiveColors.blue} name="Blue (Primary)" />
      <ColorScale colors={primitiveColors.green} name="Green (Success)" />
      <ColorScale colors={primitiveColors.red} name="Red (Danger)" />
      <ColorScale colors={primitiveColors.amber} name="Amber (Warning)" />
    </div>
  ),
}

export const SemanticTokens: Story = {
  name: 'Semantic Tokens',
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Semantic Color Tokens</h2>
        <p className="text-muted-foreground mb-6">
          Colors with contextual meaning that map to primitive tokens.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Primary Actions</h3>
          <div className="space-y-2">
            <ColorSwatch color={semanticColors.primary.default} name="Primary" description="Main brand actions" />
            <ColorSwatch color={semanticColors.primary.hover} name="Primary Hover" />
            <ColorSwatch color={semanticColors.primary.active} name="Primary Active" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Secondary Actions</h3>
          <div className="space-y-2">
            <ColorSwatch color={semanticColors.secondary.default} name="Secondary" description="Secondary actions" />
            <ColorSwatch color={semanticColors.secondary.hover} name="Secondary Hover" />
            <ColorSwatch color={semanticColors.secondary.active} name="Secondary Active" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Status Colors</h3>
          <div className="space-y-2">
            <ColorSwatch color={semanticColors.success.default} name="Success" description="Positive outcomes" />
            <ColorSwatch color={semanticColors.warning.default} name="Warning" description="Caution states" />
            <ColorSwatch color={semanticColors.danger.default} name="Danger" description="Error states" />
            <ColorSwatch color={semanticColors.info.default} name="Info" description="Informational content" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Surface & Text</h3>
          <div className="space-y-2">
            <ColorSwatch color={semanticColors.surface.default} name="Surface" description="Card/panel backgrounds" />
            <ColorSwatch color={semanticColors.text.primary} name="Text Primary" description="Main text content" />
            <ColorSwatch color={semanticColors.text.secondary} name="Text Secondary" description="Secondary text" />
            <ColorSwatch color={semanticColors.text.muted} name="Text Muted" description="Subtle text" />
          </div>
        </div>
      </div>
    </div>
  ),
}

export const ContextualTokens: Story = {
  name: 'Contextual Tokens',
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Contextual Color Tokens</h2>
        <p className="text-muted-foreground mb-6">
          Genre-specific colors used only in storytelling contexts.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Story Ending Tones</h3>
          <div className="space-y-2">
            {Object.entries(endingTones).map(([tone, colors]) => (
              <ColorSwatch 
                key={tone}
                color={colors.background} 
                name={tone.charAt(0).toUpperCase() + tone.slice(1)} 
                description={`${tone} story ending theme`}
              />
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Lore Categories</h3>
          <div className="space-y-2">
            {Object.entries(loreCategories).map(([category, colors]) => (
              <div key={category} className="p-3 border rounded-lg">
                <div className="font-medium text-sm">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </div>
                <div className="text-xs font-mono mt-1">
                  bg: {colors.background} | border: {colors.border}
                </div>
                <div className="mt-2">
                  <svg width="100%" height="32" viewBox="0 0 200 32" role="img" aria-label={`${category} example`}>
                    <rect x="0" y="0" width="200" height="32" fill={colors.background} stroke={colors.border} />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
}

export const TokenUsageExamples: Story = {
  name: 'Usage Examples',
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Token Usage Examples</h2>
        <p className="text-muted-foreground mb-6">
          Examples showing how to use design tokens in components.
        </p>
      </div>
      
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3">Button Variants</h3>
          <div className="flex gap-3 flex-wrap">
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
              Primary Button
            </button>
            <button className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md">
              Secondary Button
            </button>
            <button className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-md">
              Destructive Button
            </button>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-3">Status Indicators</h3>
          <div className="space-y-3">
            <div className="bg-success-background border border-success-border text-success-foreground p-3 rounded-md">
              <div className="font-medium">Success Message</div>
              <div className="text-sm">Operation completed successfully</div>
            </div>
            <div className="bg-warning-background border border-warning-border text-warning-foreground p-3 rounded-md">
              <div className="font-medium">Warning Message</div>
              <div className="text-sm">Please review before proceeding</div>
            </div>
            <div className="bg-info-background border border-info-border text-info-foreground p-3 rounded-md">
              <div className="font-medium">Info Message</div>
              <div className="text-sm">Additional information available</div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-3">Cards & Surfaces</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-card border border-border p-4 rounded-lg">
              <h4 className="font-medium mb-2">Default Card</h4>
              <p className="text-sm text-muted-foreground">Uses standard surface tokens</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Muted Surface</h4>
              <p className="text-sm text-muted-foreground">Subtle background variant</p>
            </div>
            <div className="bg-accent text-accent-foreground p-4 rounded-lg">
              <h4 className="font-medium mb-2">Accent Surface</h4>
              <p className="text-sm">Highlighted content area</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}
