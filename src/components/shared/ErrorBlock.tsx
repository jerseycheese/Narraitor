import React from 'react';
import { errorStyles } from '@/styles/errorStyles';

interface ErrorBlockProps {
  errors: string[];
  className?: string;
}

export const ErrorBlock: React.FC<ErrorBlockProps> = ({ errors, className }) => (
  <div className={className || errorStyles.container}>
    {errors.map((error: string, index: number) => (
      <p key={index} className={errorStyles.message}>
        {error}
      </p>
    ))}
  </div>
);