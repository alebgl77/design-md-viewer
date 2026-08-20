import { TypographyToken, Provenance } from '../schema/designSystem';
import { ParsedMarkdownStructure } from './markdownStructure';
import { parsePxValue } from '../normalizers/unitNormalizer';

// A table only counts as typography when a header carries a real type signal.
// Bare "level" / "size" / "style" headers are shared with elevation, spacing and radius tables.
const TYPE_HEADER_SIGNAL = /font-size|font|line-height|weight|typography|text/i;

// Sections that own look-alike tables ("| Level | Shadow |", "| Token | Value |").
const NON_TYPE_SECTION = /shadow|elevation|radius|corner|spacing/i;

// A single whole length value — never a shadow, a font stack or a bare keyword.
const LENGTH_VALUE = /^[\d.]+(?:px|rem|em|pt)$/i;

function cleanCell(cell: string | undefined): string {
  return cell ? cell.replace(/[`*]/g, '').trim() : '';
}

export function extractTypography(
  structure: ParsedMarkdownStructure
): TypographyToken[] {
  const typography: TypographyToken[] = [];
  const seenKeys = new Set<string>();

  function addTypography(
    name: string,
    fontFamily: string,
    fontSize: string,
    fontWeight: string | number,
    lineHeight?: string,
    letterSpacing?: string,
    textTransform?: string,
    role?: string,
    provenance?: Provenance,
    confidence: 'explicit' | 'inferred' = 'explicit'
  ) {
    const size = fontSize.trim();
    const pxVal = parsePxValue(size);
    if (!pxVal || !LENGTH_VALUE.test(size)) return;

    const cleanName = name.replace(/[-_]/g, ' ').trim();
    const dedupeKey = `${cleanName.toLowerCase()}-${size}`;
    if (seenKeys.has(dedupeKey)) return;
    seenKeys.add(dedupeKey);

    const id = `typo-${typography.length + 1}-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    typography.push({
      id,
      name: cleanName || `Type Scale ${typography.length + 1}`,
      fontFamily: fontFamily || 'Inter, sans-serif',
      fontSize: size,
      fontSizePx: pxVal,
      fontWeight: fontWeight || 400,
      lineHeight: lineHeight || '1.5',
      letterSpacing,
      textTransform,
      role: role || cleanName,
      provenance: provenance || {
        headingPath: ['Typography'],
        rawSourceSnippet: `${name}: ${fontSize}`,
      },
      confidence,
    });
  }

  // 1. Detect Global Font Family in markdown
  let globalFontFamily = 'Inter, sans-serif';
  for (const block of structure.codeBlocks) {
    const fontMatch = block.code.match(/font-family\s*:\s*([^;]+);/i);
    if (fontMatch) {
      globalFontFamily = fontMatch[1].replace(/['"]/g, '').trim();
      break;
    }
  }
  if (globalFontFamily === 'Inter, sans-serif') {
    for (const item of structure.listItems) {
      const ffMatch = item.text.match(/font[- ]family\s*[:=]\s*([^,;]+)/i);
      if (ffMatch) {
        globalFontFamily = ffMatch[1].replace(/[`*]/g, '').trim();
        break;
      }
    }
  }

  // 2. Extract from Markdown Tables
  for (const table of structure.tables) {
    if (table.headingPath.some(h => NON_TYPE_SECTION.test(h))) continue;

    const isTypoTable =
      table.headingPath.some(h => /typography|type|font|heading|text scale/i.test(h)) ||
      table.headers.some(h => TYPE_HEADER_SIGNAL.test(h));

    if (isTypoTable) {
      const nameIdx = table.headers.findIndex(h => /level|name|token|style|element|heading|type/i.test(h));
      const sizeIdx = table.headers.findIndex(h => /size|font-size|px|rem/i.test(h));
      const weightIdx = table.headers.findIndex(h => /weight|font-weight/i.test(h));
      const lhIdx = table.headers.findIndex(h => /line-height|leading|height/i.test(h));
      const familyIdx = table.headers.findIndex(h => /family|font/i.test(h));

      table.rows.forEach((row, rowIdx) => {
        const rowLine = table.startLine + rowIdx + 2;
        const rawName = nameIdx !== -1 ? row[nameIdx] : row[0];
        const nameVal = cleanCell(rawName);
        // Without a size column, only a cell that is itself a length can stand in for one.
        const sizeVal =
          sizeIdx !== -1
            ? cleanCell(row[sizeIdx])
            : row.map(cleanCell).find(c => LENGTH_VALUE.test(c)) || '';
        const weightVal = weightIdx !== -1 ? cleanCell(row[weightIdx]) : '400';
        const lhVal = lhIdx !== -1 ? cleanCell(row[lhIdx]) : '';
        const familyVal = familyIdx !== -1 ? cleanCell(row[familyIdx]) : globalFontFamily;

        if (nameVal && sizeVal) {
          addTypography(
            nameVal,
            familyVal || globalFontFamily,
            sizeVal,
            weightVal || 400,
            lhVal || undefined,
            undefined,
            undefined,
            rawName,
            {
              sectionTitle: table.headingPath[table.headingPath.length - 1],
              headingPath: table.headingPath,
              lineNumber: rowLine,
              rawSourceSnippet: `| ${row.join(' | ')} |`,
            }
          );
        }
      });
    }
  }

  // 3. Extract from Code Blocks (CSS font vars)
  for (const block of structure.codeBlocks) {
    const lines = block.code.split('\n');
    lines.forEach((line, idx) => {
      const lineNum = block.startLine + idx + 1;
      // Matches: --font-size-h1: 32px; or --text-xl: 1.25rem;
      const typoVarMatch = line.match(/^\s*(--(?:font-size|text|font|typography)-[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/i);
      if (typoVarMatch) {
        const varName = typoVarMatch[1];
        const rawVal = typoVarMatch[2].trim();
        addTypography(
          varName.replace(/^--(?:font-size-|text-|font-|typography-)/, ''),
          globalFontFamily,
          rawVal,
          400,
          undefined,
          undefined,
          undefined,
          varName,
          {
            sectionTitle: block.headingPath[block.headingPath.length - 1],
            headingPath: block.headingPath,
            lineNumber: lineNum,
            rawSourceSnippet: line.trim(),
          }
        );
      }
    });
  }

  // 4. Extract from List Items
  for (const item of structure.listItems) {
    const isTypoSection = item.headingPath.some(h => /typography|type|font|heading|text/i.test(h));
    
    // Matches: - **H1**: 36px, Bold, Line height 44px
    // or - H1: 32px / 40px, 700
    const listTypoMatch = item.text.match(/^[*_`]*([a-zA-Z0-9_\-\s]+)[*_`]*\s*[:=]\s*([\d.]+(?:px|rem|em|pt))\s*(?:\/\s*([\d.]+(?:px|rem|em|pt|\d+)))?(?:,\s*([a-zA-Z0-9_\-\s]+))?(?:,\s*(.+))?$/i);
    
    if (listTypoMatch) {
      const name = listTypoMatch[1].trim();
      const size = listTypoMatch[2].trim();
      const lh = listTypoMatch[3] ? listTypoMatch[3].trim() : undefined;
      const weight = listTypoMatch[4] ? listTypoMatch[4].trim() : 400;

      addTypography(
        name,
        globalFontFamily,
        size,
        weight,
        lh,
        undefined,
        undefined,
        name,
        {
          sectionTitle: item.headingPath[item.headingPath.length - 1],
          headingPath: item.headingPath,
          lineNumber: item.lineNumber,
          rawSourceSnippet: item.raw,
        }
      );
    } else if (isTypoSection) {
      // General match for sizes in typo section (e.g. - Body: 16px Regular)
      const generalSizeMatch = item.text.match(/^[*_`]*([a-zA-Z0-9_\-\s]+)[*_`]*\s*[:=]\s*(.+)$/);
      if (generalSizeMatch) {
        const name = generalSizeMatch[1].trim();
        const rest = generalSizeMatch[2].trim();
        const sizeFound = rest.match(/([\d.]+(?:px|rem|em|pt))/i);
        if (sizeFound) {
          addTypography(
            name,
            globalFontFamily,
            sizeFound[1],
            rest.includes('bold') || rest.includes('700') ? 700 : (rest.includes('medium') || rest.includes('500') ? 500 : 400),
            undefined,
            undefined,
            undefined,
            name,
            {
              sectionTitle: item.headingPath[item.headingPath.length - 1],
              headingPath: item.headingPath,
              lineNumber: item.lineNumber,
              rawSourceSnippet: item.raw,
            }
          );
        }
      }
    }
  }

  // Sort typography from largest to smallest font size
  typography.sort((a, b) => (b.fontSizePx || 0) - (a.fontSizePx || 0));

  return typography;
}
