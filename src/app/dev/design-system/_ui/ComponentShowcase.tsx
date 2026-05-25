'use client';

import { useState } from 'react';
import { Search, Info, AlertTriangle, CheckCircle2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import type { DSTheme } from './DSToggle';
import './component-showcase.css';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const BUTTON_VARIANTS = [
  'default',
  'secondary',
  'outline',
  'ghost',
  'link',
  'destructive',
  'success',
  'info',
  'warning',
] as const;

const BADGE_VARIANTS = [
  'default',
  'secondary',
  'outline',
  'destructive',
  'success',
  'warning',
  'info',
] as const;

/**
 * Canonical primitive showcase. Renders the real `@/components/ui/*`
 * components in their variant/state matrices so the design-system pages
 * govern the same components the app ships (issue #1276). Theming comes
 * entirely from the surrounding `data-theme` scope and design tokens — no
 * hand-built look-alikes, no hardcoded colors.
 */
export function ComponentShowcase({ theme }: { theme: DSTheme }) {
  const [tab, setTab] = useState('overview');
  const [tracking, setTracking] = useState('investigate');
  const [spoilers, setSpoilers] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="ds-components" data-theme={theme} data-testid="ds-components">
      {/* Buttons */}
      <section className="dsc-group" aria-label="Button primitive">
        <h3 className="dsc-group-title">Button</h3>
        <p className="dsc-group-note">
          The real <code>Button</code> in every variant, then sizes and states.
        </p>
        <div className="dsc-row">
          {BUTTON_VARIANTS.map((v) => (
            <Button key={v} variant={v}>
              {cap(v)}
            </Button>
          ))}
        </div>
        <div className="dsc-row">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Search">
            <Search />
          </Button>
        </div>
        <div className="dsc-row">
          <Button>Enabled</Button>
          <Button disabled>Disabled</Button>
          <Button disabled>
            <span className="dsc-spinner" aria-hidden="true" />
            Saving…
          </Button>
        </div>
      </section>

      {/* Badges */}
      <section className="dsc-group" aria-label="Badge primitive">
        <h3 className="dsc-group-title">Badge</h3>
        <p className="dsc-group-note">Variants, sizes, and the icon / count slots.</p>
        <div className="dsc-row">
          {BADGE_VARIANTS.map((v) => (
            <Badge key={v} variant={v}>
              {cap(v)}
            </Badge>
          ))}
        </div>
        <div className="dsc-row">
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
          <Badge size="lg">Large</Badge>
          <Badge icon={<Bell />}>Notices</Badge>
          <Badge count={4}>Unread</Badge>
        </div>
      </section>

      {/* Form controls */}
      <section className="dsc-group" aria-label="Form controls">
        <h3 className="dsc-group-title">Input, Textarea, Select &amp; Label</h3>
        <p className="dsc-group-note">
          Form primitives with default, error, and disabled states.
        </p>
        <div className="dsc-grid">
          <div className="dsc-field">
            <Label htmlFor="dsc-name">Character name</Label>
            <Input id="dsc-name" defaultValue="Marlowe Vance" />
          </div>
          <div className="dsc-field">
            <Label htmlFor="dsc-name-error">Scene title</Label>
            <Input
              id="dsc-name-error"
              className="form-input-error"
              defaultValue="Already used"
            />
            <p className="form-error">Choose a unique title to continue.</p>
          </div>
          <div className="dsc-field">
            <Label htmlFor="dsc-genre">Genre</Label>
            <Select id="dsc-genre" defaultValue="mystery">
              <option value="mystery">Mystery</option>
              <option value="fantasy">Fantasy</option>
              <option value="scifi">Science Fiction</option>
            </Select>
          </div>
          <div className="dsc-field">
            <Label htmlFor="dsc-locked">Locked while streaming</Label>
            <Input id="dsc-locked" defaultValue="Read only" disabled />
          </div>
          <div className="dsc-field dsc-field-wide">
            <Label htmlFor="dsc-bg">Background</Label>
            <Textarea
              id="dsc-bg"
              placeholder="Describe your character's history…"
              defaultValue="A rain-soaked detective with a debt to the wrong people."
            />
          </div>
        </div>
      </section>

      {/* Checkbox + Radio */}
      <section className="dsc-group" aria-label="Selection controls">
        <h3 className="dsc-group-title">Checkbox &amp; Radio Group</h3>
        <p className="dsc-group-note">Boolean and single-choice selection primitives.</p>
        <div className="dsc-grid">
          <div className="dsc-stack">
            <Checkbox label="Auto-save the manuscript" defaultChecked />
            <Checkbox
              label="Reveal spoilers in the journal"
              checked={spoilers}
              onChange={(e) => setSpoilers(e.target.checked)}
            />
            <Checkbox label="Locked setting" disabled />
          </div>
          <RadioGroup
            className="dsc-radio-group"
            name="dsc-tracking"
            value={tracking}
            onValueChange={setTracking}
          >
            <RadioGroupItem value="investigate">Investigate quietly</RadioGroupItem>
            <RadioGroupItem value="confront">Confront the suspect</RadioGroupItem>
            <RadioGroupItem value="retreat">Retreat and regroup</RadioGroupItem>
          </RadioGroup>
        </div>
      </section>

      {/* Alerts */}
      <section className="dsc-group" aria-label="Alert primitive">
        <h3 className="dsc-group-title">Alert</h3>
        <p className="dsc-group-note">All four variants with title and description.</p>
        <div className="dsc-stack dsc-stack-wide">
          <Alert>
            <AlertTitle>Autosave on</AlertTitle>
            <AlertDescription>Your progress is saved after every turn.</AlertDescription>
          </Alert>
          <Alert variant="info">
            <AlertTitle>Perception check</AlertTitle>
            <AlertDescription>Hidden tracks lead east toward the docks.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTitle>Low torchlight</AlertTitle>
            <AlertDescription>Stealth attempts are harder in the dark.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Save failed</AlertTitle>
            <AlertDescription>Your progress may not be preserved.</AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Cards */}
      <section className="dsc-group" aria-label="Card primitive">
        <h3 className="dsc-group-title">Card</h3>
        <p className="dsc-group-note">Header, content, and footer slots composed together.</p>
        <div className="dsc-grid">
          <Card className="dsc-card">
            <CardHeader className="dsc-card-header">
              <CardTitle className="dsc-card-title">Rain City Noir</CardTitle>
              <CardDescription className="dsc-card-description">
                Mystery · 3 sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="dsc-card-content">
              A rain-soaked city of jazz clubs and back alleys where every witness
              has something to hide.
            </CardContent>
            <CardFooter className="dsc-card-footer">
              <Button size="sm">Continue</Button>
              <Button size="sm" variant="outline">
                Details
              </Button>
            </CardFooter>
          </Card>
          <Card className="dsc-card">
            <CardHeader className="dsc-card-header">
              <CardTitle className="dsc-card-title">Starfall Station</CardTitle>
              <CardDescription className="dsc-card-description">
                Sci-Fi · 1 session
              </CardDescription>
            </CardHeader>
            <CardContent className="dsc-card-content">
              A deep-space mining station gone silent. The distress signal stopped
              two days ago.
            </CardContent>
            <CardFooter className="dsc-card-footer">
              <Button size="sm">Continue</Button>
              <Button size="sm" variant="outline">
                Details
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Tabs */}
      <section className="dsc-group" aria-label="Tabs primitive">
        <h3 className="dsc-group-title">Tabs</h3>
        <p className="dsc-group-note">Controlled tabs switching between panels.</p>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="dsc-tabs-list">
            <TabsTrigger
              value="overview"
              className="dsc-tabs-trigger"
              aria-selected={tab === 'overview'}
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="journal"
              className="dsc-tabs-trigger"
              aria-selected={tab === 'journal'}
            >
              Journal
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="dsc-tabs-trigger"
              aria-selected={tab === 'inventory'}
            >
              Inventory
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="dsc-tabs-content">
            A summary of the current scene, characters present, and open threads.
          </TabsContent>
          <TabsContent value="journal" className="dsc-tabs-content">
            Logged discoveries, decisions, and warnings from the investigation.
          </TabsContent>
          <TabsContent value="inventory" className="dsc-tabs-content">
            Items carried into the scene and what each one might unlock.
          </TabsContent>
        </Tabs>
      </section>

      {/* Table */}
      <section className="dsc-group" aria-label="Table primitive">
        <h3 className="dsc-group-title">Table</h3>
        <p className="dsc-group-note">Tabular data with header and body rows.</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Revolver</TableCell>
              <TableCell>Weapon</TableCell>
              <TableCell>
                <Badge variant="success" size="sm">
                  Ready
                </Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Case File</TableCell>
              <TableCell>Document</TableCell>
              <TableCell>
                <Badge variant="info" size="sm">
                  New
                </Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Lockpick Set</TableCell>
              <TableCell>Tool</TableCell>
              <TableCell>
                <Badge variant="warning" size="sm">
                  Worn
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      {/* Dialog */}
      <section className="dsc-group" aria-label="Dialog primitive">
        <h3 className="dsc-group-title">Dialog</h3>
        <p className="dsc-group-note">
          The real Radix-backed <code>Dialog</code>, opened from a button.
        </p>
        <div className="dsc-row">
          <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent
            overlayScroll
            overlayClassName="dsc-dialog-overlay"
            className="dsc-dialog-content"
          >
            <DialogTitle className="dsc-dialog-title">Leave this scene?</DialogTitle>
            <p className="dsc-dialog-body">
              Unsaved narration will be lost if you leave before the turn resolves.
            </p>
            <div className="dsc-dialog-actions">
              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  Stay
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive" size="sm">
                  Leave
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </section>

      {/* Inline icon legend so unused icon imports stay meaningful */}
      <section className="dsc-group" aria-label="Status iconography">
        <h3 className="dsc-group-title">Status icons</h3>
        <p className="dsc-group-note">Shared lucide icons used across the primitives above.</p>
        <div className="dsc-row dsc-icon-legend">
          <span className="dsc-icon-chip">
            <CheckCircle2 /> Success
          </span>
          <span className="dsc-icon-chip">
            <Info /> Info
          </span>
          <span className="dsc-icon-chip">
            <AlertTriangle /> Warning
          </span>
        </div>
      </section>
    </div>
  );
}
