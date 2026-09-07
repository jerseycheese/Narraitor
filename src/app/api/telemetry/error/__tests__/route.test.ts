/**
 * @jest-environment node
 */

/**
 * This route is an unauthenticated write sink: anyone can POST to it and the
 * body lands in the runtime log. Its whole job is deciding what of a hostile
 * payload is allowed through, so the seam is the sink itself — `logErrorReport`
 * is faked and every sanitizer between the request and it runs for real. Faking
 * anything lower would skip the code that is the point of the route.
 *
 * No provider is involved, so there is no fetch to stub and no key header to
 * send; a plain NextRequest is what a real caller sends here.
 */

jest.mock('@/lib/telemetry/reportServerError', () => ({
  logErrorReport: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { logErrorReport } from '@/lib/telemetry/reportServerError';
import type { ErrorReport } from '@/lib/telemetry/errorReport';
import { ErrorType } from '@/lib/utils/errorUtils';

const mockLog = logErrorReport as jest.MockedFunction<typeof logErrorReport>;

const postReport = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/telemetry/error', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const loggedReport = (): ErrorReport => mockLog.mock.calls[0][0];

const VALID_REPORT = {
  source: 'error-boundary',
  name: 'TypeError',
  type: 'network',
  route: '/play/world-1753812345678-a1b2',
  digest: '3f9a2b',
  frames: ['    at renderScene (/app/src/components/Scene.tsx:42:9)'],
};

describe('POST /api/telemetry/error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts a well-formed report and passes the sanitized fields to the sink', async () => {
    const response = await POST(postReport(VALID_REPORT));

    expect(response.status).toBe(204);
    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(loggedReport()).toEqual({
      source: 'error-boundary',
      name: 'TypeError',
      type: ErrorType.NETWORK,
      // The entity id in the path is masked before anything is written.
      route: '/play/:id',
      digest: '3f9a2b',
      frames: ['at renderScene (/app/src/components/Scene.tsx:42:9)'],
    });
  });

  it('drops posted lines that are not stack frames', async () => {
    await POST(
      postReport({
        ...VALID_REPORT,
        frames: [
          '    at renderScene (/app/src/components/Scene.tsx:42:9)',
          'Error: the player pasted their own prose in here',
          'at loadWorld (webpack-internal:///./src/lib/world.ts?id=42:10:3)',
        ],
      })
    );

    const report = loggedReport();
    expect(report.frames).toEqual([
      'at renderScene (/app/src/components/Scene.tsx:42:9)',
      // The frame survives; the query string riding on it does not.
      'at loadWorld (webpack-internal:///./src/lib/world.ts)',
    ]);
    expect(report.frames.join('\n')).not.toContain('pasted their own prose');
  });

  it('ignores fields outside the schema', async () => {
    await POST(
      postReport({
        ...VALID_REPORT,
        message: 'the free-form message that must never travel',
        apiKey: 'a-players-provider-key',
        world: { description: 'private world content' },
      })
    );

    const report = loggedReport();
    expect(Object.keys(report).sort()).toEqual([
      'digest',
      'frames',
      'name',
      'route',
      'source',
      'type',
    ]);
    expect(JSON.stringify(report)).not.toContain('a-players-provider-key');
    expect(JSON.stringify(report)).not.toContain('must never travel');
  });

  it('collapses values outside the closed vocabulary to their defaults', async () => {
    await POST(
      postReport({
        source: 'attacker-supplied-source',
        name: 'a whole sentence, not a class name',
        type: 'invented-category',
        route: '/worlds?search=something+private#frag',
        digest: 'not-hex-at-all',
        frames: 'not-an-array',
      })
    );

    expect(loggedReport()).toEqual({
      source: 'client',
      name: 'Error',
      type: ErrorType.UNKNOWN,
      // Query string and hash are dropped whole.
      route: '/worlds',
      frames: [],
    });
  });

  it('drops a body over the size ceiling without logging it', async () => {
    const oversized = {
      ...VALID_REPORT,
      frames: [`    at pad (${'x'.repeat(5000)}.ts:1:1)`],
    };

    const response = await POST(postReport(oversized));

    expect(response.status).toBe(204);
    expect(mockLog).not.toHaveBeenCalled();
  });

  it('answers 204 and logs nothing when the body is not JSON', async () => {
    const response = await POST(postReport('{"source": "client",'));

    expect(response.status).toBe(204);
    expect(mockLog).not.toHaveBeenCalled();
  });

  it('answers 204 and logs nothing when the body is JSON but not an object', async () => {
    const response = await POST(postReport('"just a string"'));

    expect(response.status).toBe(204);
    expect(mockLog).not.toHaveBeenCalled();
  });
});
