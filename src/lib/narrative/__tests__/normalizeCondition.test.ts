import { normalizeConditionLabel, isSameCondition } from '../normalizeCondition';

describe('normalizeConditionLabel', () => {
  it('strips sensation wrappers and leading articles', () => {
    expect(normalizeConditionLabel('fresh wave of blinding pain through twisted lower limb')).toBe(
      'twisted lower limb'
    );
    expect(normalizeConditionLabel('a sharp pain in the left ankle')).toBe('left ankle');
    expect(normalizeConditionLabel('waves of exhaustion')).toBe('exhaustion');
    expect(normalizeConditionLabel('a gashed left forearm.')).toBe('gashed left forearm');
  });

  it('preserves clean condition labels unchanged', () => {
    expect(normalizeConditionLabel('twisted left ankle')).toBe('twisted left ankle');
    expect(normalizeConditionLabel('swollen, aching left ankle')).toBe('swollen, aching left ankle');
    expect(normalizeConditionLabel('shaken')).toBe('shaken');
    expect(normalizeConditionLabel('badly shaken')).toBe('badly shaken');
  });
});

describe('isSameCondition', () => {
  it('matches verbatim and case/whitespace variations', () => {
    expect(isSameCondition('shaken', 'SHAKEN')).toBe(true);
    expect(isSameCondition('gashed left forearm', '  Gashed Left Forearm  ')).toBe(true);
  });

  it('matches developing status conditions with the same core state', () => {
    expect(isSameCondition('shaken', 'badly shaken')).toBe(true);
    expect(isSameCondition('exhausted', 'bone-weary exhaustion')).toBe(true);
    expect(isSameCondition('discredited before the room', 'discredited before the council')).toBe(true);
  });

  it('distinguishes different status conditions', () => {
    expect(isSameCondition('shaken', 'hoarse')).toBe(false);
    expect(isSameCondition('shaken', 'exhausted')).toBe(false);
    expect(isSameCondition('poisoned', 'dazed')).toBe(false);
  });

  it('matches developing injuries on the same body part', () => {
    expect(isSameCondition('twisted left ankle', 'swollen, aching left ankle')).toBe(true);
    expect(isSameCondition('twisted left ankle', 'fresh wave of blinding pain through twisted lower limb')).toBe(
      true
    );
  });

  it('distinguishes injuries on different body parts or lateralities', () => {
    expect(isSameCondition('twisted left ankle', 'gashed left forearm')).toBe(false);
    expect(isSameCondition('twisted left ankle', 'twisted right ankle')).toBe(false);
    expect(isSameCondition('bleeding left shoulder', 'gashed left forearm')).toBe(false);
    expect(isSameCondition('blinded left eye', 'blinded right eye')).toBe(false);
    expect(isSameCondition('deafened left ear', 'deafened right ear')).toBe(false);
  });

  it('distinguishes separate injury types on the same body part', () => {
    expect(isSameCondition('burned left hand', 'broken left hand')).toBe(false);
    expect(isSameCondition('gashed left forearm', 'broken left forearm')).toBe(false);
  });

  it('does not merge distinct conditions that merely share context words', () => {
    expect(isSameCondition('no longer welcome at Hendersons', 'indebted to Hendersons')).toBe(false);
  });
});
