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

interface MetricEntry {
  category: string;
  count: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ system, onNavigate }) => {
  const { overview } = system;

  const metrics: MetricEntry[] = [
    { category: 'Colors', count: system.colors.length, label: 'Color Swatches', icon: Palette },
    { category: 'Typography', count: system.typography.length, label: 'Type Scales', icon: Type },
    { category: 'Spacing', count: system.spacing.length, label: 'Spacing Units', icon: Ruler },
    { category: 'Radius', count: system.radii.length, label: 'Corner Radii', icon: Maximize2 },
    { category: 'Components', count: system.components.length, label: 'UI Components', icon: Component },
    { category: 'Accessibility', count: system.accessibility.length, label: 'A11y Guidelines', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero / Visual Fingerprint Banner */}
      <section className="relative overflow-hidden rounded-lg bg-surface-raised border border-line p-6 sm:p-8 shadow-chromatic">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="brand" size="md">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
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

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-content-primary tracking-tight mb-3 font-heading">
            {overview.name || 'Design System'}
          </h1>

          <p className="text-content-secondary text-sm sm:text-base max-w-3xl leading-relaxed">
            {overview.description}
          </p>

          {/* Color Ribbon Fingerprint */}
          {overview.primaryColors.length > 0 && (
            <div className="mt-6 pt-6 border-t border-line-subtle">
              <div className="text-xs font-bold uppercase tracking-wider text-content-secondary mb-3 flex items-center justify-between font-heading">
                <h2 className="text-xs font-bold uppercase tracking-wider">Core Color DNA</h2>
                <button
                  type="button"
                  onClick={() => onNavigate('Colors')}
                  className="text-accent hover:text-accent-hover text-xs font-bold flex items-center gap-1 rounded-sm"
                >
                  View all <span className="tabular-nums">{system.colors.length}</span> colors{' '}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <ul className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
                {overview.primaryColors.map((color) => (
                  <li
                    key={color.id}
                    className="group relative flex flex-col rounded-lg overflow-hidden bg-surface-inset border border-line-subtle transition-transform hover:-translate-y-0.5"
                  >
                    {/* Parsed document value: rendered as data, never tokenised. */}
                    <div
                      className="h-14 w-full transition-opacity group-hover:opacity-90"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="p-2.5 text-left">
                      <div className="font-bold text-xs text-content-primary truncate font-heading">
                        {color.name}
                      </div>
                      <div className="font-mono text-[10px] text-content-muted">{color.hex}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics
          .filter((metric) => metric.count > 0)
          .map(({ category, count, label, icon: Icon }) => (
            <button
              key={category}
              type="button"
              onClick={() => onNavigate(category)}
              className="p-5 rounded-lg bg-surface-raised hover:bg-surface-overlay border border-line hover:border-accent/40 text-left transition-colors group shadow-deep"
            >
              <Icon className="w-5 h-5 text-accent mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-2xl font-extrabold text-content-primary font-heading tabular-nums">
                {count}
              </div>
              <div className="text-xs text-content-secondary">{label}</div>
            </button>
          ))}
      </div>

      {/* Typography Specimen Preview */}
      {overview.typographySample && (
        <section className="p-6 rounded-lg bg-surface-raised border border-line">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary font-heading">
              Primary Typography Specimen
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('Typography')}
              className="text-xs text-accent hover:text-accent-hover font-bold flex items-center gap-1 rounded-sm"
            >
              Explore Typography <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-6 rounded-lg bg-surface-inset border border-line-subtle">
            {/* Parsed document values: the specimen must render the extracted face, not ours. */}
            <div
              className="text-content-primary mb-2 truncate font-heading"
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
            <div className="flex flex-wrap items-center gap-3 text-xs text-content-muted font-mono">
              <span>Font: {overview.typographySample.fontFamily}</span>
              <span aria-hidden="true">•</span>
              <span>Size: {overview.typographySample.fontSize}</span>
              <span aria-hidden="true">•</span>
              <span>Weight: {overview.typographySample.fontWeight}</span>
            </div>
          </div>
        </section>
      )}

      {/* Philosophy & Principles */}
      {(overview.philosophy || overview.principles.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {overview.philosophy && (
            <section className="p-6 rounded-lg bg-surface-raised border border-line flex flex-col">
              <h2 className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-wider mb-3 font-heading">
                <Quote className="w-4 h-4 text-accent" />
                <span>Visual Atmosphere &amp; Direction</span>
              </h2>
              <p className="text-content-secondary text-sm leading-relaxed italic">
                "{overview.philosophy}"
              </p>
            </section>
          )}

          {overview.principles.length > 0 && (
            <section className="p-6 rounded-lg bg-surface-raised border border-line flex flex-col">
              <h2 className="text-accent font-bold text-xs uppercase tracking-wider mb-3 font-heading">
                Core Rules &amp; Principles
              </h2>
              <ul className="space-y-2.5 text-xs sm:text-sm text-content-secondary">
                {overview.principles.map((principle, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{principle}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
