import { ImageResponse } from 'next/og';

/**
 * Branded share card (#1636). Inherited by every route unless that route
 * declares its own `openGraph` block — see the comment in layout.tsx.
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

export const alt = 'Narraitor — play a story in any world you can imagine';
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
          padding: 48,
          backgroundColor: CANVAS,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            padding: '64px 72px',
            border: `2px solid ${BORDER}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: ACCENT,
            }}
          >
            A solo role-playing game
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 76,
              lineHeight: 1.15,
              color: INK,
              maxWidth: 900,
            }}
          >
            Play a story in any world you can imagine
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{ display: 'flex', width: 72, height: 4, backgroundColor: ACCENT }}
            />
            <div style={{ display: 'flex', marginLeft: 24, fontSize: 34, color: INK }}>
              Narraitor
            </div>
            <div style={{ display: 'flex', marginLeft: 24, fontSize: 26, color: SECONDARY }}>
              Runs in your browser
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
