import React, { useState, useRef } from 'react';
import { UploadCloud, FileCode2, Sparkles, Layers, ArrowRight, AlertCircle, PlusCircle, Download, Check, X } from 'lucide-react';
import { clsx } from 'clsx';
import {
  SAMPLE_IAB2B_DESIGN_SYSTEM,
  SAMPLE_MINIMAL_COLORS,
  SAMPLE_NARRATIVE_GUIDELINES,
  SAMPLE_CYBERPUNK_TOKENS,
} from '../../samples/fixtures';
import { copyToClipboard } from '../../utils/clipboard';

interface DropZoneProps {
  onFileLoaded: (content: string, fileName: string) => void;
  error?: string | null;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileLoaded, error: externalError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isScaffoldModalOpen, setIsScaffoldModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'iab2b' | 'mobile' | 'minimal' | 'cyberpunk'>('iab2b');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const error = externalError || localError;

  const handleFileProcess = (file: File) => {
    setLocalError(null);
    if (!file.name.toLowerCase().endsWith('.md') && !file.name.toLowerCase().endsWith('.markdown') && !file.name.toLowerCase().endsWith('.txt')) {
      setLocalError(`Invalid file format "${file.name}". Please drop a Markdown file (.md).`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content || content.trim().length === 0) {
        setLocalError(`The file "${file.name}" is completely empty. Please load a valid design.md file.`);
        return;
      }
      onFileLoaded(content, file.name);
    };
    reader.onerror = () => {
      setLocalError(`Failed to read "${file.name}". Please try another file.`);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const getTemplateContent = () => {
    switch (selectedTemplate) {
      case 'iab2b': return SAMPLE_IAB2B_DESIGN_SYSTEM;
      case 'mobile': return SAMPLE_NARRATIVE_GUIDELINES;
      case 'minimal': return SAMPLE_MINIMAL_COLORS;
      case 'cyberpunk': return SAMPLE_CYBERPUNK_TOKENS;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 sm:py-16 flex flex-col items-center justify-center animate-in fade-in duration-300">
      {/* Brand Header */}
      <div className="text-center max-w-2xl mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[#34d399] text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Design System Visualizer</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 font-heading">
          Design.md <span className="text-[#10b981]">Visual Explorer</span>
        </h1>
        <p className="text-[#cbd5e1] text-base sm:text-lg leading-relaxed font-normal">
          Transform your raw <code className="text-[#34d399] bg-[#111a14] border border-[#1b2b21] px-2 py-0.5 rounded-md font-mono text-sm">design.md</code> into an interactive, structured, and immediately exploitable design system.
        </p>
      </div>

      {/* Main Drop Area */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Drop your design.md file here or click to browse"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={clsx(
          'w-full relative rounded-[24px] border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden p-8 sm:p-14 text-center focus:outline-none focus:ring-4 focus:ring-[#10b981]/20',
          isDragging
            ? 'border-[#10b981] bg-[#10b981]/10 scale-[1.01] shadow-[0_0_0_4px_rgba(52,211,153,0.15),0_10px_30px_-20px_rgba(0,0,0,0.9)]'
            : 'border-[#1b2b21] hover:border-[#10b981]/50 bg-[#0e1611]/90 hover:bg-[#111a14] shadow-[0_0_0_1px_rgba(52,211,153,0.1),0_10px_30px_-22px_rgba(0,0,0,0.8)]'
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept=".md,.markdown,.txt"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center pointer-events-none">
          <div className={clsx(
            'w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-200',
            isDragging ? 'scale-110 bg-[#10b981] text-black' : 'bg-[#111a14] text-[#10b981] border border-[#1b2b21]'
          )}>
            <UploadCloud className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-extrabold text-white mb-2 font-heading">
            {isDragging ? 'Drop your design.md right here' : 'Drop your design.md file here'}
          </h2>
          <p className="text-sm text-[#94a3b8] max-w-md mb-6">
            Drag & drop your Markdown specification, or <span className="text-[#34d399] font-semibold underline underline-offset-4">browse your computer</span>
          </p>

          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#0b0f0c] border border-[#1b2b21] text-xs font-mono text-[#94a3b8]">
            <FileCode2 className="w-4 h-4 text-[#10b981]" />
            <span>Accepts .md, .markdown • 100% Client-side privacy</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="w-full mt-4 p-4 rounded-[16px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-0.5">Could not load file</div>
            <div className="text-rose-300/90">{error}</div>
          </div>
        </div>
      )}

      {/* Scaffold Bar */}
      <div className="w-full mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-[24px] bg-[#0e1611] border border-[#1b2b21] shadow-sm">
        <div>
          <div className="font-bold text-sm text-white font-heading">Don't have a design.md file yet?</div>
          <div className="text-xs text-[#94a3b8]">Generate an industry-standard template with Bricolage Grotesque, dark canvas, and tokens.</div>
        </div>
        <button
          type="button"
          onClick={() => setIsScaffoldModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#10b981]/15 hover:bg-[#10b981]/25 border border-[#10b981]/40 text-[#34d399] text-xs font-bold transition-all shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5 text-[#10b981]" />
          <span>Scaffold Starter DESIGN.md</span>
        </button>
      </div>

      {/* Quick Sample Selector */}
      <div className="w-full mt-8">
        <div className="text-center mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] font-heading">
            Or test with instant sample specifications:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onFileLoaded(SAMPLE_IAB2B_DESIGN_SYSTEM, 'ia-b2b-design-system.md')}
            className="flex flex-col text-left p-4 rounded-[22px] bg-[#0e1611] hover:bg-[#111a14] border border-[#1b2b21] hover:border-[#10b981]/50 transition-all group shadow-sm"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-white group-hover:text-[#34d399] flex items-center gap-1.5 font-heading">
                <Layers className="w-3.5 h-3.5 text-[#10b981]" />
                ia-b2b.fr System
              </span>
              <ArrowRight className="w-3 h-3 text-[#94a3b8] group-hover:text-[#10b981] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[11px] text-[#94a3b8] line-clamp-2 leading-relaxed">
              Bricolage Grotesque headings, #0b0f0c dark canvas, #10b981 emerald, pill buttons & 24px cards.
            </span>
          </button>

          <button
            type="button"
            onClick={() => onFileLoaded(SAMPLE_MINIMAL_COLORS, 'chroma-palette.md')}
            className="flex flex-col text-left p-4 rounded-[22px] bg-[#0e1611] hover:bg-[#111a14] border border-[#1b2b21] hover:border-[#10b981]/50 transition-all group shadow-sm"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-white group-hover:text-[#34d399] flex items-center gap-1.5 font-heading">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                Chroma Colors
              </span>
              <ArrowRight className="w-3 h-3 text-[#94a3b8] group-hover:text-[#10b981] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[11px] text-[#94a3b8] line-clamp-2 leading-relaxed">
              Minimal color-only specification (tests dynamic category suppression).
            </span>
          </button>

          <button
            type="button"
            onClick={() => onFileLoaded(SAMPLE_NARRATIVE_GUIDELINES, 'aurora-guidelines.md')}
            className="flex flex-col text-left p-4 rounded-[22px] bg-[#0e1611] hover:bg-[#111a14] border border-[#1b2b21] hover:border-[#1d4ed8]/50 transition-all group shadow-sm"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-white group-hover:text-[#93c5fd] flex items-center gap-1.5 font-heading">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1d4ed8]" />
                Aurora Narrative
              </span>
              <ArrowRight className="w-3 h-3 text-[#94a3b8] group-hover:text-[#1d4ed8] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[11px] text-[#94a3b8] line-clamp-2 leading-relaxed">
              Text-heavy brand identity guidelines with inline values.
            </span>
          </button>

          <button
            type="button"
            onClick={() => onFileLoaded(SAMPLE_CYBERPUNK_TOKENS, 'cyberpunk-tokens.md')}
            className="flex flex-col text-left p-4 rounded-[22px] bg-[#0e1611] hover:bg-[#111a14] border border-[#1b2b21] hover:border-[#34d399]/50 transition-all group shadow-sm"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-white group-hover:text-[#34d399] flex items-center gap-1.5 font-heading">
                <span className="w-2.5 h-2.5 rounded-full bg-[#34d399]" />
                Cyberpunk HUD
              </span>
              <ArrowRight className="w-3 h-3 text-[#94a3b8] group-hover:text-[#34d399] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[11px] text-[#94a3b8] line-clamp-2 leading-relaxed">
              CSS variables with token aliases and terminal HUD styling.
            </span>
          </button>
        </div>
      </div>

      {/* Scaffold Modal */}
      {isScaffoldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#0e1611] border border-[#1b2b21] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-[#1b2b21]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 flex items-center justify-center">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-heading">Scaffold New DESIGN.md</h3>
                  <p className="text-xs text-[#94a3b8]">Generate a structured design specification template for your codebase</p>
                </div>
              </div>
              <button
                onClick={() => setIsScaffoldModalOpen(false)}
                className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#111a14]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate('iab2b')}
                  className={`p-3 rounded-[16px] border text-left text-xs transition-all ${
                    selectedTemplate === 'iab2b' ? 'bg-[#10b981]/15 border-[#10b981] text-white font-bold' : 'bg-[#0b0f0c] border-[#1b2b21] text-[#94a3b8]'
                  }`}
                >
                  ia-b2b.fr System
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate('mobile')}
                  className={`p-3 rounded-[16px] border text-left text-xs transition-all ${
                    selectedTemplate === 'mobile' ? 'bg-[#10b981]/15 border-[#10b981] text-white font-bold' : 'bg-[#0b0f0c] border-[#1b2b21] text-[#94a3b8]'
                  }`}
                >
                  Mobile & Consumer
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate('minimal')}
                  className={`p-3 rounded-[16px] border text-left text-xs transition-all ${
                    selectedTemplate === 'minimal' ? 'bg-[#10b981]/15 border-[#10b981] text-white font-bold' : 'bg-[#0b0f0c] border-[#1b2b21] text-[#94a3b8]'
                  }`}
                >
                  Minimal Palette
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate('cyberpunk')}
                  className={`p-3 rounded-[16px] border text-left text-xs transition-all ${
                    selectedTemplate === 'cyberpunk' ? 'bg-[#10b981]/15 border-[#10b981] text-white font-bold' : 'bg-[#0b0f0c] border-[#1b2b21] text-[#94a3b8]'
                  }`}
                >
                  Cyberpunk HUD
                </button>
              </div>

              <div className="p-4 rounded-[16px] bg-[#0b0f0c] border border-[#1b2b21] max-h-60 overflow-y-auto">
                <pre className="text-xs font-mono text-[#cbd5e1] whitespace-pre leading-relaxed">
                  {getTemplateContent()}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-[#1b2b21] bg-[#0e1611]/80 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsScaffoldModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#94a3b8] hover:text-white"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyToClipboard(getTemplateContent());
                    if (ok) {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1800);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#111a14] hover:bg-[#16231b] text-xs font-bold text-white border border-[#1b2b21] flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#34d399]" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Template'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onFileLoaded(getTemplateContent(), `starter-${selectedTemplate}-design.md`);
                    setIsScaffoldModalOpen(false);
                  }}
                  className="px-4 py-1.5 rounded-full bg-[#10b981] hover:bg-[#0c6e4e] text-xs font-bold text-black shadow-md transition-all"
                >
                  Open in Explorer →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
