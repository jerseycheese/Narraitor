'use client';

import { ForceTheme } from '../_ui/ForceTheme';
import { SessionShowcase } from '../_ui/SessionShowcase';

/**
 * Standalone fullscreen render of the canon game session, themed DS1 — used by
 * the game-session-compare tool. The real ManuscriptSessionShell is a fixed
 * full-screen overlay, so it fills the route on its own (issue #1276).
 */
export default function DesignSystemSessionPage() {
  return (
    <div className="design-system-session-fullscreen" data-ds="ds1">
      <ForceTheme theme="ds1" />
      <SessionShowcase theme="ds1" defaultOpen showLauncher={false} />
    </div>
  );
}
