import { useState, useCallback } from 'react';

/**
 * Configuration options for useModal hook
 */
export interface UseModalOptions {
  /** Initial open state */
  initialOpen?: boolean;
  /** Callback when modal opens */
  onOpen?: () => void;
  /** Callback when modal closes */
  onClose?: () => void;
}

/**
 * Return type for useModal hook
 */
export interface UseModalReturn {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Open the modal */
  open: () => void;
  /** Close the modal */
  close: () => void;
  /** Toggle the modal open/closed */
  toggle: () => void;
  /** Props to spread on modal components for common behavior */
  modalProps: {
    isOpen: boolean;
    onClose: () => void;
  };
}

/**
 * Custom hook for managing modal state
 * 
 * This hook abstracts the common pattern of:
 * - Modal open/close state management
 * - Toggle functionality
 * - Event callbacks
 * - Props generation for modal components
 * 
 * @param options Configuration options for modal state
 * @returns Modal state management object
 * 
 * @example
 * ```tsx
 * const modal = useModal({
 *   onOpen: () => console.log('Modal opened'),
 *   onClose: () => console.log('Modal closed'),
 * });
 * 
 * return (
 *   <div>
 *     <button onClick={modal.open}>Open Modal</button>
 *     <Modal {...modal.modalProps}>
 *       <p>Modal content</p>
 *     </Modal>
 *   </div>
 * );
 * ```
 */
export function useModal(options: UseModalOptions = {}): UseModalReturn {
  const { initialOpen = false, onOpen, onClose } = options;
  
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  const modalProps = {
    isOpen,
    onClose: close,
  };

  return {
    isOpen,
    open,
    close,
    toggle,
    modalProps,
  };
}