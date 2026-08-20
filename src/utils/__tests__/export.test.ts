import { describe, it, expect } from 'vitest';
import { parseDesignDocument } from '../../parsers/pipeline';
import {
  exportToJson,
  exportToCssVariables,
  exportToTailwindConfig,
  exportToNormalizedMarkdown,
  sanitizeCssValue,
} from '../exportFormats';
import { SAMPLE_APEX_DESIGN_SYSTEM } from '../../samples/fixtures';

/**
 * Returns the balanced `{ ... }` object literal that follows `key:` in the
 * generated module. The generated maps are meant to be pure JSON, so parsing
 * the slice is what proves no token contributed syntax of its own.
 */
function extractObjectLiteral(source: string, key: string): string {
  const start = source.indexOf(`${key}: {`);
  expect(start).toBeGreaterThan(-1);

  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error(`Unbalanced object literal for "${key}"`);
}

describe('Export Generators', () => {
  const system = parseDesignDocument(SAMPLE_APEX_DESIGN_SYSTEM, 'apex.md');

  it('should export valid JSON matching W3C DTCG format', () => {
    const jsonStr = exportToJson(system);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.$schema).toContain('design-tokens');
    expect(parsed.colors).toBeDefined();
    expect(parsed.typography).toBeDefined();
    expect(parsed.spacing).toBeDefined();
  });

  it('should export valid CSS custom properties', () => {
    const css = exportToCssVariables(system);

    expect(css).toContain(':root {');
    expect(css).toContain('--color-primary');
    expect(css).toContain('}');
  });

  it('should export valid Tailwind configuration snippet', () => {
    const tw = exportToTailwindConfig(system);

    expect(tw).toContain('module.exports = {');
    expect(tw).toContain('theme: {');
    expect(tw).toContain('colors: {');
  });

  it('should export clean normalized markdown', () => {
    const md = exportToNormalizedMarkdown(system);

    expect(md).toContain('# Apex UI Design System');
    expect(md).toContain('## Colors');
    expect(md).toContain('## Typography');
    expect(md).toContain('## Spacing');
  });
});

describe('Export Injection Hardening', () => {
  const PAYLOAD = "8px'; require('child_process').execSync('calc'); //";

  function systemWithHostileSpacingToken() {
    const system = parseDesignDocument(
      '# Hostile\n\n## Colors\n* **Primary Brand**: #1d4ed8\n\n## Spacing\n* **gap**: 8px (base gap)\n\n## Border Radius\n* **radius-md**: 8px (buttons)\n',
      'hostile.md'
    );
    system.spacing.push({
      ...system.spacing[0],
      id: 'space-hostile',
      name: 'hostile',
      value: PAYLOAD,
    });
    return system;
  }

  it('should confine a Tailwind token value to a quoted JSON string', () => {
    const tw = exportToTailwindConfig(systemWithHostileSpacingToken());

    // Every token map must still be pure JSON: a value that escaped its quotes
    // would make this slice unparseable, which is exactly the RCE.
    const spacing = JSON.parse(extractObjectLiteral(tw, 'spacing'));
    expect(spacing.hostile).toBe(PAYLOAD);

    // The value is never re-emitted as a bare single-quoted literal.
    expect(tw).not.toContain(`'${PAYLOAD}'`);
    expect(tw).toContain(`"hostile": ${JSON.stringify(PAYLOAD)}`);

    // The generated module scaffold carries no user data at all.
    JSON.parse(extractObjectLiteral(tw, 'colors'));
    JSON.parse(extractObjectLiteral(tw, 'borderRadius'));
  });

  it('should leave a readable placeholder for a category with no tokens', () => {
    const tw = exportToTailwindConfig(parseDesignDocument('# Bare\n', 'bare.md'));

    expect(tw).toContain('// No colors parsed');
    expect(tw).toContain('// No spacing parsed');
    expect(tw).toContain('// No radii parsed');
  });

  it('should strip the characters that terminate a CSS declaration', () => {
    const css = exportToCssVariables(systemWithHostileSpacingToken());
    const hostile = css.split('\n').find(line => line.includes('--space-hostile'));

    expect(hostile).toBeDefined();
    // One semicolon, and it is the terminator the exporter wrote.
    expect(hostile?.match(/;/g)).toHaveLength(1);
    expect(hostile?.endsWith(';')).toBe(true);
    expect(hostile).not.toContain("'");
    // Nothing escaped the :root block.
    expect(css.split('{')).toHaveLength(css.split('}').length);
  });

  it('should omit a value that cannot be made safe rather than emit a broken rule', () => {
    const system = systemWithHostileSpacingToken();
    // An unmatched parenthesis would swallow the closing brace of the rule.
    system.spacing[system.spacing.length - 1].value = 'rgba(0, 0, 0, 0.5';

    const css = exportToCssVariables(system);
    expect(css).not.toContain('--space-hostile');
    expect(css.split('{')).toHaveLength(css.split('}').length);
  });

  it('should neutralize values that would terminate or comment out a declaration', () => {
    expect(sanitizeCssValue('8px; } body { display: none')).toBe('8px body display: none');
    expect(sanitizeCssValue('red /* swallow */ blue')).toBe('red swallow blue');
    expect(sanitizeCssValue('rgba(0, 0, 0, 0.5')).toBe('');
    expect(sanitizeCssValue('rgba(0, 0, 0, 0.5)')).toBe('rgba(0, 0, 0, 0.5)');
  });

  it('should keep a hostile color role from closing its own CSS comment', () => {
    const system = parseDesignDocument('# C\n\n## Colors\n* **Primary Brand**: #1d4ed8\n', 'c.md');
    system.colors[0].role = '*/ } body { display: none } /*';

    const css = exportToCssVariables(system);
    // Comment delimiters and braces are gone, so the injected rule can never open.
    expect(css).not.toContain('body {');
    expect(css.match(/\/\*/g)).toHaveLength((css.match(/\*\//g) || []).length);
    expect(css.split('{')).toHaveLength(css.split('}').length);
  });
});
