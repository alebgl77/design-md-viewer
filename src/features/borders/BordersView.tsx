import React from 'react';
import { BoxSelect } from 'lucide-react';
import { BorderToken } from '../../schema/designSystem';
import { CopyButton } from '../../components/common/CopyButton';
import { ProvenancePopover } from '../../components/common/ProvenancePopover';
import { Badge } from '../../components/common/Badge';

interface BordersViewProps {
  borders: BorderToken[];
  onNavigateToSource?: (lineNumber?: number) => void;
}

/**
 * Fallback stroke colour for a border token parsed without one. It is part of
 * the CSS declaration we print and copy, so it stays a literal value and is
 * used for BOTH the printed declaration and the preview — previously the two
 * disagreed and the preview drew an indigo the copied CSS never contained.
 */
const FALLBACK_BORDER_COLOR = '#334155';

export const BordersView: React.FC<BordersViewProps> = ({ borders, onNavigateToSource }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-4 border-b border-line-subtle">
        <h1 className="text-xl font-bold text-content-primary flex items-center gap-2">
          <BoxSelect className="w-5 h-5 text-accent" />
          Borders &amp; Strokes
        </h1>
        <p className="text-xs text-content-secondary mt-0.5">
          {borders.length} border rules with visual stroke simulations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {borders.map((token) => {
          const borderColor = token.color || FALLBACK_BORDER_COLOR;
          const borderStyleStr = `${token.width} ${token.style} ${borderColor}`;
          const cssVar = `--border-${token.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}: ${borderStyleStr};`;

          return (
            <div
              key={token.id}
              className="p-5 rounded-lg bg-surface-raised/60 border border-line-subtle hover:border-line flex flex-col justify-between gap-4 shadow-deep transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-content-primary">{token.name}</div>
                  <div className="text-xs text-content-secondary font-mono tabular-nums truncate">{borderStyleStr}</div>
                </div>
                <ProvenancePopover
                  provenance={token.provenance}
                  confidence={token.confidence}
                  itemName={token.name}
                  onNavigateToSource={onNavigateToSource}
                />
              </div>

              {/* Visual Box with border applied */}
              <div className="h-28 w-full flex items-center justify-center p-4 bg-surface-inset rounded-md">
                <div
                  className="w-full h-full rounded-sm bg-surface-raised/80 flex items-center justify-center text-xs text-content-primary font-medium"
                  style={{
                    // Parsed document values: the stroke IS the token.
                    borderWidth: token.width,
                    borderStyle: token.style as any,
                    borderColor,
                  }}
                >
                  {token.name} ({token.width})
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-line-subtle">
                <span className="text-xs text-content-secondary">{token.role || 'Border token'}</span>
                <CopyButton text={cssVar} label="Copy CSS" variant="secondary" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
