'use client'

import { Button } from '@/components/ui/button'

export default function ShadcnTestPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">shadcn/ui Integration Test</h1>
      
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Button Variants</h2>
        <div className="flex gap-4 flex-wrap">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Button Sizes</h2>
        <div className="flex gap-4 items-center flex-wrap">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">⚙️</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Button States</h2>
        <div className="flex gap-4 flex-wrap">
          <Button>Normal</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Buttons with Icons</h2>
        <div className="flex gap-4 flex-wrap">
          <Button>
            ⚙️ Settings
          </Button>
          <Button variant="outline">
            📊 Analytics
          </Button>
          <Button variant="destructive">
            🗑️ Delete
          </Button>
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