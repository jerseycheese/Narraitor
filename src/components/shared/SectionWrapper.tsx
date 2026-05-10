'use client';

import React from 'react';

interface SectionWrapperProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionWrapper({ title, children, className = '' }: SectionWrapperProps) {
  return (
    <section className={`component-section-wrapper ${className}`.trim()}>
      <h2 className="component-section-wrapper-title">{title}</h2>
      <div className="component-section-wrapper-body">{children}</div>
    </section>
  );
}
