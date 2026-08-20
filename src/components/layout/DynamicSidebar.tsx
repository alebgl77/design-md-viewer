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
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-surface-inset/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/*
        `invisible` when closed, not just translated off-screen: a panel parked
        outside the viewport still holds every one of its buttons in the tab
        order, so keyboard users on mobile used to tab through fourteen
        invisible categories. `visibility` is transitionable and stays `visible`
        for the whole duration when moving to hidden, so the slide-out is
        preserved; `md:visible` restores the always-on desktop rail.
      */}
      <aside
        id="category-sidebar"
        aria-label="Detected specification categories"
        className={clsx(
          'w-64 shrink-0 z-40 flex flex-col border-r border-line bg-surface-raised',
          'fixed inset-y-0 left-0 pt-16 md:pt-0 md:static md:translate-x-0 md:visible',
          'transition-[transform,visibility] duration-200 ease-in-out',
          isOpenMobile ? 'translate-x-0 visible' : '-translate-x-full invisible'
        )}
      >
        <div className="p-4 border-b border-line-subtle flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-content-secondary font-heading">
            Detected Specifications
          </span>
          <span className="text-[11px] font-mono text-content-muted">
            {categories.length - 2} categories
          </span>
        </div>

        <nav aria-label="Design system categories" className="flex-1 overflow-y-auto p-3 space-y-1">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category] || Tag;
            const count = counts[category];
            const isActive = activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  onSelectCategory(category);
                  onCloseMobile?.();
                }}
                className={clsx(
                  'w-full flex items-center justify-between px-3.5 py-2.5 rounded-md border text-xs font-semibold transition-colors group',
                  isActive
                    ? 'bg-accent/15 border-accent/40 text-content-primary font-bold'
                    : 'border-transparent text-content-secondary hover:text-content-primary hover:bg-surface-overlay'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={clsx(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-accent' : 'text-content-muted group-hover:text-content-secondary'
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
                          ? 'bg-accent text-accent-contrast'
                          : 'bg-surface-inset text-content-secondary'
                      )}
                    >
                      {count}
                    </span>
                  )}
                  {category === 'Audit' && (
                    <span className="px-2 py-0.5 rounded-sm border border-line-subtle bg-surface-inset text-[10px] font-semibold text-content-secondary">
                      Lint
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3 h-3 text-accent" aria-hidden="true" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/*
          Footer. What stood here was a pulsing dot next to "ia-b2b.fr Ready":
          leftover branding from a scraped sample document, a status indicator
          wired to no status, and an infinite animation. Replaced with the one
          claim about this app that is actually verifiable from its own source.
        */}
        <div className="p-4 border-t border-line-subtle">
          <p className="text-[11px] leading-relaxed text-content-muted font-sans">
            <span className="font-semibold text-content-secondary">Local engine.</span> This document
            is parsed in your browser and never uploaded.
          </p>
        </div>
      </aside>
    </>
  );
};
