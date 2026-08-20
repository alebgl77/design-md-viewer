import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCode2,
  Sparkles,
  Layers,
  ArrowRight,
  AlertCircle,
  PlusCircle,
  Download,
  Check,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  SAMPLE_IAB2B_DESIGN_SYSTEM,
  SAMPLE_MINIMAL_COLORS,
  SAMPLE_NARRATIVE_GUIDELINES,
  SAMPLE_CYBERPUNK_TOKENS,
} from '../../samples/fixtures';
import { copyToClipboard } from '../../utils/clipboard';
import { Modal } from './Modal';

const SCAFFOLD_TITLE_ID = 'scaffold-modal-title';

/**
 * Upper bound on an accepted file, in bytes.
 *
 * Parsing is synchronous and runs on the main thread, so an oversized upload
 * freezes the tab with no feedback at all. A design specification is prose plus
 * token tables; the largest fixture here is a few dozen KB, so 2 MB is roughly
 * two orders of magnitude of headroom and still well inside what the parser
 * handles instantly.
 */
const MAX_FILE_BYTES = 2 * 1024 * 1024;

function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DropZoneProps {
  onFileLoaded: (content: string, fileName: string) => void;
  error?: string | null;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileLoaded, error: externalError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isScaffoldModalOpen, setIsScaffoldModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'iab2b' | 'mobile' | 'minimal' | 'cyberpunk'>(
    'iab2b'
  );
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const error = externalError || localError;

  const handleFileProcess = (file: File) => {
    setLocalError(null);
    if (
      !file.name.toLowerCase().endsWith('.md') &&
      !file.name.toLowerCase().endsWith('.markdown') &&
      !file.name.toLowerCase().endsWith('.txt')
    ) {
      setLocalError(`Invalid file format "${file.name}". Please drop a Markdown file (.md).`);
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setLocalError(
        `The file "${file.name}" is ${formatMegabytes(file.size)}, over the ${formatMegabytes(MAX_FILE_BYTES)} limit. Please load a smaller design.md file.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
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
      case 'iab2b':
        return SAMPLE_IAB2B_DESIGN_SYSTEM;
      case 'mobile':
        return SAMPLE_NARRATIVE_GUIDELINES;
      case 'minimal':
        return SAMPLE_MINIMAL_COLORS;
      case 'cyberpunk':
        return SAMPLE_CYBERPUNK_TOKENS;
    }
  };

  const templateOptions: { id: typeof selectedTemplate; label: string }[] = [
    { id: 'iab2b', label: 'ia-b2b.fr System' },
    { id: 'mobile', label: 'Mobile & Consumer' },
    { id: 'minimal', label: 'Minimal Palette' },
    { id: 'cyberpunk', label: 'Cyberpunk HUD' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 sm:py-16 flex flex-col items-center justify-center animate-in fade-in duration-300">
      {/* Brand Header */}
      <div className="text-center max-w-2xl mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-sm bg-accent/15 border border-accent/30 text-accent text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Design System Visualizer</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-content-primary mb-4 font-heading">
          Design.md <span className="text-accent">Visual Explorer</span>
        </h1>
        <p className="text-content-secondary text-base sm:text-lg leading-relaxed font-normal">
          Transform your raw{' '}
          <code className="text-accent bg-surface-overlay border border-line px-2 py-0.5 rounded-sm font-mono text-sm">
            design.md
          </code>{' '}
          into an interactive, structured, and immediately exploitable design system.
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
          'w-full relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden p-8 sm:p-14 text-center focus:ring-4 focus:ring-accent/20',
          isDragging
            ? 'border-accent bg-accent/10 scale-[1.01] shadow-chromatic-glow'
            : 'border-line hover:border-accent/50 bg-surface-raised hover:bg-accent/5 shadow-chromatic'
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
          <div
            className={clsx(
              'w-16 h-16 rounded-lg flex items-center justify-center mb-5 transition-transform duration-200',
              isDragging
                ? 'scale-110 bg-accent text-accent-contrast'
                : 'bg-surface-overlay text-accent border border-line'
            )}
          >
            <UploadCloud className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-extrabold text-content-primary mb-2 font-heading">
            {isDragging ? 'Drop your design.md right here' : 'Drop your design.md file here'}
          </h2>
          <p className="text-sm text-content-secondary max-w-md mb-6">
            Drag & drop your Markdown specification, or{' '}
            <span className="text-accent font-semibold underline underline-offset-4">
              browse your computer
            </span>
          </p>

          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-sm bg-surface-inset border border-line text-xs font-mono text-content-secondary">
            <FileCode2 className="w-4 h-4 text-accent" />
            <span>Accepts .md, .markdown • 100% Client-side privacy</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="w-full mt-4 p-4 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger text-sm flex items-start gap-3 animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-0.5">Could not load file</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Scaffold Bar */}
      <div className="w-full mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-lg bg-surface-raised border border-line shadow-deep">
        <div>
          <div className="font-bold text-sm text-content-primary font-heading">
            Don't have a design.md file yet?
          </div>
          <div className="text-xs text-content-secondary">
            Generate an industry-standard template with Bricolage Grotesque, dark canvas, and tokens.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsScaffoldModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent/15 hover:bg-accent/25 border border-accent/40 text-accent text-xs font-bold transition-all shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5 text-accent" />
          <span>Scaffold Starter DESIGN.md</span>
        </button>
      </div>

      {/* Quick Sample Selector */}
      <div className="w-full mt-8">
        <div className="text-center mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-content-secondary font-heading">
            Or test with instant sample specifications:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onFileLoaded(SAMPLE_IAB2B_DESIGN_SYSTEM, 'ia-b2b-design-system.md')}
            className="flex flex-col text-left p-4 rounded-lg bg-surface-raised hover:bg-accent/5 border border-line hover:border-accent/50 transition-all group shadow-deep"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-content-primary group-hover:text-accent flex items-center gap-1.5 font-heading">
                <Layers className="w-3.5 h-3.5 text-accent" />
                ia-b2b.fr System
              </span>
              <ArrowRight className="w-3 h-3 text-content-secondary group-hover:text-accent group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[11px] text-content-secondary line-clamp-2 leading-relaxed">
              Bricolage Grotesque headings, #0b0f0c dark canvas, #10b981 emerald, pill buttons & 24px cards.
            </span>
          </button>

          <button
            type="button"
            onClick={() => onFileLoaded(SAMPLE_MINIMAL_COLORS, 'chroma-palette.md')}
            className="flex flex-col text-left p-4 rounded-lg bg-surface-raised hover:bg-accent/5 border border-line hover:border-accent/50 transition-all group shadow-deep"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-content-primary group-hover:text-accent flex items-center gap-1.5 font-heading">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                Chroma Colors
              </span>
              <ArrowRight className="w-3 h-3 text-content-secondary group-hover:text-accent group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[11px] text-content-secondary line-clamp-2 leading-relaxed">
              Minimal color-only specification (tests dynamic category suppression).
            </span>
          </button>

          <button
            type="button"
            onClick={() => onFileLoaded(SAMPLE_NARRATIVE_GUIDELINES, 'aurora-guidelines.md')}
            className="flex flex-col text-left p-4 rounded-lg bg-surface-raised hover:bg-accent/5 border border-line hover:border-accent/50 transition-all group shadow-deep"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-content-primary group-hover:text-accent flex items-center gap-1.5 font-heading">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                Aurora Narrative
              </span>
              <ArrowRight className="w-3 h-3 text-content-secondary group-hover:text-accent group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[11px] text-content-secondary line-clamp-2 leading-relaxed">
              Text-heavy brand identity guidelines with inline values.
            </span>
          </button>

          <button
            type="button"
            onClick={() => onFileLoaded(SAMPLE_CYBERPUNK_TOKENS, 'cyberpunk-tokens.md')}
            className="flex flex-col text-left p-4 rounded-lg bg-surface-raised hover:bg-accent/5 border border-line hover:border-accent/50 transition-all group shadow-deep"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-content-primary group-hover:text-accent flex items-center gap-1.5 font-heading">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                Cyberpunk HUD
              </span>
              <ArrowRight className="w-3 h-3 text-content-secondary group-hover:text-accent group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[11px] text-content-secondary line-clamp-2 leading-relaxed">
              CSS variables with token aliases and terminal HUD styling.
            </span>
          </button>
        </div>
      </div>

      {/* Scaffold Modal */}
      <Modal
        isOpen={isScaffoldModalOpen}
        onClose={() => setIsScaffoldModalOpen(false)}
        labelledBy={SCAFFOLD_TITLE_ID}
        size="md"
        className="max-h-[85vh]"
      >
        <div className="flex items-center justify-between p-5 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-accent/15 text-accent border border-accent/30 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 id={SCAFFOLD_TITLE_ID} className="font-bold text-content-primary text-base font-heading">
                Scaffold New DESIGN.md
              </h3>
              <p className="text-xs text-content-secondary">
                Generate a structured design specification template for your codebase
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsScaffoldModalOpen(false)}
            aria-label="Close scaffold dialog"
            className="p-1.5 rounded-md text-content-secondary hover:text-content-primary hover:bg-surface-inset"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {templateOptions.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedTemplate(option.id)}
                aria-pressed={selectedTemplate === option.id}
                className={clsx(
                  'p-3 rounded-md border text-left text-xs transition-all',
                  selectedTemplate === option.id
                    ? 'bg-accent/15 border-accent text-content-primary font-bold'
                    : 'bg-surface-inset border-line text-content-secondary'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-surface-inset border border-line max-h-60 overflow-y-auto">
            <pre className="text-xs font-mono text-content-primary whitespace-pre leading-relaxed">
              {getTemplateContent()}
            </pre>
          </div>
        </div>

        <div className="p-4 border-t border-line bg-surface-inset flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsScaffoldModalOpen(false)}
            className="px-3 py-1.5 rounded-md text-xs text-content-secondary hover:text-content-primary hover:bg-surface-overlay"
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
              className="px-3.5 py-1.5 rounded-md bg-surface-raised hover:bg-accent/10 text-xs font-bold text-content-primary border border-line hover:border-accent/40 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Download className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Template'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onFileLoaded(getTemplateContent(), `starter-${selectedTemplate}-design.md`);
                setIsScaffoldModalOpen(false);
              }}
              className="px-4 py-1.5 rounded-md bg-accent hover:bg-accent-hover text-xs font-bold text-accent-contrast shadow-deep transition-all"
            >
              Open in Explorer →
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
