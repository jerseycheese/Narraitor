import React from 'react';
import { cn } from '@/lib/utils/classNames';

interface FallbackIndicatorProps {
  isVisible: boolean;
  reason?: 'service_unavailable' | 'timeout' | 'error' | 'rate_limit';
  className?: string;
}

export function FallbackIndicator({ 
  isVisible, 
  reason = 'service_unavailable',
  className 
}: FallbackIndicatorProps) {
  if (!isVisible) return null;

  const messages = {
    service_unavailable: 'AI service temporarily unavailable - using curated content',
    timeout: 'AI response timed out - using curated content',
    error: 'An error occurred - using curated content', 
    rate_limit: 'Rate limit reached - using curated content'
  };

  const icons = {
    service_unavailable: '🔌',
    timeout: '⏱️',
    error: '⚠️',
    rate_limit: '🚦'
  };

  return (
    <div 
      className={cn(
        'flex items-center gap-2 px-3 py-2 text-sm rounded-md',
        'bg-yellow-50 text-yellow-800 border border-yellow-200',
        'animate-fade-in',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className="text-lg" aria-hidden="true">
        {icons[reason]}
      </span>
      <span>{messages[reason]}</span>
    </div>
  );
}