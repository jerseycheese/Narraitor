'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface NotFoundStateProps {
  title: string;
  message: string;
  backUrl: string;
  backLabel: string;
}

export function NotFoundState({ title, message, backUrl, backLabel }: NotFoundStateProps) {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">{title}</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <button
            onClick={() => router.push(backUrl)}
            className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
          >
            {backLabel}
          </button>
        </div>
      </div>
    </div>
  );
}