import React from 'react';
import { useRouter } from 'next/navigation';
import { SimpleModal } from '@/components/shared/SimpleModal';
import { Button } from '@/components/ui/button';
import './provider-config.css';

interface NoProviderModalProps {
  isOpen: boolean;
  /** Optional override; defaults to navigating to the providers settings page. */
  onConfigure?: () => void;
}

/**
 * Blocking modal shown when a player tries to play without a configured
 * provider. There's no close button and the backdrop won't dismiss it — the
 * only way forward is to set up a provider.
 */
export function NoProviderModal({ isOpen, onConfigure }: NoProviderModalProps) {
  const router = useRouter();

  const handleConfigure = () => {
    if (onConfigure) {
      onConfigure();
    } else {
      router.push('/settings/providers');
    }
  };

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={() => {}}
      title="Connect a provider to play"
      showCloseButton={false}
      closeOnBackdropClick={false}
      closeOnEscape={false}
      description="Stories are generated with your own provider key, kept in this browser. Add one to start playing."
    >
      <div className="component-no-provider-modal">
        <div className="no-provider-actions">
          <Button variant="default" onClick={handleConfigure}>
            Set up a provider
          </Button>
        </div>
      </div>
    </SimpleModal>
  );
}
