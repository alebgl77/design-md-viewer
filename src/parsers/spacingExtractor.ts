import { SpacingToken, Provenance } from '../schema/designSystem';
import { ParsedMarkdownStructure } from './markdownStructure';
import { parsePxValue, formatRem } from '../normalizers/unitNormalizer';

export function extractSpacing(
  structure: ParsedMarkdownStructure
): SpacingToken[] {
  const spacing: SpacingToken[] = [];
  const seenValues = new Set<string>();

  function addSpacing(
    name: string,
    value: string,
    provenance: Provenance,
    role?: string
  ) {
    const px = parsePxValue(value);
    const cleanName = name.replace(/^(--|\$)/, '').replace(/[-_]/g, ' ').trim();
    const dedupeKey = `${cleanName.toLowerCase()}-${px}`;
    if (seenValues.has(dedupeKey)) return;
    seenValues.add(dedupeKey);

    const id = `space-${spacing.length + 1}-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    spacing.push({
      id,
      name: cleanName || `Space ${spacing.length + 1}`,
      value: value.trim(),
      pxValue: px,
      remValue: formatRem(px),
      role: role || cleanName,
      provenance,
      confidence: 'explicit',
    });
  }

  // 1. Code blocks (CSS vars)
  for (const block of structure.codeBlocks) {
    const lines = block.code.split('\n');
    lines.forEach((line, idx) => {
      const lineNum = block.startLine + idx + 1;
      const spaceVarMatch = line.match(/^\s*(--(?:spacing|space|gap|pad|margin)-[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/i);
      if (spaceVarMatch) {
        addSpacing(
          spaceVarMatch[1].replace(/^--(?:spacing-|space-|gap-|pad-|margin-)/, ''),
          spaceVarMatch[2],
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

  // 2. Tables
  for (const table of structure.tables) {
    const isSpacingTable =
      table.headingPath.some(h => /spacing|space|grid|gap|padding|margin|scale/i.test(h)) ||
      table.headers.some(h => /space|spacing|gap|padding|size|rem|px/i.test(h));

    if (isSpacingTable) {
      const nameIdx = table.headers.findIndex(h => /token|name|scale|level|key/i.test(h));
      const valIdx = table.headers.findIndex(h => /value|size|px|rem|dimension/i.test(h));
      const roleIdx = table.headers.findIndex(h => /usage|role|desc|example/i.test(h));

      table.rows.forEach((row, rowIdx) => {
        const rowLine = table.startLine + rowIdx + 2;
        const nameVal = nameIdx !== -1 ? row[nameIdx] : row[0];
        const valVal = valIdx !== -1 ? row[valIdx] : (row.find(c => /[\d.]+(?:px|rem|em)/i.test(c)) || row[1]);
        const roleVal = roleIdx !== -1 ? row[roleIdx] : undefined;

        if (nameVal && valVal && /[\d.]+(?:px|rem|em|\d+)/i.test(valVal)) {
          addSpacing(
            nameVal.replace(/[`*]/g, '').trim(),
            valVal.replace(/[`*]/g, '').trim(),
            {
              sectionTitle: table.headingPath[table.headingPath.length - 1],
              headingPath: table.headingPath,
              lineNumber: rowLine,
              rawSourceSnippet: `| ${row.join(' | ')} |`,
            },
            roleVal ? roleVal.replace(/[`*]/g, '').trim() : undefined
          );
        }
      });
    }
  }

  // 3. Lists
  for (const item of structure.listItems) {
    const isSpacingSection = item.headingPath.some(h => /spacing|space|gap|padding|margin|dimension/i.test(h));
    if (isSpacingSection) {
      const kvMatch = item.text.match(/^[*_`]*([a-zA-Z0-9_\-\s]+)[*_`]*\s*[:=]\s*[`*]*([\d.]+(?:px|rem|em))[`*]*(?:\s*[-—(]\s*(.*?)\)?)?$/i);
      if (kvMatch) {
        addSpacing(
          kvMatch[1].trim(),
          kvMatch[2].trim(),
          {
            sectionTitle: item.headingPath[item.headingPath.length - 1],
            headingPath: item.headingPath,
            lineNumber: item.lineNumber,
            rawSourceSnippet: item.raw,
          },
          kvMatch[3]?.trim()
        );
      }
    }
  }

  // Sort ascending by pxValue
  spacing.sort((a, b) => a.pxValue - b.pxValue);

  return spacing;
}
