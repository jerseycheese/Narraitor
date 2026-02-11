'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { notFound } from 'next/navigation';

export default function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDesignSystem = pathname === '/dev/design-system';

  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  // Design system page gets clean layout without header
  if (isDesignSystem) {
    return <>{children}</>;
  }

  return (
    <main>
      <div>
        <header>
          <Link href="/dev">
            <h1>Narraitor Development</h1>
          </Link>
          <p>Test environments for component development</p>
        </header>
        {children}
      </div>
    </main>
  );
}
