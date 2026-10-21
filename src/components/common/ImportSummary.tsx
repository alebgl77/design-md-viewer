import React from 'react';
import { FileCode2, Info } from 'lucide-react';
import type { ImportResult } from '../../importers';
import { isGeneratedImport } from './importPresentation';

interface ImportSummaryProps {
  result: Pick<ImportResult, 'sources' | 'warnings'>;
}

export const ImportSummary: React.FC<ImportSummaryProps> = ({ result }) => {
  const generated = isGeneratedImport(result.sources);
  const warnings = [
    ...new Set(
      result.warnings.length > 0
        ? result.warnings
        : result.sources.flatMap(source => source.warnings.map(warning => `${source.name}: ${warning}`))
    ),
  ];

  return (
    <section
      aria-label="Import summary"
      className="mb-6 min-w-0 rounded-lg border border-line bg-surface-raised px-4 py-3 text-xs"
    >
      <div className="flex items-start gap-2.5">
        <FileCode2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-content-primary">
            {generated ? 'Generated DESIGN.md' : 'Markdown source'}
            <span className="ml-2 font-normal text-content-secondary">
              {result.sources.length} {result.sources.length === 1 ? 'source' : 'sources'}
            </span>
          </p>
          <details className="mt-1.5 text-content-secondary">
            <summary className="cursor-pointer break-words leading-relaxed hover:text-content-primary">
              {result.sources
                .slice(0, 2)
                .map(source => `${source.name} (${source.format})`)
                .join(', ')}
              {result.sources.length > 2 && ` + ${result.sources.length - 2} more`}
            </summary>
            <ul className="mt-2 space-y-1 pl-4">
              {result.sources.map((source, index) => (
                <li key={`${source.name}-${index}`} className="break-words">
                  <span className="font-mono">{source.name}</span> · {source.format}
                </li>
              ))}
            </ul>
          </details>
          {generated && (
            <p className="mt-2 leading-relaxed text-content-muted">
              Source links open the generated Markdown. Images provide palettes only; PDFs provide selectable
              text only. Review extracted values before using them.
            </p>
          )}
          {warnings.length > 0 && (
            <details className="mt-2 text-status-warning">
              <summary className="cursor-pointer font-semibold">
                <Info className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
                {warnings.length} import {warnings.length === 1 ? 'note' : 'notes'}
              </summary>
              <ul className="mt-2 list-disc space-y-1.5 pl-4 leading-relaxed">
                {warnings.map(warning => (
                  <li key={warning} className="break-words">
                    {warning}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </section>
  );
};
