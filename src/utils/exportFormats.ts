import { DesignSystem } from '../schema/designSystem';

/**
 * Removes anything that could terminate a declaration, escape a rule block or
 * open a comment in CSS/SCSS. Returns an empty string when the value cannot be
 * made safe, in which case callers omit the declaration entirely rather than
 * emit a broken stylesheet.
 */
export function sanitizeCssValue(value: string): string {
  const cleaned = value
    .replace(/\/\*|\*\//g, ' ')
    .replace(/[;{}<>\\"']/g, '')
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // An unmatched parenthesis swallows the rest of the stylesheet, including the
  // closing brace of the rule it sits in.
  return hasBalancedParens(cleaned) ? cleaned : '';
}

function hasBalancedParens(value: string): boolean {
  let depth = 0;
  for (const char of value) {
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}

/** Collapses a value onto a single line so it cannot forge new markdown blocks. */
function toSingleLine(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Comment text only has to survive until the closing delimiter, so the comment
 * markers go first. Braces and semicolons follow them out so the text stays
 * inert even for a downstream tool that strips comments before parsing.
 */
function toCssComment(value: string): string {
  return toSingleLine(value)
    .replace(/\/\*|\*\//g, ' ')
    .replace(/[;{}<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toTableCell(value: string): string {
  return toSingleLine(value).replace(/\|/g, '\\|');
}

/** A code span cannot escape a backtick, so backticks are dropped outright. */
function toCodeCell(value: string): string {
  return toTableCell(value).replace(/`/g, '');
}

function toTokenKey(name: string, fallback: string): string {
  const key = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return key || fallback;
}

/**
 * Token names are free-form sentences, so distinct tokens routinely collapse to
 * the same identifier. Suffix collisions deterministically instead of silently
 * dropping tokens (object literals, YAML maps) or shadowing them (CSS).
 */
function uniqueKey(key: string, seen: Set<string>): string {
  let candidate = key;
  let suffix = 2;
  while (seen.has(candidate)) {
    candidate = `${key}-${suffix}`;
    suffix += 1;
  }
  seen.add(candidate);
  return candidate;
}

function pushDeclaration(
  lines: string[],
  indent: string,
  varName: string,
  rawValue: string,
  comment?: string
): void {
  const value = sanitizeCssValue(rawValue);
  if (!value) return;
  const note = comment ? toCssComment(comment) : '';
  lines.push(`${indent}${varName}: ${value};${note ? ` /* ${note} */` : ''}`);
}

function buildTokenMap(
  tokens: Array<{ name: string; value: string }>,
  fallback: string
): Record<string, string> {
  const map: Record<string, string> = Object.create(null);
  const seen = new Set<string>();
  tokens.forEach(token => {
    map[uniqueKey(toTokenKey(token.name, fallback), seen)] = token.value;
  });
  return map;
}

/**
 * Serializes a token map as a JS object literal. Every user-controlled string
 * goes through JSON.stringify, which quotes keys and escapes quotes, backslashes
 * and newlines - so no token can contribute syntax to the generated module.
 */
function serializeTokenMap(map: Record<string, string>, indent: string, emptyNote: string): string {
  if (Object.keys(map).length === 0) {
    return `{\n${indent}  ${emptyNote}\n${indent}}`;
  }

  // Safe to re-indent line by line: JSON.stringify escapes newlines inside
  // strings, so every remaining newline is structural.
  return JSON.stringify(map, null, 2)
    .split('\n')
    .map((line, index) => (index === 0 ? line : `${indent}${line}`))
    .join('\n');
}

export function exportToJson(system: DesignSystem): string {
  const exportPayload = {
    $schema: 'https://design-tokens.github.io/community-group/format/',
    name: system.overview.name || 'Design System',
    description: system.overview.description,
    version: '1.0.0',
    meta: {
      generatedBy: 'Design.md Visual Explorer',
      sourceFile: system.metadata.fileName,
      parsedAt: system.metadata.parsedAt,
      isAiEnriched: system.metadata.isAiEnriched,
      totalTokens: system.overview.totalTokensCount,
    },
    overview: {
      philosophy: system.overview.philosophy,
      principles: system.overview.principles,
      visualTone: system.overview.visualTone,
    },
    // Token ids are keyed with a null-prototype accumulator: a plain object
    // would route an id of "__proto__" to the prototype setter and drop it.
    colors: system.colors.reduce(
      (acc, col) => {
        acc[col.id] = {
          $value: col.hex,
          $type: 'color',
          $description: col.role || col.name,
          rgb: col.rgb,
          hsl: col.hsl,
          group: col.paletteGroup,
          aliases: col.aliases,
          confidence: col.confidence,
        };
        return acc;
      },
      Object.create(null) as Record<string, any>
    ),
    typography: system.typography.reduce(
      (acc, typo) => {
        acc[typo.id] = {
          $type: 'typography',
          $value: {
            fontFamily: typo.fontFamily,
            fontSize: typo.fontSize,
            fontWeight: typo.fontWeight,
            lineHeight: typo.lineHeight,
            letterSpacing: typo.letterSpacing,
          },
          $description: typo.role || typo.name,
        };
        return acc;
      },
      Object.create(null) as Record<string, any>
    ),
    spacing: system.spacing.reduce(
      (acc, sp) => {
        acc[sp.id] = {
          $type: 'dimension',
          $value: sp.value,
          px: sp.pxValue,
          rem: sp.remValue,
        };
        return acc;
      },
      Object.create(null) as Record<string, any>
    ),
    radius: system.radii.reduce(
      (acc, rad) => {
        acc[rad.id] = {
          $type: 'dimension',
          $value: rad.value,
          px: rad.pxValue,
        };
        return acc;
      },
      Object.create(null) as Record<string, any>
    ),
    shadows: system.shadows.reduce(
      (acc, shd) => {
        acc[shd.id] = {
          $type: 'shadow',
          $value: shd.value,
          elevation: shd.elevationLevel,
        };
        return acc;
      },
      Object.create(null) as Record<string, any>
    ),
    borders: system.borders.reduce(
      (acc, brd) => {
        acc[brd.id] = {
          $type: 'border',
          $value: `${brd.width} ${brd.style} ${brd.color || ''}`.trim(),
        };
        return acc;
      },
      Object.create(null) as Record<string, any>
    ),
    breakpoints: system.breakpoints.reduce(
      (acc, bp) => {
        acc[bp.id] = {
          $type: 'breakpoint',
          $value: bp.minWidth || `${bp.pxValue}px`,
          px: bp.pxValue,
        };
        return acc;
      },
      Object.create(null) as Record<string, any>
    ),
    components: system.components.map(comp => ({
      name: comp.name,
      description: comp.description,
      anatomy: comp.anatomy,
      variants: comp.variants,
      sizes: comp.sizes,
      states: comp.states,
      tokensUsed: comp.tokensUsed,
      a11yNotes: comp.a11yNotes,
      previewType: comp.previewType,
    })),
    motion: system.motion.map(mot => ({
      name: mot.name,
      duration: mot.duration,
      easing: mot.easing,
      usage: mot.usage,
    })),
    accessibility: system.accessibility.map(a => ({
      title: a.title,
      category: a.category,
      description: a.description,
      wcagLevel: a.wcagLevel,
    })),
  };

  return JSON.stringify(exportPayload, null, 2);
}

export function exportToTailwindV4(system: DesignSystem): string {
  const lines: string[] = ['/* Tailwind CSS v4 Theme Extension */', '@import "tailwindcss";', '', '@theme {'];

  if (system.colors.length > 0) {
    lines.push('  /* --- Colors --- */');
    const seen = new Set<string>();
    system.colors.forEach(col => {
      pushDeclaration(lines, '  ', `--color-${uniqueKey(toTokenKey(col.name, 'color'), seen)}`, col.hex);
    });
  }

  if (system.spacing.length > 0) {
    lines.push('\n  /* --- Spacing --- */');
    const seen = new Set<string>();
    system.spacing.forEach(sp => {
      pushDeclaration(lines, '  ', `--spacing-${uniqueKey(toTokenKey(sp.name, 'space'), seen)}`, sp.value);
    });
  }

  if (system.radii.length > 0) {
    lines.push('\n  /* --- Radii --- */');
    const seen = new Set<string>();
    system.radii.forEach(rad => {
      pushDeclaration(lines, '  ', `--radius-${uniqueKey(toTokenKey(rad.name, 'radius'), seen)}`, rad.value);
    });
  }

  lines.push('}');
  return lines.join('\n');
}

export function exportToCssVariables(system: DesignSystem): string {
  const lines: string[] = ['/** Generated by Design.md Visual Explorer */', ':root {'];

  if (system.colors.length > 0) {
    lines.push('  /* --- Colors --- */');
    const seen = new Set<string>();
    system.colors.forEach(col => {
      const varName = `--color-${uniqueKey(toTokenKey(col.name, 'color'), seen)}`;
      pushDeclaration(lines, '  ', varName, col.hex, col.role || col.paletteGroup);
    });
  }

  if (system.typography.length > 0) {
    lines.push('\n  /* --- Typography --- */');
    const seen = new Set<string>();
    system.typography.forEach(t => {
      const varName = `--font-size-${uniqueKey(toTokenKey(t.name, 'text'), seen)}`;
      pushDeclaration(lines, '  ', varName, t.fontSize);
    });
  }

  if (system.spacing.length > 0) {
    lines.push('\n  /* --- Spacing --- */');
    const seen = new Set<string>();
    system.spacing.forEach(s => {
      const varName = `--space-${uniqueKey(toTokenKey(s.name, 'space'), seen)}`;
      pushDeclaration(lines, '  ', varName, s.value);
    });
  }

  if (system.radii.length > 0) {
    lines.push('\n  /* --- Radii --- */');
    const seen = new Set<string>();
    system.radii.forEach(r => {
      const varName = `--radius-${uniqueKey(toTokenKey(r.name, 'radius'), seen)}`;
      pushDeclaration(lines, '  ', varName, r.value);
    });
  }

  if (system.shadows.length > 0) {
    lines.push('\n  /* --- Shadows --- */');
    const seen = new Set<string>();
    system.shadows.forEach(sh => {
      const varName = `--shadow-${uniqueKey(toTokenKey(sh.name, 'shadow'), seen)}`;
      pushDeclaration(lines, '  ', varName, sh.value);
    });
  }

  lines.push('}');
  return lines.join('\n');
}

export function exportToTypeScriptTheme(system: DesignSystem): string {
  const toCamelKey = (name: string, fallback: string): string => {
    const key = name
      .toLowerCase()
      .replace(/[^a-z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '');
    return key || fallback;
  };

  const buildCamelMap = (
    tokens: Array<{ name: string; value: string }>,
    fallback: string
  ): Record<string, string> => {
    const map: Record<string, string> = Object.create(null);
    const seen = new Set<string>();
    tokens.forEach(token => {
      map[uniqueKey(toCamelKey(token.name, fallback), seen)] = token.value;
    });
    return map;
  };

  const colorsObj = buildCamelMap(
    system.colors.map(c => ({ name: c.name, value: c.hex })),
    'color'
  );
  const spacingObj = buildCamelMap(
    system.spacing.map(s => ({ name: s.name, value: s.value })),
    'space'
  );
  const radiusObj = buildCamelMap(
    system.radii.map(r => ({ name: r.name, value: r.value })),
    'radius'
  );

  return `/**
 * TypeScript Design Tokens Definition
 * Auto-generated by Design.md Visual Explorer
 */

export const theme = {
  name: ${JSON.stringify(system.overview.name || 'Design System')},
  colors: ${JSON.stringify(colorsObj, null, 4)},
  spacing: ${JSON.stringify(spacingObj, null, 4)},
  borderRadius: ${JSON.stringify(radiusObj, null, 4)},
} as const;

export type Theme = typeof theme;
export type ThemeColor = keyof typeof theme.colors;
export type ThemeSpacing = keyof typeof theme.spacing;
`;
}

export function exportToScssVariables(system: DesignSystem): string {
  const lines: string[] = ['// SCSS / SASS Variables', '// Generated by Design.md Visual Explorer', ''];

  if (system.colors.length > 0) {
    lines.push('// --- Colors ---');
    const seen = new Set<string>();
    system.colors.forEach(col => {
      pushDeclaration(lines, '', `$color-${uniqueKey(toTokenKey(col.name, 'color'), seen)}`, col.hex);
    });
  }

  if (system.spacing.length > 0) {
    lines.push('\n// --- Spacing ---');
    const seen = new Set<string>();
    system.spacing.forEach(s => {
      pushDeclaration(lines, '', `$space-${uniqueKey(toTokenKey(s.name, 'space'), seen)}`, s.value);
    });
  }

  if (system.radii.length > 0) {
    lines.push('\n// --- Radii ---');
    const seen = new Set<string>();
    system.radii.forEach(r => {
      pushDeclaration(lines, '', `$radius-${uniqueKey(toTokenKey(r.name, 'radius'), seen)}`, r.value);
    });
  }

  return lines.join('\n');
}

export function exportToTailwindConfig(system: DesignSystem): string {
  const colors = buildTokenMap(
    system.colors.map(c => ({ name: c.name, value: c.hex })),
    'color'
  );
  const spacing = buildTokenMap(
    system.spacing.map(s => ({ name: s.name, value: s.value })),
    'space'
  );
  const radii = buildTokenMap(
    system.radii.map(r => ({ name: r.name, value: r.value })),
    'radius'
  );

  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: ${serializeTokenMap(colors, '      ', '// No colors parsed')},
      spacing: ${serializeTokenMap(spacing, '      ', '// No spacing parsed')},
      borderRadius: ${serializeTokenMap(radii, '      ', '// No radii parsed')},
    },
  },
};
`;
}

export function exportToAiPromptRules(system: DesignSystem): string {
  // Every interpolation is flattened: this document is handed to an agent as a
  // rule set, so a token must not be able to forge a heading or a new rule line.
  const colorList = system.colors
    .map(c => `- ${toSingleLine(c.name)}: ${toSingleLine(c.hex)} (${toSingleLine(c.role || c.paletteGroup)})`)
    .join('\n');
  const typoList = system.typography
    .map(
      t =>
        `- ${toSingleLine(t.name)}: ${toSingleLine(t.fontSize)}, weight ${toSingleLine(String(t.fontWeight))} (${toSingleLine(t.fontFamily)})`
    )
    .join('\n');
  const spaceList = system.spacing
    .map(s => `- ${toSingleLine(s.name)}: ${toSingleLine(s.value)} (${s.pxValue}px)`)
    .join('\n');
  const radiusList = system.radii.map(r => `- ${toSingleLine(r.name)}: ${toSingleLine(r.value)}`).join('\n');
  const compList = system.components
    .map(c => `- ${toSingleLine(c.name)}: ${toSingleLine(c.description || 'UI component')}`)
    .join('\n');
  const a11yList = system.accessibility
    .map(a => `- ${toSingleLine(a.title)}: ${toSingleLine(a.description)}`)
    .join('\n');

  const identity = toSingleLine(system.overview.name || 'Core System');
  const description = toSingleLine(system.overview.description || 'Standard design specification.');
  const philosophy = toSingleLine(system.overview.philosophy || '');

  return `# DESIGN SYSTEM GUIDELINES & CONSTRAINTS

You MUST strictly follow this design system specification when generating or modifying any UI components or code.
NEVER invent arbitrary colors, font sizes, or spacing outside these designated tokens.

## Design Identity: ${identity}
${description}
${philosophy ? `Philosophy: ${philosophy}` : ''}

## Primary Design Tokens

### Colors
${colorList || '- Use standard neutral palette.'}

### Typography
${typoList || '- Default sans-serif scale.'}

### Spacing Grid
${spaceList || '- Standard 4px/8px geometric grid.'}

### Border Radius
${radiusList || '- Standard rounded corners.'}

## Components to Follow
${compList || '- Standard accessible UI components.'}

## Accessibility & Quality Standards
${a11yList || '- Minimum WCAG AA 4.5:1 contrast.\n- Clear focus rings for keyboard navigation.\n- Minimum 44x44px touch target size.'}
`;
}

export function exportToNormalizedMarkdown(system: DesignSystem): string {
  const lines: string[] = [];

  // YAML Frontmatter for AI Agents & Tools. Scalars are emitted with
  // JSON.stringify: a JSON string is a valid YAML double-quoted scalar, and it
  // escapes the quotes and newlines that would otherwise end the block early.
  lines.push('---');
  lines.push(`name: ${JSON.stringify(system.overview.name || 'Design System')}`);
  lines.push(`totalTokens: ${system.overview.totalTokensCount}`);
  lines.push('tokens:');
  lines.push('  colors:');
  const colorKeys = new Set<string>();
  system.colors.forEach(c => {
    lines.push(`    ${uniqueKey(toTokenKey(c.name, 'color'), colorKeys)}: ${JSON.stringify(c.hex)}`);
  });
  lines.push('  spacing:');
  const spacingKeys = new Set<string>();
  system.spacing.forEach(s => {
    lines.push(`    ${uniqueKey(toTokenKey(s.name, 'space'), spacingKeys)}: ${JSON.stringify(s.value)}`);
  });
  lines.push('  radius:');
  const radiusKeys = new Set<string>();
  system.radii.forEach(r => {
    lines.push(`    ${uniqueKey(toTokenKey(r.name, 'radius'), radiusKeys)}: ${JSON.stringify(r.value)}`);
  });
  lines.push('---\n');

  lines.push(`# ${toSingleLine(system.overview.name || 'Design System')}\n`);
  if (system.overview.description) {
    lines.push(`${system.overview.description}\n`);
  }
  if (system.overview.philosophy) {
    lines.push(`## Philosophy\n\n${system.overview.philosophy}\n`);
  }
  if (system.overview.principles.length > 0) {
    lines.push(`## Core Principles\n`);
    system.overview.principles.forEach(p => lines.push(`* ${toSingleLine(p)}`));
    lines.push('');
  }

  if (system.colors.length > 0) {
    lines.push(`## Colors\n`);
    lines.push(`| Name | HEX | RGB | Role |`);
    lines.push(`| :--- | :--- | :--- | :--- |`);
    system.colors.forEach(c => {
      lines.push(
        `| ${toTableCell(c.name)} | \`${toCodeCell(c.hex)}\` | \`${toCodeCell(c.rgb)}\` | ${toTableCell(c.role || c.paletteGroup)} |`
      );
    });
    lines.push('');
  }

  if (system.typography.length > 0) {
    lines.push(`## Typography\n`);
    lines.push(`| Level | Font Family | Size | Weight | Line Height |`);
    lines.push(`| :--- | :--- | :--- | :--- | :--- |`);
    system.typography.forEach(t => {
      lines.push(
        `| ${toTableCell(t.name)} | ${toTableCell(t.fontFamily)} | \`${toCodeCell(t.fontSize)}\` | ${toTableCell(String(t.fontWeight))} | ${toTableCell(t.lineHeight || '-')} |`
      );
    });
    lines.push('');
  }

  if (system.spacing.length > 0) {
    lines.push(`## Spacing\n`);
    lines.push(`| Token | Value | Pixels | Role |`);
    lines.push(`| :--- | :--- | :--- | :--- |`);
    system.spacing.forEach(s => {
      lines.push(
        `| ${toTableCell(s.name)} | \`${toCodeCell(s.value)}\` | ${s.pxValue}px | ${toTableCell(s.role || '-')} |`
      );
    });
    lines.push('');
  }

  if (system.radii.length > 0) {
    lines.push(`## Border Radius\n`);
    lines.push(`| Token | Value | Pixels |`);
    lines.push(`| :--- | :--- | :--- |`);
    system.radii.forEach(r => {
      lines.push(`| ${toTableCell(r.name)} | \`${toCodeCell(r.value)}\` | ${r.pxValue}px |`);
    });
    lines.push('');
  }

  if (system.shadows.length > 0) {
    lines.push(`## Shadows & Elevation\n`);
    lines.push(`| Level | CSS Value |`);
    lines.push(`| :--- | :--- |`);
    system.shadows.forEach(sh => {
      lines.push(`| ${toTableCell(sh.name)} | \`${toCodeCell(sh.value)}\` |`);
    });
    lines.push('');
  }

  if (system.breakpoints.length > 0) {
    lines.push(`## Breakpoints\n`);
    lines.push(`| Name | Min Width | Pixels |`);
    lines.push(`| :--- | :--- | :--- |`);
    system.breakpoints.forEach(b => {
      lines.push(`| ${toTableCell(b.name)} | \`${toCodeCell(b.minWidth || '')}\` | ${b.pxValue}px |`);
    });
    lines.push('');
  }

  if (system.components.length > 0) {
    lines.push(`## Components\n`);
    system.components.forEach(c => {
      lines.push(`### ${toSingleLine(c.name)}\n`);
      if (c.description) lines.push(`${c.description}\n`);
      if (c.variants && c.variants.length > 0) {
        lines.push(`#### Variants\n`);
        c.variants.forEach(v =>
          lines.push(
            `* **${toSingleLine(v.name)}**${v.description ? `: ${toSingleLine(v.description)}` : ''}`
          )
        );
        lines.push('');
      }
      if (c.states && c.states.length > 0) {
        lines.push(`#### States: ${c.states.map(toSingleLine).join(', ')}\n`);
      }
    });
  }

  if (system.accessibility.length > 0) {
    lines.push(`## Accessibility Guidelines\n`);
    system.accessibility.forEach(a => {
      lines.push(
        `* **${toSingleLine(a.title)}** (${toSingleLine(a.category)}${a.wcagLevel ? `, WCAG ${toSingleLine(a.wcagLevel)}` : ''}): ${toSingleLine(a.description)}`
      );
    });
    lines.push('');
  }

  return lines.join('\n');
}
