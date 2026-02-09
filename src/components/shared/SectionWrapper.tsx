'use client';

import React from 'react';

interface SectionWrapperProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionWrapper({ title, children, className = '' }: SectionWrapperProps) {
  return (
    <section className={`${className}`}>
      <h2 >{title}</h2>
      {children}
    </section>
  );
}
