import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings } from 'lucide-react';
import './DesignSystemShowcase.css';

const meta: Meta = {
  title: '00-Foundation/Design System Showcase',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A comprehensive showcase of all design system elements in one place for easy reference and testing.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// CSS Var Swatch Component
//
// Renders a swatch whose background is the live CSS custom property value
// (via `var(...)`), so it automatically tracks the light/dark color mode
// active in the Storybook toolbar rather than a hardcoded, possibly-stale
// hex value.
//
// Render the color as a div `background` rather than an SVG `<rect fill>`:
// a percentage-sized SVG with a square viewBox stretched each swatch to the
// full page width (~1393px tall), ballooning the showcase to ~27,000px.
const CssVarSwatch = ({ token }: { token: string }) => (
  <div
    className="ds-css-var-swatch"
    style={{
      display: 'inline-block',
      verticalAlign: 'top',
      marginRight: 'var(--space-4)',
      marginBottom: 'var(--space-3)',
    }}
  >
    <div
      className="ds-css-var-swatch-chip"
      style={{
        background: `var(${token})`,
        width: '3rem',
        height: '3rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
      }}
      role="img"
      aria-label={`${token} swatch`}
    />
    <div>
      <div>{token}</div>
    </div>
  </div>
);

export const CompleteShowcase: Story = {
  name: 'Complete Design System',
  render: () => (
    <div className="ds-showcase">
      {/* Typography */}
      <section className="ds-showcase-section">
        <h2>Typography</h2>
        <div className="ds-showcase-typography-samples">
          <h1>Heading 1 - Main Page Titles</h1>
          <h2>Heading 2 - Section Titles</h2>
          <h3>Heading 3 - Subsection Titles</h3>
          <h4>Heading 4 - Component Titles</h4>
          <p className="ds-showcase-text-large">Large text - Prominent body copy</p>
          <p className="ds-showcase-text-body">Body text - Default paragraph text</p>
          <p className="ds-showcase-text-small">Small text - Secondary information</p>
          <p className="ds-showcase-text-xs">Extra small - Captions and metadata</p>
          <p className="ds-showcase-text-muted">Muted text - Less important information</p>
          <code>Inline code</code>
        </div>
      </section>

      {/* Color System */}
      <section className="ds-showcase-section">
        <h2>Color System</h2>

        {/* Theme Tokens */}
        <div className="ds-showcase-subsection">
          <h3>Theme Tokens</h3>
          <p className="ds-showcase-description">
            Swatches render the live CSS custom property value, so they
            automatically track the light/dark color mode selected in the
            toolbar above.
          </p>

          <h4>Core</h4>
          <div className="ds-showcase-swatch-group">
            {[
              '--color-accent',
              '--color-accent-hover',
              '--color-accent-soft',
              '--color-on-accent',
            ].map((token) => (
              <CssVarSwatch key={token} token={token} />
            ))}
          </div>

          <h4>Text</h4>
          <div className="ds-showcase-swatch-group">
            {[
              '--color-text-primary',
              '--color-text-secondary',
              '--color-text-muted',
              '--color-text-inverse',
            ].map((token) => (
              <CssVarSwatch key={token} token={token} />
            ))}
          </div>

          <h4>Surfaces</h4>
          <div className="ds-showcase-swatch-group">
            {[
              '--color-canvas',
              '--color-surface',
              '--color-surface-hover',
              '--color-border',
              '--color-border-strong',
            ].map((token) => (
              <CssVarSwatch key={token} token={token} />
            ))}
          </div>

          <h4>Feedback</h4>
          <div className="ds-showcase-swatch-group">
            {[
              '--color-danger',
              '--color-danger-hover',
              '--color-on-danger',
              '--color-success',
              '--color-on-success',
              '--color-warning',
              '--color-on-warning',
              '--color-info',
            ].map((token) => (
              <CssVarSwatch key={token} token={token} />
            ))}
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className="ds-showcase-section">
        <h2>Buttons</h2>

        <div className="ds-showcase-subsection-group">
          {/* Button Variants */}
          <div className="ds-showcase-subsection">
            <h3>Variants</h3>
            <div className="ds-showcase-button-row">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="success">Success</Button>
              <Button variant="info">Info</Button>
              <Button variant="warning">Warning</Button>
            </div>
          </div>

          {/* Button Sizes */}
          <div className="ds-showcase-subsection">
            <h3>Sizes</h3>
            <div className="ds-showcase-button-row">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <Settings />
              </Button>
            </div>
          </div>

          {/* Button States */}
          <div className="ds-showcase-subsection">
            <h3>States</h3>
            <div className="ds-showcase-button-row">
              <Button>Normal</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>

          {/* Semantic Action Buttons */}
          <div className="ds-showcase-subsection">
            <h3>Semantic Action Buttons</h3>
            <div className="ds-showcase-button-row">
              <Button variant="success">Start Game</Button>
              <Button variant="success">Create Character</Button>
              <Button variant="success">Play World</Button>
              <Button variant="success">Continue</Button>
              <Button>Edit</Button>
              <Button variant="destructive">Delete</Button>
            </div>
            <p className="ds-showcase-description">
              Green buttons (success variant) are used for forward momentum
              actions like starting games or creating content. They provide
              4.6:1 contrast ratio for WCAG AA compliance.
            </p>
          </div>
        </div>
      </section>

      {/* Form Elements */}
      <section className="ds-showcase-section">
        <h2>Form Elements</h2>
        <div className="ds-showcase-subsection-group">
          {/* Text Inputs */}
          <div className="ds-showcase-subsection">
            <h3>Text Inputs</h3>
            <div className="ds-showcase-form-grid">
              <div className="ds-showcase-form-field">
                <Label htmlFor="input-default">Default Input</Label>
                <Input id="input-default" placeholder="Enter text..." />
              </div>
              <div className="ds-showcase-form-field">
                <Label htmlFor="input-error">Input with Error</Label>
                <Input id="input-error" placeholder="Invalid input" />
                <p className="ds-showcase-field-error">This field is required</p>
              </div>
              <div className="ds-showcase-form-field">
                <Label htmlFor="textarea">Textarea</Label>
                <Textarea
                  id="textarea"
                  placeholder="Enter longer text..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Selection Inputs */}
          <div className="ds-showcase-subsection">
            <h3>Selection Inputs</h3>
            <div className="ds-showcase-form-grid">
              <div className="ds-showcase-form-field">
                <Label htmlFor="select">Select Dropdown</Label>
                <Select id="select">
                  <option value="">Choose an option</option>
                  <option value="option1">Option 1</option>
                  <option value="option2">Option 2</option>
                  <option value="option3">Option 3</option>
                </Select>
              </div>

              <div className="ds-showcase-form-field">
                <Label>Checkboxes</Label>
                <div className="ds-showcase-option-group">
                  <div className="ds-showcase-option-row">
                    <Checkbox id="check1" />
                    <Label htmlFor="check1">Option 1</Label>
                  </div>
                  <div className="ds-showcase-option-row">
                    <Checkbox id="check2" />
                    <Label htmlFor="check2">Option 2</Label>
                  </div>
                </div>
              </div>

              <div className="ds-showcase-form-field">
                <Label>Radio Group</Label>
                <RadioGroup defaultValue="radio1">
                  <div className="ds-showcase-option-row">
                    <RadioGroupItem value="radio1" id="radio1" />
                    <Label htmlFor="radio1">Radio 1</Label>
                  </div>
                  <div className="ds-showcase-option-row">
                    <RadioGroupItem value="radio2" id="radio2" />
                    <Label htmlFor="radio2">Radio 2</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="ds-showcase-section">
        <h2>Badges</h2>
        <div className="ds-showcase-badge-row">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </section>

      {/* Alerts */}
      <section className="ds-showcase-section">
        <h2>Alerts</h2>
        <div className="ds-showcase-stack">
          <Alert>
            <AlertTitle>Default Alert</AlertTitle>
            <AlertDescription>
              This is a default alert with important information.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertTitle>Error Alert</AlertTitle>
            <AlertDescription>
              This is an error alert indicating something went wrong.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Cards */}
      <section className="ds-showcase-section">
        <h2>Cards</h2>
        <div className="ds-showcase-card-grid">
          <Card>
            <CardHeader>
              <CardTitle>Simple Card</CardTitle>
              <CardDescription>
                A basic card with header and content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Card content goes here. This can contain any type of content.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Card with Footer</CardTitle>
              <CardDescription>
                A card that includes footer actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>This card demonstrates footer usage.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Save</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dashed Border</CardTitle>
              <CardDescription>A card with custom styling.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Cards can be customized with different styles.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tabs */}
      <section className="ds-showcase-section">
        <h2>Tabs</h2>
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <Card>
              <CardHeader>
                <CardTitle>Tab 1 Content</CardTitle>
                <CardDescription>
                  This is the content for the first tab.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Tab content can contain any components and layouts.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="tab2">
            <Card>
              <CardHeader>
                <CardTitle>Tab 2 Content</CardTitle>
                <CardDescription>
                  This is the content for the second tab.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  Each tab can have completely different content and structure.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="tab3">
            <Card>
              <CardHeader>
                <CardTitle>Tab 3 Content</CardTitle>
                <CardDescription>
                  This is the content for the third tab.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Tabs are useful for organizing related content.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Layout Examples */}
      <section className="ds-showcase-section">
        <h2>Layout Examples</h2>

        <div className="ds-showcase-subsection-group">
          {/* Grid Layout */}
          <div className="ds-showcase-subsection">
            <h3>Grid Layout</h3>
            <div className="ds-showcase-demo-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="ds-showcase-demo-box">Grid Item {i}</div>
              ))}
            </div>
          </div>

          {/* Flex Layout */}
          <div className="ds-showcase-subsection">
            <h3>Flex Layout</h3>
            <div className="ds-showcase-demo-flex">
              <div className="ds-showcase-demo-flex-item ds-showcase-demo-box">Flex Item 1</div>
              <div className="ds-showcase-demo-flex-item ds-showcase-demo-box">Flex Item 2</div>
              <div className="ds-showcase-demo-flex-item ds-showcase-demo-box">Flex Item 3</div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing Scale */}
      <section className="ds-showcase-section">
        <h2>Spacing Scale</h2>
        <div className="ds-showcase-spacing-list">
          {[1, 2, 3, 4, 6, 8, 12, 16, 20, 24].map((space) => (
            <div key={space} className="ds-showcase-spacing-row">
              <div className="ds-showcase-spacing-px">{space * 4}px</div>
              <div>
                <svg
                  width={space * 4}
                  height={16}
                  role="img"
                  aria-label={`${space * 4}px bar`}
                >
                  <rect x="0" y="0" width={space * 4} height={16} rx="4" />
                </svg>
              </div>
              <div className="ds-showcase-spacing-token">space-{space}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Drafting Marks */}
      <section className="ds-showcase-section ds-showcase-marks">
        <h2>Drafting Marks</h2>
        <p className="ds-showcase-marks-intro">
          DS3&rsquo;s decorative vocabulary is one family of ink marks, not a set of unrelated
          ornaments. Every mark is drawn in <code>--color-text-muted</code>, and the ones with
          arms share <code>--mark-arm-length</code>. Accent buys at most one focal mark per
          surface: per surface, not per card, and not per register.
        </p>
        <p className="ds-showcase-marks-intro">
          The samples below use the production classes rather than copies, so this section
          cannot drift from what the app renders.
        </p>

        <div className="ds-showcase-marks-grid">
          <div className="ds-showcase-mark-item">
            <div className="component-world-card ds-showcase-mark-sample" />
            <p className="ds-showcase-mark-name">Corner bracket</p>
            <p className="ds-showcase-mark-where">
              The family&rsquo;s quiet default. Top-left and bottom-right of every card and
              detail section.
            </p>
          </div>

          <div className="ds-showcase-mark-item">
            <div className="component-dashboard-continue-card ds-showcase-mark-sample" />
            <p className="ds-showcase-mark-name">Registration cross</p>
            <p className="ds-showcase-mark-where">
              A bracket promoted to a full trim mark, in accent. One per surface; this is where
              the accent budget goes.
            </p>
          </div>

          <div className="ds-showcase-mark-item ds-showcase-mark-item-wide">
            <div className="world-detail-section ds-showcase-mark-sample">
              <h2>Section heading</h2>
            </div>
            <p className="ds-showcase-mark-name">
              Dimension ticks, dotted rule, bullet eyebrow
            </p>
            <p className="ds-showcase-mark-where">
              Ticks measure the section&rsquo;s top edge at the dotted rule&rsquo;s own 12px
              pitch. The perforated rule sits under the heading, the bullet eyebrow above it.
              Detail sections only: a tick band repeated across a dense card grid drowns the
              dot grid.
            </p>
          </div>
        </div>
      </section>

      {/* Theme-Specific Colors */}
      <section className="ds-showcase-section">
        <h2>Theme-Specific Colors</h2>

        {/* Ending Tones */}
        <div className="ds-showcase-subsection">
          <h3>Ending Tones</h3>
          <div className="ds-showcase-swatch-group">
            {[
              '--ending-triumphant',
              '--ending-hopeful',
              '--ending-mysterious',
              '--ending-tragic',
            ].map((token) => (
              <CssVarSwatch key={token} token={token} />
            ))}
          </div>
        </div>

        {/* Lore Categories */}
        <div className="ds-showcase-subsection">
          <h3>Lore Categories</h3>
          <div className="ds-showcase-swatch-group">
            {[
              '--lore-characters-bg',
              '--lore-characters-border',
              '--lore-characters-text',
              '--lore-events-bg',
              '--lore-events-border',
              '--lore-events-text',
              '--lore-locations-bg',
              '--lore-locations-border',
              '--lore-locations-text',
              '--lore-rules-bg',
              '--lore-rules-border',
              '--lore-rules-text',
            ].map((token) => (
              <CssVarSwatch key={token} token={token} />
            ))}
          </div>
        </div>
      </section>
    </div>
  ),
};

