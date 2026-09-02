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
    expect(screen.getByText(/Storage is unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Progress will not be saved/i)).toBeInTheDocument();
    expect(screen.getByText(/IndexedDB not available in this environment/i)).toBeInTheDocument();
  });

  it('renders fallback warning when unavailable without a detailed notice message', () => {
    _setStorageStatusForTesting(StorageStatus.UNAVAILABLE, null);

    render(<StorageFallbackBanner />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Storage is unavailable. Progress will not be saved.')).toBeInTheDocument();
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
    expect(screen.getByText(/Quota exceeded/i)).toBeInTheDocument();

    act(() => {
      _setStorageStatusForTesting(null, null);
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
