/**
 * The prompts behind the homepage's four world plates.
 *
 * These live in the repo because the images are a claim: the page shows them as
 * art the product's own image model produced for a described world. Anyone
 * should be able to see what was asked for and regenerate it.
 *
 * Shared style rules, all from the brand's stated anti-references:
 *   - Painterly and desaturated. The image the homepage used to carry was a
 *     neon photoreal city, on a brand that names neon and game-UI sheen as
 *     things it is not.
 *   - Low-key lighting. The hero runs text over these, and a CSS scrim
 *     guarantees the contrast floor, but a bright plate makes the scrim heavy
 *     enough to muddy the art.
 *   - No lettering of any kind. Generated signage comes out garbled and reads
 *     as a machine artifact, which was a specific critique of the old image.
 *   - Warm neutral cast, so the plates sit next to DS3's paper rather than
 *     fighting it.
 */

export const DEFAULT_ASPECT = '16:9';

const SHARED_STYLE = [
  'Painterly digital illustration with visible brushwork, in the manner of a',
  'printed plate in an old book rather than a photograph or a game render.',
  'Strongly desaturated, muted palette with a warm neutral cast.',
  'Low-key lighting: the overall image reads dark and atmospheric, with light',
  'coming from few sources and falling off quickly.',
  'Landscape composition with clear depth and a lot of quiet, empty space.',
  'Absolutely no text, no lettering, no signage, no numerals, no logos, no',
  'watermarks, and no signature of any kind anywhere in the frame.',
  'No neon glow, no cyberpunk sheen, no lens flare, no bloom, no HDR gloss,',
  'no video-game interface elements, no characters facing the viewer.',
].join(' ');

/**
 * `caption` is the plate label shown on the page and must match the world the
 * prompt describes. `typed` is the short description a player would have
 * written to make this world, shown on the page as the input side of the
 * "you wrote this, it wrote that" pairing.
 */
export const BRAND_IMAGES = [
  {
    id: 'port-city',
    caption: 'A rain-soaked port city',
    typed:
      'A rain-soaked port city where it never stops raining and every cop is on ' +
      'someone\'s payroll. Nineteen-forties, but the neon is wrong.',
    prompt: [
      'A narrow cobbled street in a harbour city at night in heavy rain, seen at',
      'street level. Wet stone throwing back the light of a few tall iron',
      'lampposts receding into fog. Shuttered storefronts, iron balconies, a',
      'sliver of dark water and dock cranes at the far end. Nineteen-forties',
      'silhouette. Nobody in the frame.',
      SHARED_STYLE,
    ].join(' '),
  },
  {
    id: 'survey-ship',
    caption: 'A survey ship, six months dark',
    typed:
      'A survey ship six months into a silent run, the crew down to four, and ' +
      'something in the hold that was not on the manifest.',
    prompt: [
      'The interior of a cramped spacecraft observation deck seen from behind the',
      'pilot seats, looking out through thick angular windows onto empty black',
      'space and one distant pale planet. Worn padded seats, exposed conduit,',
      'analogue switch panels dimmed to standby. Utilitarian nineteen-seventies',
      'hardware, not sleek. Nobody in the frame.',
      SHARED_STYLE,
    ].join(' '),
  },
  {
    id: 'normandy',
    caption: 'Normandy, June 1944',
    typed:
      'Normandy, June 1944. A rifle squad separated from its unit, working ' +
      'inland through the hedgerows with no radio.',
    prompt: [
      'A sunken farm track between high overgrown hedgerows in northern France on',
      'an overcast June morning. Deep ruts holding water, a broken gate, a stone',
      'farm wall, flat fields and a distant church spire beyond. Heavy grey sky.',
      'Cold, damp, still. Nobody in the frame, and no vehicles or weapons.',
      SHARED_STYLE,
    ].join(' '),
  },
  {
    id: 'debt-court',
    caption: 'A court that runs on debts',
    typed:
      'A court where nobody uses money and every favour is written down, and ' +
      'the ledger is the only law anyone is afraid of.',
    prompt: [
      'A long stone audience hall lit by banked candles, seen down its centre',
      'line. Tall pointed arches receding into shadow, a raised empty seat at the',
      'far end, worn flagstones, heavy hanging cloth with no device or emblem on',
      'it. Warm candlelight against cold stone. Nobody in the frame.',
      SHARED_STYLE,
    ].join(' '),
  },
];
