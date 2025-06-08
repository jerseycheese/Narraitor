'use client';

import React from 'react';
import Link from 'next/link';

export default function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4">
        <header className="bg-blue-600 text-white p-4 mb-4 rounded shadow">
          <Link href="/dev">
            <h1 className="text-2xl font-bold text-white hover:text-gray-200 transition-colors cursor-pointer">Narraitor Development</h1>
          </Link>
          <p className="text-sm">Test environments for component development</p>
        </header>
        {children}
      </div>
    </main>
  );
}
