import { describe, expect, it } from 'vitest';
import { extractComponents } from '../componentExtractor';
import { parseMarkdownStructure } from '../markdownStructure';

describe('Component subtree boundaries', () => {
  it('keeps many sibling components and their nested subsections within the correct source ranges', () => {
    const count = 2048;
    const siblings = Array.from({ length: count }, (_, index) =>
      [
        `### Orbit ${index}`,
        '',
        `Description for component ${index}.`,
        '',
        '#### States',
        '',
        '* hover',
        '',
        '##### Example',
        '',
        '```text',
        `example(${index})`,
        '```',
        '',
      ].join('\n')
    );
    const document = [
      '# System',
      '',
      '## Components',
      '',
      ...siblings,
      '## After components',
      '',
      '```text',
      'outside()',
      '```',
    ].join('\n');
    const structure = parseMarkdownStructure(document);
    const components = extractComponents(structure);

    expect(components).toHaveLength(count);
    components.forEach((component, index) => {
      expect(component.name).toBe(`Orbit ${index}`);
      expect(component.rawCodeExample).toBe(`example(${index})`);
      expect(component.states).toEqual(['hover']);
      const next = components[index + 1];
      const end = next ? next.provenance.lineNumber! - 1 : structure.sections.at(-1)!.lineNumber - 1;
      expect(component.provenance.lineEnd).toBe(end);
    });
  });

  it('closes nested recognized components at their next peer without borrowing later examples', () => {
    const document = [
      '# System',
      '## Components',
      '### Orbit',
      'Orbit description.',
      '#### Card',
      'Card description.',
      '##### Example',
      '```text',
      'nested()',
      '```',
      '#### Card Next',
      'Next card without an example.',
      '### Orbit Next',
      'Next component.',
      '#### Example',
      '```text',
      'sibling()',
      '```',
      '## Finish',
    ].join('\n');
    const structure = parseMarkdownStructure(document);
    const components = extractComponents(structure);
    expect(components.map(c => c.name)).toEqual(['Orbit', 'Card', 'Card Next', 'Orbit Next']);
    const nested = components[1];
    expect(nested.rawCodeExample).toBe('nested()');
    expect(nested.provenance.lineEnd).toBe(components[2].provenance.lineNumber! - 1);
    expect(components[2].rawCodeExample).toBeUndefined();
    expect(components[3].rawCodeExample).toBe('sibling()');
    expect(components[3].provenance.lineEnd).toBe(structure.rawLines.length - 1);
  });
});
