import React from 'react';
import {
  Sparkles,
  Palette,
  Type,
  Ruler,
  Maximize2,
  Component,
  ShieldCheck,
  ArrowRight,
  Quote,
  CheckCircle2,
} from 'lucide-react';
import { DesignSystem } from '../../schema/designSystem';
import { Badge } from '../../components/common/Badge';

interface OverviewViewProps {
  system: DesignSystem;
  onNavigate: (category: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ system, onNavigate }) => {
  const { overview } = system;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero / Visual Fingerprint Banner */}
      <div className="relative overflow-hidden rounded-[24px] bg-[#0e1611] border border-[#1b2b21] p-6 sm:p-8 shadow-[0_0_0_1px_rgba(52,211,153,0.15),0_10px_30px_-22px_rgba(0,0,0,0.8)]">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="brand" size="md">
              <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
              Visual Fingerprint
            </Badge>
            {overview.visualTone && (
              <Badge variant="neutral" size="md">
                Tone: {overview.visualTone}
              </Badge>
            )}
            {system.metadata.isAiEnriched && (
              <Badge variant="inferred" size="md">
                AI Enriched
              </Badge>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-3 font-heading">
            {overview.name || 'Design System'}
          </h1>

          <p className="text-[#cbd5e1] text-sm sm:text-base max-w-3xl leading-relaxed">
            {overview.description}
          </p>

          {/* Color Ribbon Fingerprint */}
          {overview.primaryColors.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[#1b2b21]">
              <div className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-3 flex items-center justify-between font-heading">
                <span>Core Color DNA</span>
                <button
                  onClick={() => onNavigate('Colors')}
                  className="text-[#34d399] hover:text-[#10b981] text-xs font-bold flex items-center gap-1"
                >
                  View all {system.colors.length} colors <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
                {overview.primaryColors.map((color) => (
                  <div
                    key={color.id}
                    className="group relative flex flex-col rounded-[16px] overflow-hidden bg-[#0b0f0c] border border-[#1b2b21] transition-transform hover:-translate-y-0.5"
                  >
                    <div
                      className="h-14 w-full transition-opacity group-hover:opacity-90 shadow-inner"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="p-2.5 text-left">
                      <div className="font-bold text-xs text-white truncate font-heading">{color.name}</div>
                      <div className="font-mono text-[10px] text-[#94a3b8]">{color.hex}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {system.colors.length > 0 && (
          <button
            onClick={() => onNavigate('Colors')}
            className="p-5 rounded-[22px] bg-[#0e1611] hover:bg-[#111a14] border border-[#1b2b21] hover:border-[#10b981]/40 text-left transition-all group shadow-sm"
          >
            <Palette className="w-5 h-5 text-[#10b981] mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-extrabold text-white font-heading">{system.colors.length}</div>
            <div className="text-xs text-[#94a3b8]">Color Swatches</div>
          </button>
        )}

        {system.typography.length > 0 && (
          <button
            onClick={() => onNavigate('Typography')}
            className="p-5 rounded-[22px] bg-[#0e1611] hover:bg-[#111a14] border border-[#1b2b21] hover:border-[#10b981]/40 text-left transition-all group shadow-sm"
          >
            <Type className="w-5 h-5 text-[#34d399] mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-extrabold text-white font-heading">{system.typography.length}</div>
            <div className="text-xs text-[#94a3b8]">Type Scales</div>
          </button>
        )}

        {system.spacing.length > 0 && (
          <button
            onClick={() => onNavigate('Spacing')}
            className="p-5 rounded-[22px] bg-[#0e1611] hover:bg-[#111a14] border border-[#1b2b21] hover:border-[#10b981]/40 text-left transition-all group shadow-sm"
          >
            <Ruler className="w-5 h-5 text-[#6ee7b7] mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-extrabold text-white font-heading">{system.spacing.length}</div>
            <div className="text-xs text-[#94a3b8]">Spacing Units</div>
          </button>
        )}

        {system.radii.length > 0 && (
          <button
            onClick={() => onNavigate('Radius')}
            className="p-5 rounded-[22px] bg-[#0e1611] hover:bg-[#111a14] border border-[#1b2b21] hover:border-[#10b981]/40 text-left transition-all group shadow-sm"
          >
            <Maximize2 className="w-5 h-5 text-[#10b981] mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-extrabold text-white font-heading">{system.radii.length}</div>
            <div className="text-xs text-[#94a3b8]">Corner Radii</div>
          </button>
        )}

        {system.components.length > 0 && (
          <button
            onClick={() => onNavigate('Components')}
            className="p-5 rounded-[22px] bg-[#0e1611] hover:bg-[#111a14] border border-[#1b2b21] hover:border-[#1d4ed8]/40 text-left transition-all group shadow-sm"
          >
            <Component className="w-5 h-5 text-[#93c5fd] mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-extrabold text-white font-heading">{system.components.length}</div>
            <div className="text-xs text-[#94a3b8]">UI Components</div>
          </button>
        )}

        {system.accessibility.length > 0 && (
          <button
            onClick={() => onNavigate('Accessibility')}
            className="p-5 rounded-[22px] bg-[#0e1611] hover:bg-[#111a14] border border-[#1b2b21] hover:border-[#10b981]/40 text-left transition-all group shadow-sm"
          >
            <ShieldCheck className="w-5 h-5 text-[#34d399] mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-extrabold text-white font-heading">{system.accessibility.length}</div>
            <div className="text-xs text-[#94a3b8]">A11y Guidelines</div>
          </button>
        )}
      </div>

      {/* Typography Specimen Preview */}
      {overview.typographySample && (
        <div className="p-6 rounded-[24px] bg-[#0e1611] border border-[#1b2b21]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] font-heading">
              Primary Typography Specimen
            </span>
            <button
              onClick={() => onNavigate('Typography')}
              className="text-xs text-[#34d399] hover:text-[#10b981] font-bold flex items-center gap-1"
            >
              Explore Typography <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-6 rounded-[20px] bg-[#0b0f0c] border border-[#1b2b21]">
            <div
              className="text-white mb-2 truncate font-heading"
              style={{
                fontFamily: overview.typographySample.fontFamily,
                fontSize: `${Math.min(overview.typographySample.fontSizePx || 36, 44)}px`,
                fontWeight: overview.typographySample.fontWeight || 800,
                lineHeight: overview.typographySample.lineHeight || 1.1,
                letterSpacing: '-0.03em',
              }}
            >
              Au-delà de l'automatisation. L'IA comme moteur de votre stratégie B2B.
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#94a3b8] font-mono">
              <span>Font: {overview.typographySample.fontFamily}</span>
              <span>•</span>
              <span>Size: {overview.typographySample.fontSize}</span>
              <span>•</span>
              <span>Weight: {overview.typographySample.fontWeight}</span>
            </div>
          </div>
        </div>
      )}

      {/* Philosophy & Principles */}
      {(overview.philosophy || overview.principles.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {overview.philosophy && (
            <div className="p-6 rounded-[24px] bg-[#0e1611] border border-[#1b2b21] flex flex-col">
              <div className="flex items-center gap-2 text-[#34d399] font-bold text-xs uppercase tracking-wider mb-3 font-heading">
                <Quote className="w-4 h-4 text-[#10b981]" />
                <span>Visual Atmosphere & Direction</span>
              </div>
              <p className="text-[#cbd5e1] text-sm leading-relaxed italic">
                "{overview.philosophy}"
              </p>
            </div>
          )}

          {overview.principles.length > 0 && (
            <div className="p-6 rounded-[24px] bg-[#0e1611] border border-[#1b2b21] flex flex-col">
              <div className="text-[#34d399] font-bold text-xs uppercase tracking-wider mb-3 font-heading">
                Core Rules & Principles
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#cbd5e1]">
                {overview.principles.map((principle, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                    <span>{principle}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
