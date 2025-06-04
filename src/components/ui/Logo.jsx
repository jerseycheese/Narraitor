import React from 'react';

export function Logo({ size = 'medium', showText = true, textSize = 'auto', className = '' }) {
  const logoSizes = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const textSizes = {
    auto: size === 'small' ? 'text-lg' : size === 'medium' ? 'text-3xl' : size === 'large' ? 'text-4xl' : 'text-5xl',
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
    '2xl': 'text-5xl'
  };

  const actualTextSize = textSize === 'auto' ? textSizes.auto : textSizes[textSize] || textSizes.auto;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <img 
        src="/narraitor-logo.svg" 
        alt="Narraitor Logo" 
        className={logoSizes[size]}
      />
      {showText && (
        <div className={actualTextSize}>
          <span className="font-light">Narr</span>
          <span className="font-bold">ai</span>
          <span className="font-light">tor</span>
        </div>
      )}
    </div>
  );
}

export function LogoText({ size = 'lg', className = '' }) {
  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
    '2xl': 'text-5xl'
  };

  return (
    <div className={`${textSizes[size]} ${className}`}>
      <span className="font-light">Narr</span>
      <span className="font-bold">ai</span>
      <span className="font-light">tor</span>
    </div>
  );
}

export function LogoIcon({ size = 'medium', className = '' }) {
  const logoSizes = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  return (
    <img 
      src="/narraitor-logo.svg" 
      alt="Narraitor Logo" 
      className={`${logoSizes[size]} ${className}`}
    />
  );
}
