'use client';

import React from 'react';

interface SectionWrapperProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionWrapper({ title, children, className = '' }: SectionWrapperProps) {
  return (
    <section className={`bg-white rounded-lg p-6 shadow mb-6 ${className}`}>
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}