'use client';

import { ForceTheme } from '../../design-system/_ui/ForceTheme';
import { SessionShowcase } from '../../design-system/_ui/SessionShowcase';

/**
 * Standalone fullscreen render of the canon game session, themed DS2 — used by
 * the game-session-compare tool. The real ManuscriptSessionShell is a fixed
 * full-screen overlay, so it fills the route on its own (issue #1276).
 */
export default function DesignSystem2SessionPage() {
  return (
    <div className="design-system-session-fullscreen" data-ds="ds2">
      <ForceTheme theme="ds2" />
      <SessionShowcase theme="ds2" defaultOpen showLauncher={false} />
    </div>
  );
}
