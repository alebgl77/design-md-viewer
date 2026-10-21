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
import { parseMarkdownStructure } from '../../parsers/markdownStructure';

const ROUNDTRIP_DOCUMENT = `# Orbit

## Colors

| Name | HEX | Role |
| --- | --- | --- |
| Primary | #2563eb | Primary actions |

## Typography

| Level | Font Family | Size | Weight | Line Height | Letter Spacing | Text Transform | Role |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Body | Inter, sans-serif | 16px | 400 | 1.5 | 0.02em | uppercase | Body copy |

## Spacing

| Token | Value | Role |
| --- | --- | --- |
| gap | 8px | Between items |

## Border Radius

| Token | Value | Role |
| --- | --- | --- |
| medium | 8px | Controls |

## Shadows

| Level | CSS Value | Role |
| --- | --- | --- |
| low | 0 1px 2px rgba(0, 0, 0, 0.2) | Cards |

## Borders

| Name | Width | Style | Color | Role |
| --- | --- | --- | --- | --- |
| subtle | 1px | solid | var(--color-primary) | Dividers |

## Breakpoints

| Name | Min Width | Role |
| --- | --- | --- |
| tablet | 768px | Two columns |

## Motion

| Name | Duration | Easing | Transition | Usage |
| --- | --- | --- | --- | --- |
| fast | 150ms | ease-out | opacity 150ms ease-out | Feedback |

## Tokens

\`\`\`css
:root {
  --layer-base: 100;
  --layer-popover: var(--layer-base);
  --cycle-a: var(--cycle-b);
  --cycle-b: var(--cycle-a);
}
\`\`\`

## Components

### Orbit Selector

A custom selection component.

#### Variants

* **icon-only**: Compact: icon with label.

#### States

* hover
* disabled

#### Sizes

* small
* large

#### Anatomy

* Small icon
* Focus indicator

#### Tokens

* --layer-popover
* $legacy-token

#### Behavior

* Escape closes the popup.

#### Accessibility

* Focus ring remains visible.

#### Code Example

\`\`\`tsx
<OrbitSelector disabled />
\`\`\`

## Accessibility

* **Keyboard**: Support Escape to close. WCAG AA.
`;

function semanticTokens(tokens: { id: string; provenance: unknown; confidence: unknown }[]) {
  return tokens.map(token =>
    Object.fromEntries(
      Object.entries(token).filter(([key]) => !['id', 'provenance', 'confidence'].includes(key))
    )
  );
}

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

