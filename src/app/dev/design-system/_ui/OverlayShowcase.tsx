'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimpleModal } from '@/components/shared/SimpleModal';
import { PreviewModal } from '@/components/shared/PreviewModal/PreviewModal';
import type { DSTheme } from './DSToggle';
// Showcase layout classes (dso-group/dso-row/dso-preview) live in the shared
// component showcase stylesheet. The modals themselves are styled in production
// (dialog.css), not here.
import './component-showcase.css';

/**
 * Canonical overlay showcase. Renders the real overlay compositions the app
 * ships — `SimpleModal` and `PreviewModal` — so the design-system pages govern
 * the same modals the app consumes (issue #1276). The low-level `Dialog`
 * primitive stays in the Components section; this section covers the
 * higher-level modal/preview compositions built on top of it.
 *
 * The modals carry their styling in production (`src/components/ui/dialog.css`),
 * so the app's own modals and this showcase render the same thing — no
 * showcase-local skinning. The page forces the global theme (ForceTheme) so the
 * Radix portals theme to the page.
 */
export function OverlayShowcase({ theme }: { theme: DSTheme }) {
  const [simpleOpen, setSimpleOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="ds-overlay" data-theme={theme} data-testid="ds-overlay">
      {/* SimpleModal — the app's standard modal wrapper */}
      <section className="dso-group" aria-label="SimpleModal composition">
        <h3 className="dso-group-title">SimpleModal</h3>
        <p className="dso-group-note">
          The real <code>SimpleModal</code> — the wrapper behind confirmation
          dialogs, previews, and editors. Title, body, and a footer of real
          Buttons, dismissable by backdrop or escape.
        </p>
        <div className="dso-row">
          <Button onClick={() => setSimpleOpen(true)}>Leave this scene?</Button>
        </div>
        <SimpleModal
          isOpen={simpleOpen}
          onClose={() => setSimpleOpen(false)}
          title="Leave this scene?"
          description="Unsaved narration is lost if you leave before the turn resolves."
          showCloseButton={false}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setSimpleOpen(false)}>
                Stay
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setSimpleOpen(false)}>
                Leave
              </Button>
            </>
          }
        >
          <p>
            The detective hesitates at the threshold. The rain hasn&apos;t let
            up, and neither has the feeling that someone&apos;s watching.
          </p>
        </SimpleModal>
      </section>

      {/* PreviewModal — preview-then-confirm composition */}
      <section className="dso-group" aria-label="PreviewModal composition">
        <h3 className="dso-group-title">PreviewModal</h3>
        <p className="dso-group-note">
          The real <code>PreviewModal</code> — renders content for review, then
          confirms or cancels. Used for generated worlds, characters, and other
          previews before you commit.
        </p>
        <div className="dso-row">
          <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
            Preview generated world
          </Button>
        </div>
        <PreviewModal
          isOpen={previewOpen}
          data={{
            name: 'Rain City Noir',
            genre: 'Mystery',
            summary:
              'A rain-soaked city of jazz clubs and back alleys where every witness has something to hide.',
          }}
          title="Preview World"
          subtitle="Review this world before adding it to your library."
          confirmText="Use This World"
          cancelText="Back"
          footerNote="You can edit any of this after it's created."
          renderContent={(world) => (
            <div className="dso-preview">
              <div className="dso-preview-head">
                <span className="dso-preview-name">{world.name}</span>
                <Badge variant="info" size="sm">
                  {world.genre}
                </Badge>
              </div>
              <p>{world.summary}</p>
            </div>
          )}
          onConfirm={() => setPreviewOpen(false)}
          onCancel={() => setPreviewOpen(false)}
        />
      </section>
    </div>
  );
}
