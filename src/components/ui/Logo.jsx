import Image from 'next/image';

export function LogoText({ size = 'lg', className = '' }) {
  return (
    <div className={className}>
      <span>Narr</span>
      <span>ai</span>
      <span>tor</span>
    </div>
  );
}

export function LogoIcon({ size = 'medium', className = '' }) {
  const logoSizes = {
    small: { width: 32, height: 32 },
    medium: { width: 64, height: 64 },
    large: { width: 96, height: 96 },
    xl: { width: 128, height: 128 }
  };

  const logoConfig = logoSizes[size];

  return (
    <Image 
      src="/narraitor-logo.svg" 
      alt="Narraitor Logo" 
      width={logoConfig.width}
      height={logoConfig.height}
      className={className}
    />
  );
}
