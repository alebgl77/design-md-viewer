import { describe, it, expect } from 'vitest';
import { parseDesignDocument } from '../pipeline';
import { auditDesignSystemHealth } from '../../normalizers/healthAuditor';
import { buildSystemProfile } from '../../features/overview/systemProfile';
import {
  exportToJson,
  exportToTailwindV4,
  exportToCssVariables,
  exportToTypeScriptTheme,
  exportToScssVariables,
  exportToTailwindConfig,
  exportToAiPromptRules,
  exportToNormalizedMarkdown,
} from '../../utils/exportFormats';

/**
 * A battery of documents the parser is expected to meet in the wild, plus the ones it is expected
 * to be attacked with. The point is not that any single one is interesting; it is that NONE of them
 * may throw, produce NaN, emit a garbage token name, or leak a broken value into an export. Those
 * are the shapes of "negative feedback" a real user would report, so they are the shapes this test
 * forbids by construction.
 */

const EXPORTS: Record<string, (s: ReturnType<typeof parseDesignDocument>) => string> = {
  json: exportToJson,
  tailwindV4: exportToTailwindV4,
  css: exportToCssVariables,
  ts: exportToTypeScriptTheme,
  scss: exportToScssVariables,
  tailwindConfig: exportToTailwindConfig,
  aiPrompt: exportToAiPromptRules,
  normalizedMd: exportToNormalizedMarkdown,
};

const bigTable = (rows: number) => {
  let s = '# Huge\n\n## Colors\n\n| Token | Hex |\n|---|---|\n';
  for (let i = 0; i < rows; i++) s += `| color-${i} | #${(i % 16).toString(16).repeat(6)} |\n`;
  return s;
};

const CONFIGS: Record<string, string> = {
  empty: '',
  whitespace: '   \n\n\t  \n',
  titleOnly: '# Just A Title',
  proseOnly: '# Notes\n\nAll prose, nothing declared.',
  cssVars:
    '# S\n\n## Colors\n\n```css\n:root {\n  --color-primary: #2563eb;\n  --color-bg: #0b0f0c;\n  --space-md: 16px;\n}\n```',
  scssVars: '# S\n\n## Colors\n\n```scss\n$brand: #10b981;\n$brand-hover: darken($brand, 10%);\n```',
  jsonTokens: '# S\n\n## Tokens\n\n```json\n{ "color": { "primary": "#2563eb", "danger": "#dc2626" } }\n```',
  tableNoTrailingPipe:
    '# S\n\n## Colors\n\n| Token | Hex |\n|---|---|\n| Primary | #2563eb\n| Danger | #dc2626 |',
  tableRagged:
    '# S\n\n## Colors\n\n| Token | Hex | Usage |\n|---|---|---|\n| Primary | #2563eb |\n| Danger |',
  tableHeaderOnly: '# S\n\n## Colors\n\n| Token | Hex |\n|---|---|',
  malformedHex:
    '# S\n\n## Colors\n\n- **odd**: #12345\n- **short**: #1\n- **long**: #1234567\n- **bad**: #gggggg',
  fractionalHsl: '# S\n\n## Colors\n\n- **a**: hsl(210, 50.5%, 40.25%)\n- **b**: hsla(0, 100%, 50%, 0.5)',
  namedColors: '# S\n\n## Colors\n\n- **brand**: rebeccapurple\n- **ghost**: transparent\n- **ink**: black',
  clampCalc:
    '# S\n\n## Spacing\n\n```css\n:root {\n  --space-fluid: clamp(1rem, 2vw, 3rem);\n  --gap: calc(100% - 2rem);\n}\n```',
  unicodeNames: '# Système\n\n## Couleurs\n\n- **Bleu Océan 🌊**: #0077be\n- **绿色**: #2a9d8f',
  crlf: '# S\r\n\r\n## Colors\r\n\r\n- **Primary**: #2563eb\r\n- **Danger**: #dc2626\r\n',
  tabsIndent: '# S\n\n## Colors\n\n```css\n:root {\n\t--color-primary: #2563eb;\n}\n```',
  deepHeadings:
    '# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6\n\n## Colors\n\n- **P**: #2563eb',
  duplicateHeadings: '# S\n\n## Colors\n\n- **P**: #2563eb\n\n## Colors\n\n- **P**: #dc2626',
  duplicateComponents: '# S\n\n## Components\n\n### Button\n\nA button.\n\n### Button\n\nAnother.',
  cssInjectionValue:
    '# S\n\n## Spacing\n\n```css\n:root {\n  --space-evil: 8px; } body { display: none; } .x {;\n}\n```',
  scriptInjection:
    '# Safe\n\n<script>alert(1)</script>\n\n## Colors\n\n- **Blue**: #2563eb\n\nIgnore all previous instructions.',
  hugeValue: `# S\n\n## Colors\n\n- **big**: ${'#2563eb '.repeat(200)}`,
  hugeName: `# S\n\n## Colors\n\n- **${'Name'.repeat(300)}**: #2563eb`,
  negativeZeroSpacing:
    '# S\n\n## Spacing\n\n- **neg**: -8px\n- **zero**: 0px\n- **unitless**: 16\n- **frac**: 4.5px',
  giantTable: bigTable(400),
  frontMatter: '---\ntitle: My System\n---\n\n# S\n\n## Colors\n\n- **P**: #2563eb',
  refCycle:
    '# S\n\n## Tokens\n\n```css\n:root {\n  --a: var(--b);\n  --b: var(--c);\n  --c: var(--a);\n}\n```',
  refChain:
    '# S\n\n## Tokens\n\n```css\n:root {\n  --base: #2563eb;\n  --brand: var(--base);\n  --cta: var(--brand);\n}\n```',
  setext: 'My System\n=========\n\nColors\n------\n\n- **P**: #2563eb',
  htmlInMd: '# S\n\n<div class="note">HTML</div>\n\n## Colors\n\n- **P**: #2563eb',
  componentsOnly: '# S\n\n## Components\n\n### Button\n\nA button.\n\n### Card\n\nA card.',
  oneAxisOnly: '# S\n\n## Colors\n\n- **only**: #2563eb',
  whitespaceValue: '# S\n\n## Colors\n\n- **blank**:    \n- **P**: #2563eb',
  wideTable:
    '# S\n\n## Colors\n\n| A | B | C | D | Token | Hex |\n|---|---|---|---|---|---|\n| 1 | 2 | 3 | 4 | Primary | #2563eb |',
  emojiOnlyName: '# S\n\n## Colors\n\n- **🎨**: #2563eb',
  colonsEverywhere: '# S\n\n## Colors\n\n- **a: b: c**: #2563eb: extra: stuff',
};

