import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Info, Sparkles, CheckCircle2, Copy, GitMerge, Check } from 'lucide-react';
import { DesignSystem } from '../../schema/designSystem';
import { auditDesignSystemHealth, AuditIssue } from '../../normalizers/healthAuditor';
import { Badge } from '../../components/common/Badge';
import { CopyButton } from '../../components/common/CopyButton';

interface HealthAuditViewProps {
  system: DesignSystem;
  onNavigateToCategory?: (category: string) => void;
}

export const HealthAuditView: React.FC<HealthAuditViewProps> = ({ system, onNavigateToCategory }) => {
  const report = auditDesignSystemHealth(system);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filteredIssues = report.issues.filter(issue => {
    if (selectedFilter === 'all') return true;
    return issue.category === selectedFilter || issue.type === selectedFilter;
  });

  const gradeColors = {
    'A+': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    'A': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    'B': 'text-[#34d399] bg-[#10b981]/10 border-[#10b981]/30',
    'C': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    'D': 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-[#1b2b21]">
        <h2 className="text-xl font-bold text-[#cbd5e1] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#34d399]" />
          Design System Health & Linter Audit
        </h2>
        <p className="text-xs text-[#94a3b8] mt-0.5">
          Automated linting for WCAG accessibility, duplicate token consolidation, grid compliance, and completeness.
        </p>
      </div>

      {/* Health Score Banner */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-2xl bg-gradient-to-br from-[#0b0f0c] via-[#0e1611] to-indigo-950/30 border border-[#1b2b21] shadow-xl">
        {/* Score Dial */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-[#1b2b21]/80">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-2">
            System Health Score
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight">
              {report.score}
            </span>
            <span className="text-sm text-[#64748b] font-mono">/ 100</span>
          </div>

          <div className={`px-3 py-1 rounded-full border text-xs font-bold ${gradeColors[report.grade]}`}>
            Grade {report.grade} • {report.grade.startsWith('A') ? 'Production Ready' : 'Optimization Recommended'}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-4">
          <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
            {report.summary}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-black/80 border border-[#1b2b21]">
              <div className="text-[11px] text-[#94a3b8] mb-0.5">Passed Checks</div>
              <div className="text-lg font-bold text-emerald-400">{report.metrics.passedChecks}</div>
            </div>

            <div className="p-3 rounded-xl bg-black/80 border border-[#1b2b21]">
              <div className="text-[11px] text-[#94a3b8] mb-0.5">Warnings</div>
              <div className="text-lg font-bold text-amber-400">{report.metrics.warningCount}</div>
            </div>

            <div className="p-3 rounded-xl bg-black/80 border border-[#1b2b21]">
              <div className="text-[11px] text-[#94a3b8] mb-0.5">Near-Duplicates</div>
              <div className="text-lg font-bold text-[#93c5fd]">{report.metrics.nearDuplicatesFound}</div>
            </div>

            <div className="p-3 rounded-xl bg-black/80 border border-[#1b2b21]">
              <div className="text-[11px] text-[#94a3b8] mb-0.5">Grid Compliance</div>
              <div className="text-lg font-bold text-sky-400">{report.metrics.gridCompliancePercent}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
            selectedFilter === 'all' ? 'bg-[#0c6e4e] text-white' : 'bg-[#0e1611]/60 border border-[#1b2b21] text-[#94a3b8] hover:text-[#cbd5e1]'
          }`}
        >
          All Issues ({report.issues.length})
        </button>
        <button
          onClick={() => setSelectedFilter('consistency')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
            selectedFilter === 'consistency' ? 'bg-[#0c6e4e] text-white' : 'bg-[#0e1611]/60 border border-[#1b2b21] text-[#94a3b8] hover:text-[#cbd5e1]'
          }`}
        >
          Duplicate Tokens
        </button>
        <button
          onClick={() => setSelectedFilter('accessibility')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
            selectedFilter === 'accessibility' ? 'bg-[#0c6e4e] text-white' : 'bg-[#0e1611]/60 border border-[#1b2b21] text-[#94a3b8] hover:text-[#cbd5e1]'
          }`}
        >
          Accessibility
        </button>
        <button
          onClick={() => setSelectedFilter('grid-rhythm')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
            selectedFilter === 'grid-rhythm' ? 'bg-[#0c6e4e] text-white' : 'bg-[#0e1611]/60 border border-[#1b2b21] text-[#94a3b8] hover:text-[#cbd5e1]'
          }`}
        >
          Grid Conformance
        </button>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#0e1611]/40 border border-[#1b2b21] text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <div className="font-bold text-sm text-[#cbd5e1]">Zero issues detected in this category!</div>
          <p className="text-xs text-[#94a3b8]">Your design tokens adhere strictly to system conventions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIssues.map((issue) => {
            const Icon = issue.type === 'error' ? AlertCircle : issue.type === 'warning' ? AlertTriangle : Info;
            const badgeVariant = issue.type === 'error' ? 'error' : issue.type === 'warning' ? 'warning' : 'neutral';

            return (
              <div
                key={issue.id}
                className="p-4 rounded-2xl bg-[#0e1611]/60 border border-[#1b2b21] hover:border-[#1b2b21] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    issue.type === 'error' ? 'bg-rose-500/10 text-rose-400' : issue.type === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-[#10b981]/10 text-[#34d399]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-[#cbd5e1]">{issue.title}</span>
                      <Badge variant={badgeVariant} size="sm">
                        {issue.category}
                      </Badge>
                      <span className="text-[10px] font-mono text-[#64748b]">-{issue.impactScore} pts</span>
                    </div>

                    <p className="text-xs text-[#cbd5e1] leading-relaxed">
                      {issue.description}
                    </p>

                    <div className="text-[11px] text-[#34d399]/90 font-medium pt-1 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#34d399] shrink-0" />
                      <span><strong>Fix suggestion:</strong> {issue.recommendation}</span>
                    </div>
                  </div>
                </div>

                {issue.itemRef && (
                  <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
                    <CopyButton text={issue.recommendation} label="Copy Fix" variant="secondary" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
