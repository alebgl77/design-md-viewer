import { IMPORT_LIMITS } from './limits';
import { cssFence, table } from './markdown';
import type { AdaptedSource } from './types';

export interface Declaration {
  name: string;
  value: string;
}

/** Keep downstream recursive resolution bounded, including branching aliases. */
export function boundAliases(declarations: Declaration[]): {
  declarations: Declaration[];
  warnings: string[];
} {
  const values = new Map(declarations.filter(d => d.name.startsWith('--')).map(d => [d.name, d.value]));
  let omitted = 0;
  const bounded = declarations.filter(declaration => {
    const pending = [{ value: declaration.value, ancestors: new Set<string>(), depth: 0 }];
    let operations = 0;
    while (pending.length) {
      const current = pending.pop()!;
      if (current.depth > 32 || ++operations > 64) {
        omitted++;
        return false;
      }
      for (const match of current.value.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)\s*\)/g)) {
        if (current.ancestors.has(match[1]) || !values.has(match[1])) continue;
        pending.push({
          value: values.get(match[1])!,
          ancestors: new Set([...current.ancestors, match[1]]),
          depth: current.depth + 1,
        });
      }
    }
    return true;
  });
  return {
    declarations: bounded,
    warnings: omitted
      ? [
          `${omitted} declaration(s) with excessively deep or branching aliases were omitted to bound token resolution.`,
        ]
      : [],
  };
}

const DESIGN_PROPERTY =
  /^(?:color|background(?:-color)?|fill|stroke|opacity|font(?:-family|-size|-weight|-style)?|line-height|letter-spacing|text-transform|(?:box|text)-shadow|border(?:-(?:top|right|bottom|left))?(?:-color|-width|-style|-radius)?|outline(?:-color|-width|-style)?|(?:padding|margin)(?:-(?:top|right|bottom|left))?|(?:row-|column-)?gap|width|height|min-width|max-width|min-height|max-height|transition(?:-duration|-timing-function)?|animation-duration)$/i;

export function safeStaticValue(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 500 &&
    !/[<>`\\;{}]/.test(value) &&
    !Array.from(value).some(character => character.charCodeAt(0) < 32) &&
    !/(?:url|expression|image-set|paint|element|attr)\s*\(|(?:https?|data|javascript|vbscript|file):|@import|!important/i.test(
      value
    )
  );
}

function stripComments(css: string): string {
  const parts: string[] = [];
  let start = 0;
  let cursor = 0;
  let quote = '';
  while (cursor < css.length) {
    const character = css[cursor];
    if (quote) {
      if (character === '\\') cursor++;
      else if (character === quote) quote = '';
    } else if (character === '"' || character === "'") quote = character;
    else if (character === '/' && css[cursor + 1] === '*') {
      parts.push(css.slice(start, cursor));
      const end = css.indexOf('*/', cursor + 2);
      cursor = end === -1 ? css.length : end + 2;
      start = cursor;
      continue;
    }
    cursor++;
  }
  parts.push(css.slice(start));
  return parts.join('');
}

/** Split declaration boundaries outside strings/functions; no stylesheet is ever evaluated. */
export function extractDeclarations(css: string): { declarations: Declaration[]; warnings: string[] } {
  const warnings: string[] = [];
  const declarations: Declaration[] = [];
  const clean = stripComments(css);
  let quote = '';
  let parentheses = 0;
  let start = 0;
  let limited = false;
  let rejected = false;
  const consume = (end: number) => {
    const candidate = clean.slice(start, end).trim();
    const match = candidate.match(/^(--[a-zA-Z0-9_-]+|[a-zA-Z][a-zA-Z-]*)\s*:\s*([\s\S]+)$/);
    if (!match || (!match[1].startsWith('--') && !DESIGN_PROPERTY.test(match[1]))) return;
    const value = match[2].trim();
    if (!safeStaticValue(value)) {
      rejected = true;
      return;
    }
    if (declarations.length >= IMPORT_LIMITS.declarations) {
      limited = true;
      return;
    }
    declarations.push({ name: match[1], value });
  };
  for (let i = 0; i < clean.length; i++) {
    const character = clean[i];
    if (quote) {
      if (character === '\\') i++;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === '(') parentheses++;
    else if (character === ')') parentheses = Math.max(0, parentheses - 1);
    else if (parentheses === 0 && (character === ';' || character === '{' || character === '}')) {
      if (character !== '{') consume(i);
      start = i + 1;
    }
  }
  consume(clean.length);
  if (rejected) warnings.push('URL-dependent, executable or unsafe CSS values were omitted.');
  if (limited)
    warnings.push(`Only the first ${IMPORT_LIMITS.declarations} static declarations were imported.`);
  return { declarations, warnings };
}

export function declarationsToMarkdown(declarations: Declaration[]): string {
  const variables = declarations.filter(d => d.name.startsWith('--'));
  const ordinary = declarations.filter(d => !d.name.startsWith('--'));
  const normalized = ordinary.map((d, i) => {
    const property = d.name.toLowerCase();
    const prefix = /^(?:padding|margin|(?:row-|column-)?gap)$/.test(property)
      ? 'space'
      : property === 'font-size'
        ? 'font-size'
        : property.includes('radius')
          ? 'radius'
          : property.includes('shadow')
            ? 'shadow'
            : /^(?:color|background|fill|stroke|border-color|outline-color)/.test(property)
              ? 'color'
              : 'css';
    return { name: `--${prefix}-imported-${i + 1}`, value: d.value };
  });
  return [
    cssFence([...variables, ...ordinary.filter(d => d.name === 'font-family'), ...normalized]),
    table(
      'Static CSS declarations',
      ['Property', 'Declared value'],
      ordinary.map(d => [d.name, d.value])
    ),
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function adaptCss(css: string): AdaptedSource {
  const extracted = extractDeclarations(css);
  const bounded = boundAliases(extracted.declarations);
  const declarations = bounded.declarations;
  const warnings = [...extracted.warnings, ...bounded.warnings];
  if (
    declarations.some(d => d.name === 'font-family') &&
    !declarations.some(d => d.name === 'font-size' || /--(?:font-size|text|typography)-/.test(d.name))
  )
    warnings.push(
      'Font families were preserved, but no type scale was inferred without an explicit font size.'
    );
  if (!declarations.length) warnings.push('No supported static design declarations were found.');
  return {
    format: 'CSS',
    markdown: declarationsToMarkdown(declarations),
    warnings,
    definitions: declarations.filter(d => d.name.startsWith('--')),
  };
}
