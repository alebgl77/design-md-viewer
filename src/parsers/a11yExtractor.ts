import { A11yRule, Provenance } from '../schema/designSystem';
import { ParsedMarkdownStructure } from './markdownStructure';

export function extractAccessibility(
  structure: ParsedMarkdownStructure
): A11yRule[] {
  const rules: A11yRule[] = [];
  const seenTitles = new Set<string>();

  function addRule(
    title: string,
    description: string,
    category: A11yRule['category'],
    provenance: Provenance,
    wcagLevel?: 'A' | 'AA' | 'AAA'
  ) {
    const cleanTitle = title.replace(/[*_`]/g, '').trim();
    if (seenTitles.has(cleanTitle.toLowerCase())) return;
    seenTitles.add(cleanTitle.toLowerCase());

    rules.push({
      id: `a11y-${rules.length + 1}-${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title: cleanTitle,
      description: description.replace(/[*_`]/g, '').trim(),
      category,
      ruleType: category,
      wcagLevel,
      provenance,
      confidence: 'explicit',
    });
  }

  // Scan sections with Accessibility or A11y in heading
  for (const section of structure.sections) {
    if (/accessib|a11y|wcag|contrast|compliance|inclusi/i.test(section.heading)) {
      const lines = section.content.split('\n');
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        const itemMatch = trimmed.match(/^[-*+]\s+(.+)$/);
        if (itemMatch) {
          const itemText = itemMatch[1];
          const parts = itemText.split(/[:—–-]/);
          const title = parts[0];
          const desc = parts.slice(1).join(':') || itemText;

          let cat: A11yRule['category'] = 'general';
          if (/contrast|color|ratio/i.test(itemText)) cat = 'contrast';
          else if (/focus|outline|ring/i.test(itemText)) cat = 'focus';
          else if (/touch|target|tap|44px|48px/i.test(itemText)) cat = 'target-size';
          else if (/keyboard|tab|escape|enter/i.test(itemText)) cat = 'keyboard';
          else if (/motion|vestibular|prefers-reduced-motion/i.test(itemText)) cat = 'motion';
          else if (/aria|screen reader|alt|label/i.test(itemText)) cat = 'aria';

          let wcag: 'A' | 'AA' | 'AAA' | undefined = undefined;
          if (/AAA\b/i.test(itemText)) wcag = 'AAA';
          else if (/AA\b/i.test(itemText)) wcag = 'AA';
          else if (/\bA\b/i.test(itemText)) wcag = 'A';

          addRule(
            title,
            desc,
            cat,
            {
              sectionTitle: section.heading,
              headingPath: [section.heading],
              lineNumber: section.lineNumber + idx,
              rawSourceSnippet: trimmed,
            },
            wcag
          );
        }
      });
    }
  }

  return rules;
}
