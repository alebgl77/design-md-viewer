import React, { useState } from 'react';
import { Layers, Sun, Moon } from 'lucide-react';
import { ShadowToken } from '../../schema/designSystem';
import { CopyButton } from '../../components/common/CopyButton';
import { ProvenancePopover } from '../../components/common/ProvenancePopover';
import { Badge } from '../../components/common/Badge';

interface ShadowsViewProps {
  shadows: ShadowToken[];
  onNavigateToSource?: (lineNumber?: number) => void;
}

export const ShadowsView: React.FC<ShadowsViewProps> = ({ shadows, onNavigateToSource }) => {
  const [backdropTheme, setBackdropTheme] = useState<'dark' | 'light'>('dark');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1b2b21]">
        <div>
          <h2 className="text-xl font-bold text-[#cbd5e1] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#34d399]" />
            Shadows & Elevation
          </h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            {shadows.length} elevation levels visualized with real CSS box-shadows.
          </p>
        </div>

        {/* Backdrop Switcher */}
        <div className="flex items-center bg-[#0e1611] border border-[#1b2b21] rounded-lg p-0.5">
          <button
            onClick={() => setBackdropTheme('dark')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              backdropTheme === 'dark' ? 'bg-[#0c6e4e] text-white' : 'text-[#94a3b8] hover:text-[#cbd5e1]'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark Canvas</span>
          </button>
          <button
            onClick={() => setBackdropTheme('light')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              backdropTheme === 'light' ? 'bg-[#0c6e4e] text-white' : 'text-[#94a3b8] hover:text-[#cbd5e1]'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light Canvas</span>
          </button>
        </div>
      </div>

      {/* Grid of Elevation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {shadows.map((token) => {
          const cssVar = `--shadow-${token.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}: ${token.value};`;

          return (
            <div
              key={token.id}
              className="p-5 rounded-2xl bg-[#0e1611]/60 border border-[#1b2b21] hover:border-[#1b2b21] flex flex-col justify-between gap-5 shadow-lg"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#cbd5e1]">{token.name}</span>
                  {token.elevationLevel && (
                    <Badge variant="brand" size="sm">
                      Level {token.elevationLevel}
                    </Badge>
                  )}
                </div>

                <ProvenancePopover
                  provenance={token.provenance}
                  confidence={token.confidence}
                  itemName={token.name}
                  onNavigateToSource={onNavigateToSource}
                />
              </div>

              {/* Real Shadow Canvas Preview */}
              <div
                className={`h-40 w-full rounded-xl flex items-center justify-center p-6 transition-colors border ${
                  backdropTheme === 'dark'
                    ? 'bg-[#0b0f0c] border-[#1b2b21]'
                    : 'bg-slate-200 border-slate-300'
                }`}
              >
                <div
                  className={`w-3/4 py-4 px-6 rounded-xl flex flex-col items-center justify-center transition-all ${
                    backdropTheme === 'dark'
                      ? 'bg-[#15221a] text-[#cbd5e1] border border-[#1b2b21]'
                      : 'bg-white text-slate-900 border border-slate-200'
                  }`}
                  style={{ boxShadow: token.value }}
                >
                  <span className="font-bold text-xs">{token.name}</span>
                  <span className="text-[10px] opacity-70">Elevated Surface</span>
                </div>
              </div>

              {/* Code snippet */}
              <div className="p-2.5 rounded-lg bg-[#0b0f0c] border border-[#1b2b21] font-mono text-[11px] text-[#94a3b8] overflow-x-auto whitespace-pre">
                {token.value}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1b2b21]/80">
                <span className="text-xs text-[#94a3b8]">{token.role || 'Elevation'}</span>
                <CopyButton text={cssVar} label="Copy CSS" variant="secondary" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
