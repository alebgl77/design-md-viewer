import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';

/**
 * Elements that can take keyboard focus inside a dialog. `[tabindex]` picks up
 * custom controls (a div carrying role="button"), and the `:not([tabindex="-1"])`
 * guard keeps the panel itself out of its own tab order.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]:not([contenteditable="false"])',
].join(',');

/** Marks the control that should receive focus when the dialog opens. */
const AUTOFOCUS_ATTRIBUTE = 'data-modal-autofocus';

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    // getClientRects() is empty for display:none / visibility:hidden subtrees,
    // so hidden controls never become trap boundaries.
    (el) => el.getClientRects().length > 0
  );
}

/**
 * Scroll lock, reference counted.
 *
 * A raw `overflow = ''` on close would unlock the page while a second dialog is
 * still open, and a leaked lock bricks scrolling for the rest of the session —
 * so the original inline value is captured once and restored exactly once.
 */
let scrollLockCount = 0;
let previousBodyOverflow = '';

function lockBodyScroll(): () => void {
  if (scrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  scrollLockCount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    scrollLockCount -= 1;
    if (scrollLockCount === 0) {
      document.body.style.overflow = previousBodyOverflow;
    }
  };
}

type ModalSize = 'sm' | 'md' | 'lg';
type ModalAlign = 'center' | 'top';

const SIZE_STYLES: Record<ModalSize, string> = {
  sm: 'max-w-lg',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
};

const ALIGN_STYLES: Record<ModalAlign, string> = {
  center: 'items-center justify-center p-4',
  top: 'items-start justify-center px-4 pt-16 sm:pt-24',
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Id of the heading element rendered inside `children`. It becomes the
   * dialog's accessible name, so every caller must render a real heading
   * carrying this exact id (visually hidden is fine when the surface has no
   * visible title).
   */
  labelledBy: string;
  size?: ModalSize;
  align?: ModalAlign;
  /** Extra panel classes — height caps, mostly. */
  className?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  labelledBy,
  size = 'md',
  align = 'center',
  className,
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const pointerDownOnBackdrop = useRef(false);

  // Focus capture + restoration and the scroll lock key off `isOpen` alone.
  // Adding onClose here would tear the whole thing down on every parent render
  // and yank focus back to the trigger mid-interaction.
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const releaseScrollLock = lockBodyScroll();
    const panel = panelRef.current;

    if (panel) {
      const autofocusTarget = panel.querySelector<HTMLElement>(`[${AUTOFOCUS_ATTRIBUTE}]`);
      const target = autofocusTarget ?? getFocusableElements(panel)[0] ?? panel;
      target.focus();
    }

    return () => {
      releaseScrollLock();
      if (previouslyFocused && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = getFocusableElements(panel);
      if (focusable.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const isInsidePanel = active instanceof Node && panel.contains(active);

      if (e.shiftKey) {
        if (!isInsidePanel || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (!isInsidePanel || active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={clsx(
        'fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm',
        ALIGN_STYLES[align]
      )}
      // Closing on mouseup alone would also fire when a text selection that
      // started inside the panel happens to end on the backdrop.
      onMouseDown={(e) => {
        pointerDownOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pointerDownOnBackdrop.current) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={clsx(
          'flex w-full flex-col overflow-hidden rounded-xl border border-line bg-surface-raised shadow-deep',
          SIZE_STYLES[size],
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
