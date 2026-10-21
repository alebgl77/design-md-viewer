import { adaptCss } from './css';
import { adaptJson } from './json';
import { byteLength, checkBatch, extension, IMPORT_LIMITS } from './limits';
import { balanceMarkdownFence, prose } from './markdown';
import { adaptMarkup } from './markup';
import type { AdaptedSource, ImportResult, SourceInput, SourceSummary } from './types';

export type { ImportResult, SourceInput, SourceSummary } from './types';
export { IMPORT_LIMITS } from './limits';

export const ACCEPTED_SOURCE_EXTENSIONS =
  '.md,.markdown,.txt,.css,.json,.html,.htm,.svg,.png,.jpg,.jpeg,.webp,.pdf';
export const SUPPORTED_SOURCE_FORMATS = [
  {
    name: 'Markdown / text',
    extensions: '.md, .markdown, .txt',
    detail: 'Design notes; clear CSS, JSON, HTML and SVG pasted as text are detected automatically.',
  },
  { name: 'CSS', extensions: '.css', detail: 'Static declarations and custom properties.' },
  { name: 'JSON tokens', extensions: '.json', detail: 'Nested, DTCG and legacy tokens with aliases.' },
  {
    name: 'HTML / SVG',
    extensions: '.html, .htm, .svg',
    detail: 'Embedded styles, inline styles and static SVG paint; no page rendering.',
  },
  {
    name: 'Images',
    extensions: '.png, .jpg, .jpeg, .webp',
    detail: 'Quantized pixel palette only; no OCR, font or layout inference.',
  },
  {
    name: 'PDF',
    extensions: '.pdf',
    detail: 'Embedded text from at most 25 pages; no OCR or visual analysis.',
  },
] as const;

const TEXT_EXTENSIONS = new Set(['md', 'markdown', 'txt', 'css', 'json', 'html', 'htm', 'svg']);
const RASTER_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp']);

function unsupported(name: string): Error {
  return new Error(
    `Unsupported source "${name}". Use Markdown, text, CSS, JSON, HTML, SVG, PNG, JPEG, WebP or PDF. Office documents, video and archives must be exported to a supported format first.`
  );
}

function looksLikeCss(probe: string): boolean {
  let cursor = 0;
  while (probe.startsWith('/*', cursor)) {
    const end = probe.indexOf('*/', cursor + 2);
    if (end === -1) return false;
    cursor = end + 2;
    while (cursor < probe.length && /\s/.test(probe[cursor])) cursor++;
  }
  if (/^--[\w-]+\s*:/.test(probe.slice(cursor))) return true;
  const brace = probe.indexOf('{', cursor);
  if (brace === -1) return false;
  return /^(?:--[\w-]+|[a-z-]+)\s*:/i.test(probe.slice(brace + 1).trimStart());
}

function textAdapter(input: SourceInput): AdaptedSource {
  let format = extension(input.name);
  if (!TEXT_EXTENSIONS.has(format)) throw unsupported(input.name);
  if (!input.content.trim()) throw new Error('This source is empty. Add design content and retry.');
  if (byteLength(input.content) > IMPORT_LIMITS.textBytes)
    throw new Error('Text sources must be 2 MiB or smaller. Split this document before importing.');
  if (input.content.includes('\u0000'))
    throw new Error(
      'This source contains binary data. Export it as UTF-8 text or use a supported binary format.'
    );
  if (format === 'md' || format === 'markdown')
    return { format: 'Markdown', markdown: input.content, warnings: [], originalMarkdown: true };
  const text = input.content.replace(/^\uFEFF/, '');
  if (format === 'txt') {
    const probe = text.trimStart();
    if (/^(?:<\?xml[^>]*>\s*)?<svg\b/i.test(probe)) format = 'svg';
    else if (
      /^(?:<!doctype\s+html\b|<(?:html|head|body|style|div|main|section|script|link|iframe|img)\b)/i.test(
        probe
      )
    )
      format = 'html';
    else if (/^(?:\{\s*(?:"|\})|\[\s*(?:\{|"|\]))/.test(probe)) format = 'json';
    else if (looksLikeCss(probe)) format = 'css';
  }
  if (format === 'css') return adaptCss(text);
  if (format === 'json') return adaptJson(text);
  if (format === 'html' || format === 'htm' || format === 'svg') return adaptMarkup(text, format === 'svg');
  return {
    format: 'Text',
    markdown: text,
    preserveMarkdown: true,
    warnings: [
      'Plain text was preserved as design notes; only explicit values recognized by the parser become tokens.',
    ],
  };
}

interface Imported {
  summary: SourceSummary;
  source?: AdaptedSource;
}

function failure(name: string, error: unknown): Imported {
  return {
    summary: {
      name,
      format: 'Not imported',
      warnings: [
        error instanceof Error ? error.message : 'This source could not be read. Select the file again.',
      ],
    },
  };
}

