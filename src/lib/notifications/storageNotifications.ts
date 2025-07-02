/**
 * Storage notification system for Narraitor
 * Provides user-friendly notifications for storage status changes
 */

import { StorageStatus, StorageError } from '../storage/resilientStorage';

/**
 * Storage notification types
 */
export interface StorageNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  actions?: StorageNotificationAction[];
  persistent?: boolean;
  autoClose?: number;
}

export interface StorageNotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary';
}

/**
 * Notification callback type for toast systems
 */
type NotificationCallback = (notification: StorageNotification) => void;

/**
 * Global notification callback - to be set by the UI layer
 */
let notificationCallback: NotificationCallback | null = null;

/**
 * Set the notification callback for displaying storage notifications
 */
export function setNotificationCallback(callback: NotificationCallback): void {
  notificationCallback = callback;
}

/**
 * Show a storage notification based on status and error
 */
export function showStorageNotification(
  status: StorageStatus,
  error?: StorageError | null
): void {
  if (!notificationCallback) {
    // Fallback to console logging if no notification system is available
    console.warn('Storage notification:', { status, error });
    return;
  }

  const notification = createNotificationFromStatus(status, error);
  if (notification) {
    notificationCallback(notification);
  }
}

/**
 * Create notification object from storage status and error
 */
function createNotificationFromStatus(
  status: StorageStatus,
  error?: StorageError | null
): StorageNotification | null {
  const notificationId = `storage-${status}-${Date.now()}`;

  switch (status) {
    case StorageStatus.HEALTHY:
      if (error?.userMessage.includes('recovered')) {
        return {
          id: notificationId,
          type: 'success',
          title: 'Storage Restored',
          message: 'Your data is now being saved automatically.',
          autoClose: 5000,
        };
      }
      // Don't show notification for normal healthy state
      return null;

    case StorageStatus.DEGRADED:
      return {
        id: notificationId,
        type: 'warning',
        title: 'Storage Issues Detected',
        message: error?.userMessage || 'Storage is experiencing intermittent issues. Your data may not save reliably.',
        actions: [
          {
            label: 'Retry',
            action: () => window.location.reload(),
            style: 'primary',
          },
          {
            label: 'Dismiss',
            action: () => {}, // Will be handled by notification system
            style: 'secondary',
          },
        ],
        persistent: true,
      };

    case StorageStatus.UNAVAILABLE:
      return {
        id: notificationId,
        type: 'error',
        title: 'Storage Unavailable',
        message: error?.userMessage || 'Storage is unavailable. Running in memory-only mode.',
        actions: createActionsForUnavailableStorage(error),
        persistent: true,
      };

    case StorageStatus.RECOVERING:
      return {
        id: notificationId,
        type: 'info',
        title: 'Restoring Storage',
        message: 'Attempting to restore storage and sync your data...',
        autoClose: 3000,
      };

    default:
      return null;
  }
}

/**
 * Create action buttons for unavailable storage based on error type
 */
function createActionsForUnavailableStorage(
  error?: StorageError | null
): StorageNotificationAction[] {
  const actions: StorageNotificationAction[] = [];

  if (error?.isRecoverable) {
    actions.push({
      label: 'Retry',
      action: () => window.location.reload(),
      style: 'primary',
    });
  }

  // Add specific actions based on error type
  if (error?.technicalMessage.includes('QuotaExceededError')) {
    actions.push({
      label: 'Free Up Space',
      action: () => {
        // Open browser storage management
        if (navigator.storage && navigator.storage.estimate) {
          navigator.storage.estimate().then(estimate => {
            console.log('Storage estimate:', estimate);
            // Could open a dialog showing storage usage
          });
        }
      },
      style: 'secondary',
    });
  }

  actions.push({
    label: 'Continue',
    action: () => {}, // Just dismiss
    style: 'secondary',
  });

  return actions;
}

/**
 * Show a custom storage notification
 */
export function showCustomStorageNotification(
  title: string,
  message: string,
  type: 'success' | 'warning' | 'error' | 'info' = 'info',
  actions?: StorageNotificationAction[]
): void {
  if (!notificationCallback) {
    console.warn('Custom storage notification:', { title, message, type });
    return;
  }

  const notification: StorageNotification = {
    id: `custom-storage-${Date.now()}`,
    type,
    title,
    message,
    actions,
    autoClose: type === 'success' ? 5000 : undefined,
    persistent: type === 'error' || type === 'warning',
  };

  notificationCallback(notification);
}

/**
 * Notification messages for different scenarios
 */
export const STORAGE_MESSAGES = {
  QUOTA_EXCEEDED: {
    title: 'Storage Full',
    message: 'Your browser storage is full. Please free up space to continue saving your progress.',
    suggestions: [
      'Clear browser data for other websites',
      'Use browser storage management tools',
      'Close unused tabs and applications',
    ],
  },
  PRIVATE_BROWSING: {
    title: 'Private Browsing Detected',
    message: 'Storage is limited in private browsing mode. Your progress will be lost when you close the browser.',
    suggestions: [
      'Use normal browsing mode for persistent storage',
      'Export your data before closing the browser',
    ],
  },
  SECURITY_ERROR: {
    title: 'Storage Access Denied',
    message: 'Your browser security settings prevent data storage.',
    suggestions: [
      'Check browser security settings',
      'Ensure the site is not blocked',
      'Try refreshing the page',
    ],
  },
  NETWORK_ERROR: {
    title: 'Connection Issues',
    message: 'Network problems are affecting data storage.',
    suggestions: [
      'Check your internet connection',
      'Try again in a few moments',
      'Refresh the page if issues persist',
    ],
  },
} as const;