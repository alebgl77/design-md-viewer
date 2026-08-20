import { RawSection } from '../schema/designSystem';
import { sanitizeText } from './safety';

export interface CodeBlock {
  language: string;
  code: string;
  startLine: number;
  endLine: number;
  headingPath: string[];
}

export interface MarkdownTable {
  headers: string[];
  rows: string[][];
  startLine: number;
  endLine: number;
  headingPath: string[];
}

export interface MarkdownListItem {
  text: string;
  raw: string;
  lineNumber: number;
  headingPath: string[];
  depth: number;
}

export interface ParsedMarkdownStructure {
  rawLines: string[];
  sections: RawSection[];
  codeBlocks: CodeBlock[];
  tables: MarkdownTable[];
  listItems: MarkdownListItem[];
}

export function parseMarkdownStructure(rawMarkdown: string): ParsedMarkdownStructure {
  const cleanMarkdown = sanitizeText(rawMarkdown);
  const lines = cleanMarkdown.split(/\r?\n/);
  
  const sections: RawSection[] = [];
  const codeBlocks: CodeBlock[] = [];
  const tables: MarkdownTable[] = [];
  const listItems: MarkdownListItem[] = [];

  let currentHeadingStack: { level: number; text: string }[] = [];
  let currentSection: RawSection | null = null;

  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines: string[] = [];
  let codeBlockStart = 0;

  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];
  let tableStart = 0;

  function getHeadingPath(): string[] {
    return currentHeadingStack.map(h => h.text);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    const trimmed = line.trim();

    // 1. Code block handling
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        // Start of code block
        inCodeBlock = true;
        codeBlockLang = trimmed.replace(/^```/, '').trim().toLowerCase();
        codeBlockLines = [];
        codeBlockStart = lineNumber;
      } else {
        // End of code block
        inCodeBlock = false;
        codeBlocks.push({
          language: codeBlockLang,
          code: codeBlockLines.join('\n'),
          startLine: codeBlockStart,
          endLine: lineNumber,
          headingPath: getHeadingPath(),
        });
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // 2. Table handling
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());

      // Check if separator line (| --- | --- |)
      const isSeparator = cells.every(c => /^:?-+:?$/.test(c));

      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
        tableRows = [];
        tableStart = lineNumber;
      } else if (!isSeparator) {
        tableRows.push(cells);
      }
      continue;
    } else {
      if (inTable) {
        inTable = false;
        if (tableHeaders.length > 0 && tableRows.length > 0) {
          tables.push({
            headers: tableHeaders,
            rows: tableRows,
            startLine: tableStart,
            endLine: lineNumber - 1,
            headingPath: getHeadingPath(),
          });
        }
      }
    }

    // 3. Headings handling (# Heading)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();

      // Finalize previous section
      if (currentSection) {
        currentSection.lineEnd = lineNumber - 1;
      }

      // Update heading stack based on level
      while (currentHeadingStack.length > 0 && currentHeadingStack[currentHeadingStack.length - 1].level >= level) {
        currentHeadingStack.pop();
      }
      currentHeadingStack.push({ level, text: headingText });

      currentSection = {
        id: `sec-${sections.length + 1}-${headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        heading: headingText,
        level,
        lineNumber,
        lineEnd: lines.length,
        content: '',
      };
      sections.push(currentSection);
      continue;
    }

    // Append to current section content
    if (currentSection) {
      currentSection.content += line + '\n';
    }

    // 4. List items handling (- item, * item, 1. item)
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const indent = listMatch[1].length;
      const content = listMatch[3].trim();
      listItems.push({
        text: content,
        raw: line,
        lineNumber,
        headingPath: getHeadingPath(),
        depth: Math.floor(indent / 2),
      });
    }
  }

  // Finalize table if still open at EOF
  if (inTable && tableHeaders.length > 0 && tableRows.length > 0) {
    tables.push({
      headers: tableHeaders,
      rows: tableRows,
      startLine: tableStart,
      endLine: lines.length,
      headingPath: getHeadingPath(),
    });
  }

  // Finalize last section end line
  if (currentSection) {
    currentSection.lineEnd = lines.length;
  }

  return {
    rawLines: lines,
    sections,
    codeBlocks,
    tables,
    listItems,
  };
}
