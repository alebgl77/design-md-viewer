import React, { useState } from 'react';
import { Tag, ArrowRight, Search, GitBranch } from 'lucide-react';
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

  const categories = ['All', ...Array.from(new Set(tokens.map(t => t.category)))];

  const filteredTokens = tokens.filter(t => {
    const matchesCat = filterCategory === 'All' || t.category === filterCategory;
    const matchesSearch =
      searchQuery === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.cssVariable?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1b2b21]">
        <div>
          <h2 className="text-xl font-bold text-[#cbd5e1] flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#34d399]" />
            Design Tokens & Variable Aliases
          </h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            {tokens.length} raw CSS variables and resolved alias relationships.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tokens..."
            className="px-3 py-1.5 rounded-lg bg-[#0e1611] border border-[#1b2b21] text-xs text-[#cbd5e1] placeholder-[#64748b] focus:outline-none focus:border-[#10b981] w-full sm:w-48"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${
              filterCategory === cat
                ? 'bg-[#10b981]/15 border border-[#10b981]/40 text-[#34d399]'
                : 'bg-[#0e1611]/60 border border-[#1b2b21] text-[#94a3b8] hover:text-[#cbd5e1]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tokens Table */}
      <div className="rounded-2xl border border-[#1b2b21] bg-[#0e1611]/60 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-[#cbd5e1]">
          <thead className="bg-black/80 border-b border-[#1b2b21] text-[#94a3b8] uppercase font-semibold text-[11px]">
            <tr>
              <th className="p-3.5">CSS Variable</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Raw Value</th>
              <th className="p-3.5">Resolved Alias</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2b21]/60 font-mono">
            {filteredTokens.map((token) => (
              <tr key={token.id} className="hover:bg-[#15221a]/40 transition-colors">
                <td className="p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#34d399]">{token.cssVariable || token.name}</span>
                    {token.references && token.references.length > 0 && (
                      <Badge variant="inferred" size="sm" title={`Aliases ${token.references.join(', ')}`}>
                        <GitBranch className="w-3 h-3" />
                        Alias
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="p-3.5 font-sans">
                  <Badge variant="neutral" size="sm">
                    {token.category}
                  </Badge>
                </td>
                <td className="p-3.5 text-[#cbd5e1]">
                  <span className="bg-[#0b0f0c] px-2 py-0.5 rounded border border-[#1b2b21]">
                    {token.value}
                  </span>
                </td>
                <td className="p-3.5">
                  {token.resolvedValue ? (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <ArrowRight className="w-3 h-3 text-[#64748b]" />
                      <span className="bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60">
                        {token.resolvedValue}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[#64748b] font-sans text-xs">Direct value</span>
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
  );
};
