import React, { useMemo } from 'react';
import { clsx } from 'clsx';
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
  Radar,
} from 'lucide-react';
import { DesignSystem } from '../../schema/designSystem';
import { Badge } from '../../components/common/Badge';
import { RadarChart } from '../../components/common/RadarChart';
import { buildSystemProfile, describeProfile } from './systemProfile';

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

  // The profile runs the health audit, which is O(n²) over the palette. Once per system, not
  // once per render.
  const profile = useMemo(() => buildSystemProfile(system), [system]);
  // Below a triangle there is no shape to read, so the readings are listed instead of plotted.
  const canPlotProfile = profile.axes.length >= 3;

  const metrics: MetricEntry[] = [
    { category: 'Colors', count: system.colors.length, label: 'Color Swatches', icon: Palette },
    { category: 'Typography', count: system.typography.length, label: 'Type Scales', icon: Type },
    { category: 'Spacing', count: system.spacing.length, label: 'Spacing Units', icon: Ruler },
    { category: 'Radius', count: system.radii.length, label: 'Corner Radii', icon: Maximize2 },
    { category: 'Components', count: system.components.length, label: 'UI Components', icon: Component },
    {
      category: 'Accessibility',
      count: system.accessibility.length,
      label: 'A11y Guidelines',
      icon: ShieldCheck,
    },
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
                {overview.primaryColors.map(color => (
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
          .filter(metric => metric.count > 0)
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

      {/* Design System Profile - the counts above say how much there is, this says how well it
          holds together. One entity, up to six axes, one unit: a percentage where higher is better. */}
      {profile.axes.length > 0 && (
        <section className="p-6 rounded-lg bg-surface-raised border border-line">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-content-secondary font-heading">
              <Radar className="w-4 h-4 text-accent" />
              <span>Design System Profile</span>
            </h2>
            {overview.categoriesDetected.includes('Audit') && (
              <button
                type="button"
                onClick={() => onNavigate('Audit')}
                className="text-xs text-accent hover:text-accent-hover font-bold flex items-center gap-1 rounded-sm"
              >
                Open the full audit <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <p className="text-xs text-content-muted leading-relaxed max-w-2xl mb-5">
            How completely this document specifies itself, measured only against what was parsed out of it.
            Every axis is a percentage and higher is better on all of them, which is what makes them readable
            on one shape.
          </p>

          <div className={clsx('grid gap-6 items-center', canPlotProfile && 'lg:grid-cols-2')}>
            {canPlotProfile && (
              /* Hidden below `sm`: at phone widths the polygon and its labels stop being legible,
                 and the table below carries the same numbers. */
              <RadarChart
                axes={profile.axes}
                ariaLabel={describeProfile(profile, overview.name || 'this design system')}
                className="hidden sm:block w-full max-w-[420px] mx-auto"
              />
            )}

            {/* The numbers as text, not only as geometry. */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">
                  Design system profile: every dimension as a percentage, higher is better, with the counts it
                  was derived from.
                </caption>
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-content-muted">
                    <th scope="col" className="py-2 pr-3 font-bold">
                      Dimension
                    </th>
                    <th scope="col" className="py-2 pr-3 font-bold text-right">
                      Score
                    </th>
                    <th scope="col" className="py-2 font-bold">
                      Measured from
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {profile.axes.map(axis => (
                    <tr key={axis.id} className="border-t border-line-subtle align-top">
                      <th scope="row" className="py-2 pr-3 font-semibold text-content-primary">
                        {axis.label}
                      </th>
                      <td className="py-2 pr-3 text-right font-mono tabular-nums text-content-primary">
                        {axis.percent}%
                      </td>
                      <td className="py-2 text-content-secondary">{axis.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {!canPlotProfile && (
            <p className="mt-4 text-[11px] text-content-muted">
              A radar needs at least three comparable dimensions. This document supports{' '}
              <span className="font-mono tabular-nums">{profile.axes.length}</span>, so the readings are
              listed rather than plotted.
            </p>
          )}

          {profile.omittedLabels.length > 0 && (
            <p className="mt-4 text-[11px] text-content-muted">
              Not measured: {profile.omittedLabels.join(', ')}. The parse holds nothing to score{' '}
              {profile.omittedLabels.length === 1 ? 'it' : 'them'} against - either the document does not
              specify {profile.omittedLabels.length === 1 ? 'it' : 'them'} or the extractor did not record{' '}
              {profile.omittedLabels.length === 1 ? 'it' : 'them'} - and a missing measurement is not a zero.
            </p>
          )}
        </section>
      )}

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
              <p className="text-content-secondary text-sm leading-relaxed italic">"{overview.philosophy}"</p>
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
