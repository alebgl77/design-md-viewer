import React, { Suspense, lazy, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { DesignSystem } from './schema/designSystem';
import { parseDesignDocument } from './parsers/pipeline';
import { DropZone } from './components/common/DropZone';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppHeader } from './components/layout/AppHeader';
import { DynamicSidebar } from './components/layout/DynamicSidebar';
import { SearchModal } from './components/layout/SearchModal';
import { AiSettingsModal } from './components/layout/AiSettingsModal';
import { ExportModal } from './components/layout/ExportModal';
import { Menu, X } from 'lucide-react';

/*
  The fourteen feature views are code-split behind a single Suspense boundary.
  They were static imports, which meant every byte of every view — the audit
  engine, the source highlighter, all of it — had to arrive before the drop zone
  could even be shown, for a user who had not yet chosen a file. Only one view
  is ever mounted at a time, so each one is fetched the first time its category
  is opened.

  The `.then(m => ({ default: m.X }))` shape is what lets React.lazy consume a
  NAMED export: the view modules keep their existing public API untouched.
*/
const OverviewView = lazy(() =>
  import('./features/overview/OverviewView').then((m) => ({ default: m.OverviewView }))
);
const ColorView = lazy(() =>
  import('./features/colors/ColorView').then((m) => ({ default: m.ColorView }))
);
const TypographyView = lazy(() =>
  import('./features/typography/TypographyView').then((m) => ({ default: m.TypographyView }))
);
const SpacingView = lazy(() =>
  import('./features/spacing/SpacingView').then((m) => ({ default: m.SpacingView }))
);
const RadiusView = lazy(() =>
  import('./features/radius/RadiusView').then((m) => ({ default: m.RadiusView }))
);
const ShadowsView = lazy(() =>
  import('./features/shadows/ShadowsView').then((m) => ({ default: m.ShadowsView }))
);
const BordersView = lazy(() =>
  import('./features/borders/BordersView').then((m) => ({ default: m.BordersView }))
);
const BreakpointsView = lazy(() =>
  import('./features/breakpoints/BreakpointsView').then((m) => ({ default: m.BreakpointsView }))
);
const ComponentsView = lazy(() =>
  import('./features/components/ComponentsView').then((m) => ({ default: m.ComponentsView }))
);
const MotionView = lazy(() =>
  import('./features/motion/MotionView').then((m) => ({ default: m.MotionView }))
);
const AccessibilityView = lazy(() =>
  import('./features/accessibility/AccessibilityView').then((m) => ({ default: m.AccessibilityView }))
);
const TokensView = lazy(() =>
  import('./features/tokens/TokensView').then((m) => ({ default: m.TokensView }))
);
const HealthAuditView = lazy(() =>
  import('./features/audit/HealthAuditView').then((m) => ({ default: m.HealthAuditView }))
);
const SourceView = lazy(() =>
  import('./features/source/SourceView').then((m) => ({ default: m.SourceView }))
);

/**
 * Suspense fallback shaped like the views it stands in for — a title block, a
 * row of summary chips, then a card grid — so the layout does not jump when the
 * real content lands. A centred spinner would reserve none of that space.
 */
