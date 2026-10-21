import { GenericToken, Provenance } from '../schema/designSystem';
import { ParsedMarkdownStructure } from './markdownStructure';

// Bound work where all sources meet: per-file limits cannot see aliases in other documents.
const MAX_RESOLUTION_DEPTH = 32;
const MAX_RESOLUTION_OPERATIONS = 128;
const MAX_RESOLVED_BYTES = 64 * 1024;

interface ResolutionBudget {
  operations: number;
  exceeded: boolean;
}

/** Count UTF-8 without allocating an encoded copy, stopping as soon as the cap is exceeded. */
function resolvedByteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const code = character.codePointAt(0)!;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
    if (bytes > MAX_RESOLVED_BYTES) break;
  }
  return bytes;
}

function consumeOperation(budget: ResolutionBudget): boolean {
  if (++budget.operations > MAX_RESOLUTION_OPERATIONS) budget.exceeded = true;
  return !budget.exceeded;
}

/** Check every occurrence's projected growth before replace allocates an expanded string. */
function replaceReference(
  value: string,
  reference: string,
  replacement: string,
  budget: ResolutionBudget
): string {
  const pattern = new RegExp(`var\\(\\s*${reference}\\s*\\)`, 'g');
  const replacementBytes = resolvedByteLength(replacement);
  let projectedBytes = resolvedByteLength(value);
  if (replacementBytes > MAX_RESOLVED_BYTES || projectedBytes > MAX_RESOLVED_BYTES) {
    budget.exceeded = true;
    return value;
  }
  for (const match of value.matchAll(pattern)) {
    if (!consumeOperation(budget)) return value;
    projectedBytes += replacementBytes - resolvedByteLength(match[0]);
    if (projectedBytes > MAX_RESOLVED_BYTES) {
      budget.exceeded = true;
      return value;
    }
  }
  // A callback inserts token data literally; replacement-string $ patterns must not expand it.
  return value.replace(pattern, () => replacement);
}

