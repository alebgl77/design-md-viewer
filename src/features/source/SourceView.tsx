import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileCode, ListTree, ChevronUp, ChevronDown, CornerDownLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { RawSection } from '../../schema/designSystem';
import { CopyButton } from '../../components/common/CopyButton';

interface SourceViewProps {
  rawContent: string;
  sections: RawSection[];
  highlightLine?: number | null;
}

/**
 * A design.md of any real size used to mount one <div> per line in a single commit —
 * tens of thousands of nodes, each with a freshly allocated ref callback. Documents up to
 * WINDOW_THRESHOLD still render whole (no behaviour change for the common case); anything
 * larger renders a WINDOW_SIZE slice with explicit paging and jump-to-line affordances.
 * Both paths keep highlight-line and jump-to-source working.
 */
const WINDOW_THRESHOLD = 1200;
const WINDOW_SIZE = 600;

interface SourceLineProps {
  lineNumber: number;
  text: string;
  isHighlighted: boolean;
}

/**
 * Memoised so paging or a highlight change only re-renders the lines that actually
 * changed. Rows carry a data attribute instead of a ref callback, which is what removes
 * the per-line closure allocation on every render.
 */
const SourceLine = React.memo(function SourceLine({ lineNumber, text, isHighlighted }: SourceLineProps) {
  return (
    <div
      data-source-line={lineNumber}
      className={clsx(
        'flex items-start py-0.5 px-2 rounded-sm transition-colors',
        isHighlighted ? 'bg-accent/20 ring-1 ring-accent' : 'hover:bg-surface-raised'
      )}
    >
      <span className="w-10 select-none text-[11px] text-content-muted text-right pr-4 shrink-0 tabular-nums">
        {lineNumber}
      </span>
      <span className="flex-1 whitespace-pre-wrap break-words">{text || ' '}</span>
    </div>
  );
});

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const SourceView: React.FC<SourceViewProps> = ({ rawContent, sections, highlightLine }) => {
  const [viewMode, setViewMode] = useState<'raw' | 'rendered'>('raw');
  const [windowStart, setWindowStart] = useState(0);
  const [jumpValue, setJumpValue] = useState('');
  // A nonce, not just a line number: asking twice for the same line must scroll twice.
  const [scrollRequest, setScrollRequest] = useState<{ line: number; nonce: number } | null>(null);
  const handledNonce = useRef(-1);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => rawContent.split(/\r?\n/), [rawContent]);
  const totalLines = lines.length;
  const isWindowed = totalLines > WINDOW_THRESHOLD;
  const maxStart = Math.max(0, totalLines - WINDOW_SIZE);

  const start = isWindowed ? Math.min(windowStart, maxStart) : 0;
  const end = isWindowed ? Math.min(totalLines, start + WINDOW_SIZE) : totalLines;
  const visibleLines = useMemo(() => lines.slice(start, end), [lines, start, end]);

  const requestScroll = (line: number) => {
    setScrollRequest(prev => ({ line, nonce: (prev?.nonce ?? 0) + 1 }));
  };

  // A freshly loaded document starts at the top.
  useEffect(() => {
    setWindowStart(0);
  }, [rawContent]);

  useEffect(() => {
    if (highlightLine) {
      requestScroll(highlightLine);
    }
  }, [highlightLine]);

  useEffect(() => {
    if (!scrollRequest || viewMode !== 'raw') return;
    if (scrollRequest.nonce === handledNonce.current) return;

    const line = clamp(scrollRequest.line, 1, totalLines);

    // Outside the rendered slice: move the window first, then let this effect re-run.
    if (isWindowed && (line < start + 1 || line > end)) {
      const nextStart = clamp(line - 1 - Math.floor(WINDOW_SIZE / 2), 0, maxStart);
      if (nextStart !== start) {
        setWindowStart(nextStart);
        return;
      }
    }

    handledNonce.current = scrollRequest.nonce;
    scrollAreaRef.current
      ?.querySelector(`[data-source-line="${line}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [scrollRequest, viewMode, isWindowed, start, end, maxStart, totalLines]);

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number.parseInt(jumpValue, 10);
    if (Number.isNaN(parsed)) return;
    setViewMode('raw');
    requestScroll(clamp(parsed, 1, totalLines));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <h1 className="text-xl font-bold text-content-primary flex items-center gap-2">
            <FileCode className="w-5 h-5 text-accent" />
            Source design.md Inspector
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            <span className="tabular-nums">{lines.length}</span> lines •{' '}
            <span className="tabular-nums">{sections.length}</span> structured markdown sections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-surface-raised border border-line rounded-md p-0.5">
            <button
              type="button"
              aria-pressed={viewMode === 'raw'}
              onClick={() => setViewMode('raw')}
              className={clsx(
                'px-3 py-1 text-xs font-medium rounded-sm transition-colors',
                viewMode === 'raw'
                  ? 'bg-accent text-accent-contrast'
                  : 'text-content-secondary hover:text-content-primary'
              )}
            >
              Raw Lines
            </button>
            <button
              type="button"
              aria-pressed={viewMode === 'rendered'}
              onClick={() => setViewMode('rendered')}
              className={clsx(
                'px-3 py-1 text-xs font-medium rounded-sm transition-colors',
                viewMode === 'rendered'
                  ? 'bg-accent text-accent-contrast'
                  : 'text-content-secondary hover:text-content-primary'
              )}
            >
              Section Outline
            </button>
          </div>

          <CopyButton text={rawContent} label="Copy File" variant="secondary" />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table of Contents Sidebar */}
        <nav
          aria-label="Document outline"
          className="lg:col-span-4 rounded-lg bg-surface-raised border border-line p-4 space-y-2 max-h-[70vh] overflow-y-auto"
        >
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5 pb-2 border-b border-line-subtle">
            <ListTree className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Document Outline</span>
          </h2>

          <div className="space-y-1">
            {sections.map(sec => (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  setViewMode('raw');
                  requestScroll(sec.lineNumber);
                }}
                className="w-full flex items-center justify-between text-left p-2 rounded-md hover:bg-surface-overlay text-xs text-content-secondary hover:text-content-primary transition-colors group"
                style={{ paddingLeft: `${Math.max(8, sec.level * 12)}px` }}
              >
                <span className="truncate group-hover:text-accent">{sec.heading}</span>
                <span className="text-[10px] font-mono text-content-muted shrink-0 ml-2 tabular-nums">
                  L{sec.lineNumber}
                </span>
              </button>
            ))}
          </div>
        </nav>

        {/* Source Content Area */}
        <div className="lg:col-span-8 rounded-lg bg-surface-inset border border-line overflow-hidden shadow-deep">
          {viewMode === 'raw' ? (
            <>
              {isWindowed && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-line bg-surface-raised">
                  <span className="text-[11px] font-mono text-content-secondary tabular-nums">
                    Showing lines {start + 1}–{end} of {totalLines}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <form onSubmit={handleJump} className="flex items-center gap-1">
                      <label htmlFor="source-jump-line" className="sr-only">
                        Jump to line number
                      </label>
                      <input
                        id="source-jump-line"
                        type="number"
                        min={1}
                        max={totalLines}
                        value={jumpValue}
                        onChange={e => setJumpValue(e.target.value)}
                        placeholder="Line"
                        className="w-20 px-2 py-1 rounded-sm bg-surface-inset border border-line text-[11px] font-mono text-content-primary placeholder-content-muted tabular-nums focus:outline-none focus:border-accent"
                      />
                      <button
                        type="submit"
                        className="flex items-center gap-1 px-2 py-1 rounded-sm border border-line text-[11px] font-semibold text-content-secondary hover:text-content-primary hover:border-line-strong transition-colors"
                      >
                        <CornerDownLeft className="w-3 h-3" aria-hidden="true" />
                        Go
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={() => setWindowStart(clamp(start - WINDOW_SIZE, 0, maxStart))}
                      disabled={start === 0}
                      className="flex items-center gap-1 px-2 py-1 rounded-sm border border-line text-[11px] font-semibold text-content-secondary hover:text-content-primary hover:border-line-strong transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-3 h-3" aria-hidden="true" />
                      Earlier
                    </button>
                    <button
                      type="button"
                      onClick={() => setWindowStart(clamp(start + WINDOW_SIZE, 0, maxStart))}
                      disabled={end >= totalLines}
                      className="flex items-center gap-1 px-2 py-1 rounded-sm border border-line text-[11px] font-semibold text-content-secondary hover:text-content-primary hover:border-line-strong transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-3 h-3" aria-hidden="true" />
                      Later
                    </button>
                  </div>
                </div>
              )}

              <div
                ref={scrollAreaRef}
                className="max-h-[70vh] overflow-y-auto font-mono text-xs text-content-secondary p-2 divide-y divide-line-subtle"
              >
                {visibleLines.map((line, idx) => {
                  const lineNum = start + idx + 1;
                  return (
                    <SourceLine
                      key={lineNum}
                      lineNumber={lineNum}
                      text={line}
                      isHighlighted={highlightLine === lineNum}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
              {sections.map(sec => (
                <div key={sec.id} className="space-y-2 pb-4 border-b border-line-subtle">
                  <div className="flex items-center justify-between gap-3">
                    <h3
                      className="font-bold text-content-primary text-base"
                      style={{ fontSize: `${Math.max(14, 20 - sec.level * 2)}px` }}
                    >
                      {sec.heading}
                    </h3>
                    <span className="text-xs font-mono text-content-muted tabular-nums shrink-0">
                      Lines {sec.lineNumber}–{sec.lineEnd}
                    </span>
                  </div>
                  <pre className="text-xs font-mono text-content-secondary bg-surface-raised p-3.5 rounded-md border border-line-subtle whitespace-pre-wrap">
                    {sec.content.trim() || '(No content)'}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