export const ComponentMatrix: Story = {
  name: 'Component Interaction Matrix',
  render: () => (
    <div className="ds-showcase-stack">
      <h2>Component Interaction Matrix</h2>
      <p className="ds-showcase-description">
        This shows how different components work together in various
        combinations.
      </p>

      {/* Form in Card */}
      <Card>
        <CardHeader>
          <CardTitle>User Registration</CardTitle>
          <CardDescription>
            Example of form components within a card
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="ds-showcase-form-grid">
            <div className="ds-showcase-form-field">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="Enter username" />
            </div>
            <div className="ds-showcase-form-field">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter email" />
            </div>
            <div className="ds-showcase-form-field">
              <Label htmlFor="role">Role</Label>
              <Select id="role">
                <option value="">Select role</option>
                <option value="player">Player</option>
                <option value="gamemaster">Game Master</option>
              </Select>
            </div>
            <div className="ds-showcase-option-row">
              <Checkbox id="terms" />
              <Label htmlFor="terms">I agree to the terms and conditions</Label>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Register</Button>
        </CardFooter>
      </Card>

      {/* Alert with Actions */}
      <Alert>
        <AlertTitle>Storage Limit Reached</AlertTitle>
        <AlertDescription>
          Your game data is approaching the storage limit. Consider cleaning up
          old sessions.
        </AlertDescription>
        <div className="ds-showcase-alert-actions">
          <Button size="sm" variant="outline">
            Manage Storage
          </Button>
          <Button size="sm">Upgrade Plan</Button>
        </div>
      </Alert>

      {/* Complex Card Layout */}
      <Card>
        <CardHeader>
          <div className="ds-showcase-card-header-row">
            <div>
              <CardTitle>Fantasy Campaign</CardTitle>
              <CardDescription>Active gaming session</CardDescription>
            </div>
            <Badge variant="outline">Live</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="players">Players</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <div className="ds-showcase-subsection">
                <p>Campaign started 3 days ago with 4 active players.</p>
                <div className="ds-showcase-badge-row">
                  <Badge>Level 3</Badge>
                  <Badge variant="secondary">Fantasy</Badge>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="players">
              <div className="ds-showcase-subsection">
                <p>Active Players (4)</p>
                <div>Player management interface would go here.</div>
              </div>
            </TabsContent>
            <TabsContent value="settings">
              <div className="ds-showcase-option-group">
                <div className="ds-showcase-option-row">
                  <Checkbox id="notifications" />
                  <Label htmlFor="notifications">Enable notifications</Label>
                </div>
                <div className="ds-showcase-option-row">
                  <Checkbox id="public" />
                  <Label htmlFor="public">Public campaign</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button>Join Campaign</Button>
        </CardFooter>
      </Card>
    </div>
  ),
};
