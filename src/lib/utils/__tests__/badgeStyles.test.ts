import { getBadgeStyles } from '../badgeStyles';

describe('getBadgeStyles', () => {
  it('returns green styles for skill-difficulty easy', () => {
    const styles = getBadgeStyles('skill-difficulty', 'easy');
    expect(styles).toContain('bg-green-100');
    expect(styles).toContain('text-green-800');
  });

  it('returns blue styles for skill-difficulty medium', () => {
    const styles = getBadgeStyles('skill-difficulty', 'medium');
    expect(styles).toContain('bg-blue-100');
    expect(styles).toContain('text-blue-800');
  });

  it('returns red styles for skill-difficulty hard', () => {
    const styles = getBadgeStyles('skill-difficulty', 'hard');
    expect(styles).toContain('bg-red-100');
    expect(styles).toContain('text-red-800');
  });

  it('returns green styles for skill-requirement available', () => {
    const styles = getBadgeStyles('skill-requirement', 'available');
    expect(styles).toContain('bg-green-100');
    expect(styles).toContain('text-green-800');
  });

  it('returns gray styles for skill-requirement unavailable', () => {
    const styles = getBadgeStyles('skill-requirement', 'unavailable');
    expect(styles).toContain('bg-gray-100');
    expect(styles).toContain('text-gray-500');
  });
});