import React from 'react';
import { wizardStyles } from './styles/wizardStyles';

interface WizardContainerProps {
  title: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const WizardContainer: React.FC<WizardContainerProps> = ({
  title,
  children,
  className = '',
}) => {
  return (
    <div className={`component-wizard-container ${wizardStyles.container} ${className}`}>
      <div className={wizardStyles.header}>
        {typeof title === 'string' ? (
          <h1 className={`${wizardStyles.title} text-center`}>{title}</h1>
        ) : (
          <div className={`${wizardStyles.title}`}>{title}</div>
        )}
      </div>
      {children}
    </div>
  );
};
