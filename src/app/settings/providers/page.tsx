'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/shared/PageLayout';
import { Button } from '@/components/ui/button';
import { ProviderCard } from '@/components/ai/ProviderCard';
import { ProviderWizard } from '@/components/ai/ProviderWizard';
import { useProviderStore } from '@/state/providerStore';
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

  const [showWizard, setShowWizard] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const list = Object.values(providers);

  const handleValidate = async (id: string) => {
    setValidatingId(id);
    try {
      await validateProvider(id);
    } finally {
      setValidatingId(null);
    }
  };

  return (
    <PageLayout
      title="Providers"
      description="Add the provider key used to generate your stories. It stays in this browser, encrypted — it never leaves your device except to your chosen provider."
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
                onDelete={removeProvider}
                isValidating={validatingId === provider.id}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
