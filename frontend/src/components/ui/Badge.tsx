import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'neutral' | 'primary' | 'error';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'neutral', size = 'md', className }: BadgeProps) {
  const variants = {
    success: 'bg-secondary-100 text-secondary-800 border-secondary-200',
    warning: 'bg-attention-100 text-attention-800 border-attention-200',
    neutral: 'bg-gray-100 text-gray-800 border-gray-200',
    primary: 'bg-primary-100 text-primary-800 border-primary-200',
    error: 'bg-red-100 text-red-800 border-red-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// Priority badge specifically for gap priorities
interface PriorityBadgeProps {
  priority: 'high' | 'medium' | 'low';
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const variants = {
    high: 'bg-attention-100 text-attention-800',
    medium: 'bg-primary-100 text-primary-800',
    low: 'bg-gray-100 text-gray-700',
  };

  const labels = {
    high: 'High Priority',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
        variants[priority],
        className
      )}
    >
      {labels[priority]}
    </span>
  );
}

// Skill category badge
interface CategoryBadgeProps {
  category: 'knowledge' | 'skill' | 'ability' | 'tool';
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const variants = {
    knowledge: 'bg-blue-100 text-blue-800',
    skill: 'bg-purple-100 text-purple-800',
    ability: 'bg-green-100 text-green-800',
    tool: 'bg-orange-100 text-orange-800',
  };

  const labels = {
    knowledge: 'Knowledge',
    skill: 'Skill',
    ability: 'Ability',
    tool: 'Tool',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
        variants[category],
        className
      )}
    >
      {labels[category]}
    </span>
  );
}
