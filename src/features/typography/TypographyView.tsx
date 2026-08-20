import React, { useState } from 'react';
import { Type, Sparkles, Sliders } from 'lucide-react';
import { TypographyToken } from '../../schema/designSystem';
import { CopyButton } from '../../components/common/CopyButton';
import { ProvenancePopover } from '../../components/common/ProvenancePopover';
import { Badge } from '../../components/common/Badge';

interface TypographyViewProps {
  typography: TypographyToken[];
  onNavigateToSource?: (lineNumber?: number) => void;
}

const PANGRAMS = [
  'The quick brown fox jumps over the lazy dog.',
  'Sphinx of black quartz, judge my vow.',
  'Pack my box with five dozen liquor jugs.',
  'How quickly daft jumping zebras vex.',
];

export const TypographyView: React.FC<TypographyViewProps> = ({
  typography,
  onNavigateToSource,
}) => {
  const [customText, setCustomText] = useState(PANGRAMS[0]);
  const [activeTab, setActiveTab] = useState<'specimens' | 'staircase'>('specimens');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1b2b21]">
        <div>
          <h2 className="text-xl font-bold text-[#cbd5e1] flex items-center gap-2">
            <Type className="w-5 h-5 text-[#93c5fd]" />
            Typography & Type Scale
          </h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            {typography.length} typographic levels detected with real rendering specimens.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-[#0e1611] border border-[#1b2b21] rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('specimens')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'specimens' ? 'bg-[#0c6e4e] text-white' : 'text-[#94a3b8] hover:text-[#cbd5e1]'
            }`}
          >
            Specimens Cards
          </button>
          <button
            onClick={() => setActiveTab('staircase')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'staircase' ? 'bg-[#0c6e4e] text-white' : 'text-[#94a3b8] hover:text-[#cbd5e1]'
            }`}
          >
            Scale Staircase
          </button>
        </div>
      </div>

      {/* Interactive Text Playground Bar */}
      <div className="p-4 rounded-xl bg-[#0e1611]/60 border border-[#1b2b21] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
            Interactive Live Specimen Preview
          </span>
          <div className="flex items-center gap-1.5">
            {PANGRAMS.map((pangram, idx) => (
              <button
                key={idx}
                onClick={() => setCustomText(pangram)}
                className="text-[11px] px-2 py-0.5 rounded bg-[#15221a] text-[#cbd5e1] hover:bg-[#1a2a20] hover:text-white transition-colors"
                title={pangram}
              >
                Pangram {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Type custom text to preview typography..."
          className="w-full px-3.5 py-2.5 rounded-lg bg-[#0b0f0c] border border-[#1b2b21] text-[#cbd5e1] text-sm focus:outline-none focus:border-[#10b981] font-sans shadow-inner"
        />
      </div>

      {/* Specimens View */}
      {activeTab === 'specimens' ? (
        <div className="space-y-4">
          {typography.map((token) => {
            const cssDeclaration = `font-family: ${token.fontFamily}; font-size: ${token.fontSize}; font-weight: ${token.fontWeight}; line-height: ${token.lineHeight || 'normal'};`;

            return (
              <div
                key={token.id}
                className="p-5 rounded-2xl bg-[#0e1611]/70 border border-[#1b2b21] hover:border-[#1b2b21] transition-all space-y-4 shadow-lg"
              >
                {/* Meta header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1b2b21]/80">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-[#cbd5e1]">{token.name}</span>
                    <Badge variant="neutral" size="sm">
                      {token.role || 'Typography'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#94a3b8]">
                      <span className="bg-[#0b0f0c] px-2 py-0.5 rounded border border-[#1b2b21]">
                        {token.fontSize}
                      </span>
                      <span>•</span>
                      <span className="bg-[#0b0f0c] px-2 py-0.5 rounded border border-[#1b2b21]">
                        Weight {token.fontWeight}
                      </span>
                      {token.lineHeight && (
                        <>
                          <span>•</span>
                          <span className="bg-[#0b0f0c] px-2 py-0.5 rounded border border-[#1b2b21]">
                            LH: {token.lineHeight}
                          </span>
                        </>
                      )}
                    </div>

                    <CopyButton text={cssDeclaration} label="CSS" variant="secondary" title="Copy CSS styles" />
                    <ProvenancePopover
                      provenance={token.provenance}
                      confidence={token.confidence}
                      itemName={token.name}
                      onNavigateToSource={onNavigateToSource}
                    />
                  </div>
                </div>

                {/* Actual Real Visual Rendering */}
                <div className="p-4 rounded-xl bg-[#0b0f0c] border border-[#1b2b21]/60 overflow-x-auto">
                  <div
                    className="text-[#cbd5e1] transition-all"
                    style={{
                      fontFamily: token.fontFamily,
                      fontSize: token.fontSize,
                      fontWeight: token.fontWeight,
                      lineHeight: token.lineHeight || 1.4,
                      letterSpacing: token.letterSpacing,
                      textTransform: token.textTransform as any,
                    }}
                  >
                    {customText || 'Aa Bb Cc 12345'}
                  </div>
                </div>

                {/* Typography specs footer */}
                <div className="text-[11px] font-mono text-[#64748b] flex flex-wrap gap-4">
                  <span>Family: <strong className="text-[#cbd5e1]">{token.fontFamily}</strong></span>
                  <span>Pixels: <strong className="text-[#cbd5e1]">{token.fontSizePx}px</strong></span>
                  {token.letterSpacing && <span>Tracking: <strong className="text-[#cbd5e1]">{token.letterSpacing}</strong></span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Scale Staircase View */
        <div className="p-6 rounded-2xl bg-[#0e1611]/60 border border-[#1b2b21] space-y-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-2">
            Typographic Scale Progression Staircase
          </div>
          <div className="space-y-6 divide-y divide-[#1b2b21]/80">
            {typography.map((token) => (
              <div key={token.id} className="pt-4 flex flex-col md:flex-row items-start md:items-baseline justify-between gap-4">
                <div className="w-44 shrink-0 font-mono text-xs text-[#94a3b8]">
                  <div className="font-bold text-[#cbd5e1]">{token.name}</div>
                  <div className="text-[11px] text-[#64748b]">{token.fontSize} ({token.fontSizePx}px)</div>
                </div>

                <div
                  className="flex-1 text-[#cbd5e1] break-words"
                  style={{
                    fontFamily: token.fontFamily,
                    fontSize: token.fontSize,
                    fontWeight: token.fontWeight,
                    lineHeight: token.lineHeight || 1.3,
                  }}
                >
                  {customText}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
