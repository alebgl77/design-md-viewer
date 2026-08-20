import { ColorToken, Provenance } from '../schema/designSystem';
import { ParsedMarkdownStructure } from './markdownStructure';
import { normalizeColorValue, classifyColorRole, getContrastRatio } from '../normalizers/colorNormalizer';
import { isSafeCssValue } from './safety';

export function extractColors(
  structure: ParsedMarkdownStructure
): { colors: ColorToken[]; tokenVars: Record<string, string> } {
  const colors: ColorToken[] = [];
  const tokenVars: Record<string, string> = {};
  const seenKeys = new Set<string>();

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

    const cleanName = name.replace(/^(--|\$)/, '').replace(/[-_]/g, ' ').trim();
    const dedupeKey = `${cleanName.toLowerCase()}-${normalized.hex.toLowerCase()}`;
    
    if (seenKeys.has(dedupeKey)) return;
    seenKeys.add(dedupeKey);

    const { paletteGroup, detectedRole } = classifyColorRole(cleanName, roleHint);
    const contrastLight = getContrastRatio(normalized.hex, '#ffffff');
    const contrastDark = getContrastRatio(normalized.hex, '#0f172a');
    const chosenContrast = contrastLight > contrastDark ? contrastLight : contrastDark;
    const bgUsed = contrastLight > contrastDark ? '#ffffff' : '#0f172a';

    const id = `col-${colors.length + 1}-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    colors.push({
      id,
      name: cleanName || `Color ${colors.length + 1}`,
      rawValue,
      hex: normalized.hex,
      rgb: normalized.rgb,
      hsl: normalized.hsl,
      role: detectedRole,
      paletteGroup,
      contrastWithBg: {
        ratio: chosenContrast,
        aaCompliant: chosenContrast >= 4.5,
        aaaCompliant: chosenContrast >= 7.0,
        bgHex: bgUsed,
      },
      provenance,
      confidence,
    });

    if (name.startsWith('--') || name.startsWith('$')) {
      tokenVars[name] = normalized.hex;
    }
  }

  // 1. Extract from Code Blocks (CSS, SCSS, JSON, YAML)
  for (const block of structure.codeBlocks) {
    if (['css', 'scss', 'less', 'style'].includes(block.language) || block.code.includes(':')) {
      const lines = block.code.split('\n');
      lines.forEach((line, idx) => {
        const lineNum = block.startLine + idx + 1;
        // Matches: --color-primary: #6366f1; or $brand-red: rgba(239, 68, 68, 1);
        const cssVarMatch = line.match(/^\s*([-$a-zA-Z0-9_-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-zA-Z]+)\s*;?/);
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
        const colorVal = valColIdx !== -1 ? row[valColIdx] : (row.find(cell => /(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\()/i.test(cell)) || row[1]);
        const descVal = descColIdx !== -1 ? row[descColIdx] : (row[2] || '');

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
    const kvMatch = item.text.match(/^[*_`]*([a-zA-Z0-9_\-\s]+)[*_`]*\s*[:=]\s*[`*]*([#0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))[`*]*(?:\s*[-—(]\s*(.*?)\)?)?$/i);
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
      const inlineHexMatch = item.text.match(/(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgba?\([^)]+\)|hsla?\([^)]+\))/i);
      if (inlineHexMatch) {
        const val = inlineHexMatch[1];
        const namePart = item.text.replace(val, '').replace(/[-—:()]/g, ' ').trim();
        addColor(
          namePart || `Color ${colors.length + 1}`,
          val,
          {
            sectionTitle: item.headingPath[item.headingPath.length - 1],
            headingPath: item.headingPath,
            lineNumber: item.lineNumber,
            rawSourceSnippet: item.raw,
          },
          namePart
        );
      }
    }
  });

  return { colors, tokenVars };
}

function extractFromJson(
  obj: any,
  block: { headingPath: string[]; startLine: number; code: string },
  addColor: Function,
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
