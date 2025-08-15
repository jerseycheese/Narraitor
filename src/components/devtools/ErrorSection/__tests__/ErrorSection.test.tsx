/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorSection } from '../ErrorSection';
import { runtimeErrorLogger } from '@/lib/devtools/runtimeErrorLogger';
import { ErrorSeverity, ErrorCategory } from '@/types/runtime-error.types';

// Mock the error logger
jest.mock('@/lib/devtools/runtimeErrorLogger', () => ({
  runtimeErrorLogger: {
    getErrors: jest.fn(() => []),
    getStatistics: jest.fn(() => ({
      total: 0,
      bySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0
      },
      byCategory: {
        [ErrorCategory.REACT]: 0,
        [ErrorCategory.NETWORK]: 0,
        [ErrorCategory.AI_SERVICE]: 0,
        [ErrorCategory.STATE_MANAGEMENT]: 0,
        [ErrorCategory.STORAGE]: 0,
        [ErrorCategory.NAVIGATION]: 0,
        [ErrorCategory.VALIDATION]: 0,
        [ErrorCategory.UNKNOWN]: 0
      },
      recentCount: 0
    })),
    dismissError: jest.fn(),
    clearErrors: jest.fn()
  }
}));

const mockGetErrors = runtimeErrorLogger.getErrors as jest.MockedFunction<typeof runtimeErrorLogger.getErrors>;
const mockGetStatistics = runtimeErrorLogger.getStatistics as jest.MockedFunction<typeof runtimeErrorLogger.getStatistics>;
const mockDismissError = runtimeErrorLogger.dismissError as jest.MockedFunction<typeof runtimeErrorLogger.dismissError>;
const mockClearErrors = runtimeErrorLogger.clearErrors as jest.MockedFunction<typeof runtimeErrorLogger.clearErrors>;

const createMockError = (id: string, message: string, severity: ErrorSeverity, category: ErrorCategory) => ({
  id,
  message,
  severity,
  category,
  timestamp: new Date(),
  dismissed: false,
  count: 1,
  stack: 'Mock stack trace',
  componentContext: {
    componentName: 'TestComponent',
    componentStack: 'at TestComponent\n  at App'
  },
  stateSnapshot: {
    route: '/test',
    timestamp: new Date(),
    userAgent: 'test-agent',
    url: 'http://localhost:3000/test'
  }
});

