import React, { useState, useEffect } from 'react';
import { DesignSystem } from './schema/designSystem';
import { parseDesignDocument } from './parsers/pipeline';
import { DropZone } from './components/common/DropZone';
import { AppHeader } from './components/layout/AppHeader';
import { DynamicSidebar } from './components/layout/DynamicSidebar';
import { SearchModal } from './components/layout/SearchModal';
import { AiSettingsModal } from './components/layout/AiSettingsModal';
import { ExportModal } from './components/layout/ExportModal';

import { OverviewView } from './features/overview/OverviewView';
import { ColorView } from './features/colors/ColorView';
import { TypographyView } from './features/typography/TypographyView';
import { SpacingView } from './features/spacing/SpacingView';
import { RadiusView } from './features/radius/RadiusView';
import { ShadowsView } from './features/shadows/ShadowsView';
import { BordersView } from './features/borders/BordersView';
import { BreakpointsView } from './features/breakpoints/BreakpointsView';
import { ComponentsView } from './features/components/ComponentsView';
import { MotionView } from './features/motion/MotionView';
import { AccessibilityView } from './features/accessibility/AccessibilityView';
import { TokensView } from './features/tokens/TokensView';
import { HealthAuditView } from './features/audit/HealthAuditView';
import { SourceView } from './features/source/SourceView';
import { Menu, X } from 'lucide-react';

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

  // If no file is loaded, show landing DropZone
  if (!system) {
    return (
      <main className="min-h-screen bg-[#0b0f0c] flex flex-col justify-center items-center px-4 py-8">
        <DropZone onFileLoaded={handleFileLoaded} error={fileError} />
      </main>
    );
  }

  // Counts for sidebar badges
  const categoryCounts: Record<string, number> = {
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
  };

  return (
    <div className="min-h-screen bg-[#0b0f0c] text-[#cbd5e1] flex flex-col">
      {/* Top Header */}
      <AppHeader
        system={system}
        onReplaceFile={() => setSystem(null)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAiSettings={() => setIsAiSettingsOpen(true)}
      />

      {/* Mobile Sidebar Toggle Button */}
      <div className="md:hidden px-4 py-2 bg-[#0e1611]/90 border-b border-[#1b2b21] flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="flex items-center gap-2 text-xs font-semibold text-[#cbd5e1]"
        >
          {isMobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>Category: {activeCategory}</span>
        </button>
        <span className="text-[11px] font-mono text-[#64748b]">
          {categoryCounts[activeCategory] || 0} items
        </span>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Dynamic Sidebar */}
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

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
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
        </main>
      </div>

      {/* Modals & Drawers */}
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
    </div>
  );
}
