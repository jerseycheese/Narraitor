import { Button } from '@/components/ui/button';

export function ButtonHarness() {
  // Stage 1: Isolation – Render the Button component
  // Stage 2: Test Harness – Add controls and variations
  // Stage 3: Integration – Integrate with state or context

  return <Button variant="default" className="bg-blue-500 hover:bg-blue-600">Button Harness</Button>;
}
