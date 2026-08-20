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

export const BordersView: React.FC<BordersViewProps> = ({ borders, onNavigateToSource }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-4 border-b border-[#1b2b21]">
        <h2 className="text-xl font-bold text-[#cbd5e1] flex items-center gap-2">
          <BoxSelect className="w-5 h-5 text-[#34d399]" />
          Borders & Strokes
        </h2>
        <p className="text-xs text-[#94a3b8] mt-0.5">
          {borders.length} border rules with visual stroke simulations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {borders.map((token) => {
          const borderStyleStr = `${token.width} ${token.style} ${token.color || '#334155'}`;
          const cssVar = `--border-${token.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}: ${borderStyleStr};`;

          return (
            <div
              key={token.id}
              className="p-5 rounded-2xl bg-[#0e1611]/60 border border-[#1b2b21] hover:border-[#1b2b21] flex flex-col justify-between gap-4 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[#cbd5e1]">{token.name}</div>
                  <div className="text-xs text-[#94a3b8] font-mono">{borderStyleStr}</div>
                </div>
                <ProvenancePopover
                  provenance={token.provenance}
                  confidence={token.confidence}
                  itemName={token.name}
                  onNavigateToSource={onNavigateToSource}
                />
              </div>

              {/* Visual Box with border applied */}
              <div className="h-28 w-full flex items-center justify-center p-4 bg-[#0b0f0c] rounded-xl">
                <div
                  className="w-full h-full rounded-lg bg-[#0e1611]/80 flex items-center justify-center text-xs text-[#cbd5e1] font-medium"
                  style={{
                    borderWidth: token.width,
                    borderStyle: token.style as any,
                    borderColor: token.color || '#6366f1',
                  }}
                >
                  {token.name} ({token.width})
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1b2b21]/80">
                <span className="text-xs text-[#94a3b8]">{token.role || 'Border token'}</span>
                <CopyButton text={cssVar} label="Copy CSS" variant="secondary" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
