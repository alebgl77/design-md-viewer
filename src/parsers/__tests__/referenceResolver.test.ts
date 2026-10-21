import { describe, expect, it } from 'vitest';
import { parseMarkdownStructure } from '../markdownStructure';
import { resolveTokensAndReferences } from '../referenceResolver';
import { importSources } from '../../importers';
import { parseDesignDocument } from '../pipeline';

function resolveCss(css: string, knownColorVars: Record<string, string> = {}) {
  const markdown = `# Tokens\n\n\`\`\`css\n${css}\n\`\`\``;
  return resolveTokensAndReferences(parseMarkdownStructure(markdown), knownColorVars);
}

describe('resolveTokensAndReferences', () => {
  it('bounds branching aliases split across two imported sources while resolving normal cross-source aliases', () => {
    const files = ['', ''];
    for (let index = 0; index < 14; index++) {
      files[index % 2] += `--branch-${index}: var(--branch-${index + 1}) var(--branch-${index + 1});\n`;
    }
    files[0] += '--branch-14: 12345678;\n--ordinary: var(--shared);';
    files[1] += '--shared: 8px;';
    const imported = importSources(files.map((content, index) => ({ name: `source-${index}.css`, content })));
    const tokens = parseDesignDocument(imported.markdown).tokens;
    const branching = tokens.find(token => token.name === 'branch-0');
    expect(branching?.value).toBe('var(--branch-1) var(--branch-1)');
    expect(branching?.resolvedValue === undefined).toBe(true);
    expect(tokens.find(token => token.name === 'ordinary')?.resolvedValue).toBe('8px');
  });

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

  it('keeps raw Markdown branching and deeply nested aliases unresolved without changing definitions', () => {
    const branch = Array.from(
      { length: 20 },
      (_, index) => `--branch-${index}: var(--branch-${index + 1}) var(--branch-${index + 1});`
    );
    branch.push('--branch-20: 8px;');
    const depth = Array.from({ length: 80 }, (_, index) => `--depth-${index}: var(--depth-${index + 1});`);
    depth.push('--depth-80: 8px;');
    const tokens = resolveCss([...branch, ...depth, '--normal: var(--leaf);', '--leaf: 16px;'].join('\n'));
    expect(tokens.find(token => token.name === 'branch-0')).toMatchObject({
      value: 'var(--branch-1) var(--branch-1)',
      resolvedValue: undefined,
    });
    expect(tokens.find(token => token.name === 'depth-0')).toMatchObject({
      value: 'var(--depth-1)',
      resolvedValue: undefined,
    });
    expect(tokens.find(token => token.name === 'normal')?.resolvedValue).toBe('16px');
    expect(
      tokens.every(
        token => !token.resolvedValue || new TextEncoder().encode(token.resolvedValue).byteLength <= 64 * 1024
      )
    ).toBe(true);
  });

  it('checks cached replacement growth before expanding repeated references', () => {
    const payload = 'x'.repeat(40_000);
    const tokens = resolveCss(
      `--payload: ${payload};\n--wide: var(--payload) var(--payload);\n--normal: var(--payload);`
    );
    expect(tokens.find(token => token.name === 'wide')).toMatchObject({
      value: 'var(--payload) var(--payload)',
      resolvedValue: undefined,
    });
    expect(tokens.find(token => token.name === 'normal')?.resolvedValue).toBe(payload);
  });

  it('enforces the expanded byte budget for multibyte values and accepts its exact boundary', () => {
    const atLimit = 'é'.repeat(32_768);
    const tokens = resolveCss(
      `--at-limit: ${atLimit};\n--exact: var(--at-limit);\n--over-limit: ${atLimit}x;\n--over: var(--over-limit);`
    );
    expect(
      new TextEncoder().encode(tokens.find(token => token.name === 'exact')?.resolvedValue).byteLength
    ).toBe(65_536);
    expect(tokens.find(token => token.name === 'over')?.resolvedValue).toBeUndefined();
    expect(tokens.find(token => token.name === 'over-limit')?.value).toBe(`${atLimit}x`);
  });

  it('bounds repeated reference work even when substitutions would shrink the value', () => {
    const value = Array.from({ length: 150 }, () => 'var(--base)').join(' ');
    const tokens = resolveCss(`--base: 1px;\n--wide: ${value};\n--normal: var(--base);`);
    expect(tokens.find(token => token.name === 'wide')).toMatchObject({ value, resolvedValue: undefined });
    expect(tokens.find(token => token.name === 'normal')?.resolvedValue).toBe('1px');
  });

  it('does not commit successful child cache entries from an aborted root', () => {
    const unknowns = (count: number) =>
      Array.from({ length: count }, (_, index) => `var(--unknown-${index})`).join(' ');
    const first = `var(--good) ${unknowns(100)}`;
    const later = `var(--good) ${unknowns(90)}`;
    const chain = Array.from(
      { length: 15 },
      (_, index) => `--g${index + 1}: ${index === 14 ? '8px' : `var(--g${index + 2})`};`
    );
    const tokens = resolveCss(
      [`--first: ${first};`, `--later: ${later};`, '--good: var(--g1);', ...chain].join('\n')
    );
    expect(tokens.find(token => token.name === 'first')).toMatchObject({
      value: first,
      resolvedValue: undefined,
    });
    expect(tokens.find(token => token.name === 'later')).toMatchObject({
      value: later,
      resolvedValue: undefined,
    });
    expect(tokens.find(token => token.name === 'good')?.resolvedValue).toBe('8px');
  });

  it('preserves shared-visited cycle behavior and treats dollar patterns as literal token data', () => {
    const dollars = '"$& $$ $\' $`"';
    const tokens = resolveCss(
      `--combined: var(--base) var(--indirect);\n--base: 8px;\n--indirect: var(--base);\n--dollars: ${dollars};\n--literal: var(--dollars);`
    );
    expect(tokens.find(token => token.name === 'combined')?.resolvedValue).toBe('8px var(--base)');
    expect(tokens.find(token => token.name === 'indirect')?.resolvedValue).toBe('8px');
    expect(tokens.find(token => token.name === 'literal')?.resolvedValue).toBe(dollars);
  });
});
