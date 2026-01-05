import { clsx } from 'clsx';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 'md',
  strokeWidth = 8,
  showLabel = true,
  label,
  className,
}: ProgressRingProps) {
  const sizes = {
    sm: 60,
    md: 100,
    lg: 140,
    xl: 180,
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const diameter = sizes[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  // Color based on progress
  const getColor = () => {
    if (progress >= 75) return 'text-secondary-500';
    if (progress >= 50) return 'text-primary-500';
    if (progress >= 25) return 'text-attention-500';
    return 'text-gray-400';
  };

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)}>
      <svg width={diameter} height={diameter} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={clsx('transition-all duration-500 ease-out', getColor())}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={clsx('font-bold text-gray-900', textSizes[size])}>
            {Math.round(progress)}%
          </span>
          {label && <span className="text-xs text-gray-500 mt-0.5">{label}</span>}
        </div>
      )}
    </div>
  );
}
