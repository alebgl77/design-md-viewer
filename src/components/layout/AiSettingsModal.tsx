import React, { useState } from 'react';
import { Bot, Sparkles, X, ShieldAlert, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { DesignSystem } from '../../schema/designSystem';
import { enrichWithAi, AiConfig } from '../../ai/aiEnrichmentService';

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: DesignSystem;
  onEnrichmentComplete: (enrichedSystem: DesignSystem) => void;
}

export const AiSettingsModal: React.FC<AiSettingsModalProps> = ({
  isOpen,
  onClose,
  system,
  onEnrichmentComplete,
}) => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('design_md_gemini_key') || '');
  const [customEndpoint, setCustomEndpoint] = useState(() => localStorage.getItem('design_md_custom_ai') || '');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const handleEnrich = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    setIsSuccess(null);

    // Save preferences
    if (apiKey) localStorage.setItem('design_md_gemini_key', apiKey);
    if (customEndpoint) localStorage.setItem('design_md_custom_ai', customEndpoint);

    const config: AiConfig = {
      apiKey: apiKey.trim() || undefined,
      customEndpoint: customEndpoint.trim() || undefined,
      model,
    };

    const res = await enrichWithAi(system, config);
    setIsLoading(false);
    setIsSuccess(res.success);
    setStatusMessage(res.message);

    if (res.success) {
      onEnrichmentComplete(res.system);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#0e1611] border border-[#1b2b21] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1b2b21]">
          <div className="flex items-center gap-2.5 font-bold text-[#cbd5e1] text-sm">
            <div className="w-8 h-8 rounded-lg bg-[#1d4ed8]/15 text-[#93c5fd] border border-[#1d4ed8]/30 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold">AI Enrichment Engine</div>
              <div className="text-xs text-[#94a3b8] font-normal">Optional semantic analysis & tone extraction</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94a3b8] hover:text-[#cbd5e1] hover:bg-[#15221a]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-[#1d4ed8]/10 border border-[#1d4ed8]/20 text-[#93c5fd] text-xs leading-relaxed space-y-1">
            <div className="font-semibold flex items-center gap-1 text-[#93c5fd]">
              <Sparkles className="w-3.5 h-3.5" />
              Strict Anti-Hallucination Policy
            </div>
            <p className="text-[#93c5fd]/80">
              AI enrichment only extracts higher-level conceptual insights (taglines, design tone, component summaries). It will <strong className="text-[#93c5fd]">never invent fake hex codes or pixel measurements</strong>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 rounded-lg bg-[#0b0f0c] border border-[#1b2b21] focus:border-[#1d4ed8] text-[#cbd5e1] text-xs font-mono placeholder-[#64748b] focus:outline-none"
            />
            <span className="text-[11px] text-[#64748b] mt-1 block">
              Key remains stored locally in your browser session.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0b0f0c] border border-[#1b2b21] text-[#cbd5e1] text-xs focus:border-[#1d4ed8] focus:outline-none"
            >
              <option value="gemini-1.5-flash">gemini-1.5-flash (Fast & Recommended)</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro (Deep reasoning)</option>
            </select>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              isSuccess ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {isSuccess ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1b2b21] bg-[#0b0f0c]/60 flex items-center justify-between">
          <span className="text-[11px] text-[#64748b]">
            {system.metadata.isAiEnriched ? 'Currently enriched' : 'Running deterministic mode'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#94a3b8] hover:text-[#cbd5e1] hover:bg-[#15221a]"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleEnrich}
              disabled={isLoading || (!apiKey.trim() && !customEndpoint.trim())}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1d4ed8] hover:bg-[#1d4ed8] disabled:opacity-50 text-xs font-semibold text-white shadow-md shadow-[#1d4ed8]/20 active:scale-95 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enriching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run AI Enrichment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
