import { render, screen } from '@testing-library/react';
// Aliased: the default export is named `Error`, which would otherwise shadow
// the global constructor this file needs to build test errors with.
import RouteErrorBoundary from '../error';
import { reportError } from '@/lib/telemetry/reportError';

jest.mock('@/lib/telemetry/reportError', () => ({ reportError: jest.fn() }));

const mockReportError = reportError as jest.Mock;

/**
 * The route-level boundary is the most common client crash path and it never
 * touches logger.error, so it needs its own hook into the sink (#1641). This
 * test exists because that gap shipped silently the first time.
 */
describe('route error boundary reporting (#1641)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reports a segment crash with its digest', () => {
    const error = Object.assign(new Error('boom'), { digest: 'abc123' });

    render(<RouteErrorBoundary error={error} reset={() => {}} />);

    expect(mockReportError).toHaveBeenCalledWith(error, {
      source: 'error-boundary',
      digest: 'abc123',
    });
  });

  it('still shows plain language rather than the raw message', () => {
    render(<RouteErrorBoundary error={new Error('boom')} reset={() => {}} />);

    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
