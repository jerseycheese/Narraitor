'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ActionButtonGroup } from './ActionButtonGroup';
import './NotFoundState.css';

interface NotFoundStateProps {
  title: string;
  message: string;
  backUrl: string;
  backLabel: string;
}

export function NotFoundState({ title, message, backUrl, backLabel }: NotFoundStateProps) {
  const router = useRouter();

  return (
    <div className="component-not-found-state">
      <div className="not-found-state-content">
        <h1>{title}</h1>
        <p>{message}</p>
      </div>
      <ActionButtonGroup
        actions={[{
          label: backLabel,
          onClick: () => router.push(backUrl),
          variant: 'primary'
        }]}
      />
    </div>
  );
}
