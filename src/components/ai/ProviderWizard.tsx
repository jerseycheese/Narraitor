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
import { ProviderDisclosure } from './ProviderDisclosure';
import { useProviderStore } from '@/state/providerStore';
import { getPresetById } from '@/lib/ai/presets';
import { validateProviderKey, type ValidationResult } from '@/lib/ai/validateProviderClient';
import { KEYLESS_PROVIDER_KEY } from '@/lib/ai/providerKeyHeader';
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
  privacyNote: string;
  /** False only for a service the player runs themselves — see ProviderPreset. */
  requiresApiKey: boolean;
  /**
   * The shape of address to show as a hint. Only set for a preset that expects
   * the player to supply their own, where the path is the non-obvious part.
   */
  endpointHint: string;
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
  privacyNote: '',
  requiresApiKey: true,
  endpointHint: '',
};

const STEPS = [
  { id: 'provider', label: 'Provider' },
  { id: 'connect', label: 'Connect' },
  { id: 'verify', label: 'Verify' },
];

/**
 * A custom endpoint could be anything, so the honest disclosure is that we
 * don't know its terms — not silence, which reads as "nothing to worry about".
 */
const CUSTOM_PRIVACY_NOTE =
  'A custom endpoint is whatever you point it at. Check that provider\'s own data-retention terms — we have no way to know them.';

interface ProviderWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

/**
 * What to send as the key. A keyless provider still gets one, because the
 * server reads a missing key as "use the env Gemini key" — see
 * KEYLESS_PROVIDER_KEY. A player who does put a key on their own server, behind
 * an authenticating tunnel, keeps theirs.
 */
/** The failure, worded for whichever kind of provider the player picked. */
function describeVerifyError(code: string | undefined, requiresApiKey: boolean): string {
  const key = code ?? 'VALIDATION_FAILED';
  if (!requiresApiKey && SELF_HOSTED_ERROR_MESSAGES[key]) return SELF_HOSTED_ERROR_MESSAGES[key];
  return ERROR_MESSAGES[key] ?? ERROR_MESSAGES.VALIDATION_FAILED;
}

function resolveKey(data: ProviderWizardData): string | undefined {
  const typed = data.apiKey.trim();
  if (typed) return typed;
  return data.requiresApiKey ? undefined : KEYLESS_PROVIDER_KEY;
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_KEY: 'That key was rejected. Double-check it and try again.',
  INVALID_MODEL: 'That model name was not found for this provider.',
  RATE_LIMITED: 'The provider is rate limiting right now — wait a moment and retry.',
  UNSUPPORTED_PROVIDER:
    "This provider's API isn't one we can talk to yet. If it accepts OpenAI-style chat completions, add it as a custom endpoint instead.",
  INVALID_ENDPOINT:
    'That endpoint must be an https URL on a public host. Local addresses are not reachable from the server that makes the request.',
  NO_KEY: 'Enter your API key first.',
  NETWORK: 'Could not reach the provider. Check your connection and the endpoint.',
  VALIDATION_FAILED: 'Something went wrong checking this configuration.',
};

/**
 * The same failures, worded for a server the player runs themselves, where the
 * fix is on their machine rather than in somebody's dashboard.
 *
 * Only two states get their own copy, because only two are distinguishable from
 * here. "The software isn't installed" and "it's on a different port" both
 * arrive as nothing answering, so writing separate messages for them would mean
 * guessing at the player and being wrong most of the time.
 */
