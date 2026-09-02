import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { StorageFallbackBanner } from '@/components/shared/StorageFallbackBanner';
import { _setStorageStatusForTesting } from '@/state/persistence';
import { StorageStatus } from '@/lib/storage/resilientStorage';

const meta: Meta<typeof StorageFallbackBanner> = {
  title: '01-Atoms/feedback/StorageFallbackBanner',
  component: StorageFallbackBanner,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StorageFallbackBanner>;

export const StorageUnavailable: Story = {
  render: () => {
    _setStorageStatusForTesting(StorageStatus.UNAVAILABLE, {
      message: 'IndexedDB unavailable in this environment',
    });
    return <StorageFallbackBanner />;
  },
};
