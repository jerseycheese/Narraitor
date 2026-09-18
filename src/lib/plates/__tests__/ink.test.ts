/**
 * The derived ink against the values the direction was approved on.
 *
 * These hexes are not arbitrary: they are what the three reference worlds
 * produced, and what the approved comps were rendered with.
 */
import { deriveWorldInk, guardHue, oklchToHex } from '../ink';

/** Fills an RGBA buffer with one colour, which is enough to read a hue from. */
function solid(
  red: number,
  green: number,
  blue: number,
  pixels = 200
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels * 4);

  for (let i = 0; i < out.length; i += 4) {
    out[i] = red;
    out[i + 1] = green;
    out[i + 2] = blue;
    out[i + 3] = 255;
  }

  return out;
}

describe('oklchToHex', () => {
  it('reproduces the inks the reference worlds derived', () => {
    // Cyberpunk Neo-Tokyo, after its hue was rotated off the accent.
    expect(oklchToHex(0.42, 0.055, 280)).toBe('#474A6B');
    expect(oklchToHex(0.78, 0.045, 280)).toBe('#B1B5D4');

    // Normandy and Port City, which sit clear of the accent already.
    expect(oklchToHex(0.42, 0.055, 108)).toBe('#504F2B');
    expect(oklchToHex(0.78, 0.045, 108)).toBe('#BABA99');
    expect(oklchToHex(0.42, 0.055, 90)).toBe('#594C28');
  });
});

describe('guardHue', () => {
  it('rotates a hue that would read as the interactive accent', () => {
    // Cyberpunk measures 258 degrees, inside 30 of the 250-degree accent.
    expect(guardHue(258)).toEqual({ hue: 280, guarded: true });
  });

  it('leaves a hue that is already clear of the accent', () => {
    expect(guardHue(108)).toEqual({ hue: 108, guarded: false });
    expect(guardHue(90)).toEqual({ hue: 90, guarded: false });
  });

  it('rotates away on the nearer side', () => {
    expect(guardHue(240).hue).toBe(220);
    expect(guardHue(260).hue).toBe(280);
  });
});

describe('deriveWorldInk', () => {
  it('produces a light and dark pair from art', () => {
    const ink = deriveWorldInk(solid(90, 140, 70));

    expect(ink).not.toBeNull();
    expect(ink?.light).toMatch(/^#[0-9A-F]{6}$/);
    expect(ink?.dark).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('takes the hue from the art', () => {
    // A mid green: the exact degree matters less than that it lands in the greens.
    const ink = deriveWorldInk(solid(90, 140, 70));

    expect(ink?.hue).toBeGreaterThan(100);
    expect(ink?.hue).toBeLessThan(160);
  });

  it('gives no ink when the art carries no usable hue, so the theme keeps its own', () => {
    // Grey carries no hue, and near-black carries none worth reading.
    expect(deriveWorldInk(solid(128, 128, 128))).toBeNull();
    expect(deriveWorldInk(solid(4, 4, 4))).toBeNull();
  });
});
