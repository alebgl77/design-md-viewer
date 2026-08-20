import { ColorContrastReport, ColorToken, Provenance } from '../schema/designSystem';
import { ParsedMarkdownStructure } from './markdownStructure';
import {
  normalizeColorValue,
  classifyColorRole,
  hexToRgb,
  getLuminance,
} from '../normalizers/colorNormalizer';
import { isSafeCssValue } from './safety';

const MAX_NAME_LENGTH = 40;
const MAX_ALIASES = 6;
const LIGHT_FALLBACK_BG = '#ffffff';
const DARK_FALLBACK_BG = '#0f172a';

/** A name lifted from a CSS declaration ("background: #fff") names the property, not the swatch. */
const CSS_PROPERTY_NAMES = new Set([
  'color',
  'background',
  'background-color',
  'border',
  'border-color',
  'outline',
  'outline-color',
  'fill',
  'stroke',
  'caret-color',
  'text-decoration-color',
]);

const BACKGROUND_VARIABLE = /^(?:--|\$)(?:color[-_])?(?:bg|background|canvas|surface[-_]base)$/i;
const BACKGROUND_NAME = /^bg$|background|canvas|surface base/i;

export function extractColors(structure: ParsedMarkdownStructure): {
  colors: ColorToken[];
  tokenVars: Record<string, string>;
} {
  const colors: ColorToken[] = [];
  const tokenVars: Record<string, string> = {};
  const indexByHex = new Map<string, number>();
  const nameQualityByIndex: number[] = [];

  function addColor(
    name: string,
    rawValue: string,
    provenance: Provenance,
    roleHint?: string,
    confidence: 'explicit' | 'inferred' = 'explicit'
  ) {
    if (!isSafeCssValue(rawValue)) return;

    const normalized = normalizeColorValue(rawValue);
    if (!normalized.isValid) return;

    const declaredVariable = /^(--|\$)/.test(name.trim()) ? name.trim() : undefined;
    // Custom properties feed the reference resolver even when the swatch itself is a duplicate
    // of one already collected, so they are registered before the dedupe check.
    if (declaredVariable) {
      tokenVars[declaredVariable] = normalized.hex;
    }

    const cleanName = cleanColorName(name);
    const quality = scoreColorName(name, cleanName);
    const existingIndex = indexByHex.get(normalized.hex.toLowerCase());

    // One swatch per hex: the same color is routinely declared under a token name, a palette
    // row and a raw CSS property, and counting it three times fabricates duplicates downstream.
    if (existingIndex !== undefined) {
      const existing = colors[existingIndex];
      const takesOverIdentity = quality > nameQualityByIndex[existingIndex];

      if (takesOverIdentity) {
        const previousName = existing.name;
        const { paletteGroup, detectedRole } = classifyColorRole(cleanName, roleHint);
        existing.id = buildColorId(existingIndex, cleanName);
        existing.name = cleanName;
        existing.rawValue = rawValue;
        existing.role = detectedRole;
        existing.paletteGroup = paletteGroup;
        existing.provenance = provenance;
        existing.confidence = confidence;
        nameQualityByIndex[existingIndex] = quality;
        rememberAlias(existing, previousName);
      } else {
        rememberAlias(existing, cleanName);
      }

      if (declaredVariable && (takesOverIdentity || !existing.cssVariable)) {
        existing.cssVariable = declaredVariable;
      }
      return;
    }

    const index = colors.length;
    const displayName = cleanName || `Color ${index + 1}`;
    const { paletteGroup, detectedRole } = classifyColorRole(displayName, roleHint);

    indexByHex.set(normalized.hex.toLowerCase(), index);
    nameQualityByIndex[index] = quality;

    colors.push({
      id: buildColorId(index, displayName),
      name: displayName,
      cssVariable: declaredVariable,
      rawValue,
      hex: normalized.hex,
      rgb: normalized.rgb,
      hsl: normalized.hsl,
      role: detectedRole,
      paletteGroup,
      contrastWithBg: buildContrastReport(normalized.hex),
      provenance,
      confidence,
    });
  }

  // 1. Extract from Code Blocks (CSS, SCSS, JSON, YAML)
  for (const block of structure.codeBlocks) {
    if (['css', 'scss', 'less', 'style'].includes(block.language) || block.code.includes(':')) {
      const lines = block.code.split('\n');
      lines.forEach((line, idx) => {
        const lineNum = block.startLine + idx + 1;
        // Matches: --color-primary: #6366f1; or $brand-red: rgba(239, 68, 68, 1);
        const cssVarMatch = line.match(
          /^\s*([-$a-zA-Z0-9_-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-zA-Z]+)\s*;?/
        );
        if (cssVarMatch) {
          const varName = cssVarMatch[1];
          const rawVal = cssVarMatch[2];
          addColor(
            varName,
            rawVal,
            {
              sectionTitle: block.headingPath[block.headingPath.length - 1],
              headingPath: block.headingPath,
              lineNumber: lineNum,
              rawSourceSnippet: line.trim(),
            },
            varName
          );
        }
      });
    }

    if (block.language === 'json') {
      try {
        const parsed = JSON.parse(block.code);
        extractFromJson(parsed, block, addColor);
      } catch {
        // Safe ignore malformed json
      }
    }
  }

  // 2. Extract from Markdown Tables
  for (const table of structure.tables) {
    const isColorTable =
      table.headingPath.some(h => /color|palette|theme|brand|surface/i.test(h)) ||
      table.headers.some(h => /color|hex|rgb|hsl|value|swatch/i.test(h));

    if (isColorTable) {
      const nameColIdx = table.headers.findIndex(h => /name|token|role|variable|identifier/i.test(h));
      const valColIdx = table.headers.findIndex(h => /value|hex|rgb|hsl|color|code/i.test(h));
      const descColIdx = table.headers.findIndex(h => /desc|usage|role|meaning/i.test(h));

      table.rows.forEach((row, rowIdx) => {
        const rowLine = table.startLine + rowIdx + 2; // header + separator
        const nameVal = nameColIdx !== -1 ? row[nameColIdx] : row[0];
        const colorVal =
          valColIdx !== -1
            ? row[valColIdx]
            : row.find(cell => /(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\()/i.test(cell)) || row[1];
        const descVal = descColIdx !== -1 ? row[descColIdx] : row[2] || '';

        if (nameVal && colorVal) {
          const cleanColor = colorVal.replace(/[`*]/g, '').trim();
          const cleanName = nameVal.replace(/[`*]/g, '').trim();
          addColor(
            cleanName,
            cleanColor,
            {
              sectionTitle: table.headingPath[table.headingPath.length - 1],
              headingPath: table.headingPath,
              lineNumber: rowLine,
              rawSourceSnippet: `| ${row.join(' | ')} |`,
            },
            descVal || cleanName
          );
        }
      });
    }
  }

  // 3. Extract from Key-Value Lists & Text Lines
  structure.listItems.forEach(item => {
    const isColorSection = item.headingPath.some(h => /color|palette|theme|brand|surface|swatch/i.test(h));

    // Pattern: - **Primary**: #6366f1 (Main brand color) or - Primary: #6366F1
    const kvMatch = item.text.match(
      /^[*_`]*([a-zA-Z0-9_\-\s]+)[*_`]*\s*[:=]\s*[`*]*([#0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))[`*]*(?:\s*[-—(]\s*(.*?)\)?)?$/i
    );
    if (kvMatch) {
      const name = kvMatch[1].trim();
      const val = kvMatch[2].trim();
      const desc = kvMatch[3] ? kvMatch[3].trim() : undefined;
      addColor(
        name,
        val,
        {
          sectionTitle: item.headingPath[item.headingPath.length - 1],
          headingPath: item.headingPath,
          lineNumber: item.lineNumber,
          rawSourceSnippet: item.raw,
        },
        desc
      );
      return;
    }

    // Pattern: - #6366f1 - Primary Brand
    const hexFirstMatch = item.text.match(/^[`*]*(#[0-9a-fA-F]{3,8})[`*]*\s*[-—:]\s*(.+)$/i);
    if (hexFirstMatch) {
      const val = hexFirstMatch[1].trim();
      const name = hexFirstMatch[2].replace(/[`*]/g, '').trim();
      addColor(
        name,
        val,
        {
          sectionTitle: item.headingPath[item.headingPath.length - 1],
          headingPath: item.headingPath,
          lineNumber: item.lineNumber,
          rawSourceSnippet: item.raw,
        },
        name
      );
      return;
    }

    if (isColorSection) {
      // Find any isolated HEX or RGB in item
      const inlineHexMatch = item.text.match(
        /(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgba?\([^)]+\)|hsla?\([^)]+\))/i
      );
      if (inlineHexMatch) {
        const val = inlineHexMatch[1];
        const namePart = deriveInlineName(item.text, val);
        addColor(
          namePart,
          val,
          {
            sectionTitle: item.headingPath[item.headingPath.length - 1],
            headingPath: item.headingPath,
            lineNumber: item.lineNumber,
            rawSourceSnippet: item.raw,
          },
          cleanColorName(namePart)
        );
      }
    }
  });

  return { colors, tokenVars };
}

/**
 * The background a document actually declares, so contrast can be measured against the canvas
 * the tokens are really painted on. Returns undefined when the document declares none.
 */
export function resolveBackgroundHex(colors: ColorToken[]): string | undefined {
  const declared = colors.find(color => color.cssVariable && BACKGROUND_VARIABLE.test(color.cssVariable));
  if (declared) return declared.hex;

  const named = colors.find(color => color.role === 'Background' || BACKGROUND_NAME.test(color.name));
  return named?.hex;
}

/** Second pass: re-measure every swatch against the resolved background, in place. */
export function applyContrastAgainstBackground(colors: ColorToken[], backgroundHex?: string): void {
  for (const color of colors) {
    color.contrastWithBg = buildContrastReport(color.hex, backgroundHex);
  }
}

function buildContrastReport(hex: string, backgroundHex?: string): ColorContrastReport {
  const ratioOnLight = contrastRatio(hex, LIGHT_FALLBACK_BG);
  const ratioOnDark = contrastRatio(hex, DARK_FALLBACK_BG);

  // With no declared canvas there is nothing honest to judge against, so we keep the historical
  // behavior of reporting the friendlier of the two default canvases.
  const bgHex = backgroundHex ?? (ratioOnLight > ratioOnDark ? LIGHT_FALLBACK_BG : DARK_FALLBACK_BG);
  const ratio = backgroundHex ? contrastRatio(hex, backgroundHex) : Math.max(ratioOnLight, ratioOnDark);

  return {
    ratio: floorTo2Decimals(ratio),
    ratioOnLight: floorTo2Decimals(ratioOnLight),
    ratioOnDark: floorTo2Decimals(ratioOnDark),
    aaCompliant: ratio >= 4.5,
    aaaCompliant: ratio >= 7.0,
    bgHex,
  };
}

/**
 * Unrounded WCAG ratio: `getContrastRatio` rounds to two decimals, which would let a 4.497
 * pair round up into an AA pass. Compliance is decided here, rounding happens for display only.
 */
function contrastRatio(hexA: string, hexB: string): number {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const lumA = getLuminance(a.r, a.g, a.b);
  const lumB = getLuminance(b.r, b.g, b.b);
  return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);
}

/** Rounded down so a displayed ratio never overstates the measured contrast. */
function floorTo2Decimals(value: number): number {
  return Math.floor(value * 100) / 100;
}

/**
 * Names end up as CSS custom property identifiers on export, so a name is an identifier and
 * never a sentence: markdown punctuation goes, whitespace collapses, length is bounded.
 */
function cleanColorName(rawName: string): string {
  const withoutMarkup = rawName.replace(/[`*_~·]+/g, ' ').trim();
  const isCustomProperty = /^(--|\$)/.test(withoutMarkup);
  let identifier = withoutMarkup.replace(/^(?:--|\$)/, '').replace(/-+/g, ' ');

  if (isCustomProperty) {
    // "--color-bg" names the swatch "bg": the leading segment is the namespace every exporter
    // re-adds, and keeping it would emit "--color-color-bg".
    const withoutNamespace = identifier.replace(/^colou?rs?\s+/i, '');
    if (withoutNamespace) identifier = withoutNamespace;
  }

  return identifier
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME_LENGTH)
    .replace(/^[\s.,:;|(){}[\]/]+|[\s.,:;|(){}[\]/]+$/g, '')
    .trim();
}

/**
 * How trustworthy a name is as the identity of a swatch. An authored custom property beats a
 * prose label, which beats the CSS property a value happened to be assigned to.
 */
function scoreColorName(rawName: string, cleanedName: string): number {
  if (!cleanedName) return 0;

  const trimmed = rawName.trim();
  if (/^(--|\$)/.test(trimmed)) {
    // Positional tokens (--palette-7) name a slot rather than a role.
    return /\d$/.test(cleanedName) ? 3 : 4;
  }
  if (CSS_PROPERTY_NAMES.has(trimmed.toLowerCase())) return 1;
  return 2;
}

/** Preference chain for a bullet: the declared custom property, then the bolded label, then the prose. */
function deriveInlineName(text: string, value: string): string {
  const declaredVariable = text.match(/(--[a-zA-Z][\w-]*)/);
  if (declaredVariable) return declaredVariable[1];

  const boldLabel = text.match(/\*\*([^*]+)\*\*/);
  if (boldLabel) return boldLabel[1];

  // Last resort, the label position: whatever precedes the value, else whatever follows it.
  const valueIndex = text.indexOf(value);
  return cleanColorName(text.slice(0, valueIndex)) || text.slice(valueIndex + value.length);
}

function rememberAlias(token: ColorToken, candidate: string): void {
  if (!candidate || candidate.toLowerCase() === token.name.toLowerCase()) return;

  const aliases = token.aliases ?? [];
  if (aliases.length >= MAX_ALIASES) return;
  if (aliases.some(alias => alias.toLowerCase() === candidate.toLowerCase())) return;

  token.aliases = [...aliases, candidate];
}

function buildColorId(index: number, name: string): string {
  return `col-${index + 1}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function extractFromJson(
  obj: any,
  block: { headingPath: string[]; startLine: number; code: string },
  addColor: (name: string, rawValue: string, provenance: Provenance, roleHint?: string) => void,
  prefix = ''
) {
  if (!obj || typeof obj !== 'object') return;
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}-${key}` : key;
    if (typeof value === 'string' && /(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\()/i.test(value)) {
      addColor(
        fullKey,
        value,
        {
          sectionTitle: block.headingPath[block.headingPath.length - 1],
          headingPath: block.headingPath,
          lineNumber: block.startLine,
          rawSourceSnippet: `"${key}": "${value}"`,
        },
        fullKey
      );
    } else if (typeof value === 'object') {
      extractFromJson(value, block, addColor, fullKey);
    }
  }
}
