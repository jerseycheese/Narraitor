'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useWizardFlow } from '@/components/shared/wizard/hooks/useWizardFlow';
import { WizardContainer } from '@/components/shared/wizard/WizardContainer';
import { WizardStep } from '@/components/shared/wizard/WizardStep';
import { WizardNavigation } from '@/components/shared/wizard/WizardNavigation';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ProviderPresets } from './ProviderPresets';
import { CustomProviderForm } from './CustomProviderForm';
import { useProviderStore } from '@/state/providerStore';
import { getPresetById } from '@/lib/ai/presets';
import { validateProviderKey, type ValidationResult } from '@/lib/ai/validateProviderClient';
import type { ProviderType } from '@/types/provider.types';
import './provider-config.css';

interface ProviderWizardData {
  mode: 'preset' | 'custom';
  presetId: string;
  name: string;
  type: ProviderType;
  endpoint: string;
  model: string;
  models: string[];
  apiKey: string;
  images: boolean;
  streaming: boolean;
  helpUrl: string;
}

const INITIAL_DATA: ProviderWizardData = {
  mode: 'preset',
  presetId: '',
  name: '',
  type: 'gemini',
  endpoint: '',
  model: '',
  models: [],
  apiKey: '',
  images: false,
  streaming: false,
  helpUrl: '',
};

const STEPS = [
  { id: 'provider', label: 'Provider' },
  { id: 'connect', label: 'Connect' },
  { id: 'verify', label: 'Verify' },
];

interface ProviderWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_KEY: 'That key was rejected. Double-check it and try again.',
  INVALID_MODEL: 'That model name was not found for this provider.',
  RATE_LIMITED: 'The provider is rate limiting right now — wait a moment and retry.',
  UNSUPPORTED_PROVIDER: 'This provider is not supported yet. Only Google Gemini works for now.',
  NO_KEY: 'Enter your API key first.',
  NETWORK: 'Could not reach the provider. Check your connection and the endpoint.',
  VALIDATION_FAILED: 'Something went wrong checking this configuration.',
};

