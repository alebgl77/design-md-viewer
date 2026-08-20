import React, { useMemo, useState } from 'react';
import { Tag, ArrowRight, GitBranch } from 'lucide-react';
import { clsx } from 'clsx';
import { GenericToken } from '../../schema/designSystem';
import { CopyButton } from '../../components/common/CopyButton';
import { ProvenancePopover } from '../../components/common/ProvenancePopover';
import { Badge } from '../../components/common/Badge';

interface TokensViewProps {
  tokens: GenericToken[];
  onNavigateToSource?: (lineNumber?: number) => void;
}

export const TokensView: React.FC<TokensViewProps> = ({ tokens, onNavigateToSource }) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(tokens.map(t => t.category)))],
    [tokens]
  );

  const filteredTokens = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return tokens.filter(t => {
      const matchesCat = filterCategory === 'All' || t.category === filterCategory;
      const matchesSearch =
        query === '' ||
        t.name.toLowerCase().includes(query) ||
        t.value.toLowerCase().includes(query) ||
        t.cssVariable?.toLowerCase().includes(query);
      return matchesCat && matchesSearch;
    });
  }, [tokens, filterCategory, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <h1 className="text-xl font-bold text-content-primary flex items-center gap-2">
            <Tag className="w-5 h-5 text-accent" />
            Design Tokens &amp; Variable Aliases
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            <span className="tabular-nums">{tokens.length}</span> raw CSS variables and resolved alias relationships.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tokens..."
            aria-label="Search tokens"
            className="px-3 py-1.5 rounded-sm bg-surface-raised border border-line text-xs text-content-primary placeholder-content-muted focus:outline-none focus:border-accent w-full sm:w-48"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const isActive = filterCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              aria-pressed={isActive}
              onClick={() => setFilterCategory(cat)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 border',
                isActive
                  ? 'bg-accent/15 border-accent/40 text-accent'
                  : 'bg-surface-raised border-line text-content-secondary hover:text-content-primary hover:border-line-strong'
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Tokens Table.
          Only the horizontal axis scrolls, and it does so on this wrapper alone — the
          ProvenancePopover escapes to a portal, so nothing here needs to clip it. */}
      <div className="rounded-lg border border-line bg-surface-raised shadow-deep">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-content-secondary">
            <caption className="sr-only">
              Design tokens with their category, raw value, resolved alias and per-token actions
            </caption>
            <thead className="bg-surface-inset border-b border-line text-content-secondary uppercase font-semibold text-[11px]">
              <tr>
                <th scope="col" className="p-3.5">CSS Variable</th>
                <th scope="col" className="p-3.5">Category</th>
                <th scope="col" className="p-3.5">Raw Value</th>
                <th scope="col" className="p-3.5">Resolved Alias</th>
                <th scope="col" className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle font-mono">
              {filteredTokens.map((token) => (
                <tr key={token.id} className="hover:bg-surface-overlay transition-colors">
                  <th scope="row" className="p-3.5 font-normal text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-accent">{token.cssVariable || token.name}</span>
                      {token.references && token.references.length > 0 && (
                        <Badge variant="inferred" size="sm" title={`Aliases ${token.references.join(', ')}`}>
                          <GitBranch className="w-3 h-3" aria-hidden="true" />
                          Alias
                        </Badge>
                      )}
                    </div>
                  </th>
                  <td className="p-3.5 font-sans">
                    <Badge variant="neutral" size="sm">
                      {token.category}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-content-primary">
                    <span className="bg-surface-inset px-2 py-0.5 rounded-sm border border-line-subtle">
                      {token.value}
                    </span>
                  </td>
                  <td className="p-3.5">
                    {token.resolvedValue ? (
                      <div className="flex items-center gap-1.5 text-accent">
                        <ArrowRight className="w-3 h-3 text-content-muted" aria-hidden="true" />
                        <span className="bg-accent/10 px-2 py-0.5 rounded-sm border border-accent/30">
                          {token.resolvedValue}
                        </span>
                      </div>
                    ) : (
                      <span className="text-content-muted font-sans text-xs">Direct value</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right font-sans">
                    <div className="flex items-center justify-end gap-1.5">
                      <CopyButton
                        text={`${token.cssVariable || token.name}: ${token.value};`}
                        label="CSS"
                        variant="secondary"
                      />
                      <ProvenancePopover
                        provenance={token.provenance}
                        confidence={token.confidence}
                        itemName={token.name}
                        onNavigateToSource={onNavigateToSource}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
