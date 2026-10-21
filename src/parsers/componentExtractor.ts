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

function plainInlineText(value: string): string {
  return value
    .replace(/\\([\\`*_{}[\]<>#|~])|([*_`])/g, (_match, escaped: string | undefined) => escaped || '')
    .trim();
}

export function extractComponents(structure: ParsedMarkdownStructure): ComponentSpec[] {
  const components: ComponentSpec[] = [];
  const seenNames = new Set<string>();
  const ancestors: ParsedMarkdownStructure['sections'] = [];
  const subtreeEndIndices = new Array<number>(structure.sections.length).fill(structure.sections.length);
  const openSections: number[] = [];
  structure.sections.forEach((section, index) => {
    while (
      openSections.length &&
      structure.sections[openSections[openSections.length - 1]].level >= section.level
    ) {
      subtreeEndIndices[openSections.pop()!] = index;
    }
    openSections.push(index);
  });
  let codeBlockIndex = 0;

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
   * sizes and states - the substance - sat in sibling sections the extractor never looked at, and
   * the fabricated defaults below hid that from everyone.
   *
   * The subtree is the section plus every following one that is nested deeper, stopping at the next
   * heading of the same or shallower level. Sub-heading lines are re-emitted because the caller
   * keys off them to know which list it is reading.
   */
  function subtreeLines(startIndex: number): string[] {
    const start = structure.sections[startIndex];
    const lines = start.content.split('\n');

    for (let i = startIndex + 1; i < subtreeEndIndices[startIndex]; i++) {
      const next = structure.sections[i];
      lines.push(`${'#'.repeat(next.level)} ${next.heading}`, ...next.content.split('\n'));
    }

    return lines;
  }

  // 1. Scan sections where heading or parent is in components area or matches known component
  for (let sectionIndex = 0; sectionIndex < structure.sections.length; sectionIndex++) {
    const section = structure.sections[sectionIndex];
    while (
      codeBlockIndex < structure.codeBlocks.length &&
      structure.codeBlocks[codeBlockIndex].startLine < section.lineNumber
    )
      codeBlockIndex++;
    while (ancestors.length && ancestors[ancestors.length - 1].level >= section.level) ancestors.pop();
    const parent = ancestors[ancestors.length - 1];
    ancestors.push(section);
    const isDirectChild =
      !!parent &&
      /^(?:components|ui elements|widgets)$/i.test(parent.heading) &&
      !/^(?:components|ui elements|widgets)$/i.test(section.heading);
    const isUnderComponents =
      isDirectChild ||
      section.heading.toLowerCase().includes('component') ||
      KNOWN_COMPONENT_NAMES.some(k => section.heading.toLowerCase().includes(k));

    if (!isUnderComponents) continue;

    // Check if section itself is a component (e.g. ## Button or ### Card)
    const isActualComponent =
      isDirectChild ||
      KNOWN_COMPONENT_NAMES.some(k => {
        const h = section.heading.toLowerCase();
        return h === k || h.startsWith(`${k} `) || h.endsWith(` ${k}`) || h.includes(`${k}s`);
      });

    if (isActualComponent) {
      const compName = plainInlineText(section.heading.replace(/^component:\s*/i, ''));
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

        // List item parsing
        const itemMatch = trimmed.match(/^[-*+]\s+(.+)$/);
        if (itemMatch) {
          const itemText = itemMatch[1].trim();
          const text = plainInlineText(itemText);
          // An authored subsection wins over keyword guesses: "small icon" is
          // anatomy under Anatomy and "focus ring" is a note under Accessibility.
          let kind = currentSubHeader;
          if (!kind) {
            if (/variant/i.test(itemText)) kind = 'variants';
            else if (/hover|focus|active|disabled|loading/i.test(itemText)) kind = 'states';
            else if (/\b(sm|md|lg|xl|small|medium|large)\b/i.test(itemText)) kind = 'sizes';
            else if (/--|\$/.test(itemText)) kind = 'tokens';
          }
          if (kind.includes('variant')) {
            const parts =
              itemText.match(/^\*\*(.*?)\*\*(?::\s*(.*))?$/) ||
              itemText.match(/^([^:—–]+)(?:[:—–]\s*(.*))?$/);
            if (parts)
              variants.push({
                name: plainInlineText(parts[1]),
                description: parts[2] ? plainInlineText(parts[2]) : undefined,
              });
          } else if (kind.includes('state')) states.push(text);
          else if (kind.includes('size')) sizes.push(text);
          else if (kind.includes('token'))
            tokensUsed.push(...(text.match(/--[a-zA-Z0-9_-]+|\$[a-zA-Z0-9_-]+/g) || [text]));
          else if (kind.includes('anatomy') || kind.includes('structure')) anatomy.push(text);
          else if (kind.includes('access') || kind.includes('a11y')) a11yNotes.push(text);
          else if (kind.includes('behavior') || kind.includes('usage')) behaviorNotes.push(text);
          return;
        }

        if (!description && !currentSubHeader && !/^[#|`~]/.test(trimmed)) {
          description = plainInlineText(trimmed);
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
      const nextPeer = structure.sections[subtreeEndIndices[sectionIndex]];
      const subtreeEnd = nextPeer ? nextPeer.lineNumber - 1 : structure.rawLines.length;
      const nextBlock = structure.codeBlocks[codeBlockIndex];
      const blockInSec = nextBlock && nextBlock.endLine <= subtreeEnd ? nextBlock : undefined;

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
          lineEnd: subtreeEnd,
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
