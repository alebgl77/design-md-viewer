import { describe, expect, it, vi } from 'vitest';
import { importSources, IMPORT_LIMITS } from '../index';
import { parseDesignDocument } from '../../parsers/pipeline';
import { balanceMarkdownFence } from '../markdown';

describe('text source import adapters', () => {
  it('keeps a single Markdown source exactly as supplied', () => {
    const content = '# Palette\r\n\r\n- Brand: #123456\r\n';
    const result = importSources([{ name: 'Original.MD', content }]);
    expect(result.markdown).toBe(content);
    expect(result.fileName).toBe('Original.MD');
    expect(result.sources).toEqual([{ name: 'Original.MD', format: 'Markdown', warnings: [] }]);
  });

  it('expands minified CSS and creates real colors, spacing, radii, typography, shadows and aliases', () => {
    const result = importSources([
      {
        name: 'tokens.css',
        content:
          ':root{--color-brand:#123456;--color-action:var(--color-brand);--space-md:16px;--radius-md:8px;--shadow-card:0 2px 4px #000;}body{font-family:Georgia,serif;font-size:20px;padding:12px;color:#abcdef;}',
      },
    ]);
    const design = parseDesignDocument(result.markdown);
    expect(design.colors.map(c => c.hex)).toEqual(expect.arrayContaining(['#123456', '#abcdef']));
    expect(design.spacing.map(s => s.value)).toEqual(expect.arrayContaining(['16px', '12px']));
    expect(design.radii.some(r => r.value === '8px')).toBe(true);
    expect(design.shadows.some(s => s.value === '0 2px 4px #000')).toBe(true);
    expect(design.typography.some(t => t.fontSize === '20px' && t.fontFamily === 'Georgia,serif')).toBe(true);
    expect(design.tokens.find(t => t.name === 'color-action')?.resolvedValue).toBe('#123456');
    expect(result.fileName).toMatch(/\.md$/);
  });

  it('normalizes nested DTCG and legacy tokens with alias references and composite values', () => {
    const content = JSON.stringify({
      color: {
        $type: 'color',
        brand: { $value: '#123456' },
        action: { $value: '{color.brand}' },
        rgba: { $value: { colorSpace: 'srgb', components: [1, 0, 0], alpha: 0.5 } },
      },
      space: { medium: { type: 'dimension', value: { value: 12, unit: 'px' } } },
      corner: { type: 'borderRadius', value: '6px' },
      large: { $type: 'fontSize', $value: { value: 24, unit: 'px' } },
      card: {
        $type: 'shadow',
        $value: {
          offsetX: { value: 0, unit: 'px' },
          offsetY: { value: 2, unit: 'px' },
          blur: { value: 4, unit: 'px' },
          color: '#000000',
        },
      },
      body: {
        $type: 'typography',
        $value: {
          fontFamily: ['Georgia', 'serif'],
          fontSize: { value: 16, unit: 'px' },
          fontWeight: 400,
          lineHeight: 1.5,
        },
      },
    });
    const result = importSources([{ name: 'tokens.json', content }]);
    const design = parseDesignDocument(result.markdown);
    expect(design.tokens.find(t => t.name === 'color-action')?.references).toContain('--color-brand');
    expect(design.tokens.find(t => t.name === 'color-action')?.resolvedValue).toBe('#123456');
    expect(design.spacing.some(s => s.value === '12px')).toBe(true);
    expect(design.radii.some(r => r.value === '6px')).toBe(true);
    expect(design.shadows.length).toBeGreaterThan(0);
    expect(design.typography.some(t => t.fontSize === '16px' && t.fontFamily === 'Georgia, serif')).toBe(
      true
    );
    expect(result.markdown).toContain('rgba(255, 0, 0, 0.5)');
  });

  it('accepts flat tokens and warns about unsupported JSON values and normalized name collisions', () => {
    const result = importSources([
      {
        name: 'tokens.json',
        content: JSON.stringify({
          'brand.a': '#123456',
          brand: { a: '#654321' },
          enabled: true,
          nil: null,
          mystery: [true, false],
        }),
      },
    ]);
    expect(result.warnings.join(' ')).toMatch(/3 JSON value/);
    expect(result.warnings.join(' ')).toMatch(/share the normalized name/);
    expect(result.warnings.join(' ')).toMatch(/Conflicting token/);
    expect(parseDesignDocument(result.markdown).colors.length).toBe(2);
  });

  it.each([
    ['style.txt', ':root { --color-primary: #123456; }', 'CSS'],
    ['tokens.txt', '{"brand":"#123456"}', 'JSON tokens'],
    ['page.txt', '<div style="color:#123456">Hello</div>', 'HTML'],
    ['icon.txt', '<svg><path fill="#123456" /></svg>', 'SVG'],
    ['notes.txt', 'We discussed CSS { braces } and [options] in the design workshop.', 'Text'],
  ])('detects clear pasted source syntax in %s', (name, content, format) => {
    expect(importSources([{ name, content }]).sources[0].format).toBe(format);
  });

  it('extracts hostile HTML and SVG as inert data without creating DOM or fetching', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    try {
      const result = importSources([
        {
          name: 'page.html',
          content:
            '<script>fetch("https://evil.test")</script><link href="https://evil.test/a.css" rel="stylesheet"><style>@import "https://evil.test";:root{--color-brand:#123456;--bad:url(https://evil.test)}</style><img src="https://evil.test/image" onerror="alert(1)" style="padding:8px"><iframe srcdoc="<script>alert(1)</script>"></iframe>',
        },
        {
          name: 'icon.svg',
          content:
            '<!DOCTYPE svg [<!ENTITY x SYSTEM "https://evil.test/entity">]><svg onload="alert(1)"><style>.a { stroke: #abcdef; }</style><path fill="#654321" style="stroke:url(https://evil.test)"/><image href="https://evil.test/pixel"/></svg>',
        },
      ]);
      expect(fetch).not.toHaveBeenCalled();
      expect(result.markdown).not.toMatch(/<script|<img|<iframe|<image|https:\/\/evil|url\(/);
      expect(result.warnings.join(' ')).toMatch(/unsafe/);
      expect(parseDesignDocument(result.markdown).colors.map(c => c.hex)).toEqual(
        expect.arrayContaining(['#123456', '#abcdef', '#654321'])
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('escapes filenames, table cells and malicious fence content in generated documents', () => {
    const result = importSources([
      { name: 'evil\n```\n<script>.css', content: ':root { --color-safe: #123456; --bad: `x`; }' },
      { name: 'notes.txt', content: '<script>alert(1)</script>\n```css\n--bad: red;\n```' },
    ]);
    expect(result.markdown).not.toContain('<script>');
    expect(parseDesignDocument(result.markdown).tokens.some(t => t.name === 'bad')).toBe(false);
    expect(result.markdown).toContain('&#96;');
    expect(result.sources).toHaveLength(2);
  });

  it('preserves both duplicate filenames and makes conflicting declarations visible', () => {
    const result = importSources([
      { name: 'tokens.css', content: '--color-brand:#123456;' },
      { name: 'tokens.css', content: '--color-brand:#654321;' },
    ]);
    expect(result.sources).toHaveLength(2);
    expect(result.warnings.join(' ')).toMatch(/same filename/);
    expect(result.warnings.join(' ')).toMatch(/Conflicting token --color-brand/);
    expect(result.markdown).toContain('--color-brand: #123456;');
    expect(result.markdown).toContain('--color-brand: #654321;');
  });

  it('keeps valid files from a mixed batch and accounts for failures', () => {
    const result = importSources([
      { name: 'tokens.json', content: '{bad' },
      { name: 'archive.zip', content: 'PK' },
      { name: 'empty.md', content: '' },
      { name: 'ok.css', content: '--color-brand:#123456;' },
    ]);
    expect(result.sources).toHaveLength(4);
    expect(result.sources.filter(s => s.format === 'Not imported')).toHaveLength(3);
    expect(result.warnings).toHaveLength(3);
    expect(result.warnings.join(' ')).toMatch(/Invalid JSON/);
    expect(result.warnings.join(' ')).toMatch(/archives/);
    expect(parseDesignDocument(result.markdown).colors[0].hex).toBe('#123456');
  });

  it('does not fabricate tokens from unsupported or empty-value sources', () => {
    const result = importSources([
      { name: 'empty.json', content: '{"enabled":true}' },
      { name: 'empty.css', content: '/* no declarations */' },
    ]);
    const design = parseDesignDocument(result.markdown);
    expect(design.overview.totalTokensCount).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('rejects empty batches, invalid JSON, binary text and entirely unsupported batches', () => {
    expect(() => importSources([])).toThrow(/at least one/);
    expect(() => importSources([{ name: 'bad.json', content: '{' }])).toThrow(/Invalid JSON/);
    expect(() => importSources([{ name: 'bad.txt', content: 'binary\u0000data' }])).toThrow(/binary data/);
    expect(() => importSources([{ name: 'movie.mp4', content: 'binary' }])).toThrow(/video/);
  });

  it('enforces count, UTF-8 byte sizes, total and per-source output limits', () => {
    expect(() => importSources(Array.from({ length: 21 }, () => ({ name: 'x.md', content: 'a' })))).toThrow(
      /at most 20/
    );
    expect(() =>
      importSources([{ name: 'big.txt', content: 'é'.repeat(IMPORT_LIMITS.textBytes / 2 + 1) }])
    ).toThrow(/2 MiB/);
    expect(() =>
      importSources(
        Array.from({ length: 11 }, () => ({ name: 'big.md', content: 'x'.repeat(IMPORT_LIMITS.textBytes) }))
      )
    ).toThrow(/20 MiB total/);
    expect(() =>
      importSources([{ name: 'expanded.css', content: `font-family:${'a'.repeat(450)};`.repeat(3_000) }])
    ).toThrow(/output limit/);
  });

  it('bounds JSON recursion and node counts with partial extraction warnings', () => {
    let nested: unknown = '#123456';
    for (let i = 0; i < 40; i++) nested = { child: nested };
    const deep = importSources([{ name: 'deep.json', content: JSON.stringify({ safe: '#abcdef', nested }) }]);
    expect(deep.warnings.join(' ')).toMatch(/32 levels/);
    expect(parseDesignDocument(deep.markdown).colors[0].hex).toBe('#abcdef');
    const wide = importSources([
      {
        name: 'wide.json',
        content: JSON.stringify(
          Object.fromEntries(Array.from({ length: 10_100 }, (_, i) => [`n${i}`, true]))
        ),
      },
    ]);
    expect(wide.warnings.join(' ')).toMatch(/10000 nodes/);
  });

  it('keeps generated line navigation in the generated Markdown', () => {
    const result = importSources([
      { name: 'one.css', content: '--color-brand:#123456;' },
      { name: 'two.css', content: '--space-sm:8px;' },
    ]);
    const design = parseDesignDocument(result.markdown);
    for (const token of [...design.colors, ...design.spacing]) {
      expect(token.provenance.lineNumber).toBeGreaterThan(0);
      expect(result.markdown.split('\n')[token.provenance.lineNumber! - 1]).toContain(
        'value' in token ? token.value : token.rawValue
      );
    }
  });

  it('retains DTCG dimension, duration and font-size aliases as resolvable tokens', () => {
    const result = importSources([
      {
        name: 'aliases.json',
        content: JSON.stringify({
          spacing: {
            $type: 'dimension',
            base: { $value: { value: 8, unit: 'px' } },
            alias: { $value: '{spacing.base}' },
          },
          time: {
            $type: 'duration',
            base: { $value: { value: 100, unit: 'ms' } },
            alias: { $value: '{time.base}' },
          },
          text: { $type: 'fontSize', base: { $value: '16px' }, alias: { $value: '{text.base}' } },
        }),
      },
    ]);
    const design = parseDesignDocument(result.markdown);
    expect(design.tokens.find(t => t.name === 'spacing-alias')?.resolvedValue).toBe('8px');
    expect(design.tokens.find(t => t.name === 'time-alias')?.resolvedValue).toBe('100ms');
    expect(design.tokens.find(t => t.name === 'text-alias')?.resolvedValue).toBe('16px');
    expect(result.warnings).toEqual([]);
  });

  it('bounds alias expansion but retains ordinary aliases and cycles for inspection', () => {
    const values = Array.from(
      { length: 100 },
      (_, i) => `--chain-${i}: ${i === 99 ? '8px' : `var(--chain-${i + 1})`};`
    ).join('\n');
    const result = importSources([
      { name: 'deep.css', content: values + '\n--cycle-a:var(--cycle-b);--cycle-b:var(--cycle-a);' },
    ]);
    expect(result.warnings.join(' ')).toMatch(/deep or branching aliases/);
    expect(() => parseDesignDocument(result.markdown)).not.toThrow();
    expect(result.markdown).toContain('--cycle-a:');
  });

  it.each(['~~~css\n--color-first: #123456;', '````css\n```\n--color-first: #123456;'])(
    'balances a merged source fence using its actual marker: %s',
    content => {
      const result = importSources([
        { name: 'first.md', content },
        { name: 'second.css', content: '--color-last:#abcdef;' },
      ]);
      expect(result.markdown).toContain(balanceMarkdownFence(content));
      expect(parseDesignDocument(result.markdown).colors.some(c => c.hex === '#abcdef')).toBe(true);
    }
  );

  it('leaves balanced fences intact and ignores shorter inner fences', () => {
    const content = '````css\n```\n--a: 8px;\n````';
    expect(balanceMarkdownFence(content)).toBe(content);
    expect(balanceMarkdownFence('~~~\nx\n```')).toBe('~~~\nx\n```\n~~~');
  });

  it('preserves existing Markdown design documents supplied as .txt', () => {
    const result = importSources([
      {
        name: 'design.txt',
        content: '# Design notes\n\n```css\n--color-brand: #123456;\n--font-size-body: 16px;\n```',
      },
    ]);
    expect(result.fileName).toMatch(/\.md$/);
    const design = parseDesignDocument(result.markdown);
    expect(design.colors[0].hex).toBe('#123456');
    expect(design.typography[0].fontSize).toBe('16px');
  });

  it('balances indented fences matching the existing parser grammar', () => {
    const result = importSources([
      { name: 'first.md', content: '    ```css\n--color-first: #123456;' },
      { name: 'last.css', content: '--color-last: #abcdef;' },
    ]);
    expect(parseDesignDocument(result.markdown).colors.some(c => c.hex === '#abcdef')).toBe(true);
  });

  it('handles long unterminated tags, comments and quoted attributes in linear scans', () => {
    const result = importSources([
      { name: 'unfinished.html', content: '<div ' + ' '.repeat(1_000_000) },
      { name: 'comments.css', content: '--color-safe:#123456;/*' + '/*'.repeat(100_000) },
      {
        name: 'quoted.html',
        content:
          '<div title="<img style=\'color:#ff0000\'>" style="color:#abcdef"></div><script>"<style>--fake:#ff0000;</style>"</script>',
      },
    ]);
    const design = parseDesignDocument(result.markdown);
    expect(result.warnings.join(' ')).toMatch(/unterminated markup/);
    expect(design.colors.map(c => c.hex)).toEqual(expect.arrayContaining(['#123456', '#abcdef']));
    expect(design.colors.some(c => c.hex === '#ff0000')).toBe(false);
  });

  it('detects whitespace-prefixed prose and commented CSS without regexp backtracking', () => {
    const result = importSources([
      { name: 'prose.txt', content: ' '.repeat(1_000_000) + 'x' },
      { name: 'css.txt', content: ' /* heading */ /* more */ :root { --color-brand: #123456; }' },
    ]);
    expect(result.sources.map(source => source.format)).toEqual(['Text', 'CSS']);
    expect(parseDesignDocument(result.markdown).colors[0].hex).toBe('#123456');
  });
});
