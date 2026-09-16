import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { StorageFallbackBanner } from '../StorageFallbackBanner';
import {
  _resetStorageStatusForTesting,
  _setStorageStatusForTesting,
} from '@/state/persistence';
import { StorageStatus } from '@/lib/storage/resilientStorage';

describe('StorageFallbackBanner', () => {
  beforeEach(() => {
    _resetStorageStatusForTesting();
  });

  afterEach(() => {
    _resetStorageStatusForTesting();
  });

  it('renders nothing when storage is normal and no fallback notice exists', () => {
    const { container } = render(<StorageFallbackBanner />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders ErrorBlock with warning message when storage status is unavailable', () => {
    _setStorageStatusForTesting(StorageStatus.UNAVAILABLE, {
      message: 'IndexedDB not available in this environment',
    });

    render(<StorageFallbackBanner />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass('storage-fallback-banner');
    expect(screen.getByText(/can't save to this browser/i)).toBeInTheDocument();
    expect(screen.getByText(/export your data from Settings/i)).toBeInTheDocument();
    // The raw failure belongs in the log, not in the player's alert.
    expect(screen.queryByText(/IndexedDB/i)).not.toBeInTheDocument();
  });

  it('renders fallback warning when unavailable without a detailed notice message', () => {
    _setStorageStatusForTesting(StorageStatus.UNAVAILABLE, null);

    render(<StorageFallbackBanner />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText(
        "Narraitor can't save to this browser right now. Keep this tab open, and export your data from Settings so you don't lose your progress."
      )
    ).toBeInTheDocument();
  });

  it('reacts dynamically to storage status change events', () => {
    const { container } = render(<StorageFallbackBanner />);
    expect(container.firstChild).toBeNull();

    act(() => {
      _setStorageStatusForTesting(StorageStatus.UNAVAILABLE, {
        message: 'Quota exceeded',
      });
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/can't save to this browser/i)).toBeInTheDocument();

    act(() => {
      _setStorageStatusForTesting(null, null);
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
