import React, { useMemo, useState } from 'react';
import { Palette, LayoutGrid, List, Eye } from 'lucide-react';
import { clsx } from 'clsx';
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

interface MatrixCell {
  surfaceId: string;
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
}

interface MatrixRow {
  color: ColorToken;
  cells: MatrixCell[];
}

const GROUPS = ['all', 'brand', 'neutral', 'surface', 'semantic', 'accent', 'other'];

export const ColorView: React.FC<ColorViewProps> = ({ colors, onNavigateToSource }) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'matrix'>('grid');
  const [searchFilter, setSearchFilter] = useState('');
  const [visionMode, setVisionMode] = useState<ColorVisionMode>('normal');

  const filteredColors = useMemo(() => {
    const needle = searchFilter.trim().toLowerCase();

    return colors.filter(col => {
      const matchesGroup = selectedGroup === 'all' || col.paletteGroup === selectedGroup;
      const matchesSearch =
        needle === '' ||
        col.name.toLowerCase().includes(needle) ||
        col.hex.toLowerCase().includes(needle) ||
        col.role?.toLowerCase().includes(needle);
      return matchesGroup && matchesSearch;
    });
  }, [colors, selectedGroup, searchFilter]);

  // Tab counts are read once per palette group on every render otherwise.
  const groupCounts = useMemo(() => {
    const counts = new Map<string, number>();
    counts.set('all', colors.length);
    for (const col of colors) {
      counts.set(col.paletteGroup, (counts.get(col.paletteGroup) ?? 0) + 1);
    }
    return counts;
  }, [colors]);

  const effectiveSurfaces = useMemo(() => {
    const surfaceColors = colors.filter(
      c => c.paletteGroup === 'surface' || /bg|background|surface|canvas/i.test(c.name)
    );
    return surfaceColors.length > 0 ? surfaceColors : colors.slice(0, 4);
  }, [colors]);

  // Colour-vision simulation is a per-channel matrix multiply; cache it per
  // token so typing in the filter box never re-simulates the whole palette.
  const simulatedHexById = useMemo(() => {
    const map = new Map<string, string>();
    for (const col of colors) {
      map.set(col.id, simulateColorVision(col.hex, visionMode));
    }
    return map;
  }, [colors, visionMode]);

  // The N x M contrast matrix was previously rebuilt inline, cell by cell, on
  // every keystroke - and from the UNFILTERED palette. It now derives from the
  // filtered set and only when the matrix is actually on screen.
  const matrixRows = useMemo<MatrixRow[]>(() => {
    if (viewMode !== 'matrix') return [];

    return filteredColors.map(color => ({
      color,
      cells: effectiveSurfaces.map(surface => {
        const ratio = getContrastRatio(color.hex, surface.hex);
        return {
          surfaceId: surface.id,
          ratio,
          passesAA: ratio >= 4.5,
          passesAAA: ratio >= 7.0,
        };
      }),
    }));
  }, [viewMode, filteredColors, effectiveSurfaces]);

  const segmentClass = (active: boolean) =>
    clsx(
      'rounded-sm transition-colors',
      active ? 'bg-accent text-accent-contrast' : 'text-content-secondary hover:text-content-primary'
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-line-subtle">
        <div>
          <h1 className="text-xl font-bold text-content-primary flex items-center gap-2">
            <Palette className="w-5 h-5 text-accent" />
            Color Palette &amp; Vision Simulator
          </h1>
          <p className="text-xs text-content-secondary mt-0.5">
            {colors.length} color swatches with computed WCAG contrast and Color Vision Deficiency simulation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Colorblindness Simulator Selector */}
          <div className="flex items-center gap-1.5 bg-surface-raised border border-line rounded-sm px-2.5 py-1 text-xs">
            <Eye className="w-3.5 h-3.5 text-accent shrink-0" />
            <select
              value={visionMode}
              onChange={e => setVisionMode(e.target.value as ColorVisionMode)}
              aria-label="Color vision simulation mode"
              className="bg-transparent text-content-primary text-xs focus:outline-none cursor-pointer"
            >
              <option value="normal" className="bg-surface-raised">
                Normal Vision
              </option>
              <option value="protanopia" className="bg-surface-raised">
                Protanopia (Red-Blind)
              </option>
              <option value="deuteranopia" className="bg-surface-raised">
                Deuteranopia (Green-Blind)
              </option>
              <option value="tritanopia" className="bg-surface-raised">
                Tritanopia (Blue-Blind)
              </option>
              <option value="achromatopsia" className="bg-surface-raised">
                Achromatopsia (Grayscale)
              </option>
            </select>
          </div>

          {/* Search input */}
          <input
            type="text"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="Filter colors..."
            aria-label="Filter colors"
            className="px-3 py-1.5 rounded-sm bg-surface-raised border border-line text-xs text-content-primary placeholder-content-muted focus:outline-none focus:border-accent w-full sm:w-40"
          />

          {/* View mode toggle */}
          <div className="flex items-center bg-surface-raised border border-line rounded-md p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={clsx('p-1.5', segmentClass(viewMode === 'grid'))}
              title="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={clsx('p-1.5', segmentClass(viewMode === 'table'))}
              title="Table view"
              aria-pressed={viewMode === 'table'}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={clsx('px-2 py-1 text-[11px] font-semibold', segmentClass(viewMode === 'matrix'))}
              title="Contrast Matrix"
              aria-pressed={viewMode === 'matrix'}
            >
              WCAG Matrix
            </button>
          </div>
        </div>
      </div>

      {/* Vision Mode Active Indicator Alert */}
      {visionMode !== 'normal' && (
        <div className="p-3 rounded-md bg-accent/10 border border-accent/30 text-accent text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-accent shrink-0" />
            <span>
              Simulating <strong>{visionMode.toUpperCase()}</strong>: Colors transformed to model how
              vision-impaired users perceive your design system.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setVisionMode('normal')}
            className="text-xs font-semibold text-accent underline hover:text-accent-hover shrink-0"
          >
            Reset
          </button>
        </div>
      )}

      {/* Palette Group Filter Tabs */}
      {viewMode !== 'matrix' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {GROUPS.map(group => {
            const count = groupCounts.get(group) ?? 0;
            if (count === 0 && group !== 'all') return null;

            return (
              <button
                key={group}
                type="button"
                onClick={() => setSelectedGroup(group)}
                aria-pressed={selectedGroup === group}
                className={clsx(
                  'px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1.5 border',
                  selectedGroup === group
                    ? 'bg-accent/15 border-accent/40 text-accent'
                    : 'bg-surface-raised/60 border-line text-content-secondary hover:text-content-primary hover:bg-surface-overlay'
                )}
              >
                <span>{group}</span>
                <span className="text-[10px] font-mono tabular-nums opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredColors.map(color => {
            // Parsed document value: rendered as data, never tokenised.
            const renderedHex = simulatedHexById.get(color.id) ?? color.hex;
            const contrast = color.contrastWithBg;
            // Overlay legibility depends on the swatch itself, not on the document background.
            const swatchReadsOnLight = contrast ? contrast.ratioOnLight > contrast.ratioOnDark : false;
            const cssDeclaration = `--color-${color.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}: ${color.hex};`;

            return (
              <div
                key={color.id}
                className="group flex flex-col rounded-lg bg-surface-raised/70 border border-line-subtle hover:border-line overflow-hidden shadow-deep transition-colors"
              >
                {/* Visual Swatch */}
                <div
                  className="h-28 w-full relative p-3 flex flex-col justify-between transition-colors duration-300"
                  style={{ backgroundColor: renderedHex }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider"
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
                      className="text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded-sm"
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
                      // Sits ON the parsed swatch, so it follows the same
                      // black/white scrim rule as the chips beside it rather
                      // than the app's theme tokens - the ground here is the
                      // user's colour, not one of our surfaces.
                      className={clsx(
                        'backdrop-blur-sm',
                        swatchReadsOnLight
                          ? 'bg-black/50 hover:bg-black/70 text-white'
                          : 'bg-white/80 hover:bg-white text-black'
                      )}
                    />
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="font-bold text-sm text-content-primary mb-1">{color.name}</div>
                    <div className="text-xs text-content-secondary line-clamp-1">
                      {color.role || 'Design system color'}
                    </div>
                  </div>

                  {/* Values List */}
                  <dl className="space-y-1.5 pt-2 border-t border-line-subtle font-mono text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-content-muted">HEX (Original):</dt>
                      <dd className="text-content-primary tabular-nums">{color.hex}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-content-muted">RGB:</dt>
                      <dd className="text-content-primary tabular-nums">{color.rgb}</dd>
                    </div>
                  </dl>

                  {/* Contrast & Quick Copy Actions */}
                  <div className="pt-3 border-t border-line-subtle flex items-center justify-between gap-2">
                    {contrast ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-content-secondary">Contrast:</span>
                        <Badge
                          variant={
                            contrast.aaaCompliant ? 'success' : contrast.aaCompliant ? 'brand' : 'warning'
                          }
                          size="sm"
                        >
                          {contrast.ratio}:1{' '}
                          {contrast.aaaCompliant ? 'AAA' : contrast.aaCompliant ? 'AA' : 'Fail'}
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
        <div className="rounded-lg border border-line-subtle bg-surface-raised/60 overflow-x-auto">
          <table className="w-full text-left text-xs text-content-primary">
            <caption className="sr-only">
              Color tokens with role, hex value, RGB channels and measured contrast.
            </caption>
            <thead className="bg-surface-inset border-b border-line-subtle text-content-secondary uppercase font-semibold text-[11px]">
              <tr>
                <th scope="col" className="p-3">
                  Swatch
                </th>
                <th scope="col" className="p-3">
                  Name
                </th>
                <th scope="col" className="p-3">
                  Role
                </th>
                <th scope="col" className="p-3">
                  HEX
                </th>
                <th scope="col" className="p-3">
                  RGB
                </th>
                <th scope="col" className="p-3">
                  Contrast
                </th>
                <th scope="col" className="p-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {filteredColors.map(color => {
                // Parsed document value: rendered as data, never tokenised.
                const renderedHex = simulatedHexById.get(color.id) ?? color.hex;

                return (
                  <tr key={color.id} className="hover:bg-surface-overlay/40 transition-colors">
                    <td className="p-3">
                      <div
                        className="w-8 h-8 rounded-md border border-line"
                        style={{ backgroundColor: renderedHex }}
                      />
                    </td>
                    <th scope="row" className="p-3 text-left font-semibold text-content-primary">
                      {color.name}
                    </th>
                    <td className="p-3 text-content-secondary">{color.role || color.paletteGroup}</td>
                    <td className="p-3 font-mono tabular-nums text-content-primary">{color.hex}</td>
                    <td className="p-3 font-mono tabular-nums text-content-secondary">{color.rgb}</td>
                    <td className="p-3 tabular-nums">
                      {color.contrastWithBg && (
                        <Badge
                          variant={
                            color.contrastWithBg.aaaCompliant
                              ? 'success'
                              : color.contrastWithBg.aaCompliant
                                ? 'brand'
                                : 'warning'
                          }
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
        <section className="rounded-lg border border-line-subtle bg-surface-raised/60 p-5 space-y-4 shadow-deep">
          <div>
            <h2 className="font-bold text-sm text-content-primary">
              Foreground Text vs Background Surfaces Contrast Matrix
            </h2>
            <p className="text-xs text-content-secondary">
              Verifies WCAG 2.1 AA (4.5:1 for body) &amp; AAA (7:1) readability compliance across all color
              pairings.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <caption className="sr-only">
                Contrast ratio of every text color against every surface color.
              </caption>
              <thead>
                <tr className="border-b border-line-subtle">
                  <th scope="col" className="p-3 font-sans font-semibold text-content-secondary">
                    Text / Surface
                  </th>
                  {effectiveSurfaces.map(surface => (
                    <th key={surface.id} scope="col" className="p-3 text-center">
                      <span className="flex flex-col items-center gap-1">
                        {/* Parsed document value: rendered as data, never tokenised. */}
                        <span
                          className="w-5 h-5 rounded-sm border border-line"
                          style={{ backgroundColor: surface.hex }}
                        />
                        <span className="font-sans text-[11px] text-content-primary font-semibold truncate max-w-[90px]">
                          {surface.name}
                        </span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {matrixRows.map(({ color: textCol, cells }) => (
                  <tr key={textCol.id} className="hover:bg-surface-overlay/30">
                    <th scope="row" className="p-3 font-sans text-left">
                      <span className="flex items-center gap-2">
                        {/* Parsed document value: rendered as data, never tokenised. */}
                        <span
                          className="w-4 h-4 rounded-sm border border-line shrink-0"
                          style={{ backgroundColor: textCol.hex }}
                        />
                        <span className="font-semibold text-content-primary text-xs">{textCol.name}</span>
                      </span>
                    </th>
                    {cells.map(cell => (
                      <td key={cell.surfaceId} className="p-3 text-center">
                        <span
                          className={clsx(
                            'inline-flex flex-col items-center justify-center p-2 rounded-md border text-[11px] font-bold tabular-nums',
                            cell.passesAAA
                              ? 'bg-status-success/10 text-status-success border-status-success/30'
                              : cell.passesAA
                                ? 'bg-accent/10 text-accent border-accent/30'
                                : 'bg-status-danger/10 text-status-danger border-status-danger/30'
                          )}
                        >
                          <span>{cell.ratio}:1</span>
                          <span className="text-[10px] font-sans font-normal opacity-80">
                            {cell.passesAAA ? 'AAA Pass' : cell.passesAA ? 'AA Pass' : 'Fail'}
                          </span>
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
