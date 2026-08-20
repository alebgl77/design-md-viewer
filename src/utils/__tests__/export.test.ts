import { describe, it, expect } from 'vitest';
import { parseDesignDocument } from '../../parsers/pipeline';
import {
  exportToJson,
  exportToCssVariables,
  exportToTailwindConfig,
  exportToNormalizedMarkdown,
} from '../exportFormats';
import { SAMPLE_MODERN_DESIGN_SYSTEM } from '../../samples/fixtures';

describe('Export Generators', () => {
  const system = parseDesignDocument(SAMPLE_MODERN_DESIGN_SYSTEM, 'apex.md');

  it('should export valid JSON matching W3C DTCG format', () => {
    const jsonStr = exportToJson(system);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.$schema).toContain('design-tokens');
    expect(parsed.colors).toBeDefined();
    expect(parsed.typography).toBeDefined();
    expect(parsed.spacing).toBeDefined();
  });

  it('should export valid CSS custom properties', () => {
    const css = exportToCssVariables(system);

    expect(css).toContain(':root {');
    expect(css).toContain('--color-primary');
    expect(css).toContain('}');
  });

  it('should export valid Tailwind configuration snippet', () => {
    const tw = exportToTailwindConfig(system);

    expect(tw).toContain('module.exports = {');
    expect(tw).toContain('theme: {');
    expect(tw).toContain('colors: {');
  });

  it('should export clean normalized markdown', () => {
    const md = exportToNormalizedMarkdown(system);

    expect(md).toContain('# Apex UI Design System');
    expect(md).toContain('## Colors');
    expect(md).toContain('## Typography');
    expect(md).toContain('## Spacing');
  });
});
