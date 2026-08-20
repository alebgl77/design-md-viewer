import React, { useState } from 'react';
import { Ruler, Maximize, AlignJustify } from 'lucide-react';
import { clsx } from 'clsx';
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

  const tabClass = (active: boolean) =>
    clsx(
      'flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-sm transition-colors',
      active ? 'bg-accent text-accent-contrast' : 'text-content-secondary hover:text-content-primary'
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-line-subtle">
        <div>
          <h1 className="text-xl font-bold text-content-primary flex items-center gap-2">
            <Ruler className="w-5 h-5 text-accent" />
            Spacing Scale &amp; Rhythm
          </h1>
          <p className="text-xs text-content-secondary mt-0.5">
            {spacing.length} proportional spacing tokens mapped on visual comparison scales.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-surface-raised border border-line rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('bars')}
            aria-pressed={viewMode === 'bars'}
            className={tabClass(viewMode === 'bars')}
          >
            <AlignJustify className="w-3.5 h-3.5" />
            <span>Scale Bars</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('boxes')}
            aria-pressed={viewMode === 'boxes'}
            className={tabClass(viewMode === 'boxes')}
          >
            <Maximize className="w-3.5 h-3.5" />
            <span>Dimension Boxes</span>
          </button>
        </div>
      </div>

      {viewMode === 'bars' ? (
        /* Bars Visualization */
        <div className="rounded-lg bg-surface-raised/60 border border-line-subtle overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">
              Spacing tokens with their declared value, proportional scale bar and pixel size.
            </caption>
            <thead className="bg-surface-inset border-b border-line-subtle text-content-secondary uppercase font-semibold text-[11px]">
              <tr>
                <th scope="col" className="p-3">Token</th>
                <th scope="col" className="p-3">Value</th>
                <th scope="col" className="p-3 w-full">Scale</th>
                <th scope="col" className="p-3 text-right">Pixels</th>
                <th scope="col" className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {spacing.map((token) => {
                const widthPercent = Math.max(3, Math.min(100, (token.pxValue / maxPx) * 100));
                const cssVar = `--space-${token.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}: ${token.value};`;

                return (
                  <tr key={token.id} className="hover:bg-surface-overlay/30 transition-colors">
                    <th scope="row" className="p-3 text-left align-middle">
                      <span className="flex items-center gap-2">
                        <span className="font-bold text-content-primary">{token.name}</span>
                        {token.role && (
                          <Badge variant="neutral" size="sm" className="hidden sm:inline-flex">
                            {token.role}
                          </Badge>
                        )}
                      </span>
                    </th>
                    <td className="p-3 align-middle whitespace-nowrap text-[11px] font-mono tabular-nums text-content-muted">
                      {token.value} {token.remValue ? `(${token.remValue})` : ''}
                    </td>
                    <td className="p-3 align-middle">
                      {/* Proportional Bar Graphic */}
                      <div className="h-6 min-w-[8rem] w-full bg-surface-inset rounded-md p-1 border border-line-subtle flex items-center overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-accent to-accent-hover rounded-sm transition-all duration-300"
                          style={{ width: `${widthPercent}%`, minWidth: `${Math.min(token.pxValue, 8)}px` }}
                        />
                      </div>
                    </td>
                    <td className="p-3 align-middle text-right font-mono text-xs font-semibold tabular-nums text-accent whitespace-nowrap">
                      {token.pxValue}px
                    </td>
                    <td className="p-3 align-middle">
                      <div className="flex items-center justify-end gap-2">
                        <CopyButton text={cssVar} showIconOnly title={`Copy: ${cssVar}`} />
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
      ) : (
        /* Boxes Grid Visualization */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {spacing.map((token) => (
            <div
              key={token.id}
              className="p-5 rounded-lg bg-surface-raised/60 border border-line-subtle hover:border-line flex flex-col items-center justify-between gap-4 text-center shadow-deep transition-colors"
            >
              <div className="w-full flex items-center justify-between text-xs">
                <span className="font-bold text-content-primary">{token.name}</span>
                <ProvenancePopover
                  provenance={token.provenance}
                  confidence={token.confidence}
                  itemName={token.name}
                  onNavigateToSource={onNavigateToSource}
                />
              </div>

              {/* Real box rendering */}
              <div className="h-32 w-full flex items-center justify-center p-2 bg-surface-inset rounded-md border border-line-subtle">
                <div
                  className="bg-accent/20 border-2 border-accent rounded-sm transition-all"
                  style={{
                    // Parsed document value: the box IS the token's measurement.
                    width: `${Math.min(token.pxValue, 100)}px`,
                    height: `${Math.min(token.pxValue, 100)}px`,
                    minWidth: '4px',
                    minHeight: '4px',
                  }}
                />
              </div>

              <div className="w-full flex items-center justify-between pt-2 border-t border-line-subtle text-xs">
                <span className="font-mono tabular-nums text-accent font-semibold">{token.pxValue}px</span>
                <CopyButton text={token.value} label={token.value} variant="secondary" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