function assemble(imported: Imported[]): ImportResult {
  const successful = imported.filter((entry): entry is Imported & { source: AdaptedSource } =>
    Boolean(entry.source)
  );
  if (!successful.length)
    throw new Error(
      `No sources could be imported. ${imported.map(entry => `${entry.summary.name}: ${entry.summary.warnings.join(' ')}`).join(' ')}`
    );
  const seenNames = new Set<string>();
  const definitions = new Map<string, { value: string; file: string }>();
  for (const entry of successful) {
    if (seenNames.has(entry.summary.name))
      entry.summary.warnings.push(
        'A source with the same filename also appears in this batch; both source sections are retained.'
      );
    seenNames.add(entry.summary.name);
    for (const definition of entry.source.definitions ?? []) {
      const previous = definitions.get(definition.name);
      if (previous && previous.value !== definition.value) {
        entry.summary.warnings.push(
          `Conflicting token ${definition.name} also occurs in ${previous.file}; both declarations remain in the generated source and the parser may use the last definition.`
        );
      }
      definitions.set(definition.name, { value: definition.value, file: entry.summary.name });
    }
    entry.summary.warnings = [...new Set(entry.summary.warnings)];
  }
  const sources = imported.map(entry => entry.summary);
  const warnings = sources.flatMap(source => source.warnings.map(warning => `${source.name}: ${warning}`));
  if (imported.length === 1 && successful[0].source.originalMarkdown) {
    return {
      markdown: successful[0].source.markdown,
      fileName: successful[0].summary.name,
      sources,
      warnings,
    };
  }
  const sections = imported.map((entry, index) => {
    const description = [
      `## Source ${index + 1}`,
      '',
      `Imported from: ${prose(entry.summary.name)}`,
      '',
      `Format: ${prose(entry.summary.format)}`,
    ];
    if (entry.summary.warnings.length)
      description.push('', ...entry.summary.warnings.map(warning => `> ${prose(warning)}`));
    if (entry.source?.markdown) {
      let content = entry.source.markdown;
      // Prefix synthesized CSS names per source so unrelated declarations do not collide.
      if (!entry.source.originalMarkdown && !entry.source.preserveMarkdown)
        content = content.replace(/(--[a-z-]+)-imported-(\d+)/g, `$1-source-${index + 1}-$2`);
      if (entry.source.originalMarkdown || entry.source.preserveMarkdown) {
        content = balanceMarkdownFence(content);
      }
      description.push('', content);
    }
    return description.join('\n');
  });
  const markdown = [
    '# Imported design sources',
    '',
    'This generated document records extracted source data. Source links refer to lines in this document, not to the original files.',
    '',
    ...sections,
  ].join('\n\n');
  if (byteLength(markdown) > IMPORT_LIMITS.outputBytes)
    throw new Error(
      'The generated document exceeds the 24 MiB output limit. Import fewer or smaller sources.'
    );
  return {
    markdown,
    fileName:
      successful.length === 1
        ? `${
            successful[0].summary.name
              .replace(/\.[^.]*$/, '')
              .replace(/[^a-zA-Z0-9_-]/g, '-')
              .slice(0, 100) || 'source'
          }.design.md`
        : 'combined-design.md',
    sources,
    warnings,
  };
}

function checkedSource(source: AdaptedSource): AdaptedSource {
  if (byteLength(source.markdown) > IMPORT_LIMITS.sourceOutputBytes)
    throw new Error('Extracted content exceeds the per-source output limit. Import a smaller source.');
  return source;
}

export function importSources(inputs: SourceInput[]): ImportResult {
  checkBatch(inputs.map(input => byteLength(input.content)));
  return assemble(
    inputs.map(input => {
      try {
        const source = checkedSource(textAdapter(input));
        return {
          source,
          summary: { name: input.name, format: source.format, warnings: [...source.warnings] },
        };
      } catch (error) {
        return failure(input.name, error);
      }
    })
  );
}

export async function importFiles(files: File[]): Promise<ImportResult> {
  checkBatch(files.map(file => file.size));
  const imported: Imported[] = [];
  for (const file of files) {
    try {
      const ext = extension(file.name);
      const text = TEXT_EXTENSIONS.has(ext);
      if (!text && !RASTER_EXTENSIONS.has(ext) && ext !== 'pdf') throw unsupported(file.name);
      const maximum = text ? IMPORT_LIMITS.textBytes : IMPORT_LIMITS.binaryBytes;
      if (file.size > maximum)
        throw new Error(
          `This ${text ? 'text' : 'binary'} source exceeds the ${text ? '2' : '10'} MiB per-file limit.`
        );
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (bytes.byteLength > maximum) throw new Error('Read content exceeds the per-file size limit.');
      let source: AdaptedSource;
      if (text) {
        let content: string;
        try {
          content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        } catch {
          throw new Error('Text sources must use UTF-8 encoding. Save the file as UTF-8 and retry.');
        }
        source = textAdapter({ name: file.name, content });
      } else if (ext === 'pdf') {
        source = await (await import('./pdf')).adaptPdf(bytes);
      } else {
        source = await (await import('./image')).adaptImage(bytes);
      }
      checkedSource(source);
      imported.push({
        source,
        summary: { name: file.name, format: source.format, warnings: [...source.warnings] },
      });
    } catch (error) {
      imported.push(failure(file.name, error));
    }
  }
  return assemble(imported);
}
