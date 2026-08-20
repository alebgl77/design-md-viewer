import { GenericToken, Provenance } from '../schema/designSystem';
import { ParsedMarkdownStructure } from './markdownStructure';

export function resolveTokensAndReferences(
  structure: ParsedMarkdownStructure,
  knownColorVars: Record<string, string>
): GenericToken[] {
  const tokenMap = new Map<string, GenericToken>();
  const rawDefinitions = new Map<string, { value: string; provenance: Provenance }>();

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

  // Determine category of token
  function categorizeToken(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('color') || lower.includes('bg') || lower.includes('text') || lower.includes('border-color')) return 'Color';
    if (lower.includes('font') || lower.includes('typography') || lower.includes('leading') || lower.includes('tracking')) return 'Typography';
    if (lower.includes('space') || lower.includes('spacing') || lower.includes('gap') || lower.includes('pad')) return 'Spacing';
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

  // Recursive resolver with cycle detection
  function resolveValue(val: string, visited = new Set<string>()): string {
    const refs = extractReferences(val);
    if (refs.length === 0) return val;

    let resolved = val;
    for (const ref of refs) {
      if (visited.has(ref)) continue; // avoid cycle
      visited.add(ref);

      if (knownColorVars[ref]) {
        resolved = resolved.replace(new RegExp(`var\\(\\s*${ref}\\s*\\)`, 'g'), knownColorVars[ref]);
      } else if (rawDefinitions.has(ref)) {
        const targetDef = rawDefinitions.get(ref)!;
        const targetResolved = resolveValue(targetDef.value, new Set(visited));
        resolved = resolved.replace(new RegExp(`var\\(\\s*${ref}\\s*\\)`, 'g'), targetResolved);
      }
    }
    return resolved;
  }

  // Build GenericToken objects
  rawDefinitions.forEach((def, name) => {
    const references = extractReferences(def.value);
    const resolvedValue = resolveValue(def.value);
    const category = categorizeToken(name);

    tokenMap.set(name, {
      id: `tok-${name.replace(/^--/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: name.replace(/^--/, ''),
      cssVariable: name,
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
