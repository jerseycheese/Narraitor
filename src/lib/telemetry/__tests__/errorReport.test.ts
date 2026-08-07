import {
  buildErrorReport,
  sanitizeRoute,
  sanitizeStack,
  selectReportableError,
} from '../errorReport';

/**
 * MVP coverage for the error-report privacy contract (#1641). Every test here
 * fails if the scrubbing regresses — that is the point of the file. Behaviour
 * that isn't a privacy boundary is deliberately not covered.
 */
describe('errorReport privacy contract (#1641)', () => {
  it('keeps the message out of the payload, key-shaped strings and story text included', () => {
    // Deliberately too short to match GitHub's Google-API-key secret scan
    // (AIza + 35 chars) — still key-shaped enough to prove the message field
    // gets dropped wholesale rather than selectively redacted.
    const secret = 'AIzaSy-FAKE-TEST-KEY-DO-NOT-USE';
    const error = new Error(
      `Request failed with key ${secret} while generating for Thornwick the Bold in the Ashen Reach`
    );

    const serialized = JSON.stringify(
      buildErrorReport(error, { source: 'client', route: '/play/world-123' })
    );

    expect(serialized).not.toContain(secret);
    expect(serialized).not.toContain('AIzaSy');
    expect(serialized).not.toContain('Thornwick');
    expect(serialized).not.toContain('Ashen Reach');
    expect(serialized).not.toContain('Request failed');
  });

  it('strips the message header line that error.stack starts with', () => {
    // error.stack is "Error: secret text\n    at ..." — a naive send leaks it.
    const frames = sanitizeStack(new Error('secret text').stack);

    expect(frames.length).toBeGreaterThan(0);
    expect(frames.join('\n')).not.toContain('secret text');
    frames.forEach((frame) => expect(frame).toMatch(/^at\s/));
  });

  it('collapses a thrown non-Error name instead of transporting it', () => {
    const report = buildErrorReport(
      { name: 'world "Ashen Reach" blew up', message: 'nope', stack: '' },
      { source: 'client', route: '/worlds' }
    );

    expect(report.name).toBe('Error');
  });

  it('drops the query string and masks id-shaped segments', () => {
    expect(sanitizeRoute('/world/123e4567-e89b-12d3-a456-426614174000/edit')).toBe(
      '/world/:id/edit'
    );
    expect(sanitizeRoute('/worlds?search=Ashen%20Reach#top')).toBe('/worlds');
    expect(sanitizeRoute('/play/world-1753812345678-a1b2')).toBe('/play/:id');
    expect(sanitizeRoute('')).toBe('/unknown');
  });

  it('leaves a long kebab-case route segment intact', () => {
    // Masking on length alone turns real API paths into /api/narrative/:id,
    // which makes the route field useless for the routes we most want to watch.
    expect(sanitizeRoute('/api/narrative/validate-event-significance')).toBe(
      '/api/narrative/validate-event-significance'
    );
  });

  it('reports the Error argument, not the label a logger call leads with', () => {
    const error = new Error('boom');

    expect(selectReportableError(['Failed to generate story ending:', error])).toBe(error);
    expect(selectReportableError(['no error here'])).toBe('no error here');
  });
});
