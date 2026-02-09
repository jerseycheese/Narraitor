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
  <div >
    <div >
      <svg width="100%" height="100%" viewBox="0 0 32 32" role="img" aria-label={`${name}swatch`}>
        <rect x="0" y="0" width="32" height="32" fill={color} />
      </svg>
    </div>
    <div >
      <div >{name}</div>
      <div >{color}</div>
    </div>
  </div>
)

export const CompleteShowcase: Story = {
  name: 'Complete Design System',
  render: () => (
    <div >
      {/* Typography */}
      <section>
        <h2 >Typography</h2>
        <div >
          <h1 >Heading 1 - Main Page Titles</h1>
          <h2 >Heading 2 - Section Titles</h2>
          <h3 >Heading 3 - Subsection Titles</h3>
          <h4 >Heading 4 - Component Titles</h4>
          <p >Large text - Prominent body copy</p>
          <p >Body text - Default paragraph text</p>
          <p >Small text - Secondary information</p>
          <p >Extra small - Captions and metadata</p>
          <p >Muted text - Less important information</p>
          <code >Inline code</code>
        </div>
      </section>

      {/* Color System */}
      <section>
        <h2 >Color System</h2>
        
        {/* Primitive Colors */}
        <div >
          <h3 >Primitive Colors</h3>
          <div >
            {Object.entries(primitiveColors).map(([colorName, shades]) => 
              Object.entries(shades as Record<string, string>).map(([shade, color]) => (
                <ColorSwatch key={`${colorName}-${shade}`} color={color} name={`${colorName}-${shade}`} />
              ))
            )}
          </div>
        </div>

        {/* Semantic Colors */}
        <div >
          <h3 >Semantic Colors</h3>
          <div >
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
        <h2 >Buttons</h2>
        
        {/* Button Variants */}
        <div >
          <div>
            <h3 >Variants</h3>
            <div >
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
            <h3 >Sizes</h3>
            <div >
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <Settings  />
              </Button>
            </div>
          </div>

          {/* Button States */}
          <div>
            <h3 >States</h3>
            <div >
              <Button>Normal</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>

          {/* Semantic Action Buttons */}
          <div>
            <h3 >Semantic Action Buttons</h3>
            <div >
              <Button variant="success">Start Game</Button>
              <Button variant="success">Create Character</Button>
              <Button variant="success">Play World</Button>
              <Button variant="success">Continue</Button>
              <Button >Edit</Button>
              <Button variant="destructive">Delete</Button>
            </div>
            <p >
              Green buttons (success variant) are used for forward momentum actions like starting games or creating content.
              They provide 4.6:1 contrast ratio for WCAG AA compliance.
            </p>
          </div>
        </div>
      </section>

      {/* Form Elements */}
      <section>
        <h2 >Form Elements</h2>
        <div >
          
          {/* Text Inputs */}
          <div >
            <h3 >Text Inputs</h3>
            <div >
              <div>
                <Label htmlFor="input-default">Default Input</Label>
                <Input id="input-default" placeholder="Enter text..." />
              </div>
              <div>
                <Label htmlFor="input-error">Input with Error</Label>
                <Input id="input-error" placeholder="Invalid input"  />
                <p >This field is required</p>
              </div>
              <div>
                <Label htmlFor="textarea">Textarea</Label>
                <Textarea id="textarea" placeholder="Enter longer text..." rows={3} />
              </div>
            </div>
          </div>

          {/* Selection Inputs */}
          <div >
            <h3 >Selection Inputs</h3>
            <div >
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
                <div >
                  <div >
                    <Checkbox id="check1" />
                    <Label htmlFor="check1">Option 1</Label>
                  </div>
                  <div >
                    <Checkbox id="check2" />
                    <Label htmlFor="check2">Option 2</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label>Radio Group</Label>
                <RadioGroup defaultValue="radio1" >
                  <div >
                    <RadioGroupItem value="radio1" id="radio1" />
                    <Label htmlFor="radio1">Radio 1</Label>
                  </div>
                  <div >
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
        <h2 >Badges</h2>
        <div >
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </section>

      {/* Alerts */}
      <section>
        <h2 >Alerts</h2>
        <div >
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
        <h2 >Cards</h2>
        <div >
          <Card>
            <CardHeader>
              <CardTitle>Simple Card</CardTitle>
              <CardDescription>
                A basic card with header and content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p >
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
              <p >
                This card demonstrates footer usage.
              </p>
            </CardContent>
            <CardFooter >
              <Button variant="outline">Cancel</Button>
              <Button>Save</Button>
            </CardFooter>
          </Card>

          <Card >
            <CardHeader>
              <CardTitle>Dashed Border</CardTitle>
              <CardDescription>
                A card with custom styling.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p >
                Cards can be customized with different styles.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tabs */}
      <section>
        <h2 >Tabs</h2>
        <Tabs defaultValue="tab1" >
          <TabsList >
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" >
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
          <TabsContent value="tab2" >
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
          <TabsContent value="tab3" >
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
        <h2 >Layout Examples</h2>
        
        {/* Grid Layout */}
        <div >
          <div>
            <h3 >Grid Layout</h3>
            <div >
              {[1, 2, 3, 4].map((i) => (
                <div key={i} >
                  Grid Item {i}
                </div>
              ))}
            </div>
          </div>

          {/* Flex Layout */}
          <div>
            <h3 >Flex Layout</h3>
            <div >
              <div >
                Flex Item 1
              </div>
              <div >
                Flex Item 2
              </div>
              <div >
                Flex Item 3
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing Scale */}
      <section>
        <h2 >Spacing Scale</h2>
        <div >
          {[1, 2, 3, 4, 6, 8, 12, 16, 20, 24].map((space) => (
            <div key={space} >
              <div >{space * 4}px</div>
              <div >
                <svg width={space * 4} height={16} role="img" aria-label={`${space * 4}px bar`}>
                  <rect x="0" y="0" width={space * 4} height={16}  rx="4" />
                </svg>
              </div>
              <div >space-{space}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Theme-Specific Colors */}
      <section>
        <h2 >Theme-Specific Colors</h2>
        
        {/* Ending Tones */}
        <div >
          <h3 >Ending Tones</h3>
          <div >
            {Object.entries(endingTones).map(([tone, colors]) => 
              Object.entries(colors as Record<string, string>).map(([shade, color]) => (
                <ColorSwatch key={`${tone}-${shade}`} color={color} name={`${tone}-${shade}`} />
              ))
            )}
          </div>
        </div>

        {/* Lore Categories */}
        <div >
          <h3 >Lore Categories</h3>
          <div >
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
    <div >
      <h2 >Component Interaction Matrix</h2>
      <p >
        This shows how different components work together in various combinations.
      </p>

      {/* Form in Card */}
      <Card >
        <CardHeader>
          <CardTitle>User Registration</CardTitle>
          <CardDescription>
            Example of form components within a card
          </CardDescription>
        </CardHeader>
        <CardContent >
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
          <div >
            <Checkbox id="terms" />
            <Label htmlFor="terms">I agree to the terms and conditions</Label>
          </div>
        </CardContent>
        <CardFooter >
          <Button variant="outline">Cancel</Button>
          <Button>Register</Button>
        </CardFooter>
      </Card>

      {/* Alert with Actions */}
      <Alert>
        <AlertTitle>Storage Limit Reached</AlertTitle>
        <AlertDescription >
          Your game data is approaching the storage limit. Consider cleaning up old sessions.
        </AlertDescription>
        <div >
          <Button size="sm" variant="outline">Manage Storage</Button>
          <Button size="sm">Upgrade Plan</Button>
        </div>
      </Alert>

      {/* Complex Card Layout */}
      <Card>
        <CardHeader>
          <div >
            <div>
              <CardTitle>Fantasy Campaign</CardTitle>
              <CardDescription>Active gaming session</CardDescription>
            </div>
            <Badge variant="outline">Live</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" >
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="players">Players</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" >
              <div >
                <p >
                  Campaign started 3 days ago with 4 active players.
                </p>
                <div >
                  <Badge>Level 3</Badge>
                  <Badge variant="secondary">Fantasy</Badge>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="players" >
              <div >
                <p >Active Players (4)</p>
                <div >
                  Player management interface would go here.
                </div>
              </div>
            </TabsContent>
            <TabsContent value="settings" >
              <div >
                <div >
                  <Checkbox id="notifications" />
                  <Label htmlFor="notifications">Enable notifications</Label>
                </div>
                <div >
                  <Checkbox id="public" />
                  <Label htmlFor="public">Public campaign</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button >Join Campaign</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
