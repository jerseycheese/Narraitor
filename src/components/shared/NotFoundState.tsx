'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ActionButtonGroup } from './ActionButtonGroup';

interface NotFoundStateProps {
  title: string;
  message: string;
  backUrl: string;
  backLabel: string;
}

export function NotFoundState({ title, message, backUrl, backLabel }: NotFoundStateProps) {
  const router = useRouter();
  
  return (
    <div >
      <div >
        <div >
          <h1 >{title}</h1>
          <p >{message}</p>
          <ActionButtonGroup
            actions={[{
              label: backLabel,
              onClick: () => router.push(backUrl),
              variant: 'primary'
            }]}
            
          />
        </div>
      </div>
    </div>
  );
}