describe('ErrorSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show empty state when no errors exist', () => {
    mockGetErrors.mockReturnValue([]);
    mockGetStatistics.mockReturnValue({
      total: 0,
      bySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0
      },
      byCategory: {
        [ErrorCategory.REACT]: 0,
        [ErrorCategory.NETWORK]: 0,
        [ErrorCategory.AI_SERVICE]: 0,
        [ErrorCategory.STATE_MANAGEMENT]: 0,
        [ErrorCategory.STORAGE]: 0,
        [ErrorCategory.NAVIGATION]: 0,
        [ErrorCategory.VALIDATION]: 0,
        [ErrorCategory.UNKNOWN]: 0
      },
      recentCount: 0
    });

    render(<ErrorSection />);

    expect(screen.getByText('No runtime errors captured')).toBeInTheDocument();
    expect(screen.getByText('Total: 0')).toBeInTheDocument();
  });

  it('should display error statistics', () => {
    mockGetErrors.mockReturnValue([
      createMockError('1', 'Error 1', ErrorSeverity.HIGH, ErrorCategory.REACT),
      createMockError('2', 'Error 2', ErrorSeverity.MEDIUM, ErrorCategory.NETWORK)
    ]);
    
    mockGetStatistics.mockReturnValue({
      total: 2,
      bySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 1,
        [ErrorSeverity.HIGH]: 1,
        [ErrorSeverity.CRITICAL]: 0
      },
      byCategory: {
        [ErrorCategory.REACT]: 1,
        [ErrorCategory.NETWORK]: 1,
        [ErrorCategory.AI_SERVICE]: 0,
        [ErrorCategory.STATE_MANAGEMENT]: 0,
        [ErrorCategory.STORAGE]: 0,
        [ErrorCategory.NAVIGATION]: 0,
        [ErrorCategory.VALIDATION]: 0,
        [ErrorCategory.UNKNOWN]: 0
      },
      recentCount: 2
    });

    render(<ErrorSection />);

    expect(screen.getByText('Total: 2')).toBeInTheDocument();
    expect(screen.getByText('Recent: 2')).toBeInTheDocument();
    expect(screen.getByText(/high.*: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/medium.*: 1/i)).toBeInTheDocument();
  });

  it('should display error list with key information', () => {
    const mockErrors = [
      createMockError('1', 'React error message', ErrorSeverity.HIGH, ErrorCategory.REACT),
      createMockError('2', 'Network error message', ErrorSeverity.MEDIUM, ErrorCategory.NETWORK)
    ];

    mockGetErrors.mockReturnValue(mockErrors);

    render(<ErrorSection />);

    expect(screen.getByText('React error message')).toBeInTheDocument();
    expect(screen.getByText('Network error message')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    
    // Check that category information is displayed (allowing for multiple matches)
    expect(screen.getAllByText(/react/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/network/i).length).toBeGreaterThan(0);
  });

  it('should allow filtering by severity', async () => {
    const user = userEvent.setup();
    
    const mockErrors = [
      createMockError('1', 'High error', ErrorSeverity.HIGH, ErrorCategory.REACT),
      createMockError('2', 'Low error', ErrorSeverity.LOW, ErrorCategory.REACT)
    ];

    mockGetErrors
      .mockReturnValueOnce(mockErrors) // Initial load
      .mockReturnValueOnce([mockErrors[0]]); // After filter

    render(<ErrorSection />);

    // Open severity filter
    const severityButton = screen.getByText('Severity');
    await user.click(severityButton);

    // Select only HIGH severity
    const highCheckbox = screen.getByLabelText('High');
    await user.click(highCheckbox);

    // Apply filter
    const applyButton = screen.getByText('Apply Filters');
    await user.click(applyButton);

    // Verify filter was applied
    expect(mockGetErrors).toHaveBeenCalledWith({
      severity: [ErrorSeverity.HIGH],
      category: [],
      dismissed: false
    });
  });

  it('should allow filtering by category', async () => {
    const user = userEvent.setup();
    
    mockGetErrors.mockReturnValue([
      createMockError('1', 'React error', ErrorSeverity.HIGH, ErrorCategory.REACT),
      createMockError('2', 'Network error', ErrorSeverity.MEDIUM, ErrorCategory.NETWORK)
    ]);

    render(<ErrorSection />);

    // Open category filter
    const categoryButton = screen.getByText('Category');
    await user.click(categoryButton);

    // Select only REACT category
    const reactCheckbox = screen.getByLabelText('React');
    await user.click(reactCheckbox);

    // Apply filter
    const applyButton = screen.getByText('Apply Filters');
    await user.click(applyButton);

    // Verify filter was applied
    expect(mockGetErrors).toHaveBeenCalledWith({
      severity: [],
      category: [ErrorCategory.REACT],
      dismissed: false
    });
  });

  it('should allow dismissing individual errors', async () => {
    const user = userEvent.setup();
    
    const mockErrors = [
      createMockError('error-1', 'Test error', ErrorSeverity.HIGH, ErrorCategory.REACT)
    ];

    mockGetErrors.mockReturnValue(mockErrors);

    render(<ErrorSection />);

    // Find and click dismiss button
    const dismissButton = screen.getByLabelText('Dismiss error');
    await user.click(dismissButton);

    expect(mockDismissError).toHaveBeenCalledWith('error-1');
  });

  it('should allow clearing all errors', async () => {
    const user = userEvent.setup();
    
    const mockErrors = [
      createMockError('1', 'Error 1', ErrorSeverity.HIGH, ErrorCategory.REACT),
      createMockError('2', 'Error 2', ErrorSeverity.MEDIUM, ErrorCategory.NETWORK)
    ];

    mockGetErrors.mockReturnValue(mockErrors);

    render(<ErrorSection />);

    // Find and click clear all button
    const clearButton = screen.getByText('Clear All');
    await user.click(clearButton);

    expect(mockClearErrors).toHaveBeenCalled();
  });

  it('should show/hide dismissed errors toggle', async () => {
    const user = userEvent.setup();
    
    mockGetErrors.mockReturnValue([]);

    render(<ErrorSection />);

    // Find the show dismissed toggle
    const showDismissedToggle = screen.getByLabelText('Show dismissed errors');
    expect(showDismissedToggle).not.toBeChecked();

    // Toggle it
    await user.click(showDismissedToggle);

    // Verify filter was applied to include dismissed errors
    expect(mockGetErrors).toHaveBeenCalledWith({
      severity: [],
      category: [],
      dismissed: true
    });
  });

  it('should display error details when expanded', async () => {
    const user = userEvent.setup();
    
    const mockError = createMockError('1', 'Test error', ErrorSeverity.HIGH, ErrorCategory.REACT);
    mockGetErrors.mockReturnValue([mockError]);

    render(<ErrorSection />);

    // Find and click the expand button
    const expandButton = screen.getByLabelText('View error details');
    await user.click(expandButton);

    // Should show stack trace and component info
    expect(screen.getByText('Mock stack trace')).toBeInTheDocument();
    
    // Check for component name in context (allowing for multiple matches)
    expect(screen.getAllByText(/TestComponent/).length).toBeGreaterThan(0);
    
    // Check for route in state snapshot
    expect(screen.getAllByText(/\/test/).length).toBeGreaterThan(0);
  });
});