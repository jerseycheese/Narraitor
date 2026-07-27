import React from 'react';
import { wizardStyles } from '../styles/wizardStyles';
import { errorStyles } from '@/styles/errorStyles';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Associates a WizardFormGroup's visible label with the wizard control it
// wraps (#1529). The group generates an id, points its Label at it, and the
// wizard field components below pick the id up from context - so every
// existing WizardFormGroup + WizardTextField/WizardSelect/WizardTextArea
// pairing gets an accessible name without call-site changes.
const WizardFieldIdContext = React.createContext<string | undefined>(undefined);

interface WizardFormGroupProps {
  label: string;
  error?: string;
  required?: boolean;
  helpText?: React.ReactNode;
  children: React.ReactNode;
}

export const WizardFormGroup: React.FC<WizardFormGroupProps> = ({
  label,
  error,
  required = false,
  helpText,
  children,
}) => {
  const fieldId = React.useId();

  return (
    <div>
      <Label htmlFor={fieldId}>
        {label}
        {required && <span>*</span>}
      </Label>
      {helpText && (
        <p
          className={wizardStyles.form.helpText}
          data-testid="wizard-form-help-text"
        >
          {helpText}
        </p>
      )}
      <WizardFieldIdContext.Provider value={fieldId}>
        {children}
      </WizardFieldIdContext.Provider>
      {error && <p className={errorStyles.message}>{error}</p>}
    </div>
  );
};

interface WizardTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  testId?: string;
  dataTutorial?: string;
}

export const WizardTextField: React.FC<WizardTextFieldProps> = ({
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  disabled = false,
  autoFocus = false,
  maxLength,
  testId,
  dataTutorial,
}) => {
  const fieldId = React.useContext(WizardFieldIdContext);

  return (
    <Input
      id={fieldId}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      maxLength={maxLength}
      className={error ? errorStyles.input : ''}
      data-testid={testId}
      data-tutorial={dataTutorial}
    />
  );
};

interface WizardTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  testId?: string;
  dataTutorial?: string;
}

export const WizardTextArea: React.FC<WizardTextAreaProps> = ({
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  disabled = false,
  rows = 4,
  maxLength,
  testId,
  dataTutorial,
}) => {
  const fieldId = React.useContext(WizardFieldIdContext);

  return (
    <Textarea
      id={fieldId}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      maxLength={maxLength}
      className={error ? errorStyles.input : ''}
      data-testid={testId}
      data-tutorial={dataTutorial}
    />
  );
};

interface WizardSelectProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  testId?: string;
  dataTutorial?: string;
}

export const WizardSelect: React.FC<WizardSelectProps> = ({
  value,
  onChange,
  onBlur,
  options,
  placeholder = 'Select an option',
  error,
  disabled = false,
  testId,
  dataTutorial,
}) => {
  const fieldId = React.useContext(WizardFieldIdContext);

  return (
    <select
      id={fieldId}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      className={`${wizardStyles.form.select} ${error ? wizardStyles.form.inputError : ''}`}
      data-testid={testId}
      data-tutorial={dataTutorial}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

interface WizardFormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  dataTutorial?: string;
}

export const WizardFormSection: React.FC<WizardFormSectionProps> = ({
  title,
  description,
  children,
  dataTutorial,
}) => {
  const headerProps = dataTutorial
    ? { 'data-tutorial': dataTutorial }
    : undefined;
  const sectionProps =
    !title && !description && dataTutorial
      ? { 'data-tutorial': dataTutorial }
      : undefined;

  return (
    <div className="wizard-form-section component-wizard-form-section" {...sectionProps}>
      {(title || description) && (
        <div className="wizard-form-section-header" {...headerProps}>
          {title && <h3 className={wizardStyles.subheading}>{title}</h3>}
          {description && (
            <p className={wizardStyles.step.description}>{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};