export function ProviderWizard({ onComplete, onCancel }: ProviderWizardProps) {
  const addProvider = useProviderStore((s) => s.addProvider);
  const [verifyState, setVerifyState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [verifyResult, setVerifyResult] = useState<ValidationResult | null>(null);
  const [isKeyRevealed, setIsKeyRevealed] = useState(false);

  // Memoized so useWizardFlow's validation effect has a stable dependency —
  // an inline function would change identity each render and loop the effect.
  const validateStep = useCallback((step: number, data: ProviderWizardData) => {
    if (step === 0) {
      const ok = data.mode === 'preset' ? Boolean(data.presetId) : Boolean(data.endpoint.trim());
      return { valid: ok, errors: ok ? [] : ['Choose a provider'], touched: true };
    }
    if (step === 1) {
      const ok = Boolean(data.apiKey.trim()) && Boolean(data.model.trim());
      return { valid: ok, errors: ok ? [] : ['Enter your key and model'], touched: true };
    }
    return { valid: true, errors: [], touched: true };
  }, []);

  const handleSave = useCallback(
    async (data: ProviderWizardData) => {
      await addProvider({
        type: data.type,
        name: data.name.trim() || data.presetId || 'Provider',
        endpoint: data.endpoint,
        model: data.model,
        apiKey: data.apiKey.trim() || undefined,
        capabilities: { text: true, images: data.images, streaming: data.streaming },
      });
      onComplete?.();
    },
    [addProvider, onComplete]
  );

  const wizard = useWizardFlow<ProviderWizardData>({
    steps: STEPS,
    initialData: INITIAL_DATA,
    // No persistKey: the wizard holds a plaintext key in memory only — it must
    // never be written to localStorage.
    onComplete: handleSave,
    onCancel,
    validateStep,
  });

  const { state, handlers, currentStep, isLastStep, stepValidation } = wizard;
  const { data } = state;

  // Any change to the credentials invalidates a prior successful check.
  useEffect(() => {
    setVerifyState('idle');
    setVerifyResult(null);
  }, [data.apiKey, data.model, data.endpoint, data.type]);

  // Reveal is a glance, not a mode: leaving the step re-masks, so a key can't
  // sit in the clear behind a step the player has already walked past.
  useEffect(() => {
    setIsKeyRevealed(false);
  }, [currentStep]);

  const selectPreset = (presetId: string) => {
    const preset = getPresetById(presetId);
    if (!preset) return;
    handlers.updateData({
      mode: 'preset',
      presetId: preset.id,
      name: preset.name,
      type: preset.type,
      endpoint: preset.endpoint,
      models: preset.models,
      model: preset.defaultModel,
      images: preset.capabilities.images,
      streaming: preset.capabilities.streaming,
      helpUrl: preset.helpUrl,
    });
  };

  const runVerify = async () => {
    setVerifyState('loading');
    try {
      const result = await validateProviderKey({
        apiKey: data.apiKey.trim(),
        type: data.type,
        endpoint: data.endpoint,
        model: data.model,
        checkImage: data.images,
      });
      setVerifyResult(result);
      setVerifyState(result.valid ? 'success' : 'error');
    } catch {
      setVerifyResult({ valid: false, error: 'NETWORK' });
      setVerifyState('error');
    }
  };

  const navDisabled = isLastStep ? verifyState !== 'success' : !(stepValidation?.valid ?? false);

  return (
    <WizardContainer title="Set up a provider" className="component-provider-wizard">
      <WizardStep error={wizard.currentError}>
        {currentStep === 0 && (
          <div>
            <p className="form-help-text">
              Pick a provider. Stories are generated with your own key, kept in this browser.
            </p>
            <ProviderPresets selectedId={data.mode === 'preset' ? data.presetId : null} onSelect={(p) => selectPreset(p.id)} />
            <button
              type="button"
              className="provider-advanced-toggle"
              onClick={() => handlers.updateData({ mode: data.mode === 'custom' ? 'preset' : 'custom', type: data.mode === 'custom' ? 'gemini' : 'openai-compatible' })}
            >
              {data.mode === 'custom' ? 'Use a preset instead' : 'Use a custom endpoint'}
            </button>
            {data.mode === 'custom' && (
              <CustomProviderForm
                value={{ name: data.name, endpoint: data.endpoint, model: data.model }}
                onChange={(updates) => handlers.updateData(updates)}
              />
            )}
          </div>
        )}

        {currentStep === 1 && (
          <div>
            <div className="form-group">
              <label className="form-label" htmlFor="provider-name">
                Name
              </label>
              <Input
                id="provider-name"
                value={data.name}
                placeholder="My provider key"
                onChange={(e) => handlers.updateData({ name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="provider-model">
                Model
              </label>
              {data.mode === 'preset' && data.models.length > 0 ? (
                <Select
                  id="provider-model"
                  value={data.model}
                  onChange={(e) => handlers.updateData({ model: e.target.value })}
                >
                  {data.models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  id="provider-model"
                  value={data.model}
                  placeholder="model-name"
                  onChange={(e) => handlers.updateData({ model: e.target.value })}
                />
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="provider-key">
                API key
              </label>
              <div className="provider-key-field">
                <Input
                  id="provider-key"
                  type={isKeyRevealed ? 'text' : 'password'}
                  value={data.apiKey}
                  placeholder="Paste your key"
                  autoComplete="off"
                  onChange={(e) => handlers.updateData({ apiKey: e.target.value })}
                />
                <button
                  type="button"
                  className="provider-key-reveal"
                  aria-pressed={isKeyRevealed}
                  aria-label={isKeyRevealed ? 'Hide key' : 'Show key'}
                  onClick={() => setIsKeyRevealed((revealed) => !revealed)}
                >
                  {isKeyRevealed ? 'Hide' : 'Show'}
                </button>
              </div>
              {data.helpUrl && (
                <p className="form-help-text">
                  <a href={data.helpUrl} target="_blank" rel="noopener noreferrer">
                    Where do I find my key?
                  </a>
                </p>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="provider-verify">
            <p className="form-help-text">
              Run a quick check to confirm your key works before saving.
            </p>
            <button
              type="button"
              className="wizard-nav-secondary"
              onClick={runVerify}
              disabled={verifyState === 'loading'}
            >
              {verifyState === 'loading' ? 'Checking...' : 'Test connection'}
            </button>
            {verifyState === 'success' && (
              <div className="provider-verify-status" data-state="success">
                Connected. Text {verifyResult?.capabilities?.text ? 'yes' : 'no'}, images{' '}
                {verifyResult?.capabilities?.images ? 'yes' : 'no'}.
              </div>
            )}
            {verifyState === 'error' && (
              <div className="provider-verify-status" data-state="error">
                {ERROR_MESSAGES[verifyResult?.error ?? 'VALIDATION_FAILED'] ??
                  ERROR_MESSAGES.VALIDATION_FAILED}
              </div>
            )}
          </div>
        )}
      </WizardStep>

      <WizardNavigation
        currentStep={currentStep}
        totalSteps={STEPS.length}
        onCancel={handlers.handleCancel}
        onBack={handlers.handleBack}
        onNext={handlers.handleNext}
        onComplete={handlers.handleComplete}
        nextLabel="Next"
        completeLabel="Save provider"
        disabled={navDisabled}
        isLoading={state.isProcessing}
      />
    </WizardContainer>
  );
}
