import React, { useState, useEffect, useRef } from 'react';
import { FileCode, FileText, Hash, ListTree, Copy } from 'lucide-react';
import { RawSection } from '../../schema/designSystem';
import { CopyButton } from '../../components/common/CopyButton';

interface SourceViewProps {
  rawContent: string;
  sections: RawSection[];
  highlightLine?: number | null;
}

export const SourceView: React.FC<SourceViewProps> = ({
  rawContent,
  sections,
  highlightLine,
}) => {
  const [viewMode, setViewMode] = useState<'raw' | 'rendered'>('raw');
  const lineRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const lines = rawContent.split(/\r?\n/);

  // Scroll to highlight line on mount or change
  useEffect(() => {
    if (highlightLine && lineRefs.current[highlightLine]) {
      lineRefs.current[highlightLine]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightLine, viewMode]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1b2b21]">
        <div>
          <h2 className="text-xl font-bold text-[#cbd5e1] flex items-center gap-2">
            <FileCode className="w-5 h-5 text-[#34d399]" />
            Source design.md Inspector
          </h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            {lines.length} lines • {sections.length} structured markdown sections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0e1611] border border-[#1b2b21] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'raw' ? 'bg-[#0c6e4e] text-white' : 'text-[#94a3b8] hover:text-[#cbd5e1]'
              }`}
            >
              Raw Lines
            </button>
            <button
              onClick={() => setViewMode('rendered')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'rendered' ? 'bg-[#0c6e4e] text-white' : 'text-[#94a3b8] hover:text-[#cbd5e1]'
              }`}
            >
              Section Outline
            </button>
          </div>

          <CopyButton text={rawContent} label="Copy File" variant="secondary" />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table of Contents Sidebar */}
        <div className="lg:col-span-4 rounded-2xl bg-[#0e1611]/60 border border-[#1b2b21] p-4 space-y-2 max-h-[70vh] overflow-y-auto">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] flex items-center gap-1.5 pb-2 border-b border-[#1b2b21]">
            <ListTree className="w-3.5 h-3.5" />
            <span>Document Outline</span>
          </div>

          <div className="space-y-1">
            {sections.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  setViewMode('raw');
                  setTimeout(() => {
                    lineRefs.current[sec.lineNumber]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 50);
                }}
                className="w-full flex items-center justify-between text-left p-2 rounded-lg hover:bg-[#111a14]/80 text-xs text-[#cbd5e1] transition-colors group"
                style={{ paddingLeft: `${Math.max(8, sec.level * 12)}px` }}
              >
                <span className="truncate group-hover:text-[#34d399]">{sec.heading}</span>
                <span className="text-[10px] font-mono text-[#64748b] shrink-0 ml-2">
                  L{sec.lineNumber}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Source Content Area */}
        <div className="lg:col-span-8 rounded-2xl bg-[#0b0f0c] border border-[#1b2b21] overflow-hidden shadow-2xl">
          {viewMode === 'raw' ? (
            <div className="max-h-[70vh] overflow-y-auto font-mono text-xs text-[#cbd5e1] p-2 divide-y divide-[#0c140f]">
              {lines.map((line, idx) => {
                const lineNum = idx + 1;
                const isHighlighted = highlightLine === lineNum;

                return (
                  <div
                    key={lineNum}
                    ref={(el) => { lineRefs.current[lineNum] = el; }}
                    className={`flex items-start py-0.5 px-2 rounded transition-colors ${
                      isHighlighted ? 'bg-[#0c6e4e]/30 ring-1 ring-indigo-500' : 'hover:bg-[#0e1611]/50'
                    }`}
                  >
                    <span className="w-10 select-none text-[11px] text-[#64748b] text-right pr-4 shrink-0">
                      {lineNum}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap break-words">{line || ' '}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
              {sections.map((sec) => (
                <div key={sec.id} className="space-y-2 pb-4 border-b border-[#0c140f]">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#cbd5e1] text-base" style={{ fontSize: `${Math.max(14, 20 - sec.level * 2)}px` }}>
                      {sec.heading}
                    </h3>
                    <span className="text-xs font-mono text-[#64748b]">
                      Lines {sec.lineNumber}–{sec.lineEnd}
                    </span>
                  </div>
                  <pre className="text-xs font-mono text-[#94a3b8] bg-[#0e1611]/60 p-3.5 rounded-xl border border-[#1b2b21]/80 whitespace-pre-wrap">
                    {sec.content.trim() || '(No content)'}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
