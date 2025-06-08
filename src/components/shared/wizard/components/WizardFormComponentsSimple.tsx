import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/classNames';

interface WizardFormFieldProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

/**
 * Simple WizardFormField without react-hook-form complexity
 */
export const WizardFormFieldSimple: React.FC<WizardFormFieldProps> = ({
  name,
  label,
  description,
  required = false,
  error,
  children,
}) => {
  const fieldId = `${name}-field`;
  const descriptionId = description ? `${name}-description` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <div className="space-y-2">
      <Label 
        htmlFor={fieldId} 
        className={cn("text-sm font-medium text-gray-700", error && "text-red-700")}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div>
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          name: name,
          'aria-describedby': [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? 'true' : 'false',
          'aria-required': required ? 'true' : undefined,
        } as React.Attributes)}
      </div>
      
      {description && (
        <p id={descriptionId} className="text-gray-500 text-sm">
          {description}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-red-600 text-sm font-medium">
          {error}
        </p>
      )}
    </div>
  );
};

interface WizardInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

/**
 * WizardInput provides a shadcn/ui Input with wizard-specific styling
 */
export const WizardInputSimple: React.FC<WizardInputProps> = ({
  className,
  error,
  ...props
}) => {
  return (
    <Input
      className={cn(
        "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
        "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
        error && "border-red-300 focus:ring-red-500 focus:border-red-500",
        className
      )}
      {...props}
    />
  );
};

interface WizardTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

/**
 * WizardTextarea provides a shadcn/ui Textarea with wizard-specific styling
 */
export const WizardTextareaSimple: React.FC<WizardTextareaProps> = ({
  className,
  error,
  ...props
}) => {
  return (
    <Textarea
      className={cn(
        "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
        "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
        "resize-vertical",
        error && "border-red-300 focus:ring-red-500 focus:border-red-500",
        className
      )}
      {...props}
    />
  );
};

interface WizardSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  error?: string;
}

/**
 * WizardSelect provides a select component with wizard-specific styling
 */
export const WizardSelectSimple: React.FC<WizardSelectProps> = ({
  options,
  placeholder = 'Select an option',
  className,
  error,
  ...props
}) => {
  return (
    <select
      className={cn(
        "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
        "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
        error && "border-red-300 focus:ring-red-500 focus:border-red-500",
        className
      )}
      {...props}
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

/**
 * WizardFormSection provides consistent section layout for forms
 */
interface WizardFormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export const WizardFormSectionSimple: React.FC<WizardFormSectionProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <div className="space-y-4">
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-xl font-bold mb-4">{title}</h3>}
          {description && <p className="text-gray-600 mb-6">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
};