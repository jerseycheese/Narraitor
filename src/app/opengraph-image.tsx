import fs from 'fs';
import path from 'path';
import { ImageResponse } from 'next/og';

/**
 * Branded share card (#1636). Inherited by every route unless that route
 * declares its own `openGraph` block — see the comment in layout.tsx.
 *
 * The mark carries the card, not artwork from a sample world: the pitch is that
 * the story is bound by whichever world you built, so leading with one genre's
 * art puts a setting the reader did not choose in the claim's place.
 * Words stay down to a wordmark and one line, since anything set as pixels here
 * is unreadable to anyone relying on the `alt` export below.
 *
 * Satori renders this without a DOM, so the DS3 palette is inlined as hex
 * (CSS custom properties and the space-separated rgb() syntax are both
 * unavailable) and every multi-child element needs an explicit display: flex.
 * Values are copied from src/lib/theme/themes/ds3.css light mode; if those
 * tokens move, move these with them.
 */

/* eslint-disable design-tokens/no-hardcoded-colors -- satori renders without a DOM, so var(--token) does not resolve here */
const CANVAS = '#F7F3ED'; // --color-canvas
const BORDER = '#E2D9CE'; // --color-border
const INK = '#2A231C'; // --color-text-primary
const SECONDARY = '#736658'; // --color-text-secondary
const ACCENT = '#5B7A8C'; // --color-accent
/* eslint-enable design-tokens/no-hardcoded-colors */

// Read at module scope: this route is statically generated, so the file is
// resolved during `next build` and never touched at runtime.
const logoMark = (() => {
  const bytes = fs.readFileSync(path.join(process.cwd(), 'public', 'narraitor-logo.svg'));
  return `data:image/svg+xml;base64,${bytes.toString('base64')}`;
})();

export const alt =
  'Narraitor: the quill-and-book logo on aged paper, with the line "a solo role-playing game, your world sets the rules"';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          padding: 32,
          backgroundColor: CANVAS,
        }}
      >
        <div
          style={{
            display: 'flex',
            position: 'relative',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            padding: '0 96px',
            overflow: 'hidden',
            border: `2px solid ${BORDER}`,
          }}
        >
          {/* Oversized mark bleeding off the right edge — depth without a second
              asset, and it stays legible behind nothing since the copy sits left. */}
          <img
            src={logoMark}
            alt=""
            width={620}
            height={620}
            style={{ position: 'absolute', top: 40, right: -150, opacity: 0.05 }}
          />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <img src={logoMark} alt="" width={104} height={104} />

            <div style={{ display: 'flex', fontSize: 84, color: INK, marginTop: 28 }}>
              Narraitor
            </div>

            <div style={{ display: 'flex', width: 96, height: 5, backgroundColor: ACCENT, marginTop: 28 }} />

            <div style={{ display: 'flex', fontSize: 30, color: SECONDARY, marginTop: 28 }}>
              A solo role-playing game. Your world sets the rules.
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
