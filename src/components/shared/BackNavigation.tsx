'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BackNavigationProps {
  href?: string;
  label: string;
  onClick?: () => void;
}

export function BackNavigation({ href, label, onClick }: BackNavigationProps) {
  const router = useRouter();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  if (href && !onClick) {
    return (
      <Link 
        href={href}
        className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
      >
        <span>←</span> {label}
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
    >
      <span>←</span> {label}
    </button>
  );
}