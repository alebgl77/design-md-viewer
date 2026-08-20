import React, { useState } from 'react';
import { Ruler, Maximize, AlignJustify } from 'lucide-react';
import { SpacingToken } from '../../schema/designSystem';
import { CopyButton } from '../../components/common/CopyButton';
import { ProvenancePopover } from '../../components/common/ProvenancePopover';
import { Badge } from '../../components/common/Badge';

interface SpacingViewProps {
  spacing: SpacingToken[];
  onNavigateToSource?: (lineNumber?: number) => void;
}

export const SpacingView: React.FC<SpacingViewProps> = ({
  spacing,
  onNavigateToSource,
}) => {
  const [viewMode, setViewMode] = useState<'bars' | 'boxes'>('bars');

  const maxPx = Math.max(...spacing.map(s => s.pxValue), 64);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1b2b21]">
        <div>
          <h2 className="text-xl font-bold text-[#cbd5e1] flex items-center gap-2">
            <Ruler className="w-5 h-5 text-emerald-400" />
            Spacing Scale & Rhythm
          </h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            {spacing.length} proportional spacing tokens mapped on visual comparison scales.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-[#0e1611] border border-[#1b2b21] rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('bars')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'bars' ? 'bg-[#0c6e4e] text-white' : 'text-[#94a3b8] hover:text-[#cbd5e1]'
            }`}
          >
            <AlignJustify className="w-3.5 h-3.5" />
            <span>Scale Bars</span>
          </button>
          <button
            onClick={() => setViewMode('boxes')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'boxes' ? 'bg-[#0c6e4e] text-white' : 'text-[#94a3b8] hover:text-[#cbd5e1]'
            }`}
          >
            <Maximize className="w-3.5 h-3.5" />
            <span>Dimension Boxes</span>
          </button>
        </div>
      </div>

      {viewMode === 'bars' ? (
        /* Bars Visualization */
        <div className="rounded-2xl bg-[#0e1611]/60 border border-[#1b2b21] p-6 space-y-5">
          {spacing.map((token) => {
            const widthPercent = Math.max(3, Math.min(100, (token.pxValue / maxPx) * 100));
            const cssVar = `--space-${token.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}: ${token.value};`;

            return (
              <div key={token.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#cbd5e1]">{token.name}</span>
                    <span className="text-[11px] font-mono text-[#64748b]">
                      {token.value} {token.remValue ? `(${token.remValue})` : ''}
                    </span>
                    {token.role && (
                      <Badge variant="neutral" size="sm" className="hidden sm:inline-flex">
                        {token.role}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-emerald-400">
                      {token.pxValue}px
                    </span>
                    <CopyButton text={cssVar} showIconOnly title={`Copy: ${cssVar}`} />
                    <ProvenancePopover
                      provenance={token.provenance}
                      confidence={token.confidence}
                      itemName={token.name}
                      onNavigateToSource={onNavigateToSource}
                    />
                  </div>
                </div>

                {/* Proportional Bar Graphic */}
                <div className="h-6 w-full bg-[#0b0f0c] rounded-lg p-1 border border-[#1b2b21]/80 flex items-center overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded transition-all duration-300 shadow-sm"
                    style={{ width: `${widthPercent}%`, minWidth: `${Math.min(token.pxValue, 8)}px` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Boxes Grid Visualization */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {spacing.map((token) => (
            <div
              key={token.id}
              className="p-5 rounded-2xl bg-[#0e1611]/60 border border-[#1b2b21] hover:border-[#1b2b21] flex flex-col items-center justify-between gap-4 text-center shadow-lg"
            >
              <div className="w-full flex items-center justify-between text-xs">
                <span className="font-bold text-[#cbd5e1]">{token.name}</span>
                <ProvenancePopover
                  provenance={token.provenance}
                  confidence={token.confidence}
                  itemName={token.name}
                  onNavigateToSource={onNavigateToSource}
                />
              </div>

              {/* Real box rendering */}
              <div className="h-32 w-full flex items-center justify-center p-2 bg-[#0b0f0c] rounded-xl border border-[#1b2b21]/60">
                <div
                  className="bg-emerald-500/20 border-2 border-emerald-400 rounded transition-all shadow-sm"
                  style={{
                    width: `${Math.min(token.pxValue, 100)}px`,
                    height: `${Math.min(token.pxValue, 100)}px`,
                    minWidth: '4px',
                    minHeight: '4px',
                  }}
                />
              </div>

              <div className="w-full flex items-center justify-between pt-2 border-t border-[#1b2b21]/80 text-xs">
                <span className="font-mono text-emerald-400 font-semibold">{token.pxValue}px</span>
                <CopyButton text={token.value} label={token.value} variant="secondary" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
