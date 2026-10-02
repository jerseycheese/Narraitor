'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
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
import { getPresetById, keyToSend } from '@/lib/ai/presets';
import { validateProviderKey, type ValidationResult } from '@/lib/ai/validateProviderClient';
import { discoverProviderModels } from '@/lib/api/discoverModelsClient';
import type { DiscoveredModel, ProviderType } from '@/types/provider.types';
import './provider-config.css';

interface ProviderWizardData {
  mode: 'preset' | 'custom';
  presetId: string;
  name: string;
  type: ProviderType;
  endpoint: string;
  model: string;
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

/** The failure, worded for whichever kind of provider the player picked. */
function describeVerifyError(code: string | undefined, requiresApiKey: boolean): string {
  const key = code ?? 'VALIDATION_FAILED';
  if (!requiresApiKey && SELF_HOSTED_ERROR_MESSAGES[key]) return SELF_HOSTED_ERROR_MESSAGES[key];
  return ERROR_MESSAGES[key] ?? ERROR_MESSAGES.VALIDATION_FAILED;
}

function describeDiscoveryError(code: string | null | undefined): string {
  if (code === 'NO_KEY') return 'Enter your API key first to load models.';
  if (code === 'INVALID_KEY') return 'The API key was rejected while loading models.';
  if (code === 'RATE_LIMITED') return 'Rate limited by the provider. Please try again in a moment.';
  if (code === 'UNSUPPORTED_PROVIDER')
    return 'Live model listing is not supported for this provider. Enter model ID manually below.';
  if (code === 'INVALID_ENDPOINT') return 'Invalid endpoint address.';
  if (code === 'NETWORK') return 'Could not reach provider to load models. Enter model ID manually below.';
  return 'Could not load models list. Enter model ID manually below.';
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
 */
const SELF_HOSTED_ERROR_MESSAGES: Record<string, string> = {
  NETWORK: 'Nothing answered at that address. Check the server is running and reachable from outside your machine.',
  INVALID_MODEL:
    'Your server does not have that model. Install it there, then run the check again.',
  INVALID_KEY:
    'Your server refused the request. Most local model servers only accept requests addressed to their own machine, so a server reached through a tunnel has to be told to allow that address.',
};

export function ProviderWizard({ onComplete, onCancel }: ProviderWizardProps) {
  const addProvider = useProviderStore((s) => s.addProvider);
  const [verifyState, setVerifyState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [verifyResult, setVerifyResult] = useState<ValidationResult | null>(null);
  const [validatedConfig, setValidatedConfig] = useState<{
    apiKey?: string | null;
    type: ProviderType;
    endpoint: string;
    model: string;
  } | null>(null);
  const validationReqIdRef = useRef<symbol | null>(null);

  const [isKeyRevealed, setIsKeyRevealed] = useState(false);

  // Model discovery state
  const searchId = useId();
  const [discoveredModels, setDiscoveredModels] = useState<DiscoveredModel[]>([]);
  const [discoveryStatus, setDiscoveryStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(false);

  // Track if user has deliberately entered or chosen a model
  const hasUserDeliberatelySetModelRef = useRef(false);
  const discoveryAbortRef = useRef<AbortController | null>(null);
  const discoveryReqIdRef = useRef<symbol | null>(null);

  // Memoized so useWizardFlow's validation effect has a stable dependency
  const validateStep = useCallback((step: number, data: ProviderWizardData) => {
    if (step === 0) {
      const preset = data.mode === 'preset' ? getPresetById(data.presetId) : null;
      const ok =
        data.mode === 'custom'
          ? Boolean(data.endpoint.trim())
          : Boolean(data.presetId) && (!preset?.requiresEndpoint || Boolean(data.endpoint.trim()));
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
        apiKey: keyToSend(data.apiKey, data.requiresApiKey),
        capabilities: { text: true, images: data.images, streaming: data.streaming },
      });
      onComplete?.();
    },
    [addProvider, onComplete]
  );

  const wizard = useWizardFlow<ProviderWizardData>({
    steps: STEPS,
    initialData: INITIAL_DATA,
    onComplete: handleSave,
    onCancel,
    validateStep,
  });

  const { state, handlers, currentStep, isLastStep, stepValidation } = wizard;
  const { data } = state;

  // Any change to the credentials or model invalidates a prior successful check
  useEffect(() => {
    setVerifyState('idle');
    setVerifyResult(null);
    setValidatedConfig(null);
    validationReqIdRef.current = null;
  }, [data.apiKey, data.model, data.endpoint, data.type]);

  // Abort stale discovery if provider, key, or endpoint changes
  useEffect(() => {
    if (discoveryAbortRef.current) {
      discoveryAbortRef.current.abort();
      discoveryAbortRef.current = null;
    }
    setDiscoveryStatus('idle');
    setDiscoveryError(null);
  }, [data.presetId, data.apiKey, data.endpoint, data.type]);

  // Reveal is a glance, not a mode: leaving the step re-masks
  useEffect(() => {
    setIsKeyRevealed(false);
  }, [currentStep]);

  const selectPreset = (presetId: string) => {
    const preset = getPresetById(presetId);
    if (!preset) return;
    const playerSuppliesEndpoint = preset.requiresEndpoint;
    hasUserDeliberatelySetModelRef.current = false;
    setDiscoveredModels([]);
    setSearchQuery('');
    setIsManualEntry(false);
    setDiscoveryStatus('idle');
    setDiscoveryError(null);

    handlers.updateData({
      mode: 'preset',
      presetId: preset.id,
      name: preset.name,
      type: preset.type,
      endpoint: playerSuppliesEndpoint ? '' : preset.endpoint,
      endpointHint: playerSuppliesEndpoint ? preset.endpoint : '',
      requiresApiKey: preset.requiresApiKey !== false,
      model: preset.defaultModel,
      images: preset.capabilities.images,
      streaming: preset.capabilities.streaming,
      helpUrl: preset.helpUrl,
      privacyNote: preset.privacyNote ?? '',
    });
  };

  const handleCustomFormChange = (
    updates: Partial<{ name: string; endpoint: string; model: string }>
  ) => {
    if (updates.model !== undefined) {
      hasUserDeliberatelySetModelRef.current = true;
    }
    handlers.updateData(updates);
  };

  const handleDiscoverModels = async () => {
    if (discoveryAbortRef.current) {
      discoveryAbortRef.current.abort();
    }
    const controller = new AbortController();
    discoveryAbortRef.current = controller;
    const reqId = Symbol();
    discoveryReqIdRef.current = reqId;

    setDiscoveryStatus('loading');
    setDiscoveryError(null);

    try {
      const result = await discoverProviderModels({
        apiKey: keyToSend(data.apiKey, data.requiresApiKey),
        type: data.type,
        endpoint: data.endpoint || undefined,
        signal: controller.signal,
      });

      if (controller.signal.aborted || discoveryReqIdRef.current !== reqId) {
        return;
      }

      if (result.error && result.models.length === 0) {
        setDiscoveryStatus('error');
        setDiscoveryError(result.error);
        return;
      }

      setDiscoveredModels(result.models);
      setDiscoveryStatus(result.models.length > 0 ? 'success' : 'idle');

      // Requirement 6: when discovery omits the suggestion, require explicit selection/manual entry rather than choosing the first result. Preserve a model the player deliberately entered.
      if (hasUserDeliberatelySetModelRef.current) {
        if (data.model && !result.models.some((m) => m.id === data.model)) {
          setIsManualEntry(true);
        }
      } else {
        const preset = getPresetById(data.presetId);
        const suggestion = preset?.defaultModel ?? '';
        const hasSuggestion = result.models.some((m) => m.id === suggestion);
        if (hasSuggestion) {
          handlers.updateData({ model: suggestion });
        } else {
          handlers.updateData({ model: '' });
        }
      }
    } catch {
      if (!controller.signal.aborted && discoveryReqIdRef.current === reqId) {
        setDiscoveryStatus('error');
        setDiscoveryError('NETWORK');
      }
    }
  };

  const runVerify = async () => {
    const targetConfig = {
      apiKey: keyToSend(data.apiKey, data.requiresApiKey),
      type: data.type,
      endpoint: data.endpoint,
      model: data.model,
    };

    const reqId = Symbol();
    validationReqIdRef.current = reqId;
    setVerifyState('loading');

    try {
      const result = await validateProviderKey({
        apiKey: targetConfig.apiKey,
        type: targetConfig.type,
        endpoint: targetConfig.endpoint,
        model: targetConfig.model,
        checkImage: data.images,
      });

      if (validationReqIdRef.current !== reqId) {
        // Drop late response if configuration changed while in flight
        return;
      }

      setVerifyResult(result);
      setVerifyState(result.valid ? 'success' : 'error');
      if (result.valid) {
        setValidatedConfig(targetConfig);
      }
    } catch {
      if (validationReqIdRef.current !== reqId) {
        return;
      }
      setVerifyResult({ valid: false, error: 'NETWORK' });
      setVerifyState('error');
    }
  };

  const hasChosenProvider = data.mode === 'preset' ? Boolean(data.presetId) : Boolean(data.endpoint.trim());
  const playerSuppliesEndpoint =
    data.mode === 'preset'
      ? Boolean(getPresetById(data.presetId)?.requiresEndpoint)
      : false;

  const isConfigValidated =
    verifyState === 'success' &&
    validatedConfig !== null &&
    validatedConfig.apiKey === keyToSend(data.apiKey, data.requiresApiKey) &&
    validatedConfig.type === data.type &&
    validatedConfig.endpoint === data.endpoint &&
    validatedConfig.model === data.model;

  const navDisabled = isLastStep ? !isConfigValidated : !(stepValidation?.valid ?? false);

  const filteredModels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return discoveredModels;
    return discoveredModels.filter(
      (m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
    );
  }, [discoveredModels, searchQuery]);

  const preset = getPresetById(data.presetId);
  const showLoadModels = data.mode === 'custom' || preset?.modelDiscovery !== false;

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
                onChange={handleCustomFormChange}
                endpointPlaceholder={data.endpointHint}
              />
            )}
            <button
              type="button"
              className="provider-advanced-toggle"
              onClick={() => {
                hasUserDeliberatelySetModelRef.current = false;
                handlers.updateData({
                  mode: data.mode === 'custom' ? 'preset' : 'custom',
                  type: data.mode === 'custom' ? 'gemini' : 'openai-compatible',
                  privacyNote: data.mode === 'custom' ? '' : CUSTOM_PRIVACY_NOTE,
                  requiresApiKey: true,
                  endpointHint: '',
                });
              }}
            >
              {data.mode === 'custom' ? 'Use a preset instead' : 'Use a custom endpoint'}
            </button>
            {data.mode === 'custom' && (
              <CustomProviderForm
                value={{ name: data.name, endpoint: data.endpoint, model: data.model }}
                onChange={handleCustomFormChange}
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

            <div className="form-group">
              <div className="provider-model-header">
                <label className="form-label" htmlFor="provider-model">
                  Model
                </label>
                {showLoadModels && (
                  <button
                    type="button"
                    className="wizard-nav-secondary provider-load-models-btn"
                    onClick={handleDiscoverModels}
                    disabled={discoveryStatus === 'loading' || (data.requiresApiKey && !data.apiKey.trim())}
                  >
                    {discoveryStatus === 'loading' ? 'Loading models...' : 'Load models'}
                  </button>
                )}
              </div>

              {discoveryStatus === 'error' && (
                <p className="form-help-text provider-discovery-error">
                  {describeDiscoveryError(discoveryError)}
                </p>
              )}

              {discoveredModels.length > 0 && !isManualEntry ? (
                <div className="provider-model-picker">
                  <div className="form-group">
                    <label className="form-label" htmlFor={searchId}>
                      Search models
                    </label>
                    <Input
                      id={searchId}
                      type="search"
                      placeholder="Search models..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select
                    id="provider-model"
                    value={data.model}
                    onChange={(e) => {
                      hasUserDeliberatelySetModelRef.current = true;
                      handlers.updateData({ model: e.target.value });
                    }}
                  >
                    <option value="">Select a model...</option>
                    {filteredModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name === m.id ? m.id : `${m.name} (${m.id})`}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : (
                <Input
                  id="provider-model"
                  value={data.model}
                  placeholder="model-name"
                  onChange={(e) => {
                    hasUserDeliberatelySetModelRef.current = true;
                    handlers.updateData({ model: e.target.value });
                  }}
                />
              )}

              {discoveredModels.length > 0 && (
                <button
                  type="button"
                  className="provider-advanced-toggle"
                  onClick={() => setIsManualEntry((prev) => !prev)}
                >
                  {isManualEntry ? 'Select from discovered models' : 'Enter model ID manually'}
                </button>
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
