'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageLayout } from '@/components/shared/PageLayout';
import { Button } from '@/components/ui/button';
import { ProviderCard } from '@/components/ai/ProviderCard';
import { ProviderWizard } from '@/components/ai/ProviderWizard';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog/DeleteConfirmationDialog';
import { useProviderStore } from '@/state/providerStore';
import { presetHasFixedSamplingControlsForEndpoint } from '@/lib/ai/presets';
import '@/components/ai/provider-config.css';

/**
 * Provider management — list saved providers, switch / re-check / remove them,
 * and launch the setup wizard. Stories are generated with the player's own key,
 * stored in this browser.
 */
export default function ProvidersSettingsPage() {
  const providers = useProviderStore((s) => s.providers);
  const activeProviderId = useProviderStore((s) => s.activeProviderId);
  const validationStatus = useProviderStore((s) => s.validationStatus);
  const setActiveProvider = useProviderStore((s) => s.setActiveProvider);
  const removeProvider = useProviderStore((s) => s.removeProvider);
  const validateProvider = useProviderStore((s) => s.validateProvider);
  const updateAdvancedSettings = useProviderStore((s) => s.updateAdvancedSettings);

  const [showWizard, setShowWizard] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [providerToRemoveId, setProviderToRemoveId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const list = Object.values(providers);

  const handleValidate = async (id: string) => {
    setValidatingId(id);
    try {
      await validateProvider(id);
    } finally {
      setValidatingId(null);
    }
  };

  // Once confirmed, removal runs to completion: cancel/escape are inert while
  // the await is in flight, and the dialog closes when it settles.
  const handleCloseRemoveDialog = () => {
    if (isRemoving) return;
    setProviderToRemoveId(null);
  };

  const handleConfirmRemove = async () => {
    if (!providerToRemoveId || isRemoving) return;
    setIsRemoving(true);
    try {
      await removeProvider(providerToRemoveId);
    } finally {
      setIsRemoving(false);
      setProviderToRemoveId(null);
    }
  };

  // Removal is destructive: the key is gone for good, and removing the last
  // provider also clears the stored encryption key. Spell out the stakes.
  const providerToRemove = providerToRemoveId ? providers[providerToRemoveId] : undefined;
  const removeMessage = !providerToRemove
    ? ''
    : list.length === 1
      ? "Removing your only provider also clears the encryption key stored in this browser. You'll need to set up a provider again before playing."
      : providerToRemove.id === activeProviderId
        ? 'This provider is currently in use. Another saved provider will take over.'
        : 'Are you sure you want to remove this provider? Its saved key will be deleted from this browser.';

  return (
    <PageLayout
      title="Providers"
      description="Add the provider key used to generate your stories. It stays in this browser, encrypted, and is only ever used to make your own requests."
      actions={
        !showWizard && list.length > 0 ? (
          <Button onClick={() => setShowWizard(true)}>Add provider</Button>
        ) : undefined
      }
    >
      <div className="component-providers-page">
        {showWizard ? (
          <ProviderWizard
            onComplete={() => setShowWizard(false)}
            onCancel={() => setShowWizard(false)}
          />
        ) : list.length === 0 ? (
          <div className="providers-empty">
            <p>No provider yet. Add one to start playing.</p>
            <Button onClick={() => setShowWizard(true)}>Set up a provider</Button>
            <p className="providers-empty-help">
              Not sure why you need your own key, or what it costs?{' '}
              <Link href="/faq#why-my-own-key">The FAQ covers it</Link>.
            </p>
          </div>
        ) : (
          <div className="providers-list">
            {list.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                isActive={provider.id === activeProviderId}
                validation={validationStatus[provider.id]}
                onSetActive={setActiveProvider}
                onValidate={handleValidate}
                onDelete={setProviderToRemoveId}
                onUpdateAdvancedSettings={updateAdvancedSettings}
                samplingControlsFixed={presetHasFixedSamplingControlsForEndpoint(provider.endpoint)}
                isValidating={validatingId === provider.id}
              />
            ))}
          </div>
        )}

        <DeleteConfirmationDialog
          isOpen={providerToRemoveId !== null}
          onClose={handleCloseRemoveDialog}
          onConfirm={handleConfirmRemove}
          title="Remove Provider"
          description={removeMessage}
          itemName={providerToRemove?.name || 'this provider'}
          confirmButtonText="Remove"
          isDeleting={isRemoving}
        />
      </div>
    </PageLayout>
  );
}
