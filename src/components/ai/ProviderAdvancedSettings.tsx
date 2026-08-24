import React from 'react';
import { clsx } from 'clsx';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { AdvancedSettings } from '@/types/provider.types';
import './provider-config.css';

interface ProviderAdvancedSettingsProps {
  /** Used to build stable, unique field ids — several providers can be on screen at once. */
  providerId: string;
  value: AdvancedSettings | undefined;
  onChange: (settings: AdvancedSettings | undefined) => void;
  /**
   * True when this provider's model rejects a temperature/top-p being sent at
   * all (a reasoning-model preset — see hasFixedSamplingControls). The two
   * sliders are disabled rather than hidden, so it's clear the setting exists
   * but doesn't apply here.
   */
  samplingControlsFixed?: boolean;
  className?: string;
}

const TEMPERATURE_DEFAULT = 0.7;
const TOP_P_DEFAULT = 1.0;

/**
 * Per-provider generation-parameter tuning, collapsed by default. Everything
 * here is optional: an absent field means "use this call site's own
 * default", which is also exactly what "Reset to defaults" restores.
 */
export function ProviderAdvancedSettings({
  providerId,
  value,
  onChange,
  samplingControlsFixed = false,
  className,
}: ProviderAdvancedSettingsProps) {
  const fieldId = (field: string) => `provider-${providerId}-advanced-${field}`;

  const set = <K extends keyof AdvancedSettings>(
    key: K,
    next: AdvancedSettings[K] | undefined
  ) => {
    const updated: AdvancedSettings = { ...value, [key]: next };
    if (next === undefined) delete updated[key];
    onChange(Object.keys(updated).length > 0 ? updated : undefined);
  };

  const handleReset = () => onChange(undefined);

  return (
    <CollapsibleSection
      title="Advanced"
      initialCollapsed
      className={clsx('component-provider-advanced-settings', className)}
    >
      <div className="provider-advanced-fields">
        {samplingControlsFixed && (
          <p className="form-help-text">
            This provider&apos;s model runs its own reasoning and rejects requests that set
            temperature or top-p at all, so those two controls are disabled below.
          </p>
        )}

        <div className="provider-advanced-field">
          <Label htmlFor={fieldId('temperature')}>
            Temperature: {(value?.temperature ?? TEMPERATURE_DEFAULT).toFixed(1)}
          </Label>
          <input
            id={fieldId('temperature')}
            type="range"
            min={0}
            max={2}
            step={0.1}
            disabled={samplingControlsFixed}
            value={value?.temperature ?? TEMPERATURE_DEFAULT}
            onChange={(e) => set('temperature', Number(e.target.value))}
            className="provider-advanced-slider"
            aria-label="Temperature"
          />
          <p className="form-help-text">
            Higher is more creative and random; lower is more consistent and focused (0.0-2.0).
            Turn it down if the story feels erratic, up if it feels repetitive.
          </p>
        </div>

        <div className="provider-advanced-field">
          <Label htmlFor={fieldId('top-p')}>
            Top-p: {(value?.topP ?? TOP_P_DEFAULT).toFixed(2)}
          </Label>
          <input
            id={fieldId('top-p')}
            type="range"
            min={0}
            max={1}
            step={0.05}
            disabled={samplingControlsFixed}
            value={value?.topP ?? TOP_P_DEFAULT}
            onChange={(e) => set('topP', Number(e.target.value))}
            className="provider-advanced-slider"
            aria-label="Top-p"
          />
          <p className="form-help-text">
            Nucleus sampling — an alternative way to bound response variety (0.0-1.0). Most
            people only need temperature; leave this at 1.0 unless you know you want it.
          </p>
        </div>

        <div className="provider-advanced-field">
          <Label htmlFor={fieldId('max-tokens')}>Max response length (tokens)</Label>
          <Input
            id={fieldId('max-tokens')}
            type="number"
            min={1}
            step={1}
            placeholder="Provider default"
            value={value?.maxTokens ?? ''}
            onChange={(e) =>
              set('maxTokens', e.target.value ? Number(e.target.value) : undefined)
            }
          />
          <p className="form-help-text">
            Caps how long one generated response can be. Higher allows longer scenes, but costs
            more and takes longer per turn.
          </p>
        </div>

        <div className="provider-advanced-field">
          <Label htmlFor={fieldId('safety-prompt')}>Custom safety guidance</Label>
          <Textarea
            id={fieldId('safety-prompt')}
            rows={3}
            placeholder="Leave blank to use the default content-rating guidance"
            value={value?.customSafetyPrompt ?? ''}
            onChange={(e) => set('customSafetyPrompt', e.target.value || undefined)}
          />
          <Alert variant="warning">
            <AlertDescription>
              Replaces the guidance sent about your world&apos;s content rating. This does not
              change a provider&apos;s own safety filtering — check that provider&apos;s policies
              before relying on this to loosen or tighten anything.
            </AlertDescription>
          </Alert>
        </div>

        <div className="provider-advanced-field">
          <Label htmlFor={fieldId('system-prompt')}>Additional system prompt</Label>
          <Textarea
            id={fieldId('system-prompt')}
            rows={3}
            placeholder="Extra instructions to include with every request to this provider"
            value={value?.customSystemPrompt ?? ''}
            onChange={(e) => set('customSystemPrompt', e.target.value || undefined)}
          />
          <p className="form-help-text">
            Extra instructions appended to every generation this provider makes — for example a
            preferred prose style.
          </p>
        </div>

        <div className="provider-advanced-field">
          <Checkbox
            id={fieldId('rate-limit-enabled')}
            label="Limit requests per hour"
            checked={value?.rateLimitEnabled ?? false}
            onChange={(e) => set('rateLimitEnabled', e.target.checked ? true : undefined)}
          />
          <p className="form-help-text">
            A safety net against accidentally burning through your own quota. Enforced in this
            browser only — it has no effect on the provider&apos;s own limits.
          </p>
          {value?.rateLimitEnabled && (
            <div className="provider-advanced-rate-limit-value">
              <Label htmlFor={fieldId('max-requests-per-hour')}>Max requests per hour</Label>
              <Input
                id={fieldId('max-requests-per-hour')}
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 60"
                value={value?.maxRequestsPerHour ?? ''}
                onChange={(e) =>
                  set(
                    'maxRequestsPerHour',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              />
            </div>
          )}
        </div>

        <div className="provider-advanced-actions">
          <Button type="button" variant="outline" size="sm" onClick={handleReset}>
            Reset to defaults
          </Button>
        </div>
      </div>
    </CollapsibleSection>
  );
}
