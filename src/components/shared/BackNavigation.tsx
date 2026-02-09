'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleClick}>
      <ArrowLeft aria-hidden="true" />
      <span>{label}</span>
    </Button>
  );
}
