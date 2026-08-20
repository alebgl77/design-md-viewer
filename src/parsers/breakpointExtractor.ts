import { BreakpointToken, Provenance } from '../schema/designSystem';
import { ParsedMarkdownStructure } from './markdownStructure';
import { parsePxValue } from '../normalizers/unitNormalizer';

export function extractBreakpoints(structure: ParsedMarkdownStructure): BreakpointToken[] {
  const breakpoints: BreakpointToken[] = [];
  const seen = new Set<string>();

  function addBreakpoint(name: string, valStr: string, provenance: Provenance, role?: string) {
    const px = parsePxValue(valStr);
    const cleanName = name
      .replace(/^(--|\$)/, '')
      .replace(/[-_]/g, ' ')
      .trim();
    if (seen.has(cleanName.toLowerCase())) return;
    seen.add(cleanName.toLowerCase());

    breakpoints.push({
      id: `bp-${breakpoints.length + 1}-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: cleanName || `Breakpoint ${breakpoints.length + 1}`,
      minWidth: `${px}px`,
      pxValue: px,
      role: role || cleanName,
      provenance,
      confidence: 'explicit',
    });
  }

  // 1. Code blocks (Media queries & vars)
  for (const block of structure.codeBlocks) {
    const lines = block.code.split('\n');
    lines.forEach((line, idx) => {
      const lineNum = block.startLine + idx + 1;
      // --breakpoint-md: 768px; or @media (min-width: 768px)
      const bpVarMatch = line.match(/^\s*(--(?:breakpoint|bp|screen)-[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/i);
      if (bpVarMatch) {
        addBreakpoint(bpVarMatch[1].replace(/^--(?:breakpoint-|bp-|screen-)/, ''), bpVarMatch[2], {
          sectionTitle: block.headingPath[block.headingPath.length - 1],
          headingPath: block.headingPath,
          lineNumber: lineNum,
          rawSourceSnippet: line.trim(),
        });
      }
    });
  }

  // 2. Tables
  for (const table of structure.tables) {
    const isBpTable =
      table.headingPath.some(h => /breakpoint|responsive|screen|device|media/i.test(h)) ||
      table.headers.some(h => /breakpoint|screen|min-width|width|device/i.test(h));

    if (isBpTable) {
      const nameIdx = table.headers.findIndex(h => /name|device|screen|token|key/i.test(h));
      const valIdx = table.headers.findIndex(h => /width|size|px|min-width|query/i.test(h));
      const roleIdx = table.headers.findIndex(h => /usage|role|device|desc/i.test(h));

      table.rows.forEach((row, rowIdx) => {
        const rowLine = table.startLine + rowIdx + 2;
        const nameVal = nameIdx !== -1 ? row[nameIdx] : row[0];
        const valVal = valIdx !== -1 ? row[valIdx] : row.find(c => /[\d.]+px/i.test(c)) || row[1];
        const roleVal = roleIdx !== -1 ? row[roleIdx] : undefined;

        if (nameVal && valVal && /[\d.]+px/i.test(valVal)) {
          addBreakpoint(
            nameVal.replace(/[`*]/g, '').trim(),
            valVal.replace(/[`*]/g, '').trim(),
            {
              sectionTitle: table.headingPath[table.headingPath.length - 1],
              headingPath: table.headingPath,
              lineNumber: rowLine,
              rawSourceSnippet: `| ${row.join(' | ')} |`,
            },
            roleVal?.replace(/[`*]/g, '').trim()
          );
        }
      });
    }
  }

  // 3. Lists
  for (const item of structure.listItems) {
    const isBpSection = item.headingPath.some(h => /breakpoint|responsive|screen|device|media/i.test(h));
    if (isBpSection) {
      const kvMatch = item.text.match(
        /^[*_`]*([a-zA-Z0-9_\-\s]+)[*_`]*\s*[:=]\s*[`*]*([\d.]+px)[`*]*(?:\s*[-—(]\s*(.*?)\)?)?$/i
      );
      if (kvMatch) {
        addBreakpoint(
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

  breakpoints.sort((a, b) => a.pxValue - b.pxValue);
  return breakpoints;
}
