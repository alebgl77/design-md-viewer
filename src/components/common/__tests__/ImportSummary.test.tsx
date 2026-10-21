import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ImportSummary } from '../ImportSummary';

describe('Import summary', () => {
  it("counts the importer's prefixed warning once instead of adding its raw source note", () => {
    const markup = renderToStaticMarkup(
      <ImportSummary
        result={{
          sources: [{ name: 'palette.png', format: 'Image palette', warnings: ['Palette only.'] }],
          warnings: ['palette.png: Palette only.'],
        }}
      />
    );
    expect(markup).toContain('1 import note');
    expect(markup.match(/Palette only\./g)).toHaveLength(1);
  });

  it('shows every source and preserves extraction notes with generated-source limitations', () => {
    const markup = renderToStaticMarkup(
      <ImportSummary
        result={{
          sources: [
            { name: 'tokens.css', format: 'CSS', warnings: [] },
            { name: 'palette.png', format: 'Image', warnings: ['Palette extraction only.'] },
            { name: 'guide.pdf', format: 'PDF', warnings: [] },
          ],
          warnings: ['Palette extraction only.', 'Skipped unsupported file archive.zip.'],
        }}
      />
    );

    expect(markup).toContain('Generated DESIGN.md');
    expect(markup).toContain('3 sources');
    expect(markup).toContain('tokens.css');
    expect(markup).toContain('palette.png');
    expect(markup).toContain('guide.pdf');
    expect(markup).toContain('2 import notes');
    expect(markup.match(/Palette extraction only\./g)).toHaveLength(1);
    expect(markup).toContain('Skipped unsupported file archive.zip.');
    expect(markup).toContain('Source links open the generated Markdown.');
    expect(markup).toContain('selectable text only');
  });

  it('keeps direct Markdown wording and escapes untrusted source names and notes', () => {
    const markup = renderToStaticMarkup(
      <ImportSummary
        result={{
          sources: [{ name: '<script>.md', format: 'Markdown', warnings: [] }],
          warnings: ['<img src=x onerror=alert(1)>'],
        }}
      />
    );

    expect(markup).toContain('Markdown source');
    expect(markup).not.toContain('Generated DESIGN.md');
    expect(markup).toContain('&lt;script&gt;.md');
    expect(markup).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});
