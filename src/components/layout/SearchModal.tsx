import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Hash, ArrowRight, CornerDownLeft } from 'lucide-react';
import { DesignSystem } from '../../schema/designSystem';
import { searchDesignSystem, SearchResult } from '../../utils/search';

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const res = searchDesignSystem(system, query);
    setResults(res);
    setSelectedIndex(0);
  }, [query, system]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#0e1611] border border-[#1b2b21] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="relative flex items-center px-4 border-b border-[#1b2b21]">
          <Search className="w-5 h-5 text-[#94a3b8] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tokens, colors, typography, components, spacing..."
            className="w-full px-3 py-4 bg-transparent text-[#cbd5e1] placeholder-[#64748b] text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-[#94a3b8] hover:text-[#cbd5e1]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2">
          {query && results.length === 0 ? (
            <div className="py-12 text-center text-[#64748b] text-sm">
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
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#10b981]/15 border border-[#10b981]/40 text-[#cbd5e1]' : 'hover:bg-[#111a14]/60 text-[#cbd5e1]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#15221a] text-[#34d399] border border-[#1b2b21]/60 shrink-0">
                        {res.category}
                      </span>
                      <div className="truncate">
                        <div className="font-semibold text-xs text-[#cbd5e1] truncate">{res.title}</div>
                        <div className="text-[11px] text-[#94a3b8] font-mono truncate">{res.subtitle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      {res.provenanceLine && (
                        <span className="text-[11px] font-mono text-[#64748b] flex items-center gap-0.5">
                          <Hash className="w-3 h-3" /> {res.provenanceLine}
                        </span>
                      )}
                      {isSelected ? (
                        <CornerDownLeft className="w-3.5 h-3.5 text-[#34d399]" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-[#64748b]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Search Footer */}
        <div className="p-3 border-t border-[#1b2b21]/80 bg-[#0b0f0c]/60 text-[11px] text-[#64748b] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Use <kbd className="px-1 py-0.5 rounded bg-[#15221a] text-[#94a3b8]">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-[#15221a] text-[#94a3b8]">↓</kbd> to navigate</span>
            <span><kbd className="px-1 py-0.5 rounded bg-[#15221a] text-[#94a3b8]">↵</kbd> to select</span>
          </div>
          <span><kbd className="px-1 py-0.5 rounded bg-[#15221a] text-[#94a3b8]">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};
