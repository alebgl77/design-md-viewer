import { RadiusToken, Provenance } from '../schema/designSystem';
import { ParsedMarkdownStructure } from './markdownStructure';
import { parsePxValue } from '../normalizers/unitNormalizer';

export function extractRadii(structure: ParsedMarkdownStructure): RadiusToken[] {
  const radii: RadiusToken[] = [];
  const seen = new Set<string>();

  function addRadius(name: string, value: string, provenance: Provenance, role?: string) {
    const px = parsePxValue(value);
    const cleanName = name
      .replace(/^(--|\$)/, '')
      .replace(/[-_]/g, ' ')
      .trim();
    const dedupeKey = `${cleanName.toLowerCase()}-${px}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    radii.push({
      id: `rad-${radii.length + 1}-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: cleanName || `Radius ${radii.length + 1}`,
      value: value.trim(),
      pxValue: px,
      role: role || cleanName,
      provenance,
      confidence: 'explicit',
    });
  }

  // 1. Code blocks
  for (const block of structure.codeBlocks) {
    const lines = block.code.split('\n');
    lines.forEach((line, idx) => {
      const lineNum = block.startLine + idx + 1;
      const radiusVarMatch = line.match(
        /^\s*(--(?:radius|border-radius|rounded)-[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/i
      );
      if (radiusVarMatch) {
        addRadius(
          radiusVarMatch[1].replace(/^--(?:radius-|border-radius-|rounded-)/, ''),
          radiusVarMatch[2],
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
    const isRadiusTable =
      table.headingPath.some(h => /radius|radii|rounded|border-radius|corner/i.test(h)) ||
      table.headers.some(h => /radius|radii|rounded|corner/i.test(h));

    if (isRadiusTable) {
      const nameIdx = table.headers.findIndex(h => /name|token|size|style|key/i.test(h));
      const valIdx = table.headers.findIndex(h => /value|px|rem|radius/i.test(h));
      const roleIdx = table.headers.findIndex(h => /usage|role|example|desc/i.test(h));

      table.rows.forEach((row, rowIdx) => {
        const rowLine = table.startLine + rowIdx + 2;
        const nameVal = nameIdx !== -1 ? row[nameIdx] : row[0];
        const valVal =
          valIdx !== -1 ? row[valIdx] : row.find(c => /[\d.]+(?:px|rem|em)|full|none/i.test(c)) || row[1];
        const roleVal = roleIdx !== -1 ? row[roleIdx] : undefined;

        if (nameVal && valVal) {
          addRadius(
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
    const isRadiusSection = item.headingPath.some(h => /radius|radii|rounded|corner|border-radius/i.test(h));
    if (isRadiusSection) {
      const kvMatch = item.text.match(
        /^[*_`]*([a-zA-Z0-9_\-\s]+)[*_`]*\s*[:=]\s*[`*]*([\d.]+(?:px|rem|em)|full|none|[\d.]+)`*(?:\s*[-—(]\s*(.*?)\)?)?$/i
      );
      if (kvMatch) {
        addRadius(
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

  radii.sort((a, b) => a.pxValue - b.pxValue);
  return radii;
}
