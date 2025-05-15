'use client';

import Link from 'next/link';

export default function DevPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Development Test Harnesses</h1>
      <div className="space-y-2">
        <Link href="/dev/world-creation-wizard" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded">
          World Creation Wizard Test Harness
        </Link>
        <Link href="/dev/test" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded">
          Test Component Harness
        </Link>
        <Link href="/dev/controls" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded">
          Controls Test Harness
        </Link>
        <Link href="/dev/mocks" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded">
          Mocks Test Harness
        </Link>
      </div>
    </div>
  );
}
