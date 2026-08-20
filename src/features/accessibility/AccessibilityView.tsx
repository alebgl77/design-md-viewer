import React from 'react';
import { ShieldCheck, Eye, Keyboard, Touchpad, Zap, BadgeCheck } from 'lucide-react';
import { A11yRule } from '../../schema/designSystem';
import { ProvenancePopover } from '../../components/common/ProvenancePopover';
import { Badge } from '../../components/common/Badge';

interface AccessibilityViewProps {
  accessibility: A11yRule[];
  onNavigateToSource?: (lineNumber?: number) => void;
}

export const AccessibilityView: React.FC<AccessibilityViewProps> = ({
  accessibility,
  onNavigateToSource,
}) => {
  const getCategoryIcon = (cat: A11yRule['category']) => {
    switch (cat) {
      case 'contrast':
        return Eye;
      case 'keyboard':
        return Keyboard;
      case 'target-size':
        return Touchpad;
      case 'motion':
        return Zap;
      default:
        return ShieldCheck;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-4 border-b border-line">
        <h1 className="text-xl font-bold text-content-primary flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent" />
          Accessibility &amp; Compliance Guidelines
        </h1>
        <p className="text-xs text-content-muted mt-0.5">
          <span className="tabular-nums">{accessibility.length}</span> accessibility standards and WCAG
          guidelines extracted from specification.
        </p>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accessibility.map(rule => {
          const Icon = getCategoryIcon(rule.category);

          return (
            <li
              key={rule.id}
              className="p-5 rounded-lg bg-surface-raised border border-line hover:border-line-strong transition-colors flex flex-col justify-between gap-4 shadow-deep"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-md bg-accent/15 text-accent border border-accent/30 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-sm text-content-primary mb-0.5">{rule.title}</h2>
                    {/* Every conformance signal is spelled out in words as well as tinted: the
                        category name and the WCAG level are both text, never colour alone. */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="neutral" size="sm">
                        <Icon className="w-3 h-3" aria-hidden="true" />
                        {rule.category}
                      </Badge>
                      {rule.wcagLevel && (
                        <Badge variant="success" size="sm" title={`WCAG conformance level ${rule.wcagLevel}`}>
                          <BadgeCheck className="w-3 h-3" aria-hidden="true" />
                          WCAG {rule.wcagLevel}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <ProvenancePopover
                  provenance={rule.provenance}
                  confidence={rule.confidence}
                  itemName={rule.title}
                  onNavigateToSource={onNavigateToSource}
                />
              </div>

              <p className="text-xs text-content-secondary leading-relaxed bg-surface-inset p-3.5 rounded-md border border-line-subtle">
                {rule.description}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
