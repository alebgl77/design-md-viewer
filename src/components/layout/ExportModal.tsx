import React, { useState } from 'react';
import { Download, Copy, Check, X, FileJson, FileCode, Code, FileText, Bot } from 'lucide-react';
import { DesignSystem } from '../../schema/designSystem';
import {
  exportToJson,
  exportToCssVariables,
  exportToTailwindConfig,
  exportToTailwindV4,
  exportToTypeScriptTheme,
  exportToScssVariables,
  exportToAiPromptRules,
  exportToNormalizedMarkdown,
} from '../../utils/exportFormats';
import { copyToClipboard } from '../../utils/clipboard';
import { Modal } from '../common/Modal';

const TITLE_ID = 'export-modal-title';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: DesignSystem;
}

type ExportTab =
  'json' | 'tailwind-v4' | 'tailwind-v3' | 'css' | 'typescript' | 'scss' | 'ai-rules' | 'markdown';

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, system }) => {
  const [activeTab, setActiveTab] = useState<ExportTab>('json');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  let exportContent = '';
  let fileName = '';
  let mimeType = 'text/plain';

  const baseName = (system.overview.name || system.metadata.fileName.replace(/\.md$/, '') || 'design-tokens')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  switch (activeTab) {
    case 'json':
      exportContent = exportToJson(system);
      fileName = `${baseName}-tokens.json`;
      mimeType = 'application/json';
      break;
    case 'tailwind-v4':
      exportContent = exportToTailwindV4(system);
      fileName = `theme.css`;
      mimeType = 'text/css';
      break;
    case 'tailwind-v3':
      exportContent = exportToTailwindConfig(system);
      fileName = `tailwind.config.js`;
      mimeType = 'application/javascript';
      break;
    case 'css':
      exportContent = exportToCssVariables(system);
      fileName = `${baseName}-tokens.css`;
      mimeType = 'text/css';
      break;
    case 'typescript':
      exportContent = exportToTypeScriptTheme(system);
      fileName = `theme.ts`;
      mimeType = 'application/typescript';
      break;
    case 'scss':
      exportContent = exportToScssVariables(system);
      fileName = `_tokens.scss`;
      mimeType = 'text/x-scss';
      break;
    case 'ai-rules':
      exportContent = exportToAiPromptRules(system);
      fileName = `.cursorrules`;
      mimeType = 'text/plain';
      break;
    case 'markdown':
      exportContent = exportToNormalizedMarkdown(system);
      fileName = `${baseName}-normalized.md`;
      mimeType = 'text/markdown';
      break;
  }

  const handleCopy = async () => {
    const success = await copyToClipboard(exportContent);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exportContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs: { id: ExportTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'json', label: 'W3C Token JSON', icon: FileJson },
    { id: 'tailwind-v4', label: 'Tailwind v4 @theme', icon: Code },
    { id: 'tailwind-v3', label: 'Tailwind v3 Config', icon: Code },
    { id: 'css', label: 'CSS Variables', icon: FileCode },
    { id: 'typescript', label: 'TypeScript Theme', icon: Code },
    { id: 'scss', label: 'SCSS Variables', icon: FileCode },
    { id: 'ai-rules', label: 'AI Prompt / .cursorrules', icon: Bot },
    { id: 'markdown', label: 'Normalized DESIGN.md', icon: FileText },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={TITLE_ID} size="lg" className="max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-line">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-accent/15 text-accent border border-accent/30 flex items-center justify-center">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h2 id={TITLE_ID} className="text-base font-bold text-content-primary">
              Export Design System &amp; Tokens
            </h2>
            <p className="text-xs text-content-secondary">
              Production-ready exports for web frameworks, iOS, Android, Figma, and AI agents
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close export dialog"
          className="p-1 rounded-md text-content-secondary hover:text-content-primary hover:bg-surface-inset"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 px-5 pt-3 border-b border-line bg-surface-inset overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={isActive}
              className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors shrink-0 ${
                isActive
                  ? 'border-accent text-accent'
                  : 'border-transparent text-content-secondary hover:text-content-primary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Code Content Preview */}
      <div className="flex-1 p-5 overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-accent font-semibold">{fileName}</span>
          <span className="text-[11px] text-content-muted">{exportContent.split('\n').length} lines</span>
        </div>

        <div className="flex-1 overflow-auto rounded-lg bg-surface-inset p-4 border border-line">
          <pre className="text-xs font-mono text-content-primary whitespace-pre leading-relaxed">
            {exportContent}
          </pre>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-line bg-surface-inset flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-md text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-surface-overlay"
        >
          Close
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-surface-raised hover:bg-accent/10 border border-line hover:border-accent/40 text-xs font-semibold text-content-primary transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-status-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-accent hover:bg-accent-hover text-xs font-semibold text-accent-contrast shadow-deep active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download File</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
