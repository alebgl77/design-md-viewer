import { DesignSystem } from '../schema/designSystem';

export interface SearchResult {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  value: string;
  provenanceLine?: number;
}

export function searchDesignSystem(system: DesignSystem, query: string): SearchResult[] {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const results: SearchResult[] = [];

  // 1. Search Colors
  system.colors.forEach(col => {
    if (
      col.name.toLowerCase().includes(q) ||
      col.hex.toLowerCase().includes(q) ||
      col.role?.toLowerCase().includes(q) ||
      col.paletteGroup.toLowerCase().includes(q)
    ) {
      results.push({
        id: col.id,
        category: 'Colors',
        title: col.name,
        subtitle: `${col.role || col.paletteGroup} • ${col.hex}`,
        value: col.hex,
        provenanceLine: col.provenance.lineNumber,
      });
    }
  });

  // 2. Search Typography
  system.typography.forEach(t => {
    if (
      t.name.toLowerCase().includes(q) ||
      t.fontFamily.toLowerCase().includes(q) ||
      t.fontSize.toLowerCase().includes(q) ||
      t.role?.toLowerCase().includes(q)
    ) {
      results.push({
        id: t.id,
        category: 'Typography',
        title: t.name,
        subtitle: `${t.fontSize} • ${t.fontWeight} • ${t.fontFamily}`,
        value: t.fontSize,
        provenanceLine: t.provenance.lineNumber,
      });
    }
  });

  // 3. Search Spacing
  system.spacing.forEach(s => {
    if (s.name.toLowerCase().includes(q) || s.value.toLowerCase().includes(q)) {
      results.push({
        id: s.id,
        category: 'Spacing',
        title: s.name,
        subtitle: `${s.value} (${s.pxValue}px)`,
        value: s.value,
        provenanceLine: s.provenance.lineNumber,
      });
    }
  });

  // 4. Search Radii
  system.radii.forEach(r => {
    if (r.name.toLowerCase().includes(q) || r.value.toLowerCase().includes(q)) {
      results.push({
        id: r.id,
        category: 'Radius',
        title: r.name,
        subtitle: `${r.value} (${r.pxValue}px)`,
        value: r.value,
        provenanceLine: r.provenance.lineNumber,
      });
    }
  });

  // 5. Search Components
  system.components.forEach(c => {
    if (
      c.name.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.variants?.some(v => v.name.toLowerCase().includes(q))
    ) {
      results.push({
        id: c.id,
        category: 'Components',
        title: c.name,
        subtitle: c.description || 'Component spec',
        value: c.variants ? `${c.variants.length} variants` : 'Component',
        provenanceLine: c.provenance.lineNumber,
      });
    }
  });

  // 6. Search Tokens
  system.tokens.forEach(tok => {
    if (
      tok.name.toLowerCase().includes(q) ||
      tok.cssVariable?.toLowerCase().includes(q) ||
      tok.value.toLowerCase().includes(q)
    ) {
      results.push({
        id: tok.id,
        category: 'Tokens',
        title: tok.cssVariable || tok.name,
        subtitle: `${tok.category} • ${tok.value}`,
        value: tok.value,
        provenanceLine: tok.provenance.lineNumber,
      });
    }
  });

  return results.slice(0, 25);
}
