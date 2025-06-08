import React from 'react';
import { useForm, FormProvider, FieldValues, DefaultValues } from 'react-hook-form';

interface WizardFormProps<T extends FieldValues> {
  data: T;
  children: React.ReactNode;
  defaultValues?: DefaultValues<T>;
}

/**
 * Simplified WizardForm component that provides react-hook-form context
 * without complex synchronization to prevent infinite loops
 */
export function WizardForm<T extends FieldValues>({
  data,
  children,
  defaultValues,
}: WizardFormProps<T>) {
  const form = useForm<T>({
    defaultValues: defaultValues as DefaultValues<T>,
    mode: 'onChange',
    values: data, // Use values prop for controlled form
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(() => {})} className="space-y-4" role="form">
        {children}
      </form>
    </FormProvider>
  );
}