import { clsx } from 'clsx';

interface LogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ variant = 'full', size = 'md', className }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-xl' },
    lg: { icon: 40, text: 'text-2xl' },
  };

  const { icon: iconSize, text: textSize } = sizes[size];

  // Simple cube icon representing the cubicle/workspace
  const IconMark = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Cube base */}
      <path
        d="M20 4L36 13V27L20 36L4 27V13L20 4Z"
        fill="currentColor"
        className="text-primary-500"
      />
      {/* Lighter face */}
      <path
        d="M20 4L36 13L20 22L4 13L20 4Z"
        fill="currentColor"
        className="text-primary-400"
      />
      {/* Arrow/growth indicator */}
      <path
        d="M20 14L26 20L20 26L14 20L20 14Z"
        fill="white"
        opacity="0.9"
      />
      <path
        d="M20 10V18M20 10L16 14M20 10L24 14"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={clsx('inline-flex items-center', className)}>
        <IconMark />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={clsx('inline-flex items-center gap-1.5', className)}>
        <IconMark />
        <span className={clsx('font-bold tracking-tight text-gray-900', textSize)}>CA</span>
      </div>
    );
  }

  return (
    <div className={clsx('inline-flex items-center gap-2', className)}>
      <IconMark />
      <span className={clsx('font-bold tracking-tight', textSize)}>
        <span className="text-gray-900">Cubicle</span>
        <span className="text-primary-600">Ally</span>
      </span>
    </div>
  );
}
