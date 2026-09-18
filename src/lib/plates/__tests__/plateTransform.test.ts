/**
 * The plate transform against the reference render.
 *
 * The ink-register direction was approved against plates generated in Python
 * with PIL. This asserts the browser pipeline reproduces them, which is the
 * whole reason the first slice exists — without it, "the browser makes the same
 * plate" is an assumption.
 *
 * The fixture stores luminance BYTES, not PNGs, so both sides transform
 * byte-identical input and only the transform is under test. It also means
 * these run without a canvas, which jsdom does not have.
 */
import fixture from './fixtures/normandy-128.json';

import { halftone } from '../screen';
import { autolevels, midtone, normaliseTone } from '../tone';

function decode(base64: string): Float32Array {
  const binary = Buffer.from(base64, 'base64');
  const out = new Float32Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) out[i] = binary[i] / 255;

  return out;
}

/** Share of the plate covered in ink. A plate gone black sits near 0.69. */
function inkCoverage(lum: Float32Array): number {
  let total = 0;
  for (let i = 0; i < lum.length; i += 1) total += lum[i];
  return 1 - total / lum.length;
}

function meanAbsoluteError(a: Float32Array, b: Float32Array): number {
  let total = 0;
  for (let i = 0; i < a.length; i += 1) total += Math.abs(a[i] - b[i]);
  return total / a.length;
}

const source = decode(fixture.source);
const { width, height, cell } = fixture;

// The fixture pins the parameters it was generated with, so the reference stays
// independent of whatever the product default happens to be.
const target = fixture.midtoneTarget;

describe('plate transform vs the reference render', () => {
  it('reproduces the continuous plate', () => {
    const expected = decode(fixture.continuous);
    const actual = normaliseTone(source, { gain: fixture.continuousGain, target });

    // Same arithmetic on both sides, so this should be quantisation only.
    expect(meanAbsoluteError(actual, expected)).toBeLessThan(0.01);
    expect(inkCoverage(actual)).toBeCloseTo(inkCoverage(expected), 2);
  });

  it('reproduces the halftone plate', () => {
    const expected = decode(fixture.halftone);
    const screened = halftone(
      normaliseTone(source, { gain: fixture.halftoneGain, target }),
      { width, height, cell }
    );

    // The reference is rendered analytically at 8x; this box-filters 3x3
    // sub-samples, so only dot edges differ. The dots themselves must land in
    // the same places and carry the same area.
    expect(meanAbsoluteError(screened, expected)).toBeLessThan(0.04);
    expect(inkCoverage(screened)).toBeCloseTo(inkCoverage(expected), 2);
  });

  it('lands ink coverage in the range a readable plate occupies', () => {
    const screened = halftone(
      normaliseTone(source, { gain: fixture.halftoneGain, target }),
      { width, height, cell }
    );

    // A faithful screen inks the same share of the plate as the tone it was
    // given, so this tracks the normalised tone rather than a chosen look. A
    // plate whose tone curve has regressed sits near 0.69.
    const toneGiven = inkCoverage(
      normaliseTone(source, { gain: fixture.halftoneGain, target })
    );

    expect(inkCoverage(screened)).toBeCloseTo(toneGiven, 2);
    expect(inkCoverage(screened)).toBeLessThan(0.58);
  });
});

describe('the tone pass', () => {
  it('needs the median move, not just the endpoint stretch', () => {
    // Endpoint stretching alone leaves this art bottom-heavy, which is what
    // drove ink coverage to ~0.69 and turned the first screened plates black.
    const stretchedOnly = autolevels(source);
    const full = midtone(stretchedOnly, target);

    expect(inkCoverage(stretchedOnly)).toBeGreaterThan(inkCoverage(full));
    expect(inkCoverage(full)).toBeLessThan(0.55);
  });

  it('leaves a flat image alone rather than dividing by its span', () => {
    const flat = new Float32Array(16).fill(0.5);

    expect(Array.from(autolevels(flat))).toEqual(Array.from(flat));
  });
});
