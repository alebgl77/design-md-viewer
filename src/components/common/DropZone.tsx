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
  LoaderCircle,
  ClipboardPaste,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  SAMPLE_SCRAPED_DESIGN_SYSTEM,
  SAMPLE_MINIMAL_COLORS,
  SAMPLE_NARRATIVE_GUIDELINES,
  SAMPLE_CYBERPUNK_TOKENS,
} from '../../samples/fixtures';
import { copyToClipboard } from '../../utils/clipboard';
import { Modal } from './Modal';
import { AnimatedLogo } from './AnimatedLogo';
import { ACCEPTED_SOURCE_EXTENSIONS, importFiles, importSources, type ImportResult } from '../../importers';
import { createPastedSource, PASTE_FORMATS, type PasteFormat } from './importPresentation';

const SCAFFOLD_TITLE_ID = 'scaffold-modal-title';

interface DropZoneProps {
  onFileLoaded: (content: string, fileName: string) => void;
  onImportComplete: (result: ImportResult) => void;
  onImportStart: () => void;
  error?: string | null;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileLoaded,
  onImportComplete,
  onImportStart,
  error: externalError,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pastedContent, setPastedContent] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [pasteFormat, setPasteFormat] = useState<PasteFormat>('md');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isScaffoldModalOpen, setIsScaffoldModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'scraped' | 'mobile' | 'minimal' | 'cyberpunk'>(
    'scraped'
  );
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInProgress = useRef(false);

  const error = externalError || localError;

  const runImport = async (readSources: () => Promise<ImportResult>) => {
    if (importInProgress.current) return;
    importInProgress.current = true;
    setIsImporting(true);
    setLocalError(null);
    onImportStart();
    try {
      const result = await readSources();
      onImportComplete(result);
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Could not read these sources. Please try again.');
    } finally {
      importInProgress.current = false;
      setIsImporting(false);
    }
  };

  const handleFileProcess = (files: File[]) => {
    if (files.length > 0) void runImport(() => importFiles(files));
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runImport(async () => {
      const source = createPastedSource(pastedContent, sourceName, pasteFormat);
      // Let the loading state paint before the synchronous text import begins.
      await new Promise<void>(resolve => window.setTimeout(resolve, 0));
      return importSources([source]);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!importInProgress.current) setIsDragging(true);
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
      handleFileProcess(Array.from(e.dataTransfer.files));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!importInProgress.current && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleExampleLoaded = (content: string, fileName: string) => {
    if (!importInProgress.current) onFileLoaded(content, fileName);
  };

  const getTemplateContent = () => {
    switch (selectedTemplate) {
      case 'scraped':
        return SAMPLE_SCRAPED_DESIGN_SYSTEM;
      case 'mobile':
        return SAMPLE_NARRATIVE_GUIDELINES;
      case 'minimal':
        return SAMPLE_MINIMAL_COLORS;
      case 'cyberpunk':
        return SAMPLE_CYBERPUNK_TOKENS;
    }
  };

  const templateOptions: { id: typeof selectedTemplate; label: string }[] = [
    { id: 'scraped', label: 'Extracted Site' },
    { id: 'mobile', label: 'Mobile & Consumer' },
    { id: 'minimal', label: 'Minimal Palette' },
    { id: 'cyberpunk', label: 'Cyberpunk HUD' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto py-6 sm:py-10 flex flex-col items-center justify-center animate-in fade-in duration-300">
      {/* Brand Header */}
      <div className="text-center max-w-2xl mb-8">
        {/*
          The mark, at the one moment there is room for it. The header tile shows it at 22px, where
          the swatch cascade is barely legible; here it carries the whole screen, and the animation
          reads as what it depicts: a written document resolving into colour, which is the thing the
          user is about to do. Hidden from assistive tech because the h1 below already names the app.
        */}
        <AnimatedLogo size={96} className="mx-auto mb-6" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-sm bg-accent/15 border border-accent/30 text-accent text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Design System Visualizer</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-content-primary mb-4 font-heading">
          Design.md <span className="text-accent">Visual Explorer</span>
        </h1>
        <p className="text-content-secondary text-base sm:text-lg leading-relaxed font-normal">
          Turn local files or pasted content into a structured{' '}
          <code className="text-accent bg-surface-overlay border border-line px-2 py-0.5 rounded-sm font-mono text-sm">
            design.md
          </code>{' '}
          you can explore, review, and export.
        </p>
      </div>

      <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <input
          type="file"
          aria-label="Choose source files"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept={ACCEPTED_SOURCE_EXTENSIONS}
          multiple
          disabled={isImporting}
          className="hidden"
        />
        <div
          role="button"
          tabIndex={isImporting ? -1 : 0}
          aria-label="Import source files: drop files here or browse your computer"
          aria-describedby="source-file-formats source-import-limits"
          aria-disabled={isImporting}
          aria-busy={isImporting}
          onClick={() => {
            if (!importInProgress.current) fileInputRef.current?.click();
          }}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={clsx(
            'min-w-0 relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden p-6 sm:p-8 text-center focus:ring-4 focus:ring-accent/20 flex items-center justify-center',
            isImporting ? 'cursor-wait' : 'cursor-pointer',
            isDragging
              ? 'border-accent bg-accent/10 shadow-chromatic-glow'
              : 'border-line hover:border-accent/50 bg-surface-raised hover:bg-accent/5 shadow-chromatic'
          )}
        >
          <div className="flex flex-col items-center justify-center pointer-events-none">
            <div
              className={clsx(
                'w-16 h-16 rounded-lg flex items-center justify-center mb-5 transition-transform duration-200',
                isDragging
                  ? 'scale-110 bg-accent text-accent-contrast'
                  : 'bg-surface-overlay text-accent border border-line'
              )}
            >
              {isImporting ? (
                <LoaderCircle className="w-8 h-8 animate-spin" aria-hidden="true" />
              ) : (
                <UploadCloud className="w-8 h-8" aria-hidden="true" />
              )}
            </div>
            <h2 className="text-2xl font-extrabold text-content-primary mb-2 font-heading">
              {isImporting
                ? 'Reading your sources…'
                : isDragging
                  ? 'Drop your sources right here'
                  : 'Bring your sources together'}
            </h2>
            <p className="text-sm text-content-secondary max-w-md mb-5">
              Drag & drop multiple files, or{' '}
              <span className="text-accent font-semibold underline underline-offset-4">
                browse your computer
              </span>
            </p>
            <div
              id="source-file-formats"
              className="rounded-md bg-surface-inset border border-line px-4 py-3 text-xs text-content-secondary leading-relaxed"
            >
              <p className="flex items-center justify-center gap-2 font-mono">
                <FileCode2 className="w-4 h-4 shrink-0 text-accent" aria-hidden="true" />
                Markdown · CSS · JSON · HTML · SVG · TXT
              </p>
              <p className="mt-1">PNG, JPEG & WebP palettes · PDF text</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handlePasteSubmit}
          aria-label="Generate DESIGN.md from pasted content"
          className="min-w-0 rounded-xl border border-line bg-surface-raised p-5 sm:p-6 shadow-deep"
        >
          <div className="mb-4 flex items-center gap-2 text-content-primary">
            <ClipboardPaste className="h-4 w-4 text-accent" aria-hidden="true" />
            <h2 className="font-heading text-lg font-bold">Or start with a paste</h2>
          </div>
          <fieldset disabled={isImporting} className="min-w-0 space-y-3 disabled:opacity-60">
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor="paste-source-name" className="mb-1.5 block text-xs text-content-secondary">
                  Source name <span className="text-content-muted">(optional)</span>
                </label>
                <input
                  id="paste-source-name"
                  value={sourceName}
                  onChange={e => setSourceName(e.target.value)}
                  placeholder="pasted-source"
                  aria-describedby="paste-format-hint"
                  className="w-full min-w-0 rounded-md border border-line bg-surface-inset px-3 py-2 text-xs text-content-primary placeholder:text-content-muted"
                />
              </div>
              <div className="min-w-0">
                <label htmlFor="paste-source-format" className="mb-1.5 block text-xs text-content-secondary">
                  Content format
                </label>
                <select
                  id="paste-source-format"
                  value={pasteFormat}
                  onChange={e => setPasteFormat(e.target.value as PasteFormat)}
                  aria-describedby="paste-format-hint"
                  className="w-full min-w-0 rounded-md border border-line bg-surface-inset px-3 py-2 text-xs text-content-primary"
                >
                  {PASTE_FORMATS.map(format => (
                    <option key={format.extension} value={format.extension}>
                      {format.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p id="paste-format-hint" className="text-[11px] text-content-muted">
              The selected format sets the source file extension.
            </p>
            <div>
              <label htmlFor="paste-source-content" className="mb-1.5 block text-xs text-content-secondary">
                Source content
              </label>
              <textarea
                id="paste-source-content"
                value={pastedContent}
                onChange={e => setPastedContent(e.target.value)}
                rows={5}
                spellCheck={false}
                placeholder="Paste design guidelines, CSS variables, tokens, HTML, or SVG…"
                className="block w-full min-w-0 resize-y rounded-md border border-line bg-surface-inset px-3 py-2.5 font-mono text-xs leading-relaxed text-content-primary placeholder:text-content-muted"
              />
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-xs font-bold text-accent-contrast transition-colors hover:bg-accent-hover disabled:cursor-wait"
            >
              {isImporting ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {isImporting ? 'Reading sources…' : 'Generate DESIGN.md'}
            </button>
          </fieldset>
        </form>
      </div>
      <div
        id="source-import-limits"
        className="mt-4 w-full text-center text-xs text-content-muted leading-relaxed"
      >
        <p>Up to 20 files · 20 MiB total · 2 MiB per text file · 10 MiB per image or PDF</p>
        <p className="mt-1">
          Images: palette only. PDFs: selectable text, up to 25 pages. No OCR or remote URLs.
        </p>
        <p className="mt-1 text-content-secondary">
          Processed locally in your browser. No upload or AI calls.
        </p>
      </div>
      {isImporting && (
        <p role="status" aria-live="polite" className="mt-3 text-sm text-accent">
          Reading sources and preparing your design system…
        </p>
      )}

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="w-full mt-4 p-4 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger text-sm flex items-start gap-3 animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-0.5">Could not import sources</div>
            <div className="break-words">{error}</div>
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
          disabled={isImporting}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent/15 hover:bg-accent/25 border border-accent/40 text-accent text-xs font-bold transition-all shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5 text-accent" />
          <span>Scaffold Starter DESIGN.md</span>
        </button>
      </div>

      {/* Quick Sample Selector */}
      <fieldset disabled={isImporting} className="w-full min-w-0 mt-8 disabled:opacity-60">
        <div className="text-center mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-content-secondary font-heading">
            Or test with instant sample specifications:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => handleExampleLoaded(SAMPLE_SCRAPED_DESIGN_SYSTEM, 'meridian-design-system.md')}
            className="flex flex-col text-left p-4 rounded-lg bg-surface-raised hover:bg-accent/5 border border-line hover:border-accent/50 transition-all group shadow-deep"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-content-primary group-hover:text-accent flex items-center gap-1.5 font-heading">
                <Layers className="w-3.5 h-3.5 text-accent" />
                Extracted Site System
              </span>
              <ArrowRight className="w-3 h-3 text-content-secondary group-hover:text-accent group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[11px] text-content-secondary line-clamp-2 leading-relaxed">
              Bricolage Grotesque headings, #0b0f0c dark canvas, #10b981 emerald, pill buttons & 24px cards.
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleExampleLoaded(SAMPLE_MINIMAL_COLORS, 'chroma-palette.md')}
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
            onClick={() => handleExampleLoaded(SAMPLE_NARRATIVE_GUIDELINES, 'aurora-guidelines.md')}
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
            onClick={() => handleExampleLoaded(SAMPLE_CYBERPUNK_TOKENS, 'cyberpunk-tokens.md')}
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
      </fieldset>

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
              disabled={isImporting}
              onClick={() => {
                handleExampleLoaded(getTemplateContent(), `starter-${selectedTemplate}-design.md`);
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
