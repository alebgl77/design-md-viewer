import React from 'react';
import { Search, Download, RefreshCw, FileText, Bot, CheckCircle2 } from 'lucide-react';
import { DesignSystem } from '../../schema/designSystem';
import { AnimatedLogo } from '../common/AnimatedLogo';
import { Badge } from '../common/Badge';
import { ThemeToggle } from '../common/ThemeToggle';

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
    <header className="sticky top-0 z-30 h-16 border-b border-line bg-surface-base/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Branding & Current File */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 font-bold text-content-primary text-sm sm:text-base shrink-0 font-heading">
          {/* A tinted plate, not a solid accent fill: the mark draws itself in
              the accent, so the tile behind it has to stay a wash. 22px inside
              a 32px tile leaves the hash a hair of breathing room while still
              reading as a logo rather than an icon. */}
          <div className="w-8 h-8 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center shadow-deep">
            <AnimatedLogo size={22} />
          </div>
          <span className="hidden md:inline font-extrabold tracking-tight">
            Design<span className="text-accent">.md</span>
          </span>
        </div>

        <div className="h-5 w-px bg-line hidden sm:block" />

        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-surface-raised border border-line-subtle text-xs text-content-secondary truncate max-w-[200px] sm:max-w-[280px]">
            <FileText className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
            <span className="font-mono truncate">{system.metadata.fileName}</span>
          </div>

          <Badge variant="neutral" size="sm" className="hidden sm:inline-flex shrink-0">
            {system.overview.totalTokensCount} tokens
          </Badge>

          {system.metadata.isAiEnriched && (
            <Badge variant="inferred" size="sm" className="hidden lg:inline-flex shrink-0">
              {/* Uncoloured on purpose: the icon inherits the badge variant's own
                  colour instead of pinning a second, unrelated hue here. */}
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
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
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-md bg-surface-raised border border-line-subtle text-xs text-content-muted hover:border-accent/40 hover:text-content-secondary transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
            <span>Search tokens, colors, components...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded-sm bg-surface-overlay border border-line-subtle text-[10px] font-mono text-content-muted">
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
          aria-label="Search"
          className="md:hidden p-2 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-overlay transition-colors"
        >
          <Search className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Theme Toggle: this app judges other people's colours, so it has to be
            able to show them on both grounds. */}
        <ThemeToggle />

        {/* AI Settings Trigger */}
        <button
          type="button"
          onClick={onOpenAiSettings}
          title="AI Enrichment Settings"
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-raised hover:bg-surface-overlay border border-line hover:border-accent/40 text-xs font-semibold text-content-secondary hover:text-content-primary transition-colors"
        >
          <Bot
            className="w-3.5 h-3.5 text-content-muted group-hover:text-accent transition-colors"
            aria-hidden="true"
          />
          <span className="hidden sm:inline">AI Enrichment</span>
        </button>

        {/* Export Button (primary CTA) */}
        <button
          type="button"
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-accent hover:bg-accent-hover text-xs font-bold text-accent-contrast shadow-deep active:scale-95 transition-all"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Export</span>
        </button>

        {/* Replace File Button */}
        <button
          type="button"
          onClick={onReplaceFile}
          title="Replace with another design.md"
          aria-label="Replace with another design.md"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-raised hover:bg-surface-overlay border border-line hover:border-accent/30 text-xs font-medium text-content-muted hover:text-content-secondary transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden lg:inline">Replace</span>
        </button>
      </div>
    </header>
  );
};
