import type { SourceInput, SourceSummary } from '../../importers';

export const PASTE_FORMATS = [
  { extension: 'md', label: 'Markdown' },
  { extension: 'css', label: 'CSS' },
  { extension: 'json', label: 'JSON / design tokens' },
  { extension: 'html', label: 'HTML' },
  { extension: 'svg', label: 'SVG' },
  { extension: 'txt', label: 'Plain text' },
] as const;

export type PasteFormat = (typeof PASTE_FORMATS)[number]['extension'];

export function createPastedSource(content: string, name: string, format: PasteFormat): SourceInput {
  if (!content.trim()) {
    throw new Error('Paste some source content before generating DESIGN.md.');
  }

  const baseName = name.trim().replace(/\.(?:md|markdown|txt|css|json|html?|svg)$/i, '') || 'pasted-source';
  return { name: `${baseName}.${format}`, content };
}

export function isGeneratedImport(sources: SourceSummary[]): boolean {
  return sources.length !== 1 || !/\.(?:md|markdown)$/i.test(sources[0].name);
}
