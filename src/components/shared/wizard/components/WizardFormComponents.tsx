import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/classNames';

export interface WizardFormFieldProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}

/**
 * WizardFormField provides consistent form field layout using shadcn/ui components
 * while maintaining wizard-specific styling and behavior
 */
export const WizardFormField: React.FC<WizardFormFieldProps> = ({
  name,
  label,
  description,
  required = false,
  children,
}) => {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className={cn("text-sm font-medium text-gray-700")}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            {React.cloneElement(children as React.ReactElement, {
              ...field,
              onChange: (e: unknown) => {
                // Handle both event objects and direct values
                const value = (e as React.ChangeEvent<HTMLInputElement>)?.target?.value ?? e;
                field.onChange(value);
              }
            } as React.Attributes)}
          </FormControl>
          {description && (
            <FormDescription className="text-gray-500 text-sm">
              {description}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export interface WizardInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

/**
 * WizardInput provides a shadcn/ui Input with wizard-specific styling
 */
export const WizardInput: React.FC<WizardInputProps> = ({
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

export interface WizardTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

/**
 * WizardTextarea provides a shadcn/ui Textarea with wizard-specific styling
 */
export const WizardTextarea: React.FC<WizardTextareaProps> = ({
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

export interface WizardSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  error?: string;
}

/**
 * WizardSelect provides a select component with wizard-specific styling
 * Note: This is a basic HTML select. For more advanced features, consider @radix-ui/react-select
 */
export const WizardSelect: React.FC<WizardSelectProps> = ({
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

export interface WizardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'cancel';
  size?: 'sm' | 'default' | 'lg';
}

/**
 * WizardButton provides consistent button styling using shadcn/ui Button
 */
export const WizardButton: React.FC<WizardButtonProps> = ({
  variant = 'primary',
  size = 'default',
  className,
  children,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    cancel: 'bg-white text-red-600 border border-red-300 hover:bg-red-50',
  };

  return (
    <Button
      variant="outline"
      size={size}
      className={cn(
        "px-4 py-2 font-medium rounded-md transition-colors",
        "disabled:bg-gray-300 disabled:cursor-not-allowed",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};

/**
 * WizardFormSection provides consistent section layout for forms
 */
export interface WizardFormSectionProps {
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
          {title && <h3 className="text-xl font-bold mb-4">{title}</h3>}
          {description && <p className="text-gray-600 mb-6">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

/**
 * WizardFieldError provides consistent error message display
 * This is a fallback for when not using react-hook-form FormMessage
 */
interface WizardFieldErrorProps {
  error?: string;
}

export const WizardFieldError: React.FC<WizardFieldErrorProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <p className="text-red-600 text-sm mt-1">{error}</p>
  );
};