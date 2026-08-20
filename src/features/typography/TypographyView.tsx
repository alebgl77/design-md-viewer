import React, { useState } from 'react';
import { Type } from 'lucide-react';
import { clsx } from 'clsx';
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

export const TypographyView: React.FC<TypographyViewProps> = ({ typography, onNavigateToSource }) => {
  const [customText, setCustomText] = useState(PANGRAMS[0]);
  const [activeTab, setActiveTab] = useState<'specimens' | 'staircase'>('specimens');

  const tabClass = (active: boolean) =>
    clsx(
      'px-3 py-1 text-xs font-medium rounded-sm transition-colors',
      active ? 'bg-accent text-accent-contrast' : 'text-content-secondary hover:text-content-primary'
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-line-subtle">
        <div>
          <h1 className="text-xl font-bold text-content-primary flex items-center gap-2">
            <Type className="w-5 h-5 text-accent" />
            Typography &amp; Type Scale
          </h1>
          <p className="text-xs text-content-secondary mt-0.5">
            {typography.length} typographic levels detected with real rendering specimens.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-surface-raised border border-line rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('specimens')}
            aria-pressed={activeTab === 'specimens'}
            className={tabClass(activeTab === 'specimens')}
          >
            Specimens Cards
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('staircase')}
            aria-pressed={activeTab === 'staircase'}
            className={tabClass(activeTab === 'staircase')}
          >
            Scale Staircase
          </button>
        </div>
      </div>

      {/* Interactive Text Playground Bar */}
      <div className="p-4 rounded-lg bg-surface-raised/60 border border-line-subtle space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
            Interactive Live Specimen Preview
          </h2>
          <div className="flex items-center gap-1.5">
            {PANGRAMS.map((pangram, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCustomText(pangram)}
                className="text-[11px] px-2 py-0.5 rounded-sm bg-surface-overlay text-content-primary hover:bg-surface-inset hover:text-accent transition-colors"
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
          onChange={e => setCustomText(e.target.value)}
          placeholder="Type custom text to preview typography..."
          aria-label="Custom specimen text"
          className="w-full px-3.5 py-2.5 rounded-sm bg-surface-inset border border-line text-content-primary text-sm focus:outline-none focus:border-accent font-sans"
        />
      </div>

      {/* Specimens View */}
      {activeTab === 'specimens' ? (
        <div className="space-y-4">
          {typography.map(token => {
            const cssDeclaration = `font-family: ${token.fontFamily}; font-size: ${token.fontSize}; font-weight: ${token.fontWeight}; line-height: ${token.lineHeight || 'normal'};`;

            return (
              <div
                key={token.id}
                className="p-5 rounded-lg bg-surface-raised/70 border border-line-subtle hover:border-line transition-colors space-y-4 shadow-deep"
              >
                {/* Meta header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line-subtle">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-content-primary">{token.name}</span>
                    <Badge variant="neutral" size="sm">
                      {token.role || 'Typography'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-content-secondary">
                      <span className="bg-surface-inset px-2 py-0.5 rounded-sm border border-line-subtle">
                        {token.fontSize}
                      </span>
                      <span>•</span>
                      <span className="bg-surface-inset px-2 py-0.5 rounded-sm border border-line-subtle">
                        Weight {token.fontWeight}
                      </span>
                      {token.lineHeight && (
                        <>
                          <span>•</span>
                          <span className="bg-surface-inset px-2 py-0.5 rounded-sm border border-line-subtle">
                            LH: {token.lineHeight}
                          </span>
                        </>
                      )}
                    </div>

                    <CopyButton
                      text={cssDeclaration}
                      label="CSS"
                      variant="secondary"
                      title="Copy CSS styles"
                    />
                    <ProvenancePopover
                      provenance={token.provenance}
                      confidence={token.confidence}
                      itemName={token.name}
                      onNavigateToSource={onNavigateToSource}
                    />
                  </div>
                </div>

                {/* Actual Real Visual Rendering */}
                <div className="p-4 rounded-md bg-surface-inset border border-line-subtle overflow-x-auto">
                  <div
                    className="text-content-primary transition-all"
                    style={{
                      // Parsed document values: the specimen is the data itself.
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
                <div className="text-[11px] font-mono text-content-muted flex flex-wrap gap-4">
                  <span>
                    Family: <strong className="text-content-primary">{token.fontFamily}</strong>
                  </span>
                  <span>
                    Pixels:{' '}
                    <strong className="text-content-primary tabular-nums">{token.fontSizePx}px</strong>
                  </span>
                  {token.letterSpacing && (
                    <span>
                      Tracking:{' '}
                      <strong className="text-content-primary tabular-nums">{token.letterSpacing}</strong>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Scale Staircase View */
        <div className="p-6 rounded-lg bg-surface-raised/60 border border-line-subtle space-y-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-content-secondary mb-2">
            Typographic Scale Progression Staircase
          </h2>
          <div className="space-y-6 divide-y divide-line-subtle">
            {typography.map(token => (
              <div
                key={token.id}
                className="pt-4 flex flex-col md:flex-row items-start md:items-baseline justify-between gap-4"
              >
                <div className="w-44 shrink-0 font-mono text-xs text-content-secondary">
                  <div className="font-bold text-content-primary">{token.name}</div>
                  <div className="text-[11px] text-content-muted tabular-nums">
                    {token.fontSize} ({token.fontSizePx}px)
                  </div>
                </div>

                <div
                  className="flex-1 text-content-primary break-words"
                  style={{
                    // Parsed document values: the specimen is the data itself.
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
