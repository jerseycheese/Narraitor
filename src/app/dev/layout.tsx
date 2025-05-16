'use client';

import React from 'react';

export default function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4">
        <header className="bg-blue-600 text-white p-4 mb-4 rounded shadow">
          <h1 className="text-2xl font-bold">Narraitor Development</h1>
          <p className="text-sm">Test environments for component development</p>
        </header>
        {children}
      </div>
    </main>
  );
}