describe('Normalized Markdown semantic roundtrip', () => {
  it('keeps overview punctuation and literal backslashes stable across two normalization cycles', () => {
    const original = parseDesignDocument('# Overview\n');
    const text = String.raw`Orbit C:\Users\design\* * # [x] \\ network`;
    original.overview.name = text;
    original.overview.description = `${text}\n## Forged\n\`\`\`css\n--fake: red;`;
    original.overview.philosophy = `${text}\n~~~\n## Fake philosophy`;
    original.overview.principles = [text, `${text}\n# Fake principle`];
    const expected = {
      name: text,
      description: `${text} ## Forged \`\`\`css --fake: red;`,
      philosophy: `${text} ~~~ ## Fake philosophy`,
      principles: [text, `${text} # Fake principle`],
    };

    let system = original;
    for (let cycle = 0; cycle < 2; cycle++) {
      const markdown = exportToNormalizedMarkdown(system);
      const structure = parseMarkdownStructure(markdown);
      expect(structure.sections.map(s => s.heading)).toHaveLength(3);
      expect(structure.codeBlocks).toEqual([]);
      system = parseDesignDocument(markdown, 'DESIGN.md');
      expect(system.overview).toMatchObject(expected);
    }
  });

  it('retains every recognized token category, aliases, and component subsections', () => {
    const original = parseDesignDocument(ROUNDTRIP_DOCUMENT, 'source.md');
    const markdown = exportToNormalizedMarkdown(original);
    const reparsed = parseDesignDocument(markdown, 'DESIGN.md');

    for (const category of [
      'colors',
      'typography',
      'spacing',
      'radii',
      'shadows',
      'borders',
      'breakpoints',
      'motion',
      'tokens',
      'components',
      'accessibility',
    ] as const) {
      expect(semanticTokens(reparsed[category]), category).toEqual(semanticTokens(original[category]));
    }
    expect(reparsed.borders).toHaveLength(1);
    expect(reparsed.breakpoints.map(b => b.pxValue)).toEqual([768]);
    expect(reparsed.motion[0]).toMatchObject({ duration: '150ms', cssTransition: 'opacity 150ms ease-out' });
    expect(reparsed.tokens.find(t => t.name === 'layer-popover')).toMatchObject({
      value: 'var(--layer-base)',
      resolvedValue: '100',
      references: ['--layer-base'],
    });
    expect(reparsed.tokens.find(t => t.name === 'cycle-a')?.value).toBe('var(--cycle-b)');
    expect(reparsed.components[0]).toMatchObject({
      name: 'Orbit Selector',
      variants: [{ name: 'icon-only', description: 'Compact: icon with label.' }],
      states: ['hover', 'disabled'],
      anatomy: ['Small icon', 'Focus indicator'],
      a11yNotes: ['Focus ring remains visible.'],
      rawCodeExample: '<OrbitSelector disabled />',
    });
    expect(reparsed.overview.totalTokensCount).toBe(12);
    expect(reparsed.overview.totalTokensCount).toBe(original.overview.totalTokensCount);
    // Components and accessibility are specifications/rules, excluded from token totals.
    expect(reparsed.components.length + reparsed.accessibility.length).toBeGreaterThan(0);
    expect(reparsed.overview.categoriesDetected).toEqual(original.overview.categoriesDetected);
    for (const token of [...reparsed.borders, ...reparsed.motion, ...reparsed.tokens]) {
      expect(markdown.split('\n')[(token.provenance.lineNumber || 0) - 1]).toContain(token.name);
    }
  });

  it('keeps custom names originally supplied in a component table', () => {
    const original = parseDesignDocument(
      '# Widgets\n\n## Components\n\n| Component | Description | Variants |\n| --- | --- | --- |\n| Date Picker | Select a date | Calendar, Text |\n'
    );
    expect(original.components.map(c => c.name)).toEqual(['Date Picker']);
    const reparsed = parseDesignDocument(exportToNormalizedMarkdown(original));
    expect(semanticTokens(reparsed.components)).toEqual(semanticTokens(original.components));
  });

  it('confines hostile component strings to their own blocks and preserves nested code fences', () => {
    const original = parseDesignDocument(ROUNDTRIP_DOCUMENT);
    const component = original.components[0];
    component.name = 'Orbit | `Picker`\n## Forged';
    component.description = '```\n## Forged Description\n| Fake | Header |';
    component.variants = [{ name: 'icon-only | `x`', description: 'With pipes | and colon: detail' }];
    component.states = ['hover\n## Forged State', '`disabled` | inert'];
    component.rawCodeExample =
      'const sample = `template`;\n```md\n## Still inside example\n```\n~~~~\n# Still code';
    original.borders[0].role = 'Dividers | ornaments \\ separators';

    const markdown = exportToNormalizedMarkdown(original);
    const structure = parseMarkdownStructure(markdown);
    const reparsed = parseDesignDocument(markdown);
    expect(structure.sections.some(s => /^Forged|^Still inside|^Still code/.test(s.heading))).toBe(false);
    expect(reparsed.components).toHaveLength(1);
    expect(reparsed.components[0]).toMatchObject({
      name: 'Orbit | `Picker` ## Forged',
      description: '``` ## Forged Description | Fake | Header |',
      variants: component.variants,
      states: ['hover ## Forged State', '`disabled` | inert'],
      rawCodeExample: component.rawCodeExample,
    });
    expect(reparsed.borders[0].role).toBe(original.borders[0].role);
    expect(reparsed.breakpoints.map(b => b.pxValue)).toEqual([768]);
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
