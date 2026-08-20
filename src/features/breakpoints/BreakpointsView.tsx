import React, { useState } from 'react';
import { Smartphone, Tablet, Monitor, Tv, Sliders } from 'lucide-react';
import { BreakpointToken } from '../../schema/designSystem';
import { CopyButton } from '../../components/common/CopyButton';
import { ProvenancePopover } from '../../components/common/ProvenancePopover';
import { Badge } from '../../components/common/Badge';

interface BreakpointsViewProps {
  breakpoints: BreakpointToken[];
  onNavigateToSource?: (lineNumber?: number) => void;
}

export const BreakpointsView: React.FC<BreakpointsViewProps> = ({
  breakpoints,
  onNavigateToSource,
}) => {
  const minWidth = Math.min(...breakpoints.map(b => b.pxValue), 320);
  const maxWidth = Math.max(...breakpoints.map(b => b.pxValue), 1600);
  const [simulatedWidth, setSimulatedWidth] = useState(1024);

  // Find active breakpoint for current simulated width
  const sortedBreakpoints = [...breakpoints].sort((a, b) => a.pxValue - b.pxValue);
  const activeBreakpoint = [...sortedBreakpoints].reverse().find(b => simulatedWidth >= b.pxValue) || sortedBreakpoints[0];

  function getDeviceIcon(name: string, px: number) {
    if (px < 768 || name.includes('mobile') || name.includes('sm')) return Smartphone;
    if (px < 1024 || name.includes('tablet') || name.includes('md')) return Tablet;
    if (px < 1440 || name.includes('desktop') || name.includes('lg')) return Monitor;
    return Tv;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-[#1b2b21]">
        <h2 className="text-xl font-bold text-[#cbd5e1] flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[#34d399]" />
          Responsive Breakpoints
        </h2>
        <p className="text-xs text-[#94a3b8] mt-0.5">
          {breakpoints.length} responsive breakpoint tokens with interactive viewport simulator.
        </p>
      </div>

      {/* Viewport Simulator */}
      <div className="p-6 rounded-2xl bg-[#0e1611]/60 border border-[#1b2b21] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
              Interactive Viewport Simulator:
            </span>
            <span className="font-mono text-sm font-bold text-[#34d399] bg-[#0b0f0c] px-2.5 py-0.5 rounded border border-[#1b2b21]">
              {simulatedWidth}px
            </span>
          </div>

          {activeBreakpoint && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#94a3b8]">Active Breakpoint:</span>
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
          onChange={(e) => setSimulatedWidth(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-[#0b0f0c] rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />

        {/* Quick jump buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs text-[#64748b]">Quick Jumps:</span>
          {sortedBreakpoints.map(b => (
            <button
              key={b.id}
              onClick={() => setSimulatedWidth(b.pxValue)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                simulatedWidth === b.pxValue
                  ? 'bg-[#0c6e4e] text-white font-bold'
                  : 'bg-[#0b0f0c] text-[#94a3b8] hover:text-[#cbd5e1] border border-[#1b2b21]'
              }`}
            >
              {b.name} ({b.pxValue}px)
            </button>
          ))}
        </div>
      </div>

      {/* Breakpoint Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedBreakpoints.map((token) => {
          const Icon = getDeviceIcon(token.name, token.pxValue);
          const mediaQuery = `@media (min-width: ${token.pxValue}px) { ... }`;
          const isActive = activeBreakpoint?.id === token.id;

          return (
            <div
              key={token.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 shadow-lg ${
                isActive
                  ? 'bg-indigo-950/20 border-[#10b981]/50 shadow-indigo-500/10'
                  : 'bg-[#0e1611]/60 border-[#1b2b21] hover:border-[#1b2b21]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#0b0f0c] border border-[#1b2b21] flex items-center justify-center text-[#34d399]">
                  <Icon className="w-5 h-5" />
                </div>

                <ProvenancePopover
                  provenance={token.provenance}
                  confidence={token.confidence}
                  itemName={token.name}
                  onNavigateToSource={onNavigateToSource}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-base text-[#cbd5e1]">{token.name}</span>
                  {isActive && <Badge variant="brand" size="sm">Active</Badge>}
                </div>
                <div className="font-mono text-xs text-[#34d399] font-semibold">
                  ≥ {token.pxValue}px ({token.minWidth || `${token.pxValue}px`})
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0b0f0c] border border-[#1b2b21] font-mono text-[11px] text-[#94a3b8] overflow-x-auto truncate">
                {mediaQuery}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1b2b21]/80">
                <span className="text-xs text-[#94a3b8]">{token.role || 'Screen token'}</span>
                <CopyButton text={`@media (min-width: ${token.pxValue}px)`} label="Query" variant="secondary" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
