import fs from 'fs';
import path from 'path';
import { ImageResponse } from 'next/og';

/**
 * Branded share card (#1636). Inherited by every route unless that route
 * declares its own `openGraph` block — see the comment in layout.tsx.
 *
 * The card leads with generated world art rather than a headline: it shows what
 * the app produces, and it keeps the words down to a wordmark and one line,
 * since anything set as pixels here is unreadable to anyone relying on the
 * `alt` export below.
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

// Read at module scope: this route is statically generated, so the files are
// resolved during `next build` and never touched at runtime.
const asDataUri = (relativePath: string, mimeType: string): string => {
  const bytes = fs.readFileSync(path.join(process.cwd(), 'public', relativePath));
  return `data:${mimeType};base64,${bytes.toString('base64')}`;
};

const worldArt = asDataUri('visual-assets/world-cyberpunk.png', 'image/png');
const logoMark = asDataUri('narraitor-logo.svg', 'image/svg+xml');

export const alt =
  'Narraitor — a rain-soaked neon city generated in the app, above the quill-and-book logo and the line "a solo role-playing game in any world you can imagine"';
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
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            border: `2px solid ${BORDER}`,
          }}
        >
          <img
            src={worldArt}
            alt=""
            width={1132}
            height={404}
            style={{ objectFit: 'cover', borderBottom: `4px solid ${ACCENT}` }}
          />

          <div
            style={{
              display: 'flex',
              flex: 1,
              alignItems: 'center',
              padding: '0 44px',
            }}
          >
            <img src={logoMark} alt="" width={76} height={76} />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginLeft: 28,
              }}
            >
              <div style={{ display: 'flex', fontSize: 46, color: INK }}>Narraitor</div>
              <div style={{ display: 'flex', fontSize: 24, color: SECONDARY, marginTop: 4 }}>
                A solo role-playing game in any world you can imagine
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
