import { boundAliases, safeStaticValue, type Declaration } from './css';
import { IMPORT_LIMITS } from './limits';
import { cssFence, table } from './markdown';
import type { AdaptedSource } from './types';

type JsonObject = Record<string, unknown>;
const object = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const scalar = (value: unknown): value is string | number =>
  typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
const cssName = (path: string[]) =>
  `--${path
    .join('-')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')}`;
const reference = (value: string) =>
  value.replace(/\{([a-zA-Z0-9_.-]+)\}/g, (_, path: string) => `var(${cssName(path.split('.'))})`);

function dimension(value: unknown): string | undefined {
  if (scalar(value)) return reference(String(value));
  if (
    object(value) &&
    typeof value.value === 'number' &&
    Number.isFinite(value.value) &&
    /^(?:px|rem|em|pt|%|ms|s)$/.test(String(value.unit))
  ) {
    return `${value.value}${value.unit}`;
  }
}

function color(value: unknown): string | undefined {
  if (typeof value === 'string') return reference(value);
  if (!object(value) || value.colorSpace !== 'srgb' || !Array.isArray(value.components)) return;
  const components = value.components;
  const alpha = value.alpha ?? 1;
  if (
    components.length !== 3 ||
    !components.every(v => typeof v === 'number' && v >= 0 && v <= 1) ||
    typeof alpha !== 'number' ||
    alpha < 0 ||
    alpha > 1
  )
    return;
  return `rgba(${components.map(v => Math.round(Number(v) * 255)).join(', ')}, ${alpha})`;
}

function shadow(value: unknown): string | undefined {
  if (typeof value === 'string') return reference(value);
  const layers = Array.isArray(value) ? value : [value];
  if (!layers.length || layers.length > 16) return;
  const rendered = layers.map(layer => {
    if (!object(layer)) return undefined;
    const parts = [
      dimension(layer.offsetX ?? layer.x),
      dimension(layer.offsetY ?? layer.y),
      dimension(layer.blur),
      dimension(layer.spread ?? { value: 0, unit: 'px' }),
      color(layer.color),
    ];
    if (parts.some(part => part === undefined)) return undefined;
    return `${layer.inset === true ? 'inset ' : ''}${parts.join(' ')}`;
  });
  return rendered.every(part => part !== undefined) ? rendered.join(', ') : undefined;
}

function staticValue(value: unknown, type: string): string | undefined {
  if (type === 'color') return color(value);
  if (type === 'shadow') return shadow(value);
  if (type === 'fontFamily' && Array.isArray(value) && value.every(v => typeof v === 'string'))
    return value.join(', ');
  if (['dimension', 'duration', 'fontSize', 'spacing', 'borderRadius'].includes(type))
    return dimension(value);
  if (scalar(value)) return reference(String(value));
}

/** Bounded traversal handles DTCG, legacy type/value and flat token maps. */
export function adaptJson(content: string): AdaptedSource {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON. Check commas, quotes and closing braces, then try again.');
  }
  const declarations: Declaration[] = [];
  const typography: string[][] = [];
  const warnings: string[] = [];
  const names = new Map<string, string>();
  let nodes = 0;
  let omitted = 0;
  let limited = false;

  const add = (path: string[], value: unknown, type: string) => {
    if (!path.length) path = ['token'];
    const name = cssName(path);
    if (type === 'typography' && object(value)) {
      const size = dimension(value.fontSize);
      const family = staticValue(value.fontFamily, 'fontFamily');
      const weight = staticValue(value.fontWeight, 'fontWeight');
      const height = dimension(value.lineHeight);
      if (size && safeStaticValue(size) && family && safeStaticValue(family)) {
        typography.push([path.join('.'), size, family, weight ?? '', height ?? '']);
        for (const [property, part] of Object.entries(value)) {
          const normalized = staticValue(part, property);
          if (normalized && safeStaticValue(normalized))
            declarations.push({
              name: `${name}-${property.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}`,
              value: normalized,
            });
          else omitted++;
        }
        return;
      }
    }
    const normalized = staticValue(value, type);
    if (normalized === undefined || !safeStaticValue(normalized)) {
      omitted++;
      return;
    }
    const original = JSON.stringify(path);
    if (names.has(name) && names.get(name) !== original)
      warnings.push(
        `Token paths ${names.get(name)} and ${original} share the normalized name ${name}; both declarations are retained.`
      );
    names.set(name, original);
    declarations.push({ name, value: normalized });
    // Explicit types can classify opaque names without guessing the value's intended use.
    const category =
      type === 'fontSize'
        ? 'font-size'
        : type === 'spacing'
          ? 'space'
          : type === 'borderRadius'
            ? 'radius'
            : type === 'shadow'
              ? 'shadow'
              : undefined;
    if (category && !name.startsWith(`--${category}-`))
      declarations.push({ name: `--${category}-typed-${name.slice(2)}`, value: normalized });
  };

  const visit = (value: unknown, path: string[], depth: number, inheritedType = '') => {
    if (++nodes > IMPORT_LIMITS.jsonNodes || depth > IMPORT_LIMITS.jsonDepth) {
      limited = true;
      return;
    }
    if (!object(value)) {
      add(path, value, inheritedType);
      return;
    }
    const type =
      typeof value.$type === 'string'
        ? value.$type
        : typeof value.type === 'string'
          ? value.type
          : inheritedType;
    if (
      Object.prototype.hasOwnProperty.call(value, '$value') ||
      Object.prototype.hasOwnProperty.call(value, 'value')
    ) {
      add(path, Object.prototype.hasOwnProperty.call(value, '$value') ? value.$value : value.value, type);
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (key.startsWith('$') || ['type', 'description', 'extensions'].includes(key)) continue;
      if (nodes >= IMPORT_LIMITS.jsonNodes) {
        limited = true;
        break;
      }
      visit(child, [...path, key], depth + 1, type);
    }
  };
  visit(parsed, [], 0);
  const bounded = boundAliases(declarations);
  warnings.push(...bounded.warnings);
  if (omitted)
    warnings.push(
      `${omitted} JSON value(s) could not be represented as safe design tokens and were omitted.`
    );
  if (limited)
    warnings.push(
      `JSON extraction stopped at ${IMPORT_LIMITS.jsonDepth} levels or ${IMPORT_LIMITS.jsonNodes} nodes; the document is partial.`
    );
  if (!declarations.length && !typography.length)
    warnings.push('No supported design token values were found in the JSON.');
  return {
    format: 'JSON tokens',
    markdown: [
      cssFence(bounded.declarations),
      table('Typography', ['Token', 'Size', 'Family', 'Weight', 'Line height'], typography),
    ]
      .filter(Boolean)
      .join('\n\n'),
    warnings,
    definitions: bounded.declarations,
  };
}
