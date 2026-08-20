import React from 'react';
import {
  Sparkles,
  Palette,
  Type,
  Ruler,
  Maximize2,
  Layers,
  BoxSelect,
  Smartphone,
  Component,
  Play,
  ShieldCheck,
  Tag,
  FileCode,
  HeartPulse,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';

interface DynamicSidebarProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  counts: Record<string, number>;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Overview: Sparkles,
  Colors: Palette,
  Typography: Type,
  Spacing: Ruler,
  Radius: Maximize2,
  Shadows: Layers,
  Borders: BoxSelect,
  Breakpoints: Smartphone,
  Components: Component,
  Motion: Play,
  Accessibility: ShieldCheck,
  Tokens: Tag,
  Audit: HeartPulse,
  Source: FileCode,
};

export const DynamicSidebar: React.FC<DynamicSidebarProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  counts,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={clsx(
          'w-64 border-r border-[#1b2b21] bg-[#0b0f0c] flex flex-col shrink-0 z-40 transition-transform duration-200 ease-in-out',
          'fixed inset-y-0 left-0 pt-16 md:pt-0 md:static md:translate-x-0',
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 border-b border-[#1b2b21] flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] font-heading">
            Detected Specifications
          </span>
          <span className="text-[11px] font-mono text-[#64748b]">
            {categories.length - 2} categories
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category] || Tag;
            const count = counts[category];
            const isActive = activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => {
                  onSelectCategory(category);
                  onCloseMobile?.();
                }}
                className={clsx(
                  'w-full flex items-center justify-between px-3.5 py-2.5 rounded-[16px] text-xs font-semibold transition-all group',
                  isActive
                    ? 'bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/40 shadow-sm font-bold'
                    : 'text-[#94a3b8] hover:text-[#cbd5e1] hover:bg-[#0e1611] border border-transparent'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={clsx(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-[#10b981]' : 'text-[#64748b] group-hover:text-[#cbd5e1]'
                    )}
                  />
                  <span className="font-heading">{category === 'Audit' ? 'Health Audit' : category}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {typeof count === 'number' && count > 0 && category !== 'Overview' && category !== 'Source' && category !== 'Audit' && (
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold',
                        isActive
                          ? 'bg-[#10b981]/25 text-[#34d399]'
                          : 'bg-[#0e1611] text-[#64748b] group-hover:text-[#94a3b8]'
                      )}
                    >
                      {count}
                    </span>
                  )}
                  {category === 'Audit' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30">
                      Lint
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3 h-3 text-[#10b981]" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-[#1b2b21] text-[11px] text-[#64748b] flex items-center justify-between font-sans">
          <span>Local Engine</span>
          <span className="inline-flex items-center gap-1.5 text-[#34d399] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            ia-b2b.fr Ready
          </span>
        </div>
      </aside>
    </>
  );
};
