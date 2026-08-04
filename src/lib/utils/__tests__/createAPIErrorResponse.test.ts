import { createAPIErrorResponse } from '../createAPIErrorResponse';
import { reportServerError } from '@/lib/telemetry/reportServerError';

jest.mock('next/server', () => ({
  NextResponse: { json: jest.fn((body, init) => ({ body, init })) },
}));
jest.mock('@/lib/telemetry/reportServerError', () => ({
  reportServerError: jest.fn(),
}));

const mockReportServerError = reportServerError as jest.Mock;

/**
 * The response shape is a thin wrapper around NextResponse.json() and the error
 * mapping is covered by the getUserFriendlyError tests. What's pinned here is
 * the reporting threshold (#1641), which is a behaviour choice: a 5xx is our
 * failure, a 4xx is the caller's.
 */
describe('createAPIErrorResponse error reporting (#1641)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports a server failure', () => {
    createAPIErrorResponse(new Error('gemini exploded'), 500);

    expect(mockReportServerError).toHaveBeenCalledTimes(1);
    expect(mockReportServerError.mock.calls[0][1]).toEqual({
      source: 'route',
      route: '/api',
    });
  });

  it('does not report a client validation failure', () => {
    createAPIErrorResponse(new Error('400 bad request: world data is required'), 400);

    expect(mockReportServerError).not.toHaveBeenCalled();
  });
});
