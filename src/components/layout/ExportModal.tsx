import React, { useState } from 'react';
import { Download, Copy, Check, X, FileJson, FileCode, Code, FileText, Bot, Sparkles } from 'lucide-react';
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

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: DesignSystem;
}

type ExportTab = 'json' | 'tailwind-v4' | 'tailwind-v3' | 'css' | 'typescript' | 'scss' | 'ai-rules' | 'markdown';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  system,
}) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-[#0e1611] border border-[#1b2b21] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1b2b21]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#cbd5e1]">Export Design System & Tokens</h2>
              <p className="text-xs text-[#94a3b8]">Production-ready exports for web frameworks, iOS, Android, Figma, and AI agents</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94a3b8] hover:text-[#cbd5e1] hover:bg-[#15221a]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-[#1b2b21] bg-[#0b0f0c]/40 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors shrink-0 ${
                  isActive ? 'border-[#10b981] text-[#34d399]' : 'border-transparent text-[#94a3b8] hover:text-[#cbd5e1]'
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
            <span className="text-xs font-mono text-[#34d399] font-semibold">{fileName}</span>
            <span className="text-[11px] text-[#64748b]">{exportContent.split('\n').length} lines</span>
          </div>

          <div className="flex-1 overflow-auto rounded-xl bg-[#0b0f0c] p-4 border border-[#1b2b21]">
            <pre className="text-xs font-mono text-[#cbd5e1] whitespace-pre leading-relaxed">
              {exportContent}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#1b2b21] bg-[#0b0f0c]/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#94a3b8] hover:text-[#cbd5e1] hover:bg-[#15221a]"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#15221a] hover:bg-[#1a2a20] border border-[#1b2b21] text-xs font-semibold text-[#cbd5e1] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0c6e4e] hover:bg-[#10b981] text-xs font-semibold text-white shadow-md shadow-[#10b981]/20 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
