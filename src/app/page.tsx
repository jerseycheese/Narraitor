'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/worlds');
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Narraitor
        </h1>
        <p className="text-gray-500">Redirecting to worlds...</p>
      </div>
    </main>
  );
}