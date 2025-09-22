'use client';

import React from 'react';

interface SectionWrapperProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionWrapper({ title, children, className = '' }: SectionWrapperProps) {
  return (
    <section className={`bg-background rounded-lg border p-6 mb-6 shadow-sm ${className}`}>
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}
