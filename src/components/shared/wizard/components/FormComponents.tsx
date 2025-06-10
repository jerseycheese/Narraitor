import React from 'react';
import { wizardStyles } from '../styles/wizardStyles';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface WizardFormGroupProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const WizardFormGroup: React.FC<WizardFormGroupProps> = ({ 
  label, 
  error, 
  required = false, 
  children 
}) => {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
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
}) => {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      maxLength={maxLength}
      className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
      data-testid={testId}
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
}) => {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      maxLength={maxLength}
      className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
      data-testid={testId}
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
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      className={`${wizardStyles.form.select} ${error ? wizardStyles.form.inputError : ''}`}
      data-testid={testId}
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

interface WizardFieldErrorProps {
  error?: string;
}

export const WizardFieldError: React.FC<WizardFieldErrorProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <p className="text-red-600 text-sm">{error}</p>
  );
};

interface WizardFormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export const WizardFormSection: React.FC<WizardFormSectionProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <div className="space-y-4">
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className={wizardStyles.step.title}>{title}</h3>}
          {description && <p className={wizardStyles.step.description}>{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
