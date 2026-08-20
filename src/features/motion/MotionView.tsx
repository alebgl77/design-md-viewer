import React, { useState } from 'react';
import { Play, RotateCcw, Activity } from 'lucide-react';
import { MotionToken } from '../../schema/designSystem';
import { CopyButton } from '../../components/common/CopyButton';
import { ProvenancePopover } from '../../components/common/ProvenancePopover';
import { Badge } from '../../components/common/Badge';

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
      <div className="pb-4 border-b border-[#1b2b21]">
        <h2 className="text-xl font-bold text-[#cbd5e1] flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#93c5fd]" />
          Motion & Transitions
        </h2>
        <p className="text-xs text-[#94a3b8] mt-0.5">
          {motion.length} animation and transition tokens with interactive physics triggers.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {motion.map((token) => {
          const isTriggered = activeAnim === token.id;
          const durationStr = token.duration || (token.durationMs ? `${token.durationMs}ms` : '200ms');
          const easingStr = token.easing || 'ease-in-out';
          const cssVar = `--transition-${token.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}: all ${durationStr} ${easingStr};`;

          return (
            <div
              key={token.id}
              className="p-5 rounded-2xl bg-[#0e1611]/60 border border-[#1b2b21] hover:border-[#1b2b21] flex flex-col justify-between gap-5 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[#cbd5e1]">{token.name}</div>
                  <div className="text-xs text-[#94a3b8] font-mono">{durationStr} • {easingStr}</div>
                </div>
                <ProvenancePopover
                  provenance={token.provenance}
                  confidence={token.confidence}
                  itemName={token.name}
                  onNavigateToSource={onNavigateToSource}
                />
              </div>

              {/* Interactive Motion Playground Canvas */}
              <div className="h-32 w-full p-4 bg-[#0b0f0c] rounded-xl border border-[#1b2b21]/80 flex flex-col justify-between overflow-hidden relative">
                <div className="w-full flex justify-between items-center text-[10px] text-[#64748b] font-mono">
                  <span>0ms</span>
                  <span>{durationStr}</span>
                </div>

                {/* Animated Object */}
                <div className="w-full relative h-10 flex items-center">
                  <div
                    className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg"
                    style={{
                      transform: isTriggered ? 'translateX(calc(100% + 120px)) scale(1.1)' : 'translateX(0px) scale(1)',
                      transitionProperty: 'all',
                      transitionDuration: durationStr,
                      transitionTimingFunction: easingStr,
                    }}
                  >
                    <Play className="w-4 h-4" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => triggerAnimation(token.id)}
                  className="w-full py-1.5 rounded-lg bg-[#0e1611] hover:bg-[#15221a] border border-[#1b2b21] text-xs font-semibold text-[#93c5fd] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Replay Transition</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1b2b21]/80">
                <span className="text-xs text-[#94a3b8]">{token.usage || 'Transition'}</span>
                <CopyButton text={cssVar} label="Copy CSS" variant="secondary" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
