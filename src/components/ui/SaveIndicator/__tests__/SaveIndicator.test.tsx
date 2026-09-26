import { render, screen, act } from '@testing-library/react';
import { SaveIndicator } from '../SaveIndicator';
import {
  _setStorageStatusForTesting,
  _resetStorageStatusForTesting,
} from '@/state/persistence';
import { StorageStatus } from '@/lib/storage/resilientStorage';

describe('SaveIndicator', () => {
  afterEach(() => {
    _resetStorageStatusForTesting();
  });

  it('should display idle status', () => {
    render(<SaveIndicator status="idle" />);

    expect(screen.getByText(/saved/i)).toBeInTheDocument();
  });

  it('should display saving status with loading indicator', () => {
    render(<SaveIndicator status="saving" />);
    
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display saved status with timestamp', () => {
    const lastSaveTime = '2023-01-01T12:00:00.000Z';
    render(<SaveIndicator status="saved" lastSaveTime={lastSaveTime} />);
    
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
    // Check for time format (could be 07:00 AM due to timezone)
    expect(screen.getByText(/\d{1,2}:\d{2}\s?(AM|PM)/i)).toBeInTheDocument();
  });

  it('should display error status with error message', () => {
    render(<SaveIndicator status="error" errorMessage="Save failed" />);
    
    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(/save failed/i)).toBeInTheDocument();
  });

  it('should display total saves count', () => {
    render(<SaveIndicator status="saved" totalSaves={5} />);
    
    expect(screen.getByText(/5 saves/)).toBeInTheDocument();
  });

  it('should allow manual save trigger when provided', () => {
    const mockTriggerSave = jest.fn();
    render(<SaveIndicator status="idle" onManualSave={mockTriggerSave} />);
    
    const saveButton = screen.getByText(/save now/i);
    expect(saveButton).toBeInTheDocument();
    
    saveButton.click();
    expect(mockTriggerSave).toHaveBeenCalledWith('manual');
  });

  it('should disable manual save button when saving', () => {
    const mockTriggerSave = jest.fn();
    render(<SaveIndicator status="saving" onManualSave={mockTriggerSave} />);
    
    const saveButton = screen.getByText(/save now/i);
    expect(saveButton).toBeDisabled();
  });

  it('reflects error when storage is in fallback or memory mode', () => {
    _setStorageStatusForTesting(StorageStatus.UNAVAILABLE, {
      message: 'IndexedDB write failed: QuotaExceededError',
    });

    render(<SaveIndicator status="saved" />);

    expect(screen.getByText(/storage error/i)).toBeInTheDocument();
    expect(
      screen.getByText(/IndexedDB write failed: QuotaExceededError/)
    ).toBeInTheDocument();
  });

  it('recovers when storage status transitions back to healthy', () => {
    const { rerender } = render(<SaveIndicator status="saved" />);
    expect(screen.getByText(/saved/i)).toBeInTheDocument();

    act(() => {
      _setStorageStatusForTesting(StorageStatus.UNAVAILABLE, {
        message: 'Storage degraded',
      });
    });

    expect(screen.getByText(/storage error/i)).toBeInTheDocument();

    act(() => {
      _setStorageStatusForTesting(null);
    });

    rerender(<SaveIndicator status="saved" />);
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
  });
});