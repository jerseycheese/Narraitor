import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main >
      <div >
        <header >
          <Link href="/dev">
            <h1 >Narraitor Development</h1>
          </Link>
          <p >Test environments for component development</p>
        </header>
        {children}
      </div>
    </main>
  );
}
