import React, { useState, useRef, useEffect } from 'react';
import { FileText, X, Hash } from 'lucide-react';
import { Provenance, ExtractionConfidence } from '../../schema/designSystem';
import { Badge } from './Badge';

interface ProvenancePopoverProps {
  provenance: Provenance;
  confidence?: ExtractionConfidence;
  itemName?: string;
  onNavigateToSource?: (lineNumber?: number) => void;
}

export const ProvenancePopover: React.FC<ProvenancePopoverProps> = ({
  provenance,
  confidence = 'explicit',
  itemName,
  onNavigateToSource,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="View source in design.md"
        className="p-1 rounded text-[#64748b] hover:text-[#cbd5e1] hover:bg-[#111a14]/80 transition-colors"
      >
        <FileText className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 right-0 mt-1.5 w-80 p-3.5 rounded-lg bg-[#0e1611] border border-[#1b2b21] shadow-2xl backdrop-blur-md text-xs text-[#cbd5e1] animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#1b2b21]">
            <div className="flex items-center gap-1.5 font-semibold text-[#cbd5e1]">
              <FileText className="w-3.5 h-3.5 text-[#34d399]" />
              <span>Source in design.md</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={confidence === 'explicit' ? 'explicit' : 'inferred'}>
                {confidence === 'explicit' ? 'Explicit' : 'Inferred'}
              </Badge>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#64748b] hover:text-[#cbd5e1] p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {provenance.headingPath && provenance.headingPath.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] uppercase font-semibold text-[#64748b] tracking-wider mb-0.5">
                Section
              </div>
              <div className="text-[#cbd5e1] font-mono text-[11px] bg-[#0b0f0c]/60 px-2 py-1 rounded border border-[#1b2b21]/80 truncate">
                {provenance.headingPath.join(' › ')}
              </div>
            </div>
          )}

          {provenance.lineNumber && (
            <div className="mb-2 flex items-center justify-between text-[#94a3b8] text-[11px]">
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3 text-[#64748b]" /> Line {provenance.lineNumber}
              </span>
              {onNavigateToSource && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigateToSource(provenance.lineNumber);
                  }}
                  className="text-[#34d399] hover:text-[#34d399] hover:underline font-medium"
                >
                  Jump to source →
                </button>
              )}
            </div>
          )}

          {provenance.rawSourceSnippet && (
            <div>
              <div className="text-[10px] uppercase font-semibold text-[#64748b] tracking-wider mb-0.5">
                Extracted Snippet
              </div>
              <pre className="text-[11px] text-[#cbd5e1] font-mono bg-[#0b0f0c] p-2 rounded border border-[#1b2b21]/80 overflow-x-auto whitespace-pre-wrap max-h-28">
                {provenance.rawSourceSnippet}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
