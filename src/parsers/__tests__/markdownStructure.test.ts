import { describe, expect, it } from 'vitest';
import { parseMarkdownStructure } from '../markdownStructure';

describe('Markdown structural delimiters', () => {
  it.each(['`', '~'])('closes %s fences only with the matching marker and sufficient length', marker => {
    const fence = marker.repeat(4);
    const other = marker === '`' ? '~~~' : '```';
    const code = [marker.repeat(3), other, `${fence}not-a-close`, '# Inside code'].join('\n');
    const source = ['# Document', fence + 'text', code, fence, '## Outside'].join('\n');
    const parsed = parseMarkdownStructure(source);
    expect(parsed.codeBlocks).toHaveLength(1);
    expect(parsed.codeBlocks[0]).toMatchObject({ language: 'text', code, startLine: 2, endLine: 7 });
    expect(parsed.sections.map(s => s.heading)).toEqual(['Document', 'Outside']);
    expect(parsed.rawLines).toEqual(source.split('\n'));
  });

  it('keeps escaped pipes and backslashes in their own table cells', () => {
    const parsed = parseMarkdownStructure(String.raw`# Table

| Name | Definition |
| --- | --- |
| alpha\|beta | path\\item |
`);
    expect(parsed.tables[0].rows).toEqual([['alpha|beta', 'path\\item']]);
    expect(parsed.tables[0].startLine).toBe(3);
  });
});
