import React, { useState } from 'react';
import { Play, RotateCcw, Activity } from 'lucide-react';
import { MotionToken } from '../../schema/designSystem';
import { CopyButton } from '../../components/common/CopyButton';
import { ProvenancePopover } from '../../components/common/ProvenancePopover';

interface MotionViewProps {
  motion: MotionToken[];
  onNavigateToSource?: (lineNumber?: number) => void;
}

export const MotionView: React.FC<MotionViewProps> = ({ motion, onNavigateToSource }) => {
  const [activeAnim, setActiveAnim] = useState<string | null>(null);

  const triggerAnimation = (id: string) => {
    setActiveAnim(null);
    setTimeout(() => setActiveAnim(id), 10);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-4 border-b border-line">
        <h1 className="text-xl font-bold text-content-primary flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          Motion &amp; Transitions
        </h1>
        <p className="text-xs text-content-muted mt-0.5">
          <span className="tabular-nums">{motion.length}</span> animation and transition tokens with
          interactive physics triggers.
        </p>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {motion.map(token => {
          const isTriggered = activeAnim === token.id;
          const durationStr = token.duration || (token.durationMs ? `${token.durationMs}ms` : '200ms');
          const easingStr = token.easing || 'ease-in-out';
          const cssVar = `--transition-${token.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}: all ${durationStr} ${easingStr};`;

          return (
            <li
              key={token.id}
              className="p-5 rounded-lg bg-surface-raised border border-line hover:border-line-strong transition-colors flex flex-col justify-between gap-5 shadow-deep"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-bold text-sm text-content-primary truncate">{token.name}</h2>
                  <div className="text-xs text-content-muted font-mono tabular-nums">
                    {durationStr} • {easingStr}
                  </div>
                </div>
                <ProvenancePopover
                  provenance={token.provenance}
                  confidence={token.confidence}
                  itemName={token.name}
                  onNavigateToSource={onNavigateToSource}
                />
              </div>

              {/* Interactive Motion Playground Canvas */}
              <div className="h-32 w-full p-4 bg-surface-inset rounded-md border border-line-subtle flex flex-col justify-between overflow-hidden relative">
                <div className="w-full flex justify-between items-center text-[10px] text-content-muted font-mono tabular-nums">
                  <span>0ms</span>
                  <span>{durationStr}</span>
                </div>

                {/* Animated Object.
                    The duration and easing below are PARSED document values, so they stay
                    inline styles — the preview has to move the way the spec says it moves. */}
                <div className="w-full relative h-10 flex items-center">
                  <div
                    className="w-10 h-10 rounded-md bg-accent text-accent-contrast flex items-center justify-center shadow-deep"
                    style={{
                      transform: isTriggered
                        ? 'translateX(calc(100% + 120px)) scale(1.1)'
                        : 'translateX(0px) scale(1)',
                      transitionProperty: 'all',
                      transitionDuration: durationStr,
                      transitionTimingFunction: easingStr,
                    }}
                  >
                    <Play className="w-4 h-4" aria-hidden="true" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => triggerAnimation(token.id)}
                  className="w-full py-1.5 rounded-md bg-surface-raised hover:bg-surface-overlay border border-line text-xs font-semibold text-accent flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  <span>Replay Transition</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-line-subtle">
                <span className="text-xs text-content-secondary truncate">{token.usage || 'Transition'}</span>
                <CopyButton text={cssVar} label="Copy CSS" variant="secondary" />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
