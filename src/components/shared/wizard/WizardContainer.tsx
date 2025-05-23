import React from 'react';
import { wizardStyles } from './styles/wizardStyles';

interface WizardContainerProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const WizardContainer: React.FC<WizardContainerProps> = ({
  title,
  children,
  className = '',
}) => {
  return (
    <div className={`${wizardStyles.container} ${className}`}>
      <div className={wizardStyles.header}>
        <h1 className={wizardStyles.title}>{title}</h1>
      </div>
      {children}
    </div>
  );
};