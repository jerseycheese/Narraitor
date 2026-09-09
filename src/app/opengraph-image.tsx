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

// Inlined rather than read from public/ at module scope. Static routes resolve
// that read on the build worker, but on-demand routes evaluate this module inside
// the serverless function, whose bundle does not carry public/ — so the read threw
// ENOENT there and took metadata resolution down with it.
const logoMark =
  'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDIwMDEwOTA0Ly9FTiIKICJodHRwOi8vd3d3LnczLm9yZy9UUi8yMDAxL1JFQy1TVkctMjAwMTA5MDQvRFREL3N2ZzEwLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4wIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiB3aWR0aD0iMTAyNC4wMDAwMDBwdCIgaGVpZ2h0PSIxMDI0LjAwMDAwMHB0IiB2aWV3Qm94PSIxNTAgMTUwIDcyNCA3MjQiCiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0Ij4KCjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAuMDAwMDAwLDEwMjQuMDAwMDAwKSBzY2FsZSgwLjEwMDAwMCwtMC4xMDAwMDApIgpmaWxsPSIjMDAwMDAwIiBzdHJva2U9Im5vbmUiPgo8cGF0aCBkPSJNNzUwNSA4NzA5IGMtMjYgLTQxIC0zMTMgLTIyMiAtNDg5IC0zMDggLTU2IC0yNyAtMjI5IC0xMTIgLTM4NgotMTg5IC01NTMgLTI2OSAtODcxIC00ODIgLTExNzYgLTc4NiAtMTU2IC0xNTcgLTI3MSAtMjk2IC0zODAgLTQ2MSAtMzE5IC00ODUKLTQ5NCAtMTA3MCAtNDk0IC0xNjUxIGwwIC0xNjEgLTQ0IC05NCBjLTQ3IC0xMDEgLTEwOSAtMjg0IC0xMDMgLTMwMyAyIC02IDk0CjE3MCAyMDUgMzkwIDExMCAyMjEgMjMzIDQ2MCAyNzIgNTMwIDQ0NiA3OTkgODg1IDEzMzMgMTM3MCAxNjYzIDEzMCA4OSAxNDMKOTAgNTAgNSAtNDEyIC0zNzggLTY4MCAtNzA5IC05ODIgLTEyMTQgLTE0NCAtMjQwIC0yNTUgLTQ0NSAtNTAxIC05MjUgLTIzMgotNDU0IC0zNDUgLTY2NCAtNTM1IC0xMDAzIC0yMzIgLTQxMCAtMzM3IC02MTEgLTQ1MyAtODY1IC01NiAtMTIxIC02OCAtMTU3Ci01MiAtMTU3IDMgMCA1NCA0NiAxMTIgMTAzIDEzMCAxMjYgMjc2IDI1MiA0NDMgMzc5IDY5IDU0IDEzNSAxMDggMTQ1IDEyMSAxMwoxNyAyMiA1NiAzMSAxMzYgMzAgMjcyIDE0OCA1ODUgMzYwIDk1NyBsNTIgOTEgNzIgNyBjMzY0IDM1IDgyNyAyMzIgMTEzOCA0ODMKMTA4IDg4IDI1NiAyNDUgMzIzIDM0MyBsNTggODUgLTEwMyA3IGMtNTcgNSAtMTA3IDkgLTExMiAxMSAtNSAyIDE1IDE4IDQ1IDM2CjI2MSAxNjEgNTEyIDQ1MyA2NDEgNzQ1IDM1IDc5IDg4IDIzMCA4OCAyNTAgMCAxMCAtMjMgNyAtODcgLTExIC00OSAtMTIgLTEwMwotMjMgLTEyMiAtMjMgbC0zNCAwIDI5IDIyIGM1MSAzNyAxODMgMTcwIDI0OCAyNDggMTMwIDE1NiAyNDQgMzQzIDMyNiA1MzUgODQKMTk0IDEyMyAzNTcgMTM2IDU2NSAxMyAyMjUgLTQ2IDUxMyAtOTEgNDM5eiBtLTI0MCAtNzI2IGMtNjUgLTI3NyAtMjczIC02MDkKLTUxMyAtODE5IC05OCAtODYgLTIzNSAtMTgwIC0zMzIgLTIyOSAtNzIgLTM2IC0xODkgLTc5IC0xOTcgLTcyIC0yIDMgNjAgNTEKMTM5IDEwNyA0NDEgMzE2IDY1NCA1NTEgODQwIDkyOCAzOSA3OCA3MiAxNDIgNzQgMTQyIDEgMCAtNCAtMjYgLTExIC01N3oKbS02MzYgLTE0OTUgYy01OCAtODUgLTE4NyAtMjE4IC0yODQgLTI5MSAtMTQ0IC0xMDggLTQxMyAtMjE4IC01MzAgLTIxNiBsLTQwCjAgNzUgMzcgYzMxMiAxNTIgMzk1IDE5NSA0NzAgMjQzIDk5IDY1IDI0OCAxODYgMzA1IDI1MSAyMiAyNCA0MiA0MyA0MyA0MiAyCi0xIC0xNSAtMzEgLTM5IC02NnoiLz4KPHBhdGggZD0iTTMzNzEgODI5NyBjLTYgLTggLTIwIC01NyAtMzEgLTEwOCAtNTUgLTI1NyAtMTI3IC0zNTAgLTMyMSAtNDE0Ci0xMzEgLTQ0IC0xMzEgLTcyIDIgLTEyMCAxOTAgLTY5IDI2NyAtMTY1IDMxNSAtMzkyIDI1IC0xMTggMzUgLTE0MyA2MCAtMTQzCjIxIDAgMzEgMjcgNTMgMTQ1IDI0IDEyOSA2MSAyMTEgMTIzIDI3NCA1OCA1OSAxMDAgODQgMTk0IDExNyAxMjMgNDIgMTMyIDc1CjI3IDEwOCAtODggMjggLTE1MSA2MyAtMjA4IDExNyAtNjIgNTkgLTk5IDEzMSAtMTI3IDI0NyAtMzYgMTU1IC00MyAxNzcgLTU5CjE4MCAtOSAyIC0yMSAtNCAtMjggLTExeiIvPgo8cGF0aCBkPSJNNDI0NiA3MTY4IGMtNyAtMTggLTIwIC01NCAtMzAgLTc5IC0xOSAtNTIgLTUwIC04NSAtMTIxIC0xMjYgLTY2Ci0zOSAtNjYgLTYwIDMgLTk2IDY2IC0zNiAxMDAgLTc4IDEzMiAtMTY0IDM1IC05MiA1NiAtOTMgODggLTMgMzEgODcgNjEgMTIzCjEzNSAxNjIgODIgNDQgODIgNjEgLTIgMTA4IC03MSA0MCAtMTAyIDc4IC0xMjcgMTU1IC0yOCA4NCAtNTUgOTkgLTc4IDQzeiIvPgo8cGF0aCBkPSJNMjYwMSA3MDczIGMtNSAtMTAgLTIxIC03NSAtMzUgLTE0NCAtNDMgLTIxMSAtNzAgLTI3MyAtMTU1IC0zNjIKLTY1IC02OCAtMTQzIC0xMTQgLTI1OSAtMTUyIC02NyAtMjIgLTgzIC0zMSAtODggLTUwIC05IC0zNCAtMSAtNDEgNzQgLTY2CjE3MyAtNTcgMjk4IC0xNTIgMzU2IC0yNzMgMzUgLTc0IDQwIC05MSA3MSAtMjQzIDI2IC0xMzEgMzggLTE2MyA1OSAtMTYzIDI2CjAgMzcgMjkgNjEgMTUyIDMxIDE1NyA1NiAyMjYgMTEyIDMxMCA2NyAxMDIgMTQ0IDE1OCAyNzggMjAzIDExMCAzNyAxMTcgNDEKMTEzIDczIC0zIDI0IC0xMiAzMCAtMTA0IDYzIC0xMTkgNDEgLTE4OSA4NCAtMjQ1IDE0OCAtNzQgODMgLTEwNiAxNjIgLTE1NAozODAgLTE0IDYzIC0zMCAxMjAgLTM2IDEyNyAtMTYgMTkgLTM2IDE3IC00OCAtM3oiLz4KPHBhdGggZD0iTTM2ODQgNDkxOSBjLTEwNiAtOCAtMjEzIC0yNCAtNDY0IC03MCAtMTU3IC0zMCAtNDEyIC0zMSAtNTU1IC00Ci01NSAxMSAtMTIyIDIwIC0xNTAgMjAgbC01MCAwIC03MSAtMjE1IGMtNTIgLTE1OCAtNzUgLTIxNCAtODUgLTIxMSAtOCAyIC00Mwo2IC03OSA4IC03NyA1IC0xMTcgLTE1IC0xNDIgLTY4IC05IC0xOSAtOTEgLTI2NiAtMTgzIC01NDkgLTkxIC0yODMgLTI0NwotNzU4IC0zNDYgLTEwNTUgLTEyMSAtMzY1IC0xNzkgLTU1NCAtMTc5IC01ODMgMCAtMTE0IDg0IC0xNjggMjk1IC0xOTIgNTYgLTYKNjE5IC0xMCAxNDgyIC0xMCA5NTMgMCAxNDAwIC0zIDE0MTkgLTExIDE2IC01IDUyIC0zMyA4MSAtNjAgODMgLTc4IDE4NyAtMTE4CjM2OCAtMTQwIDE3MiAtMjIgNDAxIDggNTE4IDY3IDI4IDE1IDcxIDQ0IDk1IDY2IDI0IDIyIDYyIDQ4IDg1IDU5IDQxIDE4IDg4CjE5IDE0NjUgMTkgMTU3NiAwIDE0NzEgLTQgMTUxMiA2MyA0MSA2NyA0MiA2NCAtMTM1IDU4OSAtOTIgMjcxIC0yODEgODMxCi00MjAgMTI0MyAtMzEyIDkyNSAtMzIyIDk1NSAtMzM2IDk3MSAtMTYgMTkgLTQ2IDE4IC0xNjkgLTcgLTgyIC0xNyAtMTQzIC0yMgotMjc1IC0yMyAtMTY5IDAgLTI0MSA3IC00MjkgNDUgLTE3OSAzNiAtMzA4IDUwIC00NzEgNTAgLTM5MCAxIC02ODAgLTgwIC05NzAKLTI3MSAtOTkgLTY2IC0yNTMgLTE4OSAtMzA5IC0yNDkgbC0yOSAtMzAgLTg0IDc5IGMtODIgNzYgLTIyMSAxODAgLTI0MiAxODAKLTExIDAgLTExMSAtMTkzIC0xMTEgLTIxNCAwIC03IDI4IC0zMiA2MyAtNTYgNzMgLTUyIDE0NCAtMTE2IDE5OCAtMTgxIGwzOQotNDcgMyAtODgxIGMxIC00ODUgMCAtODgxIC00IC04ODEgLTMgMCAtMjEgMTYgLTQwIDM2IC00OCA1MCAtMjEyIDE3NSAtMzExCjIzNiAtMTU3IDk4IC0zNjQgMTg1IC01NTMgMjMyIC0xNTIgMzggLTI3NyA1MSAtNTA1IDUwIC0yNTIgMCAtMzQzIC0xMiAtNjU3Ci04NCAtMzAyIC03MCAtMzg5IC04MyAtNTc4IC04MyAtMTQzIDAgLTE4MiAzIC0yNDkgMjIgLTQ0IDExIC04MSAyMyAtODMgMjUKLTQgMyA0MzIgMTMwMSA1NzcgMTcyNCBsMjIgNjIgNjYgLTcgYzM3IC01IDE0NCAtNyAyMzcgLTcgMTUyIDIgMTk2IDYgNDEwIDQ0CjM1NCA2MiA1NzAgNjUgODcxIDE0IDMwIC02IDMyIC0zIDkzIDEwMSA0NiA3OCA1OSAxMTAgNTAgMTE1IC0xOCAxMiAtMjAzIDQ4Ci0yOTkgNTkgLTEzMSAxNSAtMjY0IDE4IC0zODYgMTB6IG0zMTYxIC0yODMgYzI5NyAtNTUgMzQzIC01OSA1NDAgLTU4IDEwNSAxCjIwNSAzIDIyNCA0IGwzNCAzIDUyIC0xNTUgYzIwMyAtNTk5IDQ1MSAtMTMyOSA0OTQgLTE0NTQgMjggLTgyIDUxIC0xNTQgNTEKLTE2MSAwIC0xNyAtOTcgLTQyIC0yMTUgLTU2IC0xNzQgLTE5IC0zMzggMCAtNjk0IDgxIC0yNzggNjMgLTM5MCA4MCAtNTg2IDg3Ci0zMTcgMTEgLTU5NyAtMzggLTg2NSAtMTU0IC0xODkgLTgxIC00MDAgLTIxMyAtNTQ3IC0zNDEgbC02MyAtNTQgMCA4NzEgMAo4NzAgNDkgNTkgYzkzIDExMiAyMTIgMjAzIDQwMSAzMDcgMTg3IDEwMiAyOTMgMTQwIDQ3NiAxNzAgMTQyIDIzIDQ3MSAxMyA2NDkKLTE5eiBtLTI5MTUgLTE5ODEgYzE4NCAtMzEgNDYxIC0xMzggNjIyIC0yNDEgNzEgLTQ1IDI1MCAtMTg1IDI0NCAtMTkxIC0xIC0xCi0zOCAxMyAtODIgMzIgLTE4OCA4MSAtMzgyIDExNCAtNzI0IDEyMiAtMjYwIDYgLTM4NyAtMSAtODI1IC00MiAtMTQzIC0xNAotMzQ4IC0zMiAtNDU1IC00MSAtMjA0IC0xNiAtODA3IC0zMSAtODM0IC0yMSAtMTMgNSAtOCAyNiAyOSAxMzggMjUgNzMgNDYKMTM0IDQ5IDEzNiAyIDIgNTAgLTYgMTA3IC0xOCA4NiAtMTkgMTM3IC0yMyAyODkgLTIzIDIxMiAwIDMyMSAxMyA1OTAgNzUgMjExCjQ4IDM1NiA3NiA0NzAgODggMTE3IDEzIDQwNSA2IDUyMCAtMTR6IG0yOTg0IDEwIGM3MSAtOCAyMjYgLTM3IDM0NSAtNjUgMjYwCi01OSAzNDcgLTc1IDUxMSAtOTEgMTUwIC0xNCAzMDQgLTYgNDQ4IDIyIDU4IDEyIDEwNyAxOCAxMTEgMTMgMTAgLTEyIDkxCi0yNDUgOTEgLTI2MyAwIC0xMiAtNDggLTEzIC0zMDcgLTggLTI5NCA2IC01MDkgMjEgLTk0OCA2NiAtMzA5IDMzIC00NTYgNDEKLTcxMCA0MSAtNDE2IDAgLTczMSAtNDUgLTkxMyAtMTMwIC00MSAtMTkgLTYwIC0yNCAtNTEgLTE0IDI1IDMxIDIwNyAxNjEgMjgwCjIwMSAxMTcgNjUgMzUyIDE2MSA0NTcgMTg5IDE5OSA1MiA0NTQgNjYgNjg2IDM5eiIvPgo8L2c+Cjwvc3ZnPgo=';

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
