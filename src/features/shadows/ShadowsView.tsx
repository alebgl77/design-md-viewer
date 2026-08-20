import React, { useState } from 'react';
import { Layers, Sun, Moon } from 'lucide-react';
import { clsx } from 'clsx';
import { ShadowToken } from '../../schema/designSystem';
import { CopyButton } from '../../components/common/CopyButton';
import { ProvenancePopover } from '../../components/common/ProvenancePopover';
import { Badge } from '../../components/common/Badge';

interface ShadowsViewProps {
  shadows: ShadowToken[];
  onNavigateToSource?: (lineNumber?: number) => void;
}

/**
 * The elevation preview is a STAGE for parsed data, not app chrome. The whole
 * point of the Dark/Light switch is to judge one parsed box-shadow against two
 * FIXED grounds, whichever theme the product itself is wearing - so these stay
 * literal values in inline styles, exactly like the swatches in ColorView.
 * Driving them from the theme tokens would make both canvases identical and
 * delete the feature.
 */
const PREVIEW_CANVAS = {
  dark: {
    canvas: '#0a0f0c',
    canvasBorder: '#1f2d25',
    card: '#141d18',
    cardBorder: '#2d4034',
    text: '#e4ebe7',
  },
  light: {
    canvas: '#e3eae6',
    canvasBorder: '#d3ded8',
    card: '#ffffff',
    cardBorder: '#d3ded8',
    text: '#0c1512',
  },
} as const;

export const ShadowsView: React.FC<ShadowsViewProps> = ({ shadows, onNavigateToSource }) => {
  const [backdropTheme, setBackdropTheme] = useState<'dark' | 'light'>('dark');
  const canvas = PREVIEW_CANVAS[backdropTheme];

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
            <Layers className="w-5 h-5 text-accent" />
            Shadows &amp; Elevation
          </h1>
          <p className="text-xs text-content-secondary mt-0.5">
            {shadows.length} elevation levels visualized with real CSS box-shadows.
          </p>
        </div>

        {/* Backdrop Switcher */}
        <div className="flex items-center bg-surface-raised border border-line rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setBackdropTheme('dark')}
            aria-pressed={backdropTheme === 'dark'}
            className={tabClass(backdropTheme === 'dark')}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark Canvas</span>
          </button>
          <button
            type="button"
            onClick={() => setBackdropTheme('light')}
            aria-pressed={backdropTheme === 'light'}
            className={tabClass(backdropTheme === 'light')}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light Canvas</span>
          </button>
        </div>
      </div>

      {/* Grid of Elevation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {shadows.map(token => {
          const cssVar = `--shadow-${token.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}: ${token.value};`;

          return (
            <div
              key={token.id}
              className="p-5 rounded-lg bg-surface-raised/60 border border-line-subtle hover:border-line flex flex-col justify-between gap-5 shadow-deep transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-content-primary">{token.name}</span>
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

              {/* Real Shadow Canvas Preview - fixed grounds, see PREVIEW_CANVAS */}
              <div
                className="h-40 w-full rounded-md flex items-center justify-center p-6 transition-colors border"
                style={{ backgroundColor: canvas.canvas, borderColor: canvas.canvasBorder }}
              >
                <div
                  className="w-3/4 py-4 px-6 rounded-md flex flex-col items-center justify-center border transition-all"
                  style={{
                    // Parsed document value: the shadow IS the token.
                    boxShadow: token.value,
                    backgroundColor: canvas.card,
                    borderColor: canvas.cardBorder,
                    color: canvas.text,
                  }}
                >
                  <span className="font-bold text-xs">{token.name}</span>
                  <span className="text-[10px] opacity-70">Elevated Surface</span>
                </div>
              </div>

              {/* Code snippet */}
              <div className="p-2.5 rounded-sm bg-surface-inset border border-line-subtle font-mono text-[11px] text-content-secondary overflow-x-auto whitespace-pre">
                {token.value}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-line-subtle">
                <span className="text-xs text-content-secondary">{token.role || 'Elevation'}</span>
                <CopyButton text={cssVar} label="Copy CSS" variant="secondary" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
