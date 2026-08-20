import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'explicit' | 'inferred' | 'brand' | 'success' | 'warning' | 'error' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
  title,
}) => {
  const variantStyles = {
    default: 'bg-[#111a14] text-[#cbd5e1] border-[#1b2b21]',
    explicit: 'bg-[#10b981]/15 text-[#34d399] border-[#10b981]/30 font-semibold',
    inferred: 'bg-[#1d4ed8]/15 text-[#93c5fd] border-[#1d4ed8]/30 font-semibold',
    brand: 'bg-[#10b981]/15 text-[#34d399] border-[#10b981]/30 font-semibold',
    success: 'bg-[#10a34a]/15 text-[#6ee7b7] border-[#10a34a]/30 font-semibold',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold',
    error: 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-semibold',
    neutral: 'bg-[#0e1611] text-[#94a3b8] border-[#1b2b21]',
    outline: 'bg-transparent text-[#94a3b8] border-[#1b2b21]',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 font-medium rounded-full',
    md: 'text-xs px-3 py-1 font-semibold rounded-full',
  };

  return (
    <span
      title={title}
      className={clsx(
        'inline-flex items-center gap-1 border transition-colors font-sans',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};
