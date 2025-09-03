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
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">{title}</h1>
          <p className="text-gray-700 mb-6">{message}</p>
          <ActionButtonGroup
            actions={[{
              label: backLabel,
              onClick: () => router.push(backUrl),
              variant: 'primary'
            }]}
            className="justify-center"
          />
        </div>
      </div>
    </div>
  );
}
