import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, X, Hash } from 'lucide-react';
import { Provenance, ExtractionConfidence } from '../../schema/designSystem';
import { Badge } from './Badge';

interface ProvenancePopoverProps {
  provenance: Provenance;
  confidence?: ExtractionConfidence;
  itemName?: string;
  onNavigateToSource?: (lineNumber?: number) => void;
}

interface PanelPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

/** Vertical gap between the trigger and the panel. */
const TRIGGER_GAP = 6;
/** Breathing room kept between the panel and every viewport edge. */
const VIEWPORT_MARGIN = 8;
/** Preferred panel width - the former `w-80`, now clamped on narrow screens. */
const PANEL_WIDTH = 320;
/** Below this the panel scrolls internally rather than shrinking further. */
const MIN_PANEL_HEIGHT = 140;

/**
 * The panel is rendered into `document.body` through a portal and positioned
 * with `position: fixed`.
 *
 * This is not a preference. Every caller mounts this trigger inside a table or
 * card whose container carries `overflow-x-auto`, and an absolutely positioned
 * child cannot escape a clipping ancestor: `z-index` does not help, and setting
 * `overflow-y: visible` does not either, because the spec computes it back to
 * `auto` whenever `overflow-x` is not `visible`. In the Tokens and Colors
 * tables that clipped the heading path, the line number and the jump-to-source
 * link - the app's whole provenance promise - out of existence. A portal is the
 * only fix that keeps the panel in the DOM tree of the component that owns it.
 */
export const ProvenancePopover: React.FC<ProvenancePopoverProps> = ({
  provenance,
  confidence = 'explicit',
  itemName,
  onNavigateToSource,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = useCallback((restoreFocus = true) => {
    setIsOpen(false);
    setPosition(null);
    if (!restoreFocus) return;
    // Only reclaim focus when it would otherwise be destroyed along with the
    // panel. If the user has already clicked into something else, leave it be.
    const active = document.activeElement;
    if (!active || active === document.body || panelRef.current?.contains(active)) {
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(PANEL_WIDTH, viewportWidth - VIEWPORT_MARGIN * 2);

    // Right-aligned on the trigger (the original visual anchoring), then
    // clamped so it can never hang off either edge.
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(rect.right - width, viewportWidth - width - VIEWPORT_MARGIN)
    );

    const spaceBelow = viewportHeight - rect.bottom - TRIGGER_GAP - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - TRIGGER_GAP - VIEWPORT_MARGIN;
    // Measure before deciding: height is only meaningful once the panel has
    // rendered, which is why this runs in a layout effect. scrollHeight is read
    // alongside offsetHeight so a repositioning pass (resize) still sees the
    // panel's natural height even when the previous pass clamped it.
    const panelHeight = Math.max(panel.offsetHeight, panel.scrollHeight);
    const flipUp = panelHeight > spaceBelow && spaceAbove > spaceBelow;

    const available = Math.max(MIN_PANEL_HEIGHT, flipUp ? spaceAbove : spaceBelow);
    const height = Math.min(panelHeight, available);
    // Both branches clamp against the viewport edge, so the panel is fully on
    // screen even when the trigger sits in the last row of a long table.
    const top = flipUp
      ? Math.max(VIEWPORT_MARGIN, rect.top - TRIGGER_GAP - height)
      : Math.min(
          rect.bottom + TRIGGER_GAP,
          Math.max(VIEWPORT_MARGIN, viewportHeight - VIEWPORT_MARGIN - height)
        );

    setPosition({ top, left, width, maxHeight: available });
  }, []);

  // Layout effect, not effect: the panel is measured and placed before the
  // browser paints, so it never flashes at the top-left corner first.
  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, updatePosition]);

  // Move focus into the panel so Escape has somewhere to land and screen-reader
  // users are taken to the content they just asked for.
  useEffect(() => {
    if (!isOpen) return;
    panelRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      // Both refs, or the panel's own clicks would close it instantly - the
      // panel is no longer a DOM descendant of the trigger's wrapper.
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      close();
    }

    function handleScroll(event: Event) {
      const target = event.target as Node | null;
      // The snippet block scrolls; that must not dismiss the thing being read.
      if (target && panelRef.current?.contains(target)) return;
      close();
    }

    function handleResize() {
      updatePosition();
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    // Capture phase: scroll events from a scrollable container do not bubble.
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, close, updatePosition]);

  const panel = (
    <div
      ref={panelRef}
      id={panelId}
      role="dialog"
      aria-label={itemName ? `Source in design.md for ${itemName}` : 'Source in design.md'}
      tabIndex={-1}
      // React portals still bubble through the React tree, so a row-level
      // onClick would fire on every click inside the panel without this.
      onClick={e => e.stopPropagation()}
      onKeyDown={e => {
        // Same reason: an ancestor React keydown handler would otherwise see
        // this Escape and close whatever it owns as well. The native document
        // listener above still fires and closes this panel.
        if (e.key === 'Escape') e.stopPropagation();
      }}
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        width: position?.width ?? PANEL_WIDTH,
        maxHeight: position?.maxHeight,
        visibility: position ? 'visible' : 'hidden',
      }}
      className="fixed z-50 overflow-y-auto p-3.5 rounded-lg bg-surface-overlay border border-line shadow-chromatic text-xs text-content-secondary"
    >
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-line">
        <div className="flex items-center gap-1.5 font-semibold text-content-primary">
          <FileText className="w-3.5 h-3.5 text-accent" />
          <span>Source in design.md</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={confidence === 'explicit' ? 'explicit' : 'inferred'}>
            {confidence === 'explicit' ? 'Explicit' : 'Inferred'}
          </Badge>
          <button
            type="button"
            onClick={() => close()}
            aria-label="Close source panel"
            className="text-content-muted hover:text-content-primary p-0.5 rounded-sm transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {provenance.headingPath && provenance.headingPath.length > 0 && (
        <div className="mb-2">
          <div className="text-[10px] uppercase font-semibold text-content-muted tracking-wider mb-0.5">
            Section
          </div>
          <div className="text-content-primary font-mono text-[11px] bg-surface-inset px-2 py-1 rounded-sm border border-line truncate">
            {provenance.headingPath.join(' › ')}
          </div>
        </div>
      )}

      {provenance.lineNumber && (
        <div className="mb-2 flex items-center justify-between text-content-secondary text-[11px]">
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3 text-content-muted" /> Line {provenance.lineNumber}
          </span>
          {onNavigateToSource && (
            <button
              type="button"
              onClick={() => {
                close(false);
                onNavigateToSource(provenance.lineNumber);
              }}
              className="text-accent hover:text-accent-hover hover:underline font-medium rounded-sm"
            >
              Jump to source →
            </button>
          )}
        </div>
      )}

      {provenance.rawSourceSnippet && (
        <div>
          <div className="text-[10px] uppercase font-semibold text-content-muted tracking-wider mb-0.5">
            Extracted Snippet
          </div>
          <pre className="text-[11px] text-content-primary font-mono bg-surface-inset p-2 rounded-sm border border-line overflow-x-auto whitespace-pre-wrap max-h-28">
            {provenance.rawSourceSnippet}
          </pre>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        onClick={e => {
          e.stopPropagation();
          if (isOpen) {
            close();
          } else {
            setIsOpen(true);
          }
        }}
        title="View source in design.md"
        aria-label="View source in design.md"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        className="p-1 rounded-sm text-content-muted hover:text-content-primary hover:bg-accent/10 transition-colors"
      >
        <FileText className="w-3.5 h-3.5" />
      </button>

      {isOpen && createPortal(panel, document.body)}
    </div>
  );
};
