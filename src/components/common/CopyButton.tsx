import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { copyToClipboard } from '../../utils/clipboard';

interface CopyButtonProps {
  text: string;
  label?: string;
  showIconOnly?: boolean;
  className?: string;
  title?: string;
  variant?: 'ghost' | 'secondary' | 'subtle' | 'pill';
}

type CopyState = 'idle' | 'copied' | 'failed';

const RESET_DELAY: Record<Exclude<CopyState, 'idle'>, number> = {
  copied: 1800,
  failed: 2600,
};

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label,
  showIconOnly = false,
  className,
  title = 'Copy to clipboard',
  variant = 'ghost',
}) => {
  const [state, setState] = useState<CopyState>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();

  // The timer outlives the click, so it has to be cancelled if the row (or the
  // whole view) unmounts first — otherwise setState fires on a dead component.
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const flash = useCallback((next: Exclude<CopyState, 'idle'>) => {
    clearTimeout(resetTimer.current);
    setState(next);
    resetTimer.current = setTimeout(() => setState('idle'), RESET_DELAY[next]);
  }, []);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      // copyToClipboard already swallows the rejection and reports false, which
      // covers the two ways this realistically fails: a denied clipboard-write
      // permission, and an insecure context where the API is missing entirely.
      const success = await copyToClipboard(text);
      flash(success ? 'copied' : 'failed');
    },
    [text, flash]
  );

  // Hovers tint with the accent rather than swapping surfaces: `raised` is
  // lighter than the ground in the dark theme and darker in the light one, so
  // no single surface token reads as "lifted" in both.
  const variantStyles = {
    ghost: 'text-content-secondary hover:text-content-primary hover:bg-accent/10 active:scale-95',
    secondary:
      'bg-surface-overlay hover:bg-accent/10 text-content-primary border border-line hover:border-accent/40 active:scale-95',
    subtle: 'text-content-secondary hover:text-accent hover:bg-accent/10 active:scale-95',
    // Not fully round: the radius scale reserves that shape for numeric count
    // pills and status dots, so `pill` is simply the solid, high-emphasis
    // variant and takes the standard button radius from the base classes.
    pill: 'bg-accent hover:bg-accent-hover text-accent-contrast font-semibold px-3 py-1 shadow-deep active:scale-95',
  };

  const statusMessage =
    state === 'copied'
      ? 'Copied to clipboard'
      : state === 'failed'
        ? 'Copy failed. Copy the value manually.'
        : '';

  return (
    // The live region is a sibling of the button, not a child: a status node
    // inside a control is unreliable to announce, and the caller's className
    // still lands on the button so nothing about the layout shifts.
    <span className="inline-flex">
      <button
        type="button"
        onClick={handleCopy}
        title={title}
        aria-label={title}
        className={clsx(
          'inline-flex items-center justify-center gap-1.5 transition-all',
          'focus-visible:ring-2 focus-visible:ring-accent/50',
          showIconOnly ? 'p-1.5 rounded-md' : 'px-2.5 py-1 text-xs font-semibold rounded-md',
          variantStyles[variant],
          className
        )}
      >
        {state === 'copied' && (
          <>
            <Check className="w-3.5 h-3.5 text-status-success" />
            {!showIconOnly && <span className="text-status-success font-medium">Copied!</span>}
          </>
        )}
        {state === 'failed' && (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-status-danger" />
            {!showIconOnly && <span className="text-status-danger font-medium">Copy failed</span>}
          </>
        )}
        {state === 'idle' && (
          <>
            <Copy className="w-3.5 h-3.5 opacity-75" />
            {!showIconOnly && <span>{label || 'Copy'}</span>}
          </>
        )}
      </button>

      {/* Announced on change; the icon swap alone is colour-and-shape only, and
          in the icon-only variant it carries no text at all. */}
      <span role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </span>
    </span>
  );
};