const SELF_HOSTED_ERROR_MESSAGES: Record<string, string> = {
  NETWORK: 'Nothing answered at that address. Check the server is running and reachable from outside your machine.',
  INVALID_MODEL:
    'Your server does not have that model. Install it there, then run the check again.',
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
      // Picking the card is enough for a hosted service. A preset that lists no
      // models has only told us the shape of its address, so the address itself
      // is still outstanding.
      const ok =
        data.mode === 'custom'
          ? Boolean(data.endpoint.trim())
          : Boolean(data.presetId) && (data.models.length > 0 || Boolean(data.endpoint.trim()));
      return { valid: ok, errors: ok ? [] : ['Choose a provider'], touched: true };
    }
    if (step === 1) {
      const hasKey = !data.requiresApiKey || Boolean(data.apiKey.trim());
      const ok = hasKey && Boolean(data.model.trim());
      return {
        valid: ok,
        errors: ok ? [] : [data.requiresApiKey ? 'Enter your key and model' : 'Enter a model'],
        touched: true,
      };
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
        apiKey: resolveKey(data),
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
    // An empty model list marks a service the player runs themselves: we know
    // the shape of its address and nothing about the address itself, so the
    // preset's endpoint becomes a hint to show rather than a value to keep.
    // Pre-filling it would let a player walk to the verify step with our
    // example still in the field.
    const playerSuppliesEndpoint = preset.models.length === 0;
    handlers.updateData({
      mode: 'preset',
      presetId: preset.id,
      name: preset.name,
      type: preset.type,
      endpoint: playerSuppliesEndpoint ? '' : preset.endpoint,
      endpointHint: playerSuppliesEndpoint ? preset.endpoint : '',
      requiresApiKey: preset.requiresApiKey !== false,
      models: preset.models,
      model: preset.defaultModel,
      images: preset.capabilities.images,
      streaming: preset.capabilities.streaming,
      helpUrl: preset.helpUrl,
      privacyNote: preset.privacyNote ?? '',
    });
  };

  const runVerify = async () => {
    setVerifyState('loading');
    try {
      const result = await validateProviderKey({
        apiKey: resolveKey(data),
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

  const hasChosenProvider = data.mode === 'preset' ? Boolean(data.presetId) : Boolean(data.endpoint.trim());
  // A chosen preset that lists no models still needs its address typed in, so
  // step 0 keeps going rather than handing straight over to step 1.
  const playerSuppliesEndpoint = data.mode === 'preset' && Boolean(data.presetId) && data.models.length === 0;
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
            {playerSuppliesEndpoint && (
              <CustomProviderForm
                value={{ name: data.name, endpoint: data.endpoint, model: data.model }}
                onChange={(updates) => handlers.updateData(updates)}
                endpointPlaceholder={data.endpointHint}
              />
            )}
            <button
              type="button"
              className="provider-advanced-toggle"
              onClick={() =>
                handlers.updateData({
                  mode: data.mode === 'custom' ? 'preset' : 'custom',
                  type: data.mode === 'custom' ? 'gemini' : 'openai-compatible',
                  privacyNote: data.mode === 'custom' ? '' : CUSTOM_PRIVACY_NOTE,
                  // A hand-typed endpoint is somebody else's service until told
                  // otherwise, so the keyless exemption does not follow it out
                  // of the preset that granted it.
                  requiresApiKey: true,
                  endpointHint: '',
                })
              }
            >
              {data.mode === 'custom' ? 'Use a preset instead' : 'Use a custom endpoint'}
            </button>
            {data.mode === 'custom' && (
              <CustomProviderForm
                value={{ name: data.name, endpoint: data.endpoint, model: data.model }}
                onChange={(updates) => handlers.updateData(updates)}
              />
            )}
            {hasChosenProvider && (
              <ProviderDisclosure type={data.type} privacyNote={data.privacyNote} />
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
                API key{data.requiresApiKey ? '' : ' (optional)'}
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
              {!data.requiresApiKey && (
                <p className="form-help-text">
                  A server you run yourself usually needs no key — leave this blank. Fill it in
                  only if you put authentication in front of it.
                </p>
              )}
              {data.helpUrl && (
                <p className="form-help-text">
                  <a href={data.helpUrl} target="_blank" rel="noopener noreferrer">
                    {data.requiresApiKey ? 'Where do I find my key?' : 'How do I set this up?'}
                  </a>
                </p>
              )}
            </div>

            <ProviderDisclosure type={data.type} privacyNote={data.privacyNote} />
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
                {describeVerifyError(verifyResult?.error, data.requiresApiKey)}
                {!data.requiresApiKey && data.helpUrl && (
                  <>
                    {' '}
                    <a href={data.helpUrl} target="_blank" rel="noopener noreferrer">
                      Setup guide
                    </a>
                  </>
                )}
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
