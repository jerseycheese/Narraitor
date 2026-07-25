import Image from 'next/image';

interface LogoTextProps {
  className?: string;
}

export function LogoText({ className = '' }: LogoTextProps) {
  return (
    <div className={className}>
      <span>Narr</span>
      <span>ai</span>
      <span>tor</span>
    </div>
  );
}

type LogoIconSize = 'small' | 'medium' | 'large' | 'xl';

interface LogoIconProps {
  size?: LogoIconSize;
  className?: string;
}

const logoSizes: Record<LogoIconSize, { width: number; height: number }> = {
  small: { width: 32, height: 32 },
  medium: { width: 64, height: 64 },
  large: { width: 96, height: 96 },
  xl: { width: 128, height: 128 },
};

export function LogoIcon({ size = 'medium', className = '' }: LogoIconProps) {
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
