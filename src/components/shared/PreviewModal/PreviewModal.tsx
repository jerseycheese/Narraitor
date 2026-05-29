import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { SimpleModal } from '@/components/shared/SimpleModal';
import { wizardStyles } from '@/components/shared/wizard/styles/wizardStyles';

interface PreviewModalProps<T> {
  isOpen: boolean;
  data: T;
  title: string;
  subtitle?: string;
  renderContent: (data: T) => React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  footerNote?: string;
  className?: string;
  overlayClassName?: string;
  closeOnBackdropClick?: boolean;
}

function PreviewModalInner<T>({
  isOpen,
  data,
  title,
  subtitle,
  renderContent,
  onConfirm,
  onCancel,
  confirmText = 'Use This',
  cancelText = 'Back',
  footerNote,
  className,
  overlayClassName,
}: PreviewModalProps<T>) {
  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      showCloseButton={false}
      className={className}
      overlayClassName={overlayClassName}
    >
      <p id="preview-modal-desc">
        {subtitle || 'Preview content before confirming your selection.'}
      </p>

      <div>
        {renderContent(data)}

        {/* Footer Note */}
        {footerNote && <div>{footerNote}</div>}
      </div>

      <div className={wizardStyles.navigation.container}>
        <Button onClick={onCancel} variant="outline" size="default">
          {cancelText}
        </Button>
        <div className={wizardStyles.navigation.buttonGroup}>
          <Button onClick={onConfirm} variant="default" size="default">
            {confirmText}
          </Button>
        </div>
      </div>
    </SimpleModal>
  );
}

export const PreviewModal = memo(PreviewModalInner) as typeof PreviewModalInner;
