import { MotionToken, Provenance } from '../schema/designSystem';
import { ParsedMarkdownStructure } from './markdownStructure';
import { parseDurationMs } from '../normalizers/unitNormalizer';

export function extractMotion(structure: ParsedMarkdownStructure): MotionToken[] {
  const motion: MotionToken[] = [];
  const seen = new Set<string>();

  function addMotion(
    name: string,
    duration?: string,
    easing?: string,
    cssTransition?: string,
    provenance?: Provenance,
    usage?: string
  ) {
    const cleanName = name
      .replace(/^(--|\$)/, '')
      .replace(/[-_]/g, ' ')
      .trim();
    if (seen.has(cleanName.toLowerCase())) return;
    seen.add(cleanName.toLowerCase());

    const durMs = duration ? parseDurationMs(duration) : undefined;

    motion.push({
      id: `mot-${motion.length + 1}-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: cleanName || `Motion ${motion.length + 1}`,
      duration,
      durationMs: durMs,
      easing: easing || 'cubic-bezier(0.4, 0, 0.2, 1)',
      cssTransition: cssTransition || (duration ? `all ${duration} ${easing || 'ease-in-out'}` : undefined),
      usage,
      provenance: provenance || {
        headingPath: ['Motion'],
        rawSourceSnippet: `${name}: ${duration} ${easing}`,
      },
      confidence: 'explicit',
    });
  }

  // 1. Code blocks
  for (const block of structure.codeBlocks) {
    const lines = block.code.split('\n');
    lines.forEach((line, idx) => {
      const lineNum = block.startLine + idx + 1;
      const motionVar = line.match(
        /^\s*(--(?:duration|transition|motion|ease)-[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/i
      );
      if (motionVar) {
        const val = motionVar[2].trim();
        const isDuration = /\d+(?:ms|s)/i.test(val);
        const isEase = /cubic-bezier|ease|linear/i.test(val);
        addMotion(
          motionVar[1].replace(/^--(?:duration-|transition-|motion-|ease-)/, ''),
          isDuration ? val : undefined,
          isEase ? val : undefined,
          !isDuration && !isEase ? val : undefined,
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
    if (table.headingPath.some(h => /motion|animation|transition|easing/i.test(h))) {
      const nameIdx = table.headers.findIndex(h => /name|token|key|type/i.test(h));
      const durIdx = table.headers.findIndex(h => /duration|time|speed|ms/i.test(h));
      const easeIdx = table.headers.findIndex(h => /easing|curve|timing/i.test(h));
      const usageIdx = table.headers.findIndex(h => /usage|role|example|desc/i.test(h));

      table.rows.forEach((row, rowIdx) => {
        const nameVal = nameIdx !== -1 ? row[nameIdx] : row[0];
        const durVal = durIdx !== -1 ? row[durIdx] : row.find(c => /\d+(?:ms|s)/i.test(c));
        const easeVal = easeIdx !== -1 ? row[easeIdx] : row.find(c => /ease|linear|cubic/i.test(c));
        const usageVal = usageIdx !== -1 ? row[usageIdx] : undefined;

        if (nameVal && (durVal || easeVal)) {
          addMotion(
            nameVal.replace(/[`*]/g, '').trim(),
            durVal?.replace(/[`*]/g, '').trim(),
            easeVal?.replace(/[`*]/g, '').trim(),
            undefined,
            {
              sectionTitle: table.headingPath[table.headingPath.length - 1],
              headingPath: table.headingPath,
              lineNumber: table.startLine + rowIdx + 2,
              rawSourceSnippet: `| ${row.join(' | ')} |`,
            },
            usageVal?.replace(/[`*]/g, '').trim()
          );
        }
      });
    }
  }

  // 3. Lists
  for (const item of structure.listItems) {
    if (item.headingPath.some(h => /motion|animation|transition|easing/i.test(h))) {
      // The easing may follow the duration separated by a comma, a slash or just whitespace:
      // "150ms ease-out", "150ms, ease-out" and "150ms / ease-out" are all common in the wild.
      // The easing itself is a keyword optionally carrying an argument list, so cubic-bezier(...)
      // is captured whole rather than clipped at the parenthesis.
      const kvMatch = item.text.match(
        /^[*_`]*([a-zA-Z0-9_\-\s]+)[*_`]*\s*[:=]\s*[`*]*(\d+(?:ms|s))[`*]*(?:\s*[,/]?\s*[`*]*([a-zA-Z][\w-]*(?:\s*\([^)]*\))?)[`*]*)?(?:\s*[-—(]\s*(.*?)\)?)?\s*$/i
      );
      if (kvMatch) {
        addMotion(
          kvMatch[1].trim(),
          kvMatch[2].trim(),
          kvMatch[3]?.trim(),
          undefined,
          {
            sectionTitle: item.headingPath[item.headingPath.length - 1],
            headingPath: item.headingPath,
            lineNumber: item.lineNumber,
            rawSourceSnippet: item.raw,
          },
          kvMatch[4]?.trim()
        );
      }
    }
  }

  return motion;
}
