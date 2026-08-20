import React from 'react';
import { Maximize2 } from 'lucide-react';
import { RadiusToken } from '../../schema/designSystem';
import { CopyButton } from '../../components/common/CopyButton';
import { ProvenancePopover } from '../../components/common/ProvenancePopover';
import { Badge } from '../../components/common/Badge';

interface RadiusViewProps {
  radii: RadiusToken[];
  onNavigateToSource?: (lineNumber?: number) => void;
}

export const RadiusView: React.FC<RadiusViewProps> = ({ radii, onNavigateToSource }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-[#1b2b21]">
        <h2 className="text-xl font-bold text-[#cbd5e1] flex items-center gap-2">
          <Maximize2 className="w-5 h-5 text-sky-400" />
          Border Radius & Curvature
        </h2>
        <p className="text-xs text-[#94a3b8] mt-0.5">
          {radii.length} border radius definitions rendered onto interactive geometric cards.
        </p>
      </div>

      {/* Grid of real shapes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {radii.map((token) => {
          const cssVar = `--radius-${token.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}: ${token.value};`;
          const radiusCss = token.value === 'full' || token.pxValue >= 9999 ? '9999px' : `${token.pxValue}px`;

          return (
            <div
              key={token.id}
              className="p-5 rounded-2xl bg-[#0e1611]/60 border border-[#1b2b21] hover:border-[#1b2b21] flex flex-col items-center justify-between gap-5 text-center shadow-lg transition-all"
            >
              {/* Header */}
              <div className="w-full flex items-center justify-between">
                <div className="text-left">
                  <div className="font-bold text-sm text-[#cbd5e1]">{token.name}</div>
                  <div className="text-xs text-[#94a3b8] font-mono">{token.value}</div>
                </div>

                <ProvenancePopover
                  provenance={token.provenance}
                  confidence={token.confidence}
                  itemName={token.name}
                  onNavigateToSource={onNavigateToSource}
                />
              </div>

              {/* Real Visual Shape */}
              <div className="h-36 w-full flex items-center justify-center p-4 bg-[#0b0f0c] rounded-xl border border-[#1b2b21]/80">
                <div
                  className="w-24 h-24 bg-gradient-to-br from-sky-500/20 to-indigo-600/30 border-2 border-sky-400 flex items-center justify-center text-xs font-mono font-bold text-sky-300 shadow-md shadow-sky-500/10 transition-all"
                  style={{ borderRadius: radiusCss }}
                >
                  {token.value}
                </div>
              </div>

              {/* Footer */}
              <div className="w-full flex items-center justify-between pt-3 border-t border-[#1b2b21]/80">
                {token.role ? (
                  <Badge variant="neutral" size="sm">
                    {token.role}
                  </Badge>
                ) : (
                  <span />
                )}

                <CopyButton text={cssVar} label="Copy CSS" variant="secondary" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
