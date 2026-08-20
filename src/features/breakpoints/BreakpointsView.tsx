import React, { useState } from 'react';
import { Smartphone, Tablet, Monitor, Tv } from 'lucide-react';
import { clsx } from 'clsx';
import { BreakpointToken } from '../../schema/designSystem';
import { CopyButton } from '../../components/common/CopyButton';
import { ProvenancePopover } from '../../components/common/ProvenancePopover';
import { Badge } from '../../components/common/Badge';

interface BreakpointsViewProps {
  breakpoints: BreakpointToken[];
  onNavigateToSource?: (lineNumber?: number) => void;
}

export const BreakpointsView: React.FC<BreakpointsViewProps> = ({ breakpoints, onNavigateToSource }) => {
  const [simulatedWidth, setSimulatedWidth] = useState(1024);

  // Find active breakpoint for current simulated width
  const sortedBreakpoints = [...breakpoints].sort((a, b) => a.pxValue - b.pxValue);
  const activeBreakpoint =
    [...sortedBreakpoints].reverse().find(b => simulatedWidth >= b.pxValue) || sortedBreakpoints[0];

  function getDeviceIcon(name: string, px: number) {
    if (px < 768 || name.includes('mobile') || name.includes('sm')) return Smartphone;
    if (px < 1024 || name.includes('tablet') || name.includes('md')) return Tablet;
    if (px < 1440 || name.includes('desktop') || name.includes('lg')) return Monitor;
    return Tv;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-line-subtle">
        <h1 className="text-xl font-bold text-content-primary flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-accent" />
          Responsive Breakpoints
        </h1>
        <p className="text-xs text-content-secondary mt-0.5">
          {breakpoints.length} responsive breakpoint tokens with interactive viewport simulator.
        </p>
      </div>

      {/* Viewport Simulator */}
      <section className="p-6 rounded-lg bg-surface-raised/60 border border-line-subtle space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
              Interactive Viewport Simulator:
            </h2>
            <span className="font-mono text-sm font-bold tabular-nums text-accent bg-surface-inset px-2.5 py-0.5 rounded-sm border border-line-subtle">
              {simulatedWidth}px
            </span>
          </div>

          {activeBreakpoint && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-content-secondary">Active Breakpoint:</span>
              <Badge variant="brand" size="md">
                {activeBreakpoint.name} (≥ {activeBreakpoint.pxValue}px)
              </Badge>
            </div>
          )}
        </div>

        {/* Width Slider */}
        <input
          type="range"
          min={320}
          max={1920}
          value={simulatedWidth}
          onChange={e => setSimulatedWidth(parseInt(e.target.value, 10))}
          aria-label="Simulated viewport width in pixels"
          className="w-full h-2 bg-surface-inset rounded-sm appearance-none cursor-pointer accent-accent"
        />

        {/* Quick jump buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs text-content-muted">Quick Jumps:</span>
          {sortedBreakpoints.map(b => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSimulatedWidth(b.pxValue)}
              aria-pressed={simulatedWidth === b.pxValue}
              className={clsx(
                'px-2.5 py-1 rounded-md text-xs font-mono tabular-nums transition-colors border',
                simulatedWidth === b.pxValue
                  ? 'bg-accent text-accent-contrast border-accent font-bold'
                  : 'bg-surface-inset text-content-secondary hover:text-content-primary border-line-subtle'
              )}
            >
              {b.name} ({b.pxValue}px)
            </button>
          ))}
        </div>
      </section>

      {/* Breakpoint Table */}
      <div className="rounded-lg border border-line-subtle bg-surface-raised/60 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">
            Responsive breakpoints with their minimum width and generated media query.
          </caption>
          <thead className="bg-surface-inset border-b border-line-subtle text-content-secondary uppercase font-semibold text-[11px]">
            <tr>
              <th scope="col" className="p-3">
                Breakpoint
              </th>
              <th scope="col" className="p-3 text-right">
                Min width
              </th>
              <th scope="col" className="p-3">
                Media query
              </th>
              <th scope="col" className="p-3">
                Role
              </th>
              <th scope="col" className="p-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-subtle">
            {sortedBreakpoints.map(token => {
              const Icon = getDeviceIcon(token.name, token.pxValue);
              const mediaQuery = `@media (min-width: ${token.pxValue}px) { ... }`;
              const isActive = activeBreakpoint?.id === token.id;

              return (
                <tr
                  key={token.id}
                  className={clsx(
                    'transition-colors',
                    isActive ? 'bg-accent/10' : 'hover:bg-surface-overlay/30'
                  )}
                >
                  <th scope="row" className="p-3 text-left align-middle">
                    <span className="flex items-center gap-2.5">
                      <span className="w-9 h-9 shrink-0 rounded-md bg-surface-inset border border-line-subtle flex items-center justify-center text-accent">
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-content-primary">{token.name}</span>
                        {isActive && (
                          <Badge variant="brand" size="sm">
                            Active
                          </Badge>
                        )}
                      </span>
                    </span>
                  </th>
                  <td className="p-3 align-middle text-right font-mono text-xs font-semibold tabular-nums text-accent whitespace-nowrap">
                    ≥ {token.pxValue}px ({token.minWidth || `${token.pxValue}px`})
                  </td>
                  <td className="p-3 align-middle font-mono tabular-nums text-[11px] text-content-secondary whitespace-nowrap">
                    {mediaQuery}
                  </td>
                  <td className="p-3 align-middle text-xs text-content-secondary">
                    {token.role || 'Screen token'}
                  </td>
                  <td className="p-3 align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <CopyButton
                        text={`@media (min-width: ${token.pxValue}px)`}
                        label="Query"
                        variant="secondary"
                      />
                      <ProvenancePopover
                        provenance={token.provenance}
                        confidence={token.confidence}
                        itemName={token.name}
                        onNavigateToSource={onNavigateToSource}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
