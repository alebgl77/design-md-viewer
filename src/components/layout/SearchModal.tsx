import React, { useState, useEffect } from 'react';
import { Search, X, Hash, ArrowRight, CornerDownLeft } from 'lucide-react';
import { DesignSystem } from '../../schema/designSystem';
import { searchDesignSystem, SearchResult } from '../../utils/search';
import { Modal } from '../common/Modal';

const TITLE_ID = 'search-modal-title';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: DesignSystem;
  onSelectResult: (category: string, lineNumber?: number) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  system,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const res = searchDesignSystem(system, query);
    setResults(res);
    setSelectedIndex(0);
  }, [query, system]);

  // Escape is owned by Modal; this handler only drives result navigation.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected) {
          onSelectResult(selected.category, selected.provenanceLine);
          onClose();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, onSelectResult]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={TITLE_ID}
      size="md"
      align="top"
      className="max-h-[80vh]"
    >
      {/* The search field is the visible title, so the dialog's accessible
          name is carried by a heading only screen readers reach. */}
      <h2 id={TITLE_ID} className="sr-only">
        Search the design system
      </h2>

      {/* Search Header */}
      <div className="relative flex items-center px-4 border-b border-line">
        <Search className="w-5 h-5 text-content-secondary shrink-0" />
        <input
          data-modal-autofocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tokens, colors, typography, components, spacing..."
          className="w-full px-3 py-4 bg-transparent text-content-primary placeholder-content-muted text-sm focus:outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Clear search query"
            className="p-1 rounded-sm text-content-secondary hover:text-content-primary"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-2">
        {query && results.length === 0 ? (
          <div className="py-12 text-center text-content-muted text-sm">
            No matching design system tokens found for "{query}"
          </div>
        ) : (
          <div className="space-y-1">
            {results.map((res, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${res.id}-${idx}`}
                  onClick={() => {
                    onSelectResult(res.category, res.provenanceLine);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-md cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-accent/15 border border-accent/40 text-content-primary'
                      : 'hover:bg-surface-inset text-content-primary'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider bg-surface-inset text-accent border border-line-subtle shrink-0">
                      {res.category}
                    </span>
                    <div className="truncate">
                      <div className="font-semibold text-xs text-content-primary truncate">{res.title}</div>
                      <div className="text-[11px] text-content-secondary font-mono truncate">{res.subtitle}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {res.provenanceLine && (
                      <span className="text-[11px] font-mono text-content-muted flex items-center gap-0.5">
                        <Hash className="w-3 h-3" /> {res.provenanceLine}
                      </span>
                    )}
                    {isSelected ? (
                      <CornerDownLeft className="w-3.5 h-3.5 text-accent" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-content-muted" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Search Footer */}
      <div className="p-3 border-t border-line-subtle bg-surface-inset text-[11px] text-content-muted flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span>Use <kbd className="px-1 py-0.5 rounded-sm bg-surface-overlay text-content-secondary">↑</kbd> <kbd className="px-1 py-0.5 rounded-sm bg-surface-overlay text-content-secondary">↓</kbd> to navigate</span>
          <span><kbd className="px-1 py-0.5 rounded-sm bg-surface-overlay text-content-secondary">↵</kbd> to select</span>
        </div>
        <span><kbd className="px-1 py-0.5 rounded-sm bg-surface-overlay text-content-secondary">ESC</kbd> to close</span>
      </div>
    </Modal>
  );
};
