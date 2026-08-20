import React, { useState } from 'react';
import { Bot, Sparkles, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { DesignSystem } from '../../schema/designSystem';
import { enrichWithAi, AiConfig } from '../../ai/aiEnrichmentService';
import { Modal } from '../common/Modal';

const TITLE_ID = 'ai-settings-modal-title';

const GEMINI_KEY_STORAGE = 'design_md_gemini_key';
const CUSTOM_ENDPOINT_STORAGE = 'design_md_custom_ai';

/**
 * The UI promises the key "remains stored locally in your browser session", so
 * it is held in sessionStorage: it dies with the tab instead of outliving the
 * user's intent in localStorage. Any key written by an earlier build is
 * migrated out of localStorage on first read so the old permanent copy of the
 * secret does not linger.
 *
 * Storage access is guarded because it throws outright when cookies are blocked
 * or the app runs in a sandboxed frame — a settings panel must not white-screen
 * over that.
 */
function readStoredApiKey(): string {
  try {
    const sessionValue = sessionStorage.getItem(GEMINI_KEY_STORAGE);
    if (sessionValue) return sessionValue;

    const legacyValue = localStorage.getItem(GEMINI_KEY_STORAGE);
    if (legacyValue) {
      sessionStorage.setItem(GEMINI_KEY_STORAGE, legacyValue);
      localStorage.removeItem(GEMINI_KEY_STORAGE);
      return legacyValue;
    }
  } catch {
    // Storage unavailable - fall through to an empty key.
  }
  return '';
}

function writeStoredApiKey(value: string): void {
  try {
    if (value) {
      sessionStorage.setItem(GEMINI_KEY_STORAGE, value);
    } else {
      sessionStorage.removeItem(GEMINI_KEY_STORAGE);
    }
    // Belt and braces: never leave a copy behind in the permanent store.
    localStorage.removeItem(GEMINI_KEY_STORAGE);
  } catch {
    // Storage unavailable - the key simply stays in memory for this session.
  }
}

/** The endpoint is a preference, not a secret, so it may persist. */
function readStoredEndpoint(): string {
  try {
    return localStorage.getItem(CUSTOM_ENDPOINT_STORAGE) || '';
  } catch {
    return '';
  }
}

function writeStoredEndpoint(value: string): void {
  try {
    if (value) {
      localStorage.setItem(CUSTOM_ENDPOINT_STORAGE, value);
    } else {
      localStorage.removeItem(CUSTOM_ENDPOINT_STORAGE);
    }
  } catch {
    // Storage unavailable - preference is not persisted.
  }
}

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
  const [apiKey, setApiKey] = useState(readStoredApiKey);
  const [customEndpoint] = useState(readStoredEndpoint);
  const [model, setModel] = useState('gemini-1.5-flash');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const handleClearKey = () => {
    setApiKey('');
    writeStoredApiKey('');
  };

  const handleEnrich = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    setIsSuccess(null);

    // Save preferences
    writeStoredApiKey(apiKey);
    writeStoredEndpoint(customEndpoint);

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
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={TITLE_ID} size="sm">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-line">
        <div className="flex items-center gap-2.5 font-bold text-content-primary text-sm">
          <div className="w-8 h-8 rounded-md bg-accent/15 text-accent border border-accent/30 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 id={TITLE_ID} className="text-base font-bold">
              AI Enrichment Engine
            </h2>
            <div className="text-xs text-content-secondary font-normal">
              Optional semantic analysis &amp; tone extraction
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close AI enrichment settings"
          className="p-1 rounded-md text-content-secondary hover:text-content-primary hover:bg-surface-inset"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <div className="p-3.5 rounded-lg bg-accent/10 border border-accent/30 text-xs leading-relaxed space-y-1">
          <div className="font-semibold flex items-center gap-1 text-accent">
            <Sparkles className="w-3.5 h-3.5" />
            Strict Anti-Hallucination Policy
          </div>
          <p className="text-content-secondary">
            AI enrichment only extracts higher-level conceptual insights (taglines, design tone, component
            summaries). It will{' '}
            <strong className="text-content-primary">
              never invent fake hex codes or pixel measurements
            </strong>
            .
          </p>
        </div>

        <div>
          <label
            htmlFor="ai-settings-api-key"
            className="block text-xs font-semibold text-content-primary mb-1.5"
          >
            Google Gemini API Key
          </label>
          <input
            id="ai-settings-api-key"
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-3 py-2 rounded-sm bg-surface-inset border border-line focus:border-accent text-content-primary text-xs font-mono placeholder-content-muted focus:outline-none"
          />
          <div className="mt-1 flex items-center justify-between gap-3">
            <span className="text-[11px] text-content-muted">
              Key remains stored locally in your browser session.
            </span>
            {apiKey && (
              <button
                type="button"
                onClick={handleClearKey}
                className="shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold text-content-secondary hover:text-content-primary hover:bg-surface-inset"
              >
                Clear key
              </button>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="ai-settings-model"
            className="block text-xs font-semibold text-content-primary mb-1.5"
          >
            Model
          </label>
          <select
            id="ai-settings-model"
            value={model}
            onChange={e => setModel(e.target.value)}
            className="w-full px-3 py-2 rounded-sm bg-surface-inset border border-line text-content-primary text-xs focus:border-accent focus:outline-none"
          >
            <option value="gemini-1.5-flash">gemini-1.5-flash (Fast &amp; Recommended)</option>
            <option value="gemini-1.5-pro">gemini-1.5-pro (Deep reasoning)</option>
          </select>
        </div>

        {statusMessage && (
          <div
            role="status"
            className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
              isSuccess
                ? 'bg-status-success/10 border-status-success/30 text-status-success'
                : 'bg-status-danger/10 border-status-danger/30 text-status-danger'
            }`}
          >
            {isSuccess ? (
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-line bg-surface-inset flex items-center justify-between">
        <span className="text-[11px] text-content-muted">
          {system.metadata.isAiEnriched ? 'Currently enriched' : 'Running deterministic mode'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-surface-overlay"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleEnrich}
            disabled={isLoading || (!apiKey.trim() && !customEndpoint.trim())}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-accent hover:bg-accent-hover disabled:opacity-50 text-xs font-semibold text-accent-contrast shadow-deep active:scale-95 transition-all"
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
    </Modal>
  );
};
