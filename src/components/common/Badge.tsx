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
  // Every variant is a token pair, so the badge is legible on both themes with
  // no `dark:` fork. Two variants deliberately carry a non-colour signal as
  // well, because the distinctions they encode are the ones users act on:
  //   - `inferred` is dashed, so "we guessed this" survives greyscale and does
  //     not depend on a hue the contract does not own (there is no blue).
  //   - `success` is filled while `brand` is tonal, so AAA still outranks AA
  //     visually in the light theme, where --status-success and --accent
  //     resolve to the same green.
  const variantStyles = {
    default: 'bg-surface-overlay text-content-primary border-line',
    explicit: 'bg-accent/15 text-accent border-accent/30 font-semibold',
    inferred: 'bg-surface-inset text-content-secondary border-line-strong border-dashed font-semibold',
    brand: 'bg-accent/15 text-accent border-accent/30 font-semibold',
    success: 'bg-status-success text-accent-contrast border-status-success font-semibold',
    warning: 'bg-status-warning/15 text-status-warning border-status-warning/40 font-semibold',
    error: 'bg-status-danger/15 text-status-danger border-status-danger/40 font-semibold',
    neutral: 'bg-surface-raised text-content-secondary border-line',
    outline: 'bg-transparent text-content-secondary border-line',
  };

  // rounded-sm across the board: badges are chips. The fully-round radius is
  // reserved for numeric count pills and status dots.
  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 font-medium rounded-sm',
    md: 'text-xs px-3 py-1 font-semibold rounded-sm',
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
