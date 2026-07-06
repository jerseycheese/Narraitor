import React from 'react';
import { clsx } from 'clsx';
import { wizardStyles } from './styles/wizardStyles';

interface WizardContainerProps {
  title: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /**
   * Heading element for the string title, so it can fit the surrounding
   * heading order. Defaults to 'h1' for pages where the wizard owns the
   * main heading; pass 'h2' when the page already renders an h1 above it.
   */
  titleElement?: 'h1' | 'h2';
}

export const WizardContainer: React.FC<WizardContainerProps> = ({
  title,
  children,
  className = '',
  titleElement: TitleElement = 'h1',
}) => {
  return (
    <div
      className={clsx(
        'component-wizard-container',
        wizardStyles.container,
        className
      )}
    >
      <div className={wizardStyles.header}>
        {typeof title === 'string' ? (
          <TitleElement className={wizardStyles.title}>{title}</TitleElement>
        ) : (
          <div className={wizardStyles.title}>{title}</div>
        )}
      </div>
      {children}
    </div>
  );
};
