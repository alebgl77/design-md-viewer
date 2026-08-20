import React from 'react';
import { Sparkles, Search, Download, RefreshCw, FileText, Bot, CheckCircle2 } from 'lucide-react';
import { DesignSystem } from '../../schema/designSystem';
import { Badge } from '../common/Badge';

interface AppHeaderProps {
  system: DesignSystem;
  onReplaceFile: () => void;
  onOpenExport: () => void;
  onOpenSearch: () => void;
  onOpenAiSettings: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  system,
  onReplaceFile,
  onOpenExport,
  onOpenSearch,
  onOpenAiSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[#1b2b21] bg-[#0b0f0c]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Branding & Current File */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 font-bold text-white text-sm sm:text-base shrink-0 font-heading">
          <div className="w-8 h-8 rounded-xl bg-[#10b981] flex items-center justify-center text-black font-extrabold shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="hidden md:inline font-extrabold tracking-tight">
            Design<span className="text-[#10b981]">.md</span>
          </span>
        </div>

        <div className="h-5 w-px bg-[#1b2b21] hidden sm:block" />

        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0e1611] border border-[#1b2b21] text-xs text-[#cbd5e1] truncate max-w-[200px] sm:max-w-[280px]">
            <FileText className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
            <span className="font-mono truncate">{system.metadata.fileName}</span>
          </div>

          <Badge variant="neutral" size="sm" className="hidden sm:inline-flex shrink-0">
            {system.overview.totalTokensCount} tokens
          </Badge>

          {system.metadata.isAiEnriched && (
            <Badge variant="inferred" size="sm" className="hidden lg:inline-flex shrink-0">
              <CheckCircle2 className="w-3 h-3 text-[#60a5fa]" />
              AI Enriched
            </Badge>
          )}
        </div>
      </div>

      {/* Middle: Search Trigger */}
      <div className="flex-1 max-w-md hidden md:block">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-full bg-[#0e1611] border border-[#1b2b21] text-xs text-[#94a3b8] hover:border-[#10b981]/40 hover:text-[#cbd5e1] transition-colors shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Search tokens, colors, components...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-[#111a14] border border-[#1b2b21] text-[10px] font-mono text-[#94a3b8]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          title="Search"
          className="md:hidden p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#111a14] transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* AI Settings Trigger */}
        <button
          type="button"
          onClick={onOpenAiSettings}
          title="AI Enrichment Settings"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0e1611] hover:bg-[#111a14] border border-[#1b2b21] hover:border-[#1d4ed8]/40 text-xs font-semibold text-[#cbd5e1] hover:text-[#93c5fd] transition-colors"
        >
          <Bot className="w-3.5 h-3.5 text-[#1d4ed8]" />
          <span className="hidden sm:inline">AI Enrichment</span>
        </button>

        {/* Export Button (Pill CTA style) */}
        <button
          type="button"
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#10b981] hover:bg-[#0c6e4e] text-xs font-bold text-black shadow-md active:scale-95 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>

        {/* Replace File Button */}
        <button
          type="button"
          onClick={onReplaceFile}
          title="Replace with another design.md"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0e1611] hover:bg-[#111a14] border border-[#1b2b21] hover:border-[#10b981]/30 text-xs font-medium text-[#94a3b8] hover:text-[#cbd5e1] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Replace</span>
        </button>
      </div>
    </header>
  );
};
