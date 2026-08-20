import React, { useMemo, useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Info, Sparkles, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { DesignSystem } from '../../schema/designSystem';
import { auditDesignSystemHealth, AuditIssue } from '../../normalizers/healthAuditor';
import { Badge } from '../../components/common/Badge';
import { CopyButton } from '../../components/common/CopyButton';

interface HealthAuditViewProps {
  system: DesignSystem;
  onNavigateToCategory?: (category: string) => void;
}

/** Severity is never carried by colour alone: every tone ships with its own icon and its own word. */
const SEVERITY_PRESENTATION: Record<
  AuditIssue['type'],
  { label: string; icon: typeof AlertCircle; tone: string; badge: 'error' | 'warning' | 'neutral' }
> = {
  error: { label: 'Error', icon: AlertCircle, tone: 'bg-status-danger/15 text-status-danger', badge: 'error' },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    tone: 'bg-status-warning/15 text-status-warning',
    badge: 'warning',
  },
  info: { label: 'Info', icon: Info, tone: 'bg-accent/15 text-accent', badge: 'neutral' },
};

const GRADE_STYLES: Record<string, string> = {
  'A+': 'text-status-success bg-status-success/10 border-status-success/30',
  A: 'text-status-success bg-status-success/10 border-status-success/30',
  B: 'text-accent bg-accent/10 border-accent/30',
  C: 'text-status-warning bg-status-warning/10 border-status-warning/30',
  D: 'text-status-danger bg-status-danger/10 border-status-danger/30',
};

export const HealthAuditView: React.FC<HealthAuditViewProps> = ({ system }) => {
  // The auditor runs an O(n^2) colour-pair scan. Bare in the render body it re-ran on
  // every filter-chip click; it must only re-run when the parsed system itself changes.
  const report = useMemo(() => auditDesignSystemHealth(system), [system]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filteredIssues = useMemo(
    () =>
      report.issues.filter((issue) => {
        if (selectedFilter === 'all') return true;
        return issue.category === selectedFilter || issue.type === selectedFilter;
      }),
    [report.issues, selectedFilter]
  );

  const filters: { id: string; label: string }[] = [
    { id: 'all', label: `All Issues (${report.issues.length})` },
    { id: 'consistency', label: 'Duplicate Tokens' },
    { id: 'accessibility', label: 'Accessibility' },
    { id: 'grid-rhythm', label: 'Grid Conformance' },
  ];

  const metrics: { label: string; value: string; tone: string }[] = [
    { label: 'Passed Checks', value: `${report.metrics.passedChecks}`, tone: 'text-status-success' },
    { label: 'Warnings', value: `${report.metrics.warningCount}`, tone: 'text-status-warning' },
    { label: 'Near-Duplicates', value: `${report.metrics.nearDuplicatesFound}`, tone: 'text-content-primary' },
    { label: 'Grid Compliance', value: `${report.metrics.gridCompliancePercent}%`, tone: 'text-accent' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-line">
        <h1 className="text-xl font-bold text-content-primary flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent" />
          Design System Health &amp; Linter Audit
        </h1>
        <p className="text-xs text-content-muted mt-0.5">
          Automated linting for WCAG accessibility, duplicate token consolidation, grid compliance, and completeness.
        </p>
      </div>

      {/* Health Score Banner */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-lg bg-surface-raised border border-line shadow-deep">
        {/* Score Dial */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-line-subtle">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-content-secondary mb-2">
            System Health Score
          </h2>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-5xl sm:text-6xl font-extrabold text-content-primary tracking-tight tabular-nums">
              {report.score}
            </span>
            <span className="text-sm text-content-muted font-mono tabular-nums">/ 100</span>
          </div>

          <div
            className={clsx(
              'px-3 py-1 rounded-sm border text-xs font-bold',
              GRADE_STYLES[report.grade] ?? GRADE_STYLES.B
            )}
          >
            Grade {report.grade} • {report.grade.startsWith('A') ? 'Production Ready' : 'Optimization Recommended'}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-4">
          <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
            {report.summary}
          </p>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="p-3 rounded-md bg-surface-inset border border-line-subtle">
                <dt className="text-[11px] text-content-muted mb-0.5">{metric.label}</dt>
                <dd className={clsx('text-lg font-bold tabular-nums', metric.tone)}>{metric.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {filters.map((filter) => {
          const isActive = selectedFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setSelectedFilter(filter.id)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 border tabular-nums',
                isActive
                  ? 'bg-accent text-accent-contrast border-accent'
                  : 'bg-surface-raised border-line text-content-secondary hover:text-content-primary hover:border-line-strong'
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="p-8 rounded-lg bg-surface-raised border border-line text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-status-success mx-auto" />
          <div className="font-bold text-sm text-content-primary">Zero issues detected in this category!</div>
          <p className="text-xs text-content-muted">Your design tokens adhere strictly to system conventions.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredIssues.map((issue) => {
            const severity = SEVERITY_PRESENTATION[issue.type];
            const Icon = severity.icon;

            return (
              <li
                key={issue.id}
                className="p-4 rounded-lg bg-surface-raised border border-line hover:border-line-strong transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-deep"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={clsx('p-2 rounded-md shrink-0 mt-0.5', severity.tone)}>
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-content-primary">{issue.title}</span>
                      <Badge variant={severity.badge} size="sm">
                        <Icon className="w-3 h-3" aria-hidden="true" />
                        {severity.label}
                      </Badge>
                      <Badge variant="neutral" size="sm">
                        {issue.category}
                      </Badge>
                      <span className="text-[10px] font-mono text-content-muted tabular-nums">
                        -{issue.impactScore} pts
                      </span>
                    </div>

                    <p className="text-xs text-content-secondary leading-relaxed">
                      {issue.description}
                    </p>

                    <div className="text-[11px] text-accent font-medium pt-1 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-accent shrink-0" aria-hidden="true" />
                      <span><strong>Fix suggestion:</strong> {issue.recommendation}</span>
                    </div>
                  </div>
                </div>

                {issue.itemRef && (
                  <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
                    <CopyButton text={issue.recommendation} label="Copy Fix" variant="secondary" />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
