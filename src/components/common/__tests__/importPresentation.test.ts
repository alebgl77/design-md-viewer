import { describe, expect, it } from 'vitest';
import { createPastedSource, isGeneratedImport, PASTE_FORMATS } from '../importPresentation';

describe('Pasted source names', () => {
  it('rejects empty or whitespace-only content', () => {
    for (const content of ['', ' \n\t ']) {
      expect(() => createPastedSource(content, '', 'md')).toThrow('Paste some source content');
    }
  });

  it.each(PASTE_FORMATS)('names an unnamed $label source with its selected extension', ({ extension }) => {
    expect(createPastedSource('source content', '  ', extension)).toEqual({
      name: `pasted-source.${extension}`,
      content: 'source content',
    });
  });

  it('uses the selected format when a name includes a supported extension', () => {
    expect(createPastedSource('  :root { --brand: #123456; }\n', ' Brand.JSON ', 'css')).toEqual({
      name: 'Brand.css',
      content: '  :root { --brand: #123456; }\n',
    });
    expect(createPastedSource('# Design', 'guide.markdown', 'md').name).toBe('guide.md');
    expect(createPastedSource('<p>Guide</p>', 'guide.htm', 'html').name).toBe('guide.html');
  });
});

describe('Generated source indication', () => {
  it('keeps a single Markdown document identified as its original source', () => {
    for (const name of ['design.md', 'GUIDE.MARKDOWN']) {
      expect(isGeneratedImport([{ name, format: 'Markdown', warnings: [] }])).toBe(false);
    }
  });

  it('identifies other formats and combined documents as generated Markdown', () => {
    expect(isGeneratedImport([{ name: 'tokens.css', format: 'CSS', warnings: [] }])).toBe(true);
    expect(isGeneratedImport([{ name: 'guide.txt', format: 'Text', warnings: [] }])).toBe(true);
    expect(
      isGeneratedImport([
        { name: 'colors.md', format: 'Markdown', warnings: [] },
        { name: 'type.md', format: 'Markdown', warnings: [] },
      ])
    ).toBe(true);
  });
});
