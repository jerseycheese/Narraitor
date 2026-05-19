import React from 'react';
import { errorStyles } from '@/styles/errorStyles';

interface InlineErrorProps {
  error: string;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({ error, className }) => (
  <p className={className || errorStyles.message}>
    {error}
  </p>
);