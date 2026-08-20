import React from 'react';
import { ShieldCheck, CheckCircle2, Eye, Keyboard, Touchpad, Zap } from 'lucide-react';
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
      case 'contrast': return Eye;
      case 'keyboard': return Keyboard;
      case 'target-size': return Touchpad;
      case 'motion': return Zap;
      default: return ShieldCheck;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-4 border-b border-[#1b2b21]">
        <h2 className="text-xl font-bold text-[#cbd5e1] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-400" />
          Accessibility & Compliance Guidelines
        </h2>
        <p className="text-xs text-[#94a3b8] mt-0.5">
          {accessibility.length} accessibility standards and WCAG guidelines extracted from specification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accessibility.map((rule) => {
          const Icon = getCategoryIcon(rule.category);

          return (
            <div
              key={rule.id}
              className="p-5 rounded-2xl bg-[#0e1611]/60 border border-[#1b2b21] hover:border-[#1b2b21] flex flex-col justify-between gap-4 shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#cbd5e1] mb-0.5">{rule.title}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral" size="sm">
                        {rule.category}
                      </Badge>
                      {rule.wcagLevel && (
                        <Badge variant="success" size="sm">
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

              <p className="text-xs text-[#cbd5e1] leading-relaxed bg-[#0b0f0c] p-3.5 rounded-xl border border-[#1b2b21]/80">
                {rule.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
