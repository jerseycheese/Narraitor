'use client';

import React, { useEffect, useState } from 'react';

/**
 * SSRClientOnly
 * Renders a stable wrapper element during SSR/first paint to keep markup identical,
 * then mounts its children after the client has hydrated. The wrapper uses
 * `suppressHydrationWarning` to prevent React from warning about child differences.
 */
export function SSRClientOnly({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={className} suppressHydrationWarning>
      {mounted ? children : null}
    </div>
  );
}

