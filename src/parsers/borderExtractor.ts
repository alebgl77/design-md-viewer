import { BorderToken, Provenance } from '../schema/designSystem';
import { ParsedMarkdownStructure } from './markdownStructure';

export function extractBorders(
  structure: ParsedMarkdownStructure
): BorderToken[] {
  const borders: BorderToken[] = [];
  const seen = new Set<string>();

  function addBorder(
    name: string,
    width: string,
    style: string,
    color?: string,
    provenance?: Provenance,
    role?: string
  ) {
    const cleanName = name.replace(/^(--|\$)/, '').replace(/[-_]/g, ' ').trim();
    if (seen.has(cleanName.toLowerCase())) return;
    seen.add(cleanName.toLowerCase());

    borders.push({
      id: `brd-${borders.length + 1}-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: cleanName || `Border ${borders.length + 1}`,
      width: width || '1px',
      style: style || 'solid',
      color: color || '#334155',
      role: role || cleanName,
      provenance: provenance || {
        headingPath: ['Borders'],
        rawSourceSnippet: `${name}: ${width} ${style}`,
      },
      confidence: 'explicit',
    });
  }

  // Extract from Code Blocks
  for (const block of structure.codeBlocks) {
    const lines = block.code.split('\n');
    lines.forEach((line, idx) => {
      const lineNum = block.startLine + idx + 1;
      const borderMatch = line.match(/^\s*(--(?:border|stroke)-[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/i);
      if (borderMatch) {
        const parts = borderMatch[2].trim().split(/\s+/);
        addBorder(
          borderMatch[1].replace(/^--(?:border-|stroke-)/, ''),
          parts[0] || '1px',
          parts[1] || 'solid',
          parts[2],
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

  // Extract from Tables
  for (const table of structure.tables) {
    const isBorderTable =
      table.headingPath.some(h => /border|stroke|divider/i.test(h)) ||
      table.headers.some(h => /border|stroke|width/i.test(h));

    if (isBorderTable) {
      const nameIdx = table.headers.findIndex(h => /name|token|key|type/i.test(h));
      const widthIdx = table.headers.findIndex(h => /width|size|px/i.test(h));
      const styleIdx = table.headers.findIndex(h => /style|type/i.test(h));
      const colorIdx = table.headers.findIndex(h => /color|hex/i.test(h));

      table.rows.forEach((row, rowIdx) => {
        const rowLine = table.startLine + rowIdx + 2;
        const nameVal = nameIdx !== -1 ? row[nameIdx] : row[0];
        const widthVal = widthIdx !== -1 ? row[widthIdx] : (row.find(c => /[\d.]+px/i.test(c)) || '1px');
        const styleVal = styleIdx !== -1 ? row[styleIdx] : 'solid';
        const colorVal = colorIdx !== -1 ? row[colorIdx] : undefined;

        if (nameVal && widthVal) {
          addBorder(
            nameVal.replace(/[`*]/g, '').trim(),
            widthVal.replace(/[`*]/g, '').trim(),
            styleVal.replace(/[`*]/g, '').trim() || 'solid',
            colorVal?.replace(/[`*]/g, '').trim(),
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

  // Extract from Lists
  for (const item of structure.listItems) {
    const isBorderSection = item.headingPath.some(h => /border|stroke|divider/i.test(h));
    if (isBorderSection) {
      const kvMatch = item.text.match(/^[*_`]*([a-zA-Z0-9_\-\s]+)[*_`]*\s*[:=]\s*[`*]*([\d.]+px)(?:\s+([a-zA-Z]+))?(?:\s+(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)))?[`*]*/i);
      if (kvMatch) {
        addBorder(
          kvMatch[1].trim(),
          kvMatch[2].trim(),
          kvMatch[3]?.trim() || 'solid',
          kvMatch[4]?.trim(),
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

  return borders;
}