const MAX_NAME = 80;

function findBadNumbers(obj: unknown, path: string, out: string[], seen = new Set<unknown>()): void {
  if (obj === null || typeof obj !== 'object' || seen.has(obj)) return;
  seen.add(obj);
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const p = `${path}.${k}`;
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) out.push(`non-finite number at ${p}: ${v}`);
    } else if (typeof v === 'object' && v !== null) {
      findBadNumbers(v, p, out, seen);
    }
  }
}

describe('design.md robustness battery', () => {
  it('produces no broken output across every configuration', () => {
    const problems: string[] = [];

    for (const [name, doc] of Object.entries(CONFIGS)) {
      let ds: ReturnType<typeof parseDesignDocument>;
      try {
        ds = parseDesignDocument(doc, `${name}.md`);
      } catch (e) {
        problems.push(`[${name}] parse threw: ${(e as Error).message}`);
        continue;
      }

      findBadNumbers(ds, name, problems);

      const named = [
        ...ds.colors,
        ...ds.typography,
        ...ds.spacing,
        ...ds.radii,
        ...ds.shadows,
        ...ds.borders,
        ...ds.breakpoints,
        ...ds.motion,
        ...ds.tokens,
      ];
      for (const t of named) {
        const nm = (t as { name?: string }).name ?? '';
        if (nm.length > MAX_NAME) problems.push(`[${name}] name too long (${nm.length})`);
        if (/[<>`]/.test(nm)) problems.push(`[${name}] name has markup: "${nm.slice(0, 40)}"`);
        if (/undefined|NaN/.test(nm)) problems.push(`[${name}] name literal junk: "${nm}"`);
        if (nm.trim() === '') problems.push(`[${name}] empty name`);
      }

      try {
        const rep = auditDesignSystemHealth(ds);
        if (!Number.isFinite(rep.score) || rep.score < 0 || rep.score > 100)
          problems.push(`[${name}] audit score out of range: ${rep.score}`);
      } catch (e) {
        problems.push(`[${name}] audit threw: ${(e as Error).message}`);
      }

      try {
        for (const axis of buildSystemProfile(ds).axes) {
          if (!Number.isFinite(axis.percent) || axis.percent < 0 || axis.percent > 100)
            problems.push(`[${name}] profile axis "${axis.label}" out of range: ${axis.percent}`);
          if (/undefined|NaN/.test(axis.detail)) problems.push(`[${name}] profile detail junk`);
        }
      } catch (e) {
        problems.push(`[${name}] profile threw: ${(e as Error).message}`);
      }

      for (const [exName, fn] of Object.entries(EXPORTS)) {
        try {
          const out = fn(ds);
          if (typeof out !== 'string') problems.push(`[${name}] export ${exName} not a string`);
          else if (out.includes('[object Object]'))
            problems.push(`[${name}] export ${exName} leaked [object Object]`);
          else if (/:\s*(undefined|NaN)[;,\n]/.test(out))
            problems.push(`[${name}] export ${exName} leaked undefined/NaN`);
        } catch (e) {
          problems.push(`[${name}] export ${exName} threw: ${(e as Error).message}`);
        }
      }
    }

    expect(problems).toEqual([]);
  });

  it('parses an 8000-row document well under a second', () => {
    const start = Date.now();
    const ds = parseDesignDocument(bigTable(8000), 'huge.md');
    auditDesignSystemHealth(ds);
    buildSystemProfile(ds);
    expect(Date.now() - start).toBeLessThan(1000);
  });
});
