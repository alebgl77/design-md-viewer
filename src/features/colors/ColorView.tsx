import React, { useState } from 'react';
import { Palette, LayoutGrid, List, Eye, ShieldCheck, Check, X } from 'lucide-react';
import { ColorToken } from '../../schema/designSystem';
import { CopyButton } from '../../components/common/CopyButton';
import { ProvenancePopover } from '../../components/common/ProvenancePopover';
import { Badge } from '../../components/common/Badge';
import { simulateColorVision, ColorVisionMode } from '../../normalizers/colorBlindness';
import { getContrastRatio } from '../../normalizers/colorNormalizer';

interface ColorViewProps {
  colors: ColorToken[];
  onNavigateToSource?: (lineNumber?: number) => void;
}

export const ColorView: React.FC<ColorViewProps> = ({ colors, onNavigateToSource }) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'matrix'>('grid');
  const [searchFilter, setSearchFilter] = useState('');
  const [visionMode, setVisionMode] = useState<ColorVisionMode>('normal');

  const groups = ['all', 'brand', 'neutral', 'surface', 'semantic', 'accent', 'other'];

  const filteredColors = colors.filter(col => {
    const matchesGroup = selectedGroup === 'all' || col.paletteGroup === selectedGroup;
    const matchesSearch =
      searchFilter === '' ||
      col.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      col.hex.toLowerCase().includes(searchFilter.toLowerCase()) ||
      col.role?.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const surfaceColors = colors.filter(c => c.paletteGroup === 'surface' || /bg|background|surface|canvas/i.test(c.name));
  const effectiveSurfaces = surfaceColors.length > 0 ? surfaceColors : colors.slice(0, 4);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1b2b21]">
        <div>
          <h2 className="text-xl font-bold text-[#cbd5e1] flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#34d399]" />
            Color Palette & Vision Simulator
          </h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            {colors.length} color swatches with computed WCAG contrast and Color Vision Deficiency simulation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Colorblindness Simulator Selector */}
          <div className="flex items-center gap-1.5 bg-[#0e1611] border border-[#1b2b21] rounded-lg px-2.5 py-1 text-xs">
            <Eye className="w-3.5 h-3.5 text-[#34d399] shrink-0" />
            <select
              value={visionMode}
              onChange={(e) => setVisionMode(e.target.value as ColorVisionMode)}
              className="bg-transparent text-[#cbd5e1] text-xs focus:outline-none cursor-pointer"
            >
              <option value="normal" className="bg-[#0e1611]">Normal Vision</option>
              <option value="protanopia" className="bg-[#0e1611]">Protanopia (Red-Blind)</option>
              <option value="deuteranopia" className="bg-[#0e1611]">Deuteranopia (Green-Blind)</option>
              <option value="tritanopia" className="bg-[#0e1611]">Tritanopia (Blue-Blind)</option>
              <option value="achromatopsia" className="bg-[#0e1611]">Achromatopsia (Grayscale)</option>
            </select>
          </div>

          {/* Search input */}
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter colors..."
            className="px-3 py-1.5 rounded-lg bg-[#0e1611] border border-[#1b2b21] text-xs text-[#cbd5e1] placeholder-[#64748b] focus:outline-none focus:border-[#10b981] w-full sm:w-40"
          />

          {/* View mode toggle */}
          <div className="flex items-center bg-[#0e1611] border border-[#1b2b21] rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[#0c6e4e] text-white' : 'text-[#94a3b8] hover:text-[#cbd5e1]'}`}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-[#0c6e4e] text-white' : 'text-[#94a3b8] hover:text-[#cbd5e1]'}`}
              title="Table view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${viewMode === 'matrix' ? 'bg-[#0c6e4e] text-white' : 'text-[#94a3b8] hover:text-[#cbd5e1]'}`}
              title="Contrast Matrix"
            >
              WCAG Matrix
            </button>
          </div>
        </div>
      </div>

      {/* Vision Mode Active Indicator Alert */}
      {visionMode !== 'normal' && (
        <div className="p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 text-[#34d399] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#34d399]" />
            <span>Simulating <strong>{visionMode.toUpperCase()}</strong>: Colors transformed to model how vision-impaired users perceive your design system.</span>
          </div>
          <button
            onClick={() => setVisionMode('normal')}
            className="text-xs font-semibold text-[#34d399] underline hover:text-white"
          >
            Reset
          </button>
        </div>
      )}

      {/* Palette Group Filter Tabs */}
      {viewMode !== 'matrix' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {groups.map(group => {
            const count = group === 'all' ? colors.length : colors.filter(c => c.paletteGroup === group).length;
            if (count === 0 && group !== 'all') return null;

            return (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1.5 ${
                  selectedGroup === group
                    ? 'bg-[#10b981]/15 border border-[#10b981]/40 text-[#34d399]'
                    : 'bg-[#0e1611]/60 border border-[#1b2b21] text-[#94a3b8] hover:text-[#cbd5e1] hover:bg-[#15221a]'
                }`}
              >
                <span>{group}</span>
                <span className="text-[10px] font-mono opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredColors.map((color) => {
            const renderedHex = simulateColorVision(color.hex, visionMode);
            const contrast = color.contrastWithBg;
            // Overlay legibility depends on the swatch itself, not on the document background.
            const swatchReadsOnLight = contrast ? contrast.ratioOnLight > contrast.ratioOnDark : false;
            const cssDeclaration = `--color-${color.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}: ${color.hex};`;

            return (
              <div
                key={color.id}
                className="group flex flex-col rounded-2xl bg-[#0e1611]/70 border border-[#1b2b21] hover:border-[#1b2b21] overflow-hidden shadow-lg transition-all"
              >
                {/* Visual Swatch */}
                <div
                  className="h-28 w-full relative p-3 flex flex-col justify-between shadow-inner transition-colors duration-300"
                  style={{ backgroundColor: renderedHex }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm"
                      style={{
                        backgroundColor: swatchReadsOnLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)',
                        color: swatchReadsOnLight ? '#ffffff' : '#000000',
                      }}
                    >
                      {color.paletteGroup}
                    </span>

                    <ProvenancePopover
                      provenance={color.provenance}
                      confidence={color.confidence}
                      itemName={color.name}
                      onNavigateToSource={onNavigateToSource}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded shadow-sm"
                      style={{
                        backgroundColor: swatchReadsOnLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)',
                        color: swatchReadsOnLight ? '#ffffff' : '#000000',
                      }}
                    >
                      {renderedHex}
                    </span>
                    <CopyButton
                      text={color.hex}
                      title="Copy HEX code"
                      className="bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm shadow-sm"
                    />
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="font-bold text-sm text-[#cbd5e1] mb-1">{color.name}</div>
                    <div className="text-xs text-[#94a3b8] line-clamp-1">{color.role || 'Design system color'}</div>
                  </div>

                  {/* Values List */}
                  <div className="space-y-1.5 pt-2 border-t border-[#1b2b21]/80 font-mono text-[11px] text-[#94a3b8]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748b]">HEX (Original):</span>
                      <span className="text-[#cbd5e1]">{color.hex}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748b]">RGB:</span>
                      <span className="text-[#cbd5e1]">{color.rgb}</span>
                    </div>
                  </div>

                  {/* Contrast & Quick Copy Actions */}
                  <div className="pt-3 border-t border-[#1b2b21]/80 flex items-center justify-between">
                    {contrast ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-[#94a3b8]">Contrast:</span>
                        <Badge
                          variant={contrast.aaaCompliant ? 'success' : contrast.aaCompliant ? 'brand' : 'warning'}
                          size="sm"
                        >
                          {contrast.ratio}:1 {contrast.aaaCompliant ? 'AAA' : contrast.aaCompliant ? 'AA' : 'Fail'}
                        </Badge>
                      </div>
                    ) : (
                      <span />
                    )}

                    <CopyButton
                      text={cssDeclaration}
                      label="CSS Var"
                      variant="secondary"
                      title={`Copy declaration: ${cssDeclaration}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="rounded-xl border border-[#1b2b21] bg-[#0e1611]/60 overflow-x-auto">
          <table className="w-full text-left text-xs text-[#cbd5e1]">
            <thead className="bg-black/80 border-b border-[#1b2b21] text-[#94a3b8] uppercase font-semibold text-[11px]">
              <tr>
                <th className="p-3">Swatch</th>
                <th className="p-3">Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">HEX</th>
                <th className="p-3">RGB</th>
                <th className="p-3">Contrast</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2b21]/60">
              {filteredColors.map((color) => {
                const renderedHex = simulateColorVision(color.hex, visionMode);

                return (
                  <tr key={color.id} className="hover:bg-[#15221a]/40 transition-colors">
                    <td className="p-3">
                      <div
                        className="w-8 h-8 rounded-lg shadow-sm border border-[#1b2b21]/60"
                        style={{ backgroundColor: renderedHex }}
                      />
                    </td>
                    <td className="p-3 font-semibold text-[#cbd5e1]">{color.name}</td>
                    <td className="p-3 text-[#94a3b8]">{color.role || color.paletteGroup}</td>
                    <td className="p-3 font-mono text-[#cbd5e1]">{color.hex}</td>
                    <td className="p-3 font-mono text-[#94a3b8]">{color.rgb}</td>
                    <td className="p-3">
                      {color.contrastWithBg && (
                        <Badge
                          variant={color.contrastWithBg.aaaCompliant ? 'success' : color.contrastWithBg.aaCompliant ? 'brand' : 'warning'}
                          size="sm"
                        >
                          {color.contrastWithBg.ratio}:1
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <CopyButton text={color.hex} showIconOnly title="Copy HEX" />
                        <ProvenancePopover
                          provenance={color.provenance}
                          confidence={color.confidence}
                          itemName={color.name}
                          onNavigateToSource={onNavigateToSource}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* WCAG Contrast Matrix View */}
      {viewMode === 'matrix' && (
        <div className="rounded-2xl border border-[#1b2b21] bg-[#0e1611]/60 p-5 space-y-4 overflow-x-auto shadow-xl">
          <div>
            <h3 className="font-bold text-sm text-[#cbd5e1]">Foreground Text vs Background Surfaces Contrast Matrix</h3>
            <p className="text-xs text-[#94a3b8]">Verifies WCAG 2.1 AA (4.5:1 for body) & AAA (7:1) readability compliance across all color pairings.</p>
          </div>

          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-[#1b2b21]">
                <th className="p-3 font-sans font-semibold text-[#94a3b8]">Text / Surface</th>
                {effectiveSurfaces.map(surface => (
                  <th key={surface.id} className="p-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-5 h-5 rounded border border-[#1b2b21] shadow-sm" style={{ backgroundColor: surface.hex }} />
                      <span className="font-sans text-[11px] text-[#cbd5e1] font-semibold truncate max-w-[90px]">{surface.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2b21]/60">
              {colors.map(textCol => (
                <tr key={textCol.id} className="hover:bg-[#15221a]/30">
                  <td className="p-3 font-sans flex items-center gap-2">
                    <div className="w-4 h-4 rounded border border-[#1b2b21] shrink-0" style={{ backgroundColor: textCol.hex }} />
                    <span className="font-semibold text-[#cbd5e1] text-xs">{textCol.name}</span>
                  </td>
                  {effectiveSurfaces.map(surface => {
                    const ratio = getContrastRatio(textCol.hex, surface.hex);
                    const passesAA = ratio >= 4.5;
                    const passesAAA = ratio >= 7.0;

                    return (
                      <td key={surface.id} className="p-3 text-center">
                        <div
                          className={`inline-flex flex-col items-center justify-center p-2 rounded-lg border text-[11px] font-bold ${
                            passesAAA
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : passesAA
                              ? 'bg-[#10b981]/10 text-[#34d399] border-[#10b981]/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          <span>{ratio}:1</span>
                          <span className="text-[10px] font-sans font-normal opacity-80">
                            {passesAAA ? 'AAA Pass' : passesAA ? 'AA Pass' : 'Fail'}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
