// WizardStyles.ts
import { CSSProperties } from 'react';

export const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '2rem',
  },
  wizard: {
    maxWidth: '48rem',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  header: {
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  progress: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  steps: {
    display: 'flex',
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
  },
  step: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    opacity: 0.5,
    transition: 'opacity 0.2s',
  },
  activeStep: {
    opacity: 1,
    fontWeight: 'bold',
  },
  completedStep: {
    opacity: 0.75,
  },
  stepNumber: {
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    backgroundColor: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: '0.875rem',
  },
  content: {
    padding: '1.5rem',
  },
  errorMessage: {
    padding: '1rem',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '0.375rem',
    margin: '1rem',
  },
};
