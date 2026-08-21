import { describe, expect, it } from 'vitest';
import { parseMarkdownStructure } from '../markdownStructure';
import { resolveTokensAndReferences } from '../referenceResolver';

function resolveCss(css: string, knownColorVars: Record<string, string> = {}) {
  const markdown = `# Tokens\n\n\`\`\`css\n${css}\n\`\`\``;
  return resolveTokensAndReferences(parseMarkdownStructure(markdown), knownColorVars);
}

describe('resolveTokensAndReferences', () => {
  it('resolves a long alias chain without changing token order or provenance', () => {
    const chainLength = 1_000;
    const definitions = ['--alias-0: #123456;'];
    for (let index = 1; index < chainLength; index++) {
      definitions.push(`--alias-${index}: var(--alias-${index - 1});`);
    }

    const tokens = resolveCss(definitions.join('\n'));

    expect(tokens).toHaveLength(chainLength);
    expect(tokens.map(token => token.name)).toEqual(
      Array.from({ length: chainLength }, (_, index) => `alias-${index}`)
    );
    expect(tokens[chainLength - 1].resolvedValue).toBe('#123456');
    expect(tokens[chainLength - 1].provenance).toMatchObject({
      headingPath: ['Tokens'],
      lineNumber: chainLength + 3,
      rawSourceSnippet: `--alias-${chainLength - 1}: var(--alias-${chainLength - 2});`,
    });
  });

  it('resolves aliases that share the same dependency', () => {
    const tokens = resolveCss(`--base: #abcdef;
--alias-a: var(--base);
--alias-b: var(--base);
--combined: var(--alias-a) var(--alias-b);`);

    expect(tokens.find(token => token.name === 'alias-a')?.resolvedValue).toBe('#abcdef');
    expect(tokens.find(token => token.name === 'alias-b')?.resolvedValue).toBe('#abcdef');
    expect(tokens.find(token => token.name === 'combined')?.resolvedValue).toBe('#abcdef #abcdef');
  });

  it('preserves missing references and var() fallbacks', () => {
    const tokens = resolveCss(`--missing: var(--not-defined);
--fallback: var(--not-defined, #ffffff);`);

    expect(tokens.find(token => token.name === 'missing')).toMatchObject({
      value: 'var(--not-defined)',
      references: ['--not-defined'],
      resolvedValue: undefined,
    });
    expect(tokens.find(token => token.name === 'fallback')).toMatchObject({
      value: 'var(--not-defined, #ffffff)',
      references: undefined,
      resolvedValue: undefined,
    });
  });

  it('leaves cyclic aliases unresolved', () => {
    const tokens = resolveCss(`--cycle-a: var(--cycle-b);
--cycle-b: var(--cycle-a);`);

    expect(tokens.find(token => token.name === 'cycle-a')?.resolvedValue).toBeUndefined();
    expect(tokens.find(token => token.name === 'cycle-b')?.resolvedValue).toBeUndefined();
  });

  it('keeps known color variables ahead of collected definitions', () => {
    const tokens = resolveCss(
      `--known: #000000;
--alias: var(--known);`,
      { '--known': '#ffffff' }
    );

    expect(tokens.find(token => token.name === 'alias')?.resolvedValue).toBe('#ffffff');
  });
});
