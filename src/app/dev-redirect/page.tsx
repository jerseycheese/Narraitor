'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * This component handles redirections from old dev paths to new ones
 * It's needed during the transition from the old structure to the new one
 */
export default function DevRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new dev path
    router.replace('/dev');
  }, [router]);

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Redirecting...</h1>
      <p>
        The development environment has moved. 
        You&apos;ll be redirected to the new location automatically.
      </p>
      <p className="mt-2">
        If you&apos;re not redirected, please click{' '}
        <Link href="/dev" className="text-blue-500 hover:underline">
          here
        </Link>
        .
      </p>
    </div>
  );
}
