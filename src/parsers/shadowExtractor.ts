import { ShadowToken, Provenance } from '../schema/designSystem';
import { ParsedMarkdownStructure } from './markdownStructure';
import { isSafeCssValue } from './safety';

export function extractShadows(
  structure: ParsedMarkdownStructure
): ShadowToken[] {
  const shadows: ShadowToken[] = [];
  const seen = new Set<string>();

  function addShadow(
    name: string,
    value: string,
    provenance: Provenance,
    role?: string
  ) {
    if (!isSafeCssValue(value)) return;
    const cleanName = name.replace(/^(--|\$)/, '').replace(/[-_]/g, ' ').trim();
    const dedupeKey = cleanName.toLowerCase();
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    let elevation = 1;
    if (cleanName.includes('sm') || cleanName.includes('low') || cleanName.includes('1')) elevation = 1;
    else if (cleanName.includes('md') || cleanName.includes('2')) elevation = 2;
    else if (cleanName.includes('lg') || cleanName.includes('3')) elevation = 3;
    else if (cleanName.includes('xl') || cleanName.includes('4')) elevation = 4;
    else if (cleanName.includes('2xl') || cleanName.includes('5')) elevation = 5;

    shadows.push({
      id: `shd-${shadows.length + 1}-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: cleanName || `Shadow ${shadows.length + 1}`,
      value: value.trim(),
      elevationLevel: elevation,
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
      const shadowVarMatch = line.match(/^\s*(--(?:shadow|box-shadow|elevation)-[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/i);
      if (shadowVarMatch) {
        addShadow(
          shadowVarMatch[1].replace(/^--(?:shadow-|box-shadow-|elevation-)/, ''),
          shadowVarMatch[2],
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
    const isShadowTable =
      table.headingPath.some(h => /shadow|elevation|depth|box-shadow/i.test(h)) ||
      table.headers.some(h => /shadow|elevation|depth|value/i.test(h));

    if (isShadowTable) {
      const nameIdx = table.headers.findIndex(h => /name|token|level|key/i.test(h));
      const valIdx = table.headers.findIndex(h => /value|css|shadow|definition/i.test(h));
      const roleIdx = table.headers.findIndex(h => /usage|role|example|desc/i.test(h));

      table.rows.forEach((row, rowIdx) => {
        const rowLine = table.startLine + rowIdx + 2;
        const nameVal = nameIdx !== -1 ? row[nameIdx] : row[0];
        const valVal = valIdx !== -1 ? row[valIdx] : (row.find(c => /px/i.test(c) || /rgba?/i.test(c)) || row[1]);
        const roleVal = roleIdx !== -1 ? row[roleIdx] : undefined;

        if (nameVal && valVal) {
          addShadow(
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
    const isShadowSection = item.headingPath.some(h => /shadow|elevation|depth|box-shadow/i.test(h));
    if (isShadowSection) {
      const kvMatch = item.text.match(/^[*_`]*([a-zA-Z0-9_\-\s]+)[*_`]*\s*[:=]\s*[`*]*([^`*]+)[`*]*(?:\s*[-—(]\s*(.*?)\)?)?$/i);
      if (kvMatch && (kvMatch[2].includes('px') || kvMatch[2].includes('rgba') || kvMatch[2].includes('rgb') || kvMatch[2].includes('none'))) {
        addShadow(
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

  return shadows;
}
