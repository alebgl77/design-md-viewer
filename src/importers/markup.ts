import {
  boundAliases,
  declarationsToMarkdown,
  extractDeclarations,
  safeStaticValue,
  type Declaration,
} from './css';
import { IMPORT_LIMITS } from './limits';
import type { AdaptedSource } from './types';

/** A small entity decoder, deliberately without DTDs, DOM parsing or external entities. */
function entities(value: string): string {
  return value.replace(/&(?:quot|apos|amp|lt|gt|#\d{1,6}|#x[0-9a-f]{1,6});/gi, entity => {
    const named: Record<string, string> = {
      '&quot;': '"',
      '&apos;': "'",
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
    };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const hex = entity.toLowerCase().startsWith('&#x');
    const code = Number.parseInt(entity.slice(hex ? 3 : 2, -1), hex ? 16 : 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
  });
}

interface Tag {
  name: string;
  attributes: string;
  end: number;
  closing: boolean;
}

/** Every cursor advances; malformed tags cannot trigger regexp backtracking. */
function readTag(content: string, start: number): Tag | undefined {
  let cursor = start + 1;
  const closing = content[cursor] === '/';
  if (closing) cursor++;
  if (!/[a-zA-Z]/.test(content[cursor] ?? '')) return undefined;
  const nameStart = cursor;
  while (cursor < content.length && /[a-zA-Z0-9:_-]/.test(content[cursor])) cursor++;
  const name = content.slice(nameStart, cursor).toLowerCase();
  const attributeStart = cursor;
  let quote = '';
  while (cursor < content.length) {
    const character = content[cursor];
    if (quote) {
      if (character === quote) quote = '';
    } else if (character === '"' || character === "'") quote = character;
    else if (character === '>')
      return { name, attributes: content.slice(attributeStart, cursor), end: cursor + 1, closing };
    cursor++;
  }
}

function* attributes(text: string): Generator<{ name: string; value: string }> {
  let cursor = 0;
  while (cursor < text.length) {
    while (cursor < text.length && /\s/.test(text[cursor])) cursor++;
    const start = cursor;
    while (cursor < text.length && /[a-zA-Z0-9_:.-]/.test(text[cursor])) cursor++;
    if (cursor === start) {
      cursor++;
      continue;
    }
    const name = text.slice(start, cursor).toLowerCase();
    while (cursor < text.length && /\s/.test(text[cursor])) cursor++;
    if (text[cursor] !== '=') continue;
    cursor++;
    while (cursor < text.length && /\s/.test(text[cursor])) cursor++;
    const quote = text[cursor] === '"' || text[cursor] === "'" ? text[cursor++] : '';
    const valueStart = cursor;
    if (quote) {
      const end = text.indexOf(quote, cursor);
      cursor = end === -1 ? text.length : end;
    } else {
      while (cursor < text.length && !/\s/.test(text[cursor])) cursor++;
    }
    const value = text.slice(valueStart, cursor);
    if (quote && cursor < text.length) cursor++;
    yield { name, value };
  }
}

/** Read only embedded declarations and SVG paint attributes; source markup never enters a DOM. */
export function adaptMarkup(content: string, svg: boolean): AdaptedSource {
  const lower = content.toLowerCase();
  const declarations: Declaration[] = [];
  const warnings = new Set<string>();
  let limited = false;
  const append = (css: string) => {
    const extracted = extractDeclarations(entities(css));
    extracted.warnings.forEach(warning => warnings.add(warning));
    const room = IMPORT_LIMITS.declarations - declarations.length;
    if (extracted.declarations.length > room) limited = true;
    declarations.push(...extracted.declarations.slice(0, room));
  };
  let cursor = 0;
  while (cursor < content.length) {
    const start = content.indexOf('<', cursor);
    if (start === -1) break;
    if (content.startsWith('<!--', start)) {
      const end = content.indexOf('-->', start + 4);
      cursor = end === -1 ? content.length : end + 3;
      continue;
    }
    const tag = readTag(content, start);
    if (!tag) {
      if (/[a-zA-Z/]/.test(content[start + 1] ?? '')) {
        warnings.add('An unterminated markup tag was ignored.');
        break;
      }
      cursor = start + 1;
      continue;
    }
    cursor = tag.end;
    if (tag.closing) continue;
    if (tag.name === 'script' || tag.name === 'style') {
      let end = lower.indexOf(`</${tag.name}`, cursor);
      while (end !== -1 && /[a-zA-Z0-9:_-]/.test(lower[end + tag.name.length + 2] ?? ''))
        end = lower.indexOf(`</${tag.name}`, end + 2);
      if (tag.name === 'style') append(content.slice(cursor, end === -1 ? content.length : end));
      if (end === -1) {
        warnings.add('An unterminated script or style block was ignored after its static content.');
        break;
      }
      cursor = readTag(content, end)?.end ?? content.length;
      continue;
    }
    for (const attribute of attributes(tag.attributes)) {
      if (declarations.length >= IMPORT_LIMITS.declarations) {
        limited = true;
        break;
      }
      const name = attribute.name;
      const value = entities(attribute.value);
      if (name === 'style') append(value);
      else if (svg && /^(?:fill|stroke|stop-color|flood-color)$/.test(name)) {
        if (safeStaticValue(value))
          declarations.push({ name: name === 'fill' || name === 'stroke' ? name : 'color', value });
        else warnings.add('URL-dependent or unsafe SVG paint values were omitted.');
      }
    }
    if (limited) break;
  }
  warnings.add(
    svg
      ? 'Only static SVG paint attributes and embedded styles were inspected; geometry, text and external resources were not rendered.'
      : 'Only embedded CSS and inline styles were inspected; HTML, scripts, linked stylesheets and external resources were not rendered or fetched.'
  );
  if (limited) warnings.add(`Only the first ${IMPORT_LIMITS.declarations} declarations were imported.`);
  if (!declarations.length) warnings.add('No supported static design declarations were found.');
  const bounded = boundAliases(declarations);
  bounded.warnings.forEach(warning => warnings.add(warning));
  return {
    format: svg ? 'SVG' : 'HTML',
    markdown: declarationsToMarkdown(bounded.declarations),
    warnings: [...warnings],
    definitions: bounded.declarations.filter(d => d.name.startsWith('--')),
  };
}
