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
  <div>
    <div>
    <svg width="100%" height="100%" viewBox="0 0 48 48" role="img" aria-label={`${name} swatch`}>
        <rect x="0" y="0" width="48" height="48" fill={color} />
      </svg>
    </div>
    <div>
      <div>{name}</div>
      <div>{color}</div>
      {description && <div>{description}</div>}
    </div>
  </div>
)

// Color Scale Component
const ColorScale = ({ colors, name }: { colors: Record<string, string>; name: string }) => (
  <div>
    <h3>{name}</h3>
    <div>
      {Object.entries(colors).map(([shade, color]) => (
        <ColorSwatch key={`${name}-${shade}`} color={color} name={`${name}-${shade}`} />
      ))}
    </div>
  </div>
)

export const PrimitiveTokens: Story = {
  name: 'Primitive Tokens',
  render: () => (
    <div>
      <div>
        <h2>Primitive Color Tokens</h2>
        <p>
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
    <div>
      <div>
        <h2>Semantic Color Tokens</h2>
        <p>
          Colors with contextual meaning that map to primitive tokens.
        </p>
      </div>
      
      <div>
        <div>
          <h3>Primary Actions</h3>
          <div>
            <ColorSwatch color={semanticColors.primary.default} name="Primary" description="Main brand actions" />
            <ColorSwatch color={semanticColors.primary.hover} name="Primary Hover" />
            <ColorSwatch color={semanticColors.primary.active} name="Primary Active" />
          </div>
        </div>
        
        <div>
          <h3>Secondary Actions</h3>
          <div>
            <ColorSwatch color={semanticColors.secondary.default} name="Secondary" description="Secondary actions" />
            <ColorSwatch color={semanticColors.secondary.hover} name="Secondary Hover" />
            <ColorSwatch color={semanticColors.secondary.active} name="Secondary Active" />
          </div>
        </div>
        
        <div>
          <h3>Status Colors</h3>
          <div>
            <ColorSwatch color={semanticColors.success.default} name="Success" description="Positive outcomes" />
            <ColorSwatch color={semanticColors.warning.default} name="Warning" description="Caution states" />
            <ColorSwatch color={semanticColors.danger.default} name="Danger" description="Error states" />
            <ColorSwatch color={semanticColors.info.default} name="Info" description="Informational content" />
          </div>
        </div>
        
        <div>
          <h3>Surface & Text</h3>
          <div>
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
    <div>
      <div>
        <h2>Contextual Color Tokens</h2>
        <p>
          Genre-specific colors used only in storytelling contexts.
        </p>
      </div>
      
      <div>
        <div>
          <h3>Story Ending Tones</h3>
          <div>
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
        
        <div>
          <h3>Lore Categories</h3>
          <div>
            {Object.entries(loreCategories).map(([category, colors]) => (
              <div key={category} >
                <div>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </div>
                <div>
                  bg: {colors.background} | border: {colors.border}
                </div>
                <div>
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
    <div>
      <div>
        <h2>Token Usage Examples</h2>
        <p>
          Examples showing how to use design tokens in components.
        </p>
      </div>
      
      <div>
        <div>
          <h3>Button Variants</h3>
          <div>
            <button>
              Primary Button
            </button>
            <button>
              Secondary Button
            </button>
            <button>
              Destructive Button
            </button>
          </div>
        </div>
        
        <div>
          <h3>Status Indicators</h3>
          <div>
            <div>
              <div>Success Message</div>
              <div>Operation completed successfully</div>
            </div>
            <div>
              <div>Warning Message</div>
              <div>Please review before proceeding</div>
            </div>
            <div>
              <div>Info Message</div>
              <div>Additional information available</div>
            </div>
          </div>
        </div>
        
        <div>
          <h3>Cards & Surfaces</h3>
          <div>
            <div>
              <h4>Default Card</h4>
              <p>Uses standard surface tokens</p>
            </div>
            <div>
              <h4>Muted Surface</h4>
              <p>Subtle background variant</p>
            </div>
            <div>
              <h4>Accent Surface</h4>
              <p>Highlighted content area</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}
