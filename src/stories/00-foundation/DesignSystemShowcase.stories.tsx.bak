import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings } from 'lucide-react'
import { primitiveColors, semanticColors, endingTones, loreCategories } from '@/lib/design-tokens'

const meta: Meta = {
  title: '00-Foundation/Design System Showcase',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A comprehensive showcase of all design system elements in one place for easy reference and testing.'
      }
    }
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Color Swatch Component
const ColorSwatch = ({ color, name }: { color: string; name: string }) => (
  <div className="flex items-center gap-2 p-2 border rounded">
    <div className="w-8 h-8 rounded border overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 32 32" role="img" aria-label={`${name} swatch`}>
        <rect x="0" y="0" width="32" height="32" fill={color} />
      </svg>
    </div>
    <div className="text-xs">
      <div className="font-medium">{name}</div>
      <div className="text-muted-foreground font-mono">{color}</div>
    </div>
  </div>
)

export const CompleteShowcase: Story = {
  name: 'Complete Design System',
  render: () => (
    <div className="space-y-12 max-w-6xl">
      {/* Typography */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Typography</h2>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Heading 1 - Main Page Titles</h1>
          <h2 className="text-3xl font-bold">Heading 2 - Section Titles</h2>
          <h3 className="text-2xl font-semibold">Heading 3 - Subsection Titles</h3>
          <h4 className="text-xl font-semibold">Heading 4 - Component Titles</h4>
          <p className="text-lg">Large text - Prominent body copy</p>
          <p className="text-base">Body text - Default paragraph text</p>
          <p className="text-sm">Small text - Secondary information</p>
          <p className="text-xs">Extra small - Captions and metadata</p>
          <p className="text-muted-foreground">Muted text - Less important information</p>
          <code className="bg-muted px-2 py-1 rounded font-mono text-sm">Inline code</code>
        </div>
      </section>

      {/* Color System */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Color System</h2>
        
        {/* Primitive Colors */}
        <div className="space-y-4 mb-8">
          <h3 className="text-xl font-semibold">Primitive Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(primitiveColors).map(([colorName, shades]) => 
              Object.entries(shades as Record<string, string>).map(([shade, color]) => (
                <ColorSwatch key={`${colorName}-${shade}`} color={color} name={`${colorName}-${shade}`} />
              ))
            )}
          </div>
        </div>

        {/* Semantic Colors */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Semantic Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(semanticColors).map(([colorName, shades]) => 
              Object.entries(shades as Record<string, string>).map(([shade, color]) => (
                <ColorSwatch key={`${colorName}-${shade}`} color={color} name={`${colorName}-${shade}`} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Buttons</h2>
        
        {/* Button Variants */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Variants</h3>
            <div className="flex flex-wrap gap-3">
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
          <div>
            <h3 className="text-xl font-semibold mb-4">Sizes</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Button States */}
          <div>
            <h3 className="text-xl font-semibold mb-4">States</h3>
            <div className="flex flex-wrap gap-3">
              <Button>Normal</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>

          {/* Semantic Action Buttons */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Semantic Action Buttons</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="success">Start Game</Button>
              <Button variant="success">Create Character</Button>
              <Button variant="success">Play World</Button>
              <Button variant="success">Continue</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Edit</Button>
              <Button variant="destructive">Delete</Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Green buttons (success variant) are used for forward momentum actions like starting games or creating content.
              They provide 4.6:1 contrast ratio for WCAG AA compliance.
            </p>
          </div>
        </div>
      </section>

      {/* Form Elements */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Form Elements</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Text Inputs */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Text Inputs</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="input-default">Default Input</Label>
                <Input id="input-default" placeholder="Enter text..." />
              </div>
              <div>
                <Label htmlFor="input-error">Input with Error</Label>
                <Input id="input-error" placeholder="Invalid input" className="border-destructive" />
                <p className="text-sm text-destructive mt-1">This field is required</p>
              </div>
              <div>
                <Label htmlFor="textarea">Textarea</Label>
                <Textarea id="textarea" placeholder="Enter longer text..." rows={3} />
              </div>
            </div>
          </div>

          {/* Selection Inputs */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Selection Inputs</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="select">Select Dropdown</Label>
                <Select id="select">
                  <option value="">Choose an option</option>
                  <option value="option1">Option 1</option>
                  <option value="option2">Option 2</option>
                  <option value="option3">Option 3</option>
                </Select>
              </div>
              
              <div>
                <Label>Checkboxes</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="check1" />
                    <Label htmlFor="check1">Option 1</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="check2" />
                    <Label htmlFor="check2">Option 2</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label>Radio Group</Label>
                <RadioGroup defaultValue="radio1" className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="radio1" id="radio1" />
                    <Label htmlFor="radio1">Radio 1</Label>
                  </div>
                  <div className="flex items-center space-x-2">
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
      <section>
        <h2 className="text-3xl font-bold mb-6">Badges</h2>
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </section>

      {/* Alerts */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Alerts</h2>
        <div className="space-y-4">
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
      <section>
        <h2 className="text-3xl font-bold mb-6">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Simple Card</CardTitle>
              <CardDescription>
                A basic card with header and content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
                This card demonstrates footer usage.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>Save</Button>
            </CardFooter>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Dashed Border</CardTitle>
              <CardDescription>
                A card with custom styling.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cards can be customized with different styles.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tabs */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Tabs</h2>
        <Tabs defaultValue="tab1" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="mt-6">
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
          <TabsContent value="tab2" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Tab 2 Content</CardTitle>
                <CardDescription>
                  This is the content for the second tab.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Each tab can have completely different content and structure.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="tab3" className="mt-6">
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
      <section>
        <h2 className="text-3xl font-bold mb-6">Layout Examples</h2>
        
        {/* Grid Layout */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Grid Layout</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-muted p-4 rounded text-center">
                  Grid Item {i}
                </div>
              ))}
            </div>
          </div>

          {/* Flex Layout */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Flex Layout</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 bg-muted p-4 rounded text-center min-w-[200px]">
                Flex Item 1
              </div>
              <div className="flex-1 bg-muted p-4 rounded text-center min-w-[200px]">
                Flex Item 2
              </div>
              <div className="flex-1 bg-muted p-4 rounded text-center min-w-[200px]">
                Flex Item 3
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing Scale */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Spacing Scale</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 6, 8, 12, 16, 20, 24].map((space) => (
            <div key={space} className="flex items-center gap-4">
              <div className="w-16 text-sm font-mono">{space * 4}px</div>
              <div className="rounded overflow-hidden">
                <svg width={space * 4} height={16} role="img" aria-label={`${space * 4}px bar`}>
                  <rect x="0" y="0" width={space * 4} height={16} className="fill-primary" rx="4" />
                </svg>
              </div>
              <div className="text-sm text-muted-foreground">space-{space}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Theme-Specific Colors */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Theme-Specific Colors</h2>
        
        {/* Ending Tones */}
        <div className="space-y-4 mb-8">
          <h3 className="text-xl font-semibold">Ending Tones</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(endingTones).map(([tone, colors]) => 
              Object.entries(colors as Record<string, string>).map(([shade, color]) => (
                <ColorSwatch key={`${tone}-${shade}`} color={color} name={`${tone}-${shade}`} />
              ))
            )}
          </div>
        </div>

        {/* Lore Categories */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Lore Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(loreCategories).map(([category, colors]) => 
              Object.entries(colors as Record<string, string>).map(([shade, color]) => (
                <ColorSwatch key={`${category}-${shade}`} color={color} name={`${category}-${shade}`} />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export const ComponentMatrix: Story = {
  name: 'Component Interaction Matrix',
  render: () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Component Interaction Matrix</h2>
      <p className="text-muted-foreground">
        This shows how different components work together in various combinations.
      </p>

      {/* Form in Card */}
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>User Registration</CardTitle>
          <CardDescription>
            Example of form components within a card
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="Enter username" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter email" />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select id="role">
              <option value="">Select role</option>
              <option value="player">Player</option>
              <option value="gamemaster">Game Master</option>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">I agree to the terms and conditions</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button>Register</Button>
        </CardFooter>
      </Card>

      {/* Alert with Actions */}
      <Alert>
        <AlertTitle>Storage Limit Reached</AlertTitle>
        <AlertDescription className="mt-2">
          Your game data is approaching the storage limit. Consider cleaning up old sessions.
        </AlertDescription>
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline">Manage Storage</Button>
          <Button size="sm">Upgrade Plan</Button>
        </div>
      </Alert>

      {/* Complex Card Layout */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Fantasy Campaign</CardTitle>
              <CardDescription>Active gaming session</CardDescription>
            </div>
            <Badge variant="outline">Live</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="players">Players</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Campaign started 3 days ago with 4 active players.
                </p>
                <div className="flex gap-2">
                  <Badge>Level 3</Badge>
                  <Badge variant="secondary">Fantasy</Badge>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="players" className="mt-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Active Players (4)</p>
                <div className="text-sm text-muted-foreground">
                  Player management interface would go here.
                </div>
              </div>
            </TabsContent>
            <TabsContent value="settings" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="notifications" />
                  <Label htmlFor="notifications">Enable notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="public" />
                  <Label htmlFor="public">Public campaign</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Join Campaign</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