const ViewSkeleton: React.FC = () => (
  <div role="status" aria-live="polite" className="animate-pulse">
    <span className="sr-only">Loading view…</span>

    <div aria-hidden="true" className="space-y-6">
      <div className="space-y-2.5">
        <div className="h-7 w-52 max-w-full rounded-md bg-line-subtle" />
        <div className="h-4 w-80 max-w-full rounded-sm bg-line-subtle" />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="h-6 w-24 rounded-sm bg-line-subtle" />
        <div className="h-6 w-20 rounded-sm bg-line-subtle" />
        <div className="h-6 w-28 rounded-sm bg-line-subtle" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className="rounded-lg border border-line-subtle bg-surface-raised p-4 space-y-3"
          >
            <div className="h-16 rounded-md bg-line-subtle" />
            <div className="h-3.5 w-2/3 rounded-sm bg-line-subtle" />
            <div className="h-3 w-1/3 rounded-sm bg-line-subtle" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export function App() {
  const [system, setSystem] = useState<DesignSystem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Overview');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [highlightLine, setHighlightLine] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Global Keyboard shortcuts (Cmd+K / Ctrl+K for search)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (system) setIsSearchOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [system]);

  const handleFileLoaded = (rawContent: string, fileName: string) => {
    setFileError(null);
    try {
      if (!rawContent || rawContent.trim().length === 0) {
        setFileError(`The file "${fileName}" has no readable content.`);
        return;
      }

      const parsed = parseDesignDocument(rawContent, fileName);
      setSystem(parsed);
      setActiveCategory('Overview');
      setHighlightLine(null);
    } catch (err: any) {
      console.error('Parsing error: ', err);
      setFileError(`Failed to parse file: ${err?.message || 'Unknown error'}`);
    }
  };

  /** Back to the drop zone, with every transient piece of UI put away. */
  const handleUnloadSystem = () => {
    setSystem(null);
    setFileError(null);
    setActiveCategory('Overview');
    setHighlightLine(null);
    setIsMobileSidebarOpen(false);
    setIsSearchOpen(false);
    setIsAiSettingsOpen(false);
    setIsExportOpen(false);
  };

  const handleNavigateToSource = (lineNumber?: number) => {
    setActiveCategory('Source');
    if (lineNumber) {
      setHighlightLine(lineNumber);
    }
  };

  const handleSelectSearchResult = (category: string, lineNumber?: number) => {
    if (category === 'Source' || lineNumber) {
      handleNavigateToSource(lineNumber);
    } else if (system?.overview.categoriesDetected.includes(category)) {
      setActiveCategory(category);
    }
  };

  // Counts for sidebar badges
  const categoryCounts: Record<string, number> = system
    ? {
        Overview: 0,
        Colors: system.colors.length,
        Typography: system.typography.length,
        Spacing: system.spacing.length,
        Radius: system.radii.length,
        Shadows: system.shadows.length,
        Borders: system.borders.length,
        Breakpoints: system.breakpoints.length,
        Components: system.components.length,
        Motion: system.motion.length,
        Accessibility: system.accessibility.length,
        Tokens: system.tokens.length,
        Audit: 0,
        Source: system.rawSections.length,
      }
    : {};

  return (
    /*
      One shell for both states. The landing screen and the loaded layout used
      to be separate returns, each with its own <main>, which put two
      `main` landmarks in the source and left screen-reader users guessing which
      one a page offered. There is now exactly one, and the skip link — missing
      entirely before — has a stable target to point at.
    */
    <div className="min-h-screen bg-surface-base text-content-primary flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md focus:bg-accent focus:text-accent-contrast focus:text-sm focus:font-bold focus:shadow-deep"
      >
        Skip to content
      </a>

      {system && (
        <>
          <AppHeader
            system={system}
            onReplaceFile={handleUnloadSystem}
            onOpenExport={() => setIsExportOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenAiSettings={() => setIsAiSettingsOpen(true)}
          />

          {/* Mobile Sidebar Toggle Button */}
          <div className="md:hidden px-4 py-2 bg-surface-raised/90 border-b border-line-subtle flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              aria-expanded={isMobileSidebarOpen}
              aria-controls="category-sidebar"
              className="flex items-center gap-2 -mx-2 px-2 py-1 rounded-md text-xs font-semibold text-content-primary hover:bg-surface-overlay transition-colors"
            >
              {isMobileSidebarOpen ? (
                <X className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Menu className="w-4 h-4" aria-hidden="true" />
              )}
              <span>Category: {activeCategory}</span>
            </button>
            <span className="text-[11px] font-mono text-content-muted">
              {categoryCounts[activeCategory] || 0} items
            </span>
          </div>
        </>
      )}

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {system && (
          <DynamicSidebar
            categories={system.overview.categoriesDetected}
            activeCategory={activeCategory}
            onSelectCategory={(cat) => {
              setActiveCategory(cat);
              setHighlightLine(null);
            }}
            counts={categoryCounts}
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Content Area — the single `main` landmark */}
        <main
          id="main-content"
          tabIndex={-1}
          className={clsx(
            'flex-1 min-w-0',
            system
              ? 'p-4 sm:p-6 lg:p-8 overflow-y-auto'
              : 'flex flex-col justify-center items-center px-4 py-8'
          )}
        >
          <ErrorBoundary
            resetKey={`${system?.metadata.fileName ?? 'no-file'}:${activeCategory}`}
            onReset={handleUnloadSystem}
          >
            {system ? (
              <Suspense fallback={<ViewSkeleton />}>
                {activeCategory === 'Overview' && (
                  <OverviewView system={system} onNavigate={setActiveCategory} />
                )}

                {activeCategory === 'Colors' && (
                  <ColorView colors={system.colors} onNavigateToSource={handleNavigateToSource} />
                )}

                {activeCategory === 'Typography' && (
                  <TypographyView typography={system.typography} onNavigateToSource={handleNavigateToSource} />
                )}

                {activeCategory === 'Spacing' && (
                  <SpacingView spacing={system.spacing} onNavigateToSource={handleNavigateToSource} />
                )}

                {activeCategory === 'Radius' && (
                  <RadiusView radii={system.radii} onNavigateToSource={handleNavigateToSource} />
                )}

                {activeCategory === 'Shadows' && (
                  <ShadowsView shadows={system.shadows} onNavigateToSource={handleNavigateToSource} />
                )}

                {activeCategory === 'Borders' && (
                  <BordersView borders={system.borders} onNavigateToSource={handleNavigateToSource} />
                )}

                {activeCategory === 'Breakpoints' && (
                  <BreakpointsView breakpoints={system.breakpoints} onNavigateToSource={handleNavigateToSource} />
                )}

                {activeCategory === 'Components' && (
                  <ComponentsView components={system.components} onNavigateToSource={handleNavigateToSource} />
                )}

                {activeCategory === 'Motion' && (
                  <MotionView motion={system.motion} onNavigateToSource={handleNavigateToSource} />
                )}

                {activeCategory === 'Accessibility' && (
                  <AccessibilityView accessibility={system.accessibility} onNavigateToSource={handleNavigateToSource} />
                )}

                {activeCategory === 'Tokens' && (
                  <TokensView tokens={system.tokens} onNavigateToSource={handleNavigateToSource} />
                )}

                {activeCategory === 'Audit' && (
                  <HealthAuditView system={system} onNavigateToCategory={setActiveCategory} />
                )}

                {activeCategory === 'Source' && (
                  <SourceView
                    rawContent={system.rawContent}
                    sections={system.rawSections}
                    highlightLine={highlightLine}
                  />
                )}
              </Suspense>
            ) : (
              <DropZone onFileLoaded={handleFileLoaded} error={fileError} />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Modals & Drawers */}
      {system && (
        <>
          <SearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            system={system}
            onSelectResult={handleSelectSearchResult}
          />

          <AiSettingsModal
            isOpen={isAiSettingsOpen}
            onClose={() => setIsAiSettingsOpen(false)}
            system={system}
            onEnrichmentComplete={(enriched) => setSystem(enriched)}
          />

          <ExportModal
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            system={system}
          />
        </>
      )}
    </div>
  );
}
