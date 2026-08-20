import { ComponentSpec, ComponentVariant } from '../schema/designSystem';
import { ParsedMarkdownStructure } from './markdownStructure';

const KNOWN_COMPONENT_NAMES = [
  'button',
  'btn',
  'input',
  'text field',
  'textfield',
  'badge',
  'tag',
  'chip',
  'card',
  'modal',
  'dialog',
  'checkbox',
  'switch',
  'toggle',
  'alert',
  'banner',
  'toast',
  'tabs',
  'tab',
  'tooltip',
  'avatar',
  'dropdown',
  'select',
  'navbar',
  'navigation',
  'header',
  'sidebar',
  'table',
  'accordion',
  'pagination',
  'spinner',
  'loader',
  'progress',
  'radio',
  'slider',
  'drawer',
  'popover',
];

export function extractComponents(structure: ParsedMarkdownStructure): ComponentSpec[] {
  const components: ComponentSpec[] = [];
  const seenNames = new Set<string>();

  // Helper to map component name to preview type
  function determinePreviewType(name: string): ComponentSpec['previewType'] {
    const lower = name.toLowerCase();
    if (lower.includes('button') || lower === 'btn') return 'button';
    if (lower.includes('input') || lower.includes('field')) return 'input';
    if (lower.includes('badge') || lower.includes('tag') || lower.includes('chip')) return 'badge';
    if (lower.includes('card')) return 'card';
    if (lower.includes('checkbox')) return 'checkbox';
    if (lower.includes('switch') || lower.includes('toggle')) return 'switch';
    if (lower.includes('alert') || lower.includes('banner')) return 'alert';
    if (lower.includes('modal') || lower.includes('dialog')) return 'modal';
    return 'custom';
  }

  /**
   * Everything written *under* a component heading, including its own subsections.
   *
   * A section's `content` stops at the next heading of any level, so "### Button" ends the moment
   * "#### States" begins and a component was only ever handed its opening paragraph. Its variants,
   * sizes and states — the substance — sat in sibling sections the extractor never looked at, and
   * the fabricated defaults below hid that from everyone.
   *
   * The subtree is the section plus every following one that is nested deeper, stopping at the next
   * heading of the same or shallower level. Sub-heading lines are re-emitted because the caller
   * keys off them to know which list it is reading.
   */
  function subtreeLines(startIndex: number): string[] {
    const start = structure.sections[startIndex];
    const lines = start.content.split('\n');

    for (let i = startIndex + 1; i < structure.sections.length; i++) {
      const next = structure.sections[i];
      if (next.level <= start.level) break;
      lines.push(`${'#'.repeat(next.level)} ${next.heading}`, ...next.content.split('\n'));
    }

    return lines;
  }

  // 1. Scan sections where heading or parent is in components area or matches known component
  for (let sectionIndex = 0; sectionIndex < structure.sections.length; sectionIndex++) {
    const section = structure.sections[sectionIndex];
    const isUnderComponents =
      section.heading.toLowerCase().includes('component') ||
      KNOWN_COMPONENT_NAMES.some(k => section.heading.toLowerCase().includes(k));

    if (!isUnderComponents) continue;

    // Check if section itself is a component (e.g. ## Button or ### Card)
    const isActualComponent = KNOWN_COMPONENT_NAMES.some(k => {
      const h = section.heading.toLowerCase();
      return h === k || h.startsWith(`${k} `) || h.endsWith(` ${k}`) || h.includes(`${k}s`);
    });

    if (isActualComponent) {
      const compName = section.heading.replace(/^component:\s*/i, '').trim();
      if (seenNames.has(compName.toLowerCase())) continue;
      seenNames.add(compName.toLowerCase());

      const secLines = subtreeLines(sectionIndex);
      const variants: ComponentVariant[] = [];
      const states: string[] = [];
      const sizes: string[] = [];
      const tokensUsed: string[] = [];
      const anatomy: string[] = [];
      const a11yNotes: string[] = [];
      const behaviorNotes: string[] = [];
      let description = '';

      let currentSubHeader = '';

      secLines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Subheaders inside component section (e.g. ### Variants or #### States)
        const subMatch = trimmed.match(/^#{3,6}\s+(.+)$/);
        if (subMatch) {
          currentSubHeader = subMatch[1].toLowerCase();
          return;
        }

        // Detect description from first regular paragraph
        if (
          !description &&
          !trimmed.startsWith('#') &&
          !trimmed.startsWith('-') &&
          !trimmed.startsWith('|') &&
          !trimmed.startsWith('`')
        ) {
          description = trimmed;
          return;
        }

        // List item parsing
        const itemMatch = trimmed.match(/^[-*+]\s+(.+)$/);
        if (itemMatch) {
          const itemText = itemMatch[1].trim();

          if (currentSubHeader.includes('variant') || /variant/i.test(itemText)) {
            const vName = itemText
              .split(/[:—–-]/)[0]
              .replace(/[*_`]/g, '')
              .trim();
            const vDesc = itemText.includes(':') ? itemText.split(':')[1].trim() : undefined;
            variants.push({ name: vName, description: vDesc });
          } else if (
            currentSubHeader.includes('state') ||
            /hover|focus|active|disabled|loading/i.test(itemText)
          ) {
            states.push(itemText.replace(/[*_`]/g, '').trim());
          } else if (
            currentSubHeader.includes('size') ||
            /\b(sm|md|lg|xl|small|medium|large)\b/i.test(itemText)
          ) {
            sizes.push(itemText.replace(/[*_`]/g, '').trim());
          } else if (
            currentSubHeader.includes('token') ||
            itemText.includes('--') ||
            itemText.includes('$')
          ) {
            const tokenMatch = itemText.match(/(--[a-zA-Z0-9_-]+|\$[a-zA-Z0-9_-]+)/g);
            if (tokenMatch) tokensUsed.push(...tokenMatch);
          } else if (currentSubHeader.includes('anatomy') || currentSubHeader.includes('structure')) {
            anatomy.push(itemText.replace(/[*_`]/g, '').trim());
          } else if (currentSubHeader.includes('access') || currentSubHeader.includes('a11y')) {
            a11yNotes.push(itemText);
          } else if (currentSubHeader.includes('behavior') || currentSubHeader.includes('usage')) {
            behaviorNotes.push(itemText);
          }
        }
      });

      // Default variants if none explicitly listed but standard component
      if (variants.length === 0) {
        if (compName.toLowerCase().includes('button')) {
          variants.push({ name: 'Primary' }, { name: 'Secondary' }, { name: 'Outline' }, { name: 'Ghost' });
        } else if (compName.toLowerCase().includes('badge')) {
          variants.push(
            { name: 'Default' },
            { name: 'Success' },
            { name: 'Warning' },
            { name: 'Destructive' }
          );
        }
      }

      // No fabricated states. Filling an empty list with the five states a component *ought* to
      // have made every component look complete, which silently killed two features that exist to
      // notice incompleteness: the health audit's interactive-states check could never fail, and
      // the Overview profile could never score the axis. An absent list has to stay absent.

      // Default sizes if standard
      if (
        sizes.length === 0 &&
        (compName.toLowerCase().includes('button') ||
          compName.toLowerCase().includes('input') ||
          compName.toLowerCase().includes('badge'))
      ) {
        sizes.push('Small (sm)', 'Medium (md)', 'Large (lg)');
      }

      // Find code example in code blocks inside this section's line range
      const blockInSec = structure.codeBlocks.find(
        b => b.startLine >= section.lineNumber && b.endLine <= section.lineEnd
      );

      components.push({
        id: `cmp-${components.length + 1}-${compName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: compName,
        description: description || `Component specification for ${compName}.`,
        anatomy: anatomy.length > 0 ? anatomy : undefined,
        variants: variants.length > 0 ? variants : undefined,
        sizes: sizes.length > 0 ? sizes : undefined,
        states: states.length > 0 ? states : undefined,
        tokensUsed: tokensUsed.length > 0 ? Array.from(new Set(tokensUsed)) : undefined,
        behaviorNotes: behaviorNotes.length > 0 ? behaviorNotes : undefined,
        a11yNotes: a11yNotes.length > 0 ? a11yNotes : undefined,
        previewType: determinePreviewType(compName),
        rawCodeExample: blockInSec?.code,
        provenance: {
          sectionTitle: section.heading,
          headingPath: [section.heading],
          lineNumber: section.lineNumber,
          lineEnd: section.lineEnd,
          rawSourceSnippet: section.content.slice(0, 300),
        },
        confidence: 'explicit',
      });
    }
  }

  // 2. Also check tables in component sections
  for (const table of structure.tables) {
    if (table.headingPath.some(h => /component|ui element|widget/i.test(h))) {
      const nameIdx = table.headers.findIndex(h => /component|name|element/i.test(h));
      const descIdx = table.headers.findIndex(h => /description|desc|purpose|role/i.test(h));
      const variantsIdx = table.headers.findIndex(h => /variants|styles|types/i.test(h));

      if (nameIdx !== -1) {
        table.rows.forEach((row, rowIdx) => {
          const nameVal = row[nameIdx].replace(/[`*]/g, '').trim();
          if (nameVal && !seenNames.has(nameVal.toLowerCase())) {
            seenNames.add(nameVal.toLowerCase());
            const descVal = descIdx !== -1 ? row[descIdx] : `Component specification for ${nameVal}`;
            const vRaw = variantsIdx !== -1 ? row[variantsIdx] : '';
            const variantsList: ComponentVariant[] = vRaw
              ? vRaw.split(/[,/|]/).map(v => ({ name: v.trim() }))
              : [{ name: 'Default' }];

            components.push({
              id: `cmp-${components.length + 1}-${nameVal.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
              name: nameVal,
              description: descVal,
              variants: variantsList,
              previewType: determinePreviewType(nameVal),
              provenance: {
                sectionTitle: table.headingPath[table.headingPath.length - 1],
                headingPath: table.headingPath,
                lineNumber: table.startLine + rowIdx + 2,
                rawSourceSnippet: `| ${row.join(' | ')} |`,
              },
              confidence: 'explicit',
            });
          }
        });
      }
    }
  }

  return components;
}