export function resolveTokensAndReferences(
  structure: ParsedMarkdownStructure,
  knownColorVars: Record<string, string>
): GenericToken[] {
  const tokenMap = new Map<string, GenericToken>();
  const rawDefinitions = new Map<
    string,
    {
      value: string;
      provenance: Provenance;
      name?: string;
      cssVariable?: string;
      category?: string;
    }
  >();

  // 1. Collect all CSS variables from code blocks
  for (const block of structure.codeBlocks) {
    const lines = block.code.split('\n');
    lines.forEach((line, idx) => {
      const lineNum = block.startLine + idx + 1;
      const varMatch = line.match(/^\s*(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/i);
      if (varMatch) {
        const name = varMatch[1].trim();
        const value = varMatch[2].trim();
        rawDefinitions.set(name, {
          value,
          provenance: {
            sectionTitle: block.headingPath[block.headingPath.length - 1],
            headingPath: block.headingPath,
            lineNumber: lineNum,
            rawSourceSnippet: line.trim(),
          },
        });
      }
    });
  }

  // Normalized exports keep definitions in a table rather than replaying CSS:
  // replaying CSS would make each primitive extractor count those tokens again.
  for (const table of structure.tables) {
    if (!table.headingPath.some(h => /^tokens$/i.test(h))) continue;
    const nameIdx = table.headers.findIndex(h => /^name$/i.test(h));
    const variableIdx = table.headers.findIndex(h => /^css variable$/i.test(h));
    const definitionIdx = table.headers.findIndex(h => /^definition$/i.test(h));
    const categoryIdx = table.headers.findIndex(h => /^category$/i.test(h));
    if (nameIdx === -1 || definitionIdx === -1) continue;
    table.rows.forEach((row, index) => {
      const name = row[nameIdx]?.trim();
      const value = row[definitionIdx]?.replace(/^`|`$/g, '').trim();
      if (!name || !value) return;
      const cssVariable = variableIdx !== -1 ? row[variableIdx]?.replace(/^`|`$/g, '').trim() : '';
      rawDefinitions.set(cssVariable || name, {
        name,
        cssVariable: cssVariable || undefined,
        value,
        category: categoryIdx !== -1 ? row[categoryIdx] || undefined : undefined,
        provenance: {
          sectionTitle: table.headingPath[table.headingPath.length - 1],
          headingPath: table.headingPath,
          lineNumber: table.startLine + index + 2,
          rawSourceSnippet: `| ${row.join(' | ')} |`,
        },
      });
    });
  }

  // Determine category of token
  function categorizeToken(name: string): string {
    const lower = name.toLowerCase();
    if (
      lower.includes('color') ||
      lower.includes('bg') ||
      lower.includes('text') ||
      lower.includes('border-color')
    )
      return 'Color';
    if (
      lower.includes('font') ||
      lower.includes('typography') ||
      lower.includes('leading') ||
      lower.includes('tracking')
    )
      return 'Typography';
    if (
      lower.includes('space') ||
      lower.includes('spacing') ||
      lower.includes('gap') ||
      lower.includes('pad')
    )
      return 'Spacing';
    if (lower.includes('radius') || lower.includes('rounded')) return 'Radius';
    if (lower.includes('shadow') || lower.includes('elevation')) return 'Shadow';
    if (lower.includes('breakpoint') || lower.includes('screen')) return 'Breakpoint';
    if (lower.includes('duration') || lower.includes('ease') || lower.includes('motion')) return 'Motion';
    return 'Other';
  }

  // Extract referenced variable names from a value (e.g. `var(--color-primary)`)
  function extractReferences(val: string): string[] {
    const refs: string[] = [];
    const varRegex = /var\(\s*(--[a-zA-Z0-9_-]+)\s*\)/g;
    let match;
    while ((match = varRegex.exec(val)) !== null) {
      refs.push(match[1]);
    }
    return refs;
  }

  const resolvedDefinitions = new Map<string, string>();

  // Recursive resolver with cycle detection. Cache only context-independent
  // results, and only reuse them for the first reference in a root value.
  function resolveValue(
    val: string,
    visited: Set<string>,
    budget: ResolutionBudget,
    stagedDefinitions: Map<string, string>,
    depth = 0
  ): { value: string; encounteredVisitedReference: boolean } {
    if (
      !consumeOperation(budget) ||
      depth > MAX_RESOLUTION_DEPTH ||
      resolvedByteLength(val) > MAX_RESOLVED_BYTES
    ) {
      budget.exceeded = true;
      return { value: val, encounteredVisitedReference: false };
    }
    const refs = extractReferences(val);
    if (refs.length === 0) {
      return { value: val, encounteredVisitedReference: false };
    }

    let resolved = val;
    let encounteredVisitedReference = false;
    for (const ref of refs) {
      if (!consumeOperation(budget)) return { value: val, encounteredVisitedReference };
      if (visited.has(ref)) {
        encounteredVisitedReference = true;
        continue; // avoid cycle
      }

      const canReuseCachedDefinition = visited.size === 0;
      visited.add(ref);

      if (knownColorVars[ref]) {
        resolved = replaceReference(resolved, ref, knownColorVars[ref], budget);
      } else if (rawDefinitions.has(ref)) {
        let targetResolved: string;

        if (canReuseCachedDefinition && resolvedDefinitions.has(ref)) {
          targetResolved = resolvedDefinitions.get(ref)!;
        } else {
          const targetDef = rawDefinitions.get(ref)!;
          const targetResult = resolveValue(
            targetDef.value,
            new Set(visited),
            budget,
            stagedDefinitions,
            depth + 1
          );
          if (budget.exceeded) return { value: val, encounteredVisitedReference };
          targetResolved = targetResult.value;
          encounteredVisitedReference ||= targetResult.encounteredVisitedReference;

          if (!targetResult.encounteredVisitedReference) {
            stagedDefinitions.set(ref, targetResolved);
          }
        }

        resolved = replaceReference(resolved, ref, targetResolved, budget);
      }
      if (budget.exceeded) return { value: val, encounteredVisitedReference };
    }

    return { value: resolved, encounteredVisitedReference };
  }

  // Build GenericToken objects
  rawDefinitions.forEach((def, name) => {
    const references = extractReferences(def.value);
    const budget: ResolutionBudget = { operations: 0, exceeded: false };
    const stagedDefinitions = new Map<string, string>();
    const resolvedResult = resolveValue(def.value, new Set(), budget, stagedDefinitions);
    const resolvedValue = budget.exceeded ? def.value : resolvedResult.value;
    // Commit only after the whole root succeeds. An aborted branch must not prime later roots.
    if (!budget.exceeded) {
      stagedDefinitions.forEach((value, reference) => resolvedDefinitions.set(reference, value));
      if (!resolvedResult.encounteredVisitedReference) resolvedDefinitions.set(name, resolvedValue);
    }
    const category = def.category || categorizeToken(name);

    tokenMap.set(name, {
      id: `tok-${name
        .replace(/^--/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}`,
      name: def.name || name.replace(/^--/, ''),
      cssVariable: def.name ? def.cssVariable : name,
      value: def.value,
      resolvedValue: resolvedValue !== def.value ? resolvedValue : undefined,
      category,
      references: references.length > 0 ? references : undefined,
      provenance: def.provenance,
      confidence: 'explicit',
    });
  });

  return Array.from(tokenMap.values());
}
