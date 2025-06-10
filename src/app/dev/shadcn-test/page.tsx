'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default function ShadcnTestPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">shadcn/ui Integration Test</h1>
      
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Button Component Showcase</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Variants</h3>
            <div className="flex gap-4 flex-wrap">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Sizes</h3>
            <div className="flex gap-4 items-center flex-wrap">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">⚙️</Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">States & Examples</h3>
            <div className="flex gap-4 flex-wrap">
              <Button>Normal</Button>
              <Button disabled>Disabled</Button>
              <Button variant="outline">
                📊 With Icon
              </Button>
              <Button variant="destructive">
                🗑️ Delete
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Input Component Showcase</h2>
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-blue-800 font-medium mb-2">
            📋 Tab Navigation Test Instructions:
          </p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Press Tab key to navigate forward between inputs</li>
            <li>• Press Shift+Tab to navigate backwards</li>
            <li>• Focused inputs should show a blue ring around them</li>
            <li>• Disabled inputs should be skipped automatically</li>
          </ul>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="test-input">Test Input (Tab Stop 1)</Label>
            <Input id="test-input" placeholder="Enter some text..." />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="test-email">Email Input (Tab Stop 2)</Label>
            <Input id="test-email" type="email" placeholder="Enter email..." />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="test-number">Number Input (Tab Stop 3)</Label>
            <Input id="test-number" type="number" placeholder="Enter number..." />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="test-textarea">Textarea (Tab Stop 4)</Label>
            <Textarea id="test-textarea" placeholder="Enter description..." rows={4} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="another-input">Another Input (Tab Stop 5)</Label>
            <Input id="another-input" placeholder="Tab should work here too..." />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="disabled-input">Disabled Input (Should be skipped)</Label>
            <Input id="disabled-input" disabled placeholder="This is disabled" value="Cannot edit" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Integration Validation</h2>
        <div className="p-4 border border-border rounded-lg bg-card text-card-foreground">
          <h3 className="text-lg font-medium mb-2">CSS Variables Test</h3>
          <p className="text-muted-foreground mb-4">
            This section uses shadcn/ui CSS variables to ensure proper integration.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => alert('shadcn/ui Button clicked!')}>
              Test Click Handler
            </Button>
            <Button variant="outline" onClick={() => alert('Outline variant works!')}>
              Test Outline
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}