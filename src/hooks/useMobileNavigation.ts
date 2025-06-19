'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing mobile navigation state and interactions
 * 
 * Provides state management for mobile menu visibility, mobile detection,
 * and handles touch/gesture interactions for mobile navigation.
 * 
 * @returns Mobile navigation state and control functions
 */
export function useMobileNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport (optimized with memoized callback)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    // Set initial state
    setIsMobile(mediaQuery.matches);

    // Listen for viewport changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Close menu when viewport changes to desktop
  useEffect(() => {
    if (!isMobile && isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [isMobile, isMenuOpen]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMenuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen && isMobile) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isMenuOpen, isMobile]);

  const openMenu = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  return {
    isMenuOpen,
    isMobile,
    openMenu,
    closeMenu,
    toggleMenu,
  };
}