import { describe, it, expect } from 'vitest';
import { parseDesignDocument } from '../../parsers/pipeline';
import { auditDesignSystemHealth } from '../healthAuditor';
import { simulateColorVision } from '../colorBlindness';
import {
  exportToTailwindV4,
  exportToTypeScriptTheme,
  exportToScssVariables,
  exportToAiPromptRules,
} from '../../utils/exportFormats';
import { SAMPLE_MODERN_DESIGN_SYSTEM } from '../../samples/fixtures';

describe('Design System Health Auditor & Modern Enhancements', () => {
  const system = parseDesignDocument(SAMPLE_MODERN_DESIGN_SYSTEM, 'apex.md');

  it('should calculate a high health score for well-structured design system', () => {
    const report = auditDesignSystemHealth(system);

    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(['A+', 'A', 'B']).toContain(report.grade);
    expect(report.metrics.passedChecks).toBeGreaterThan(0);
    expect(report.metrics.gridCompliancePercent).toBeGreaterThanOrEqual(80);
  });

  it('should detect near-duplicate colors when present', () => {
    const docWithDuplicates = `# Test Near Duplicates
## Colors
* **Gray Slate 800**: #1e293b
* **Gray Slate 801**: #1f2937
`;
    const ds = parseDesignDocument(docWithDuplicates, 'dup.md');
    const report = auditDesignSystemHealth(ds);

    expect(report.metrics.nearDuplicatesFound).toBeGreaterThanOrEqual(1);
    const dupIssue = report.issues.find(i => i.id.startsWith('dup-color'));
    expect(dupIssue).toBeDefined();
    expect(dupIssue?.recommendation).toContain('Consolidate');
  });

  it('should simulate Color Vision Deficiency (CVD) correctly', () => {
    const pureRed = '#ff0000';
    const protanopia = simulateColorVision(pureRed, 'protanopia');
    const gray = simulateColorVision(pureRed, 'achromatopsia');

    expect(protanopia).not.toBe(pureRed);
    expect(gray).toBeDefined();
  });

  it('should generate Tailwind v4 @theme CSS export', () => {
    const v4 = exportToTailwindV4(system);
    expect(v4).toContain('@theme {');
    expect(v4).toContain('--color-primary');
    expect(v4).toContain('--spacing-');
  });

  it('should generate TypeScript typed theme export', () => {
    const ts = exportToTypeScriptTheme(system);
    expect(ts).toContain('export const theme =');
    expect(ts).toContain('as const;');
    expect(ts).toContain('export type Theme =');
  });

  it('should generate SCSS variables', () => {
    const scss = exportToScssVariables(system);
    expect(scss).toContain('$color-');
    expect(scss).toContain('$space-');
  });

  it('should generate AI Prompt & System Rules (.cursorrules)', () => {
    const aiRules = exportToAiPromptRules(system);
    expect(aiRules).toContain('# DESIGN SYSTEM GUIDELINES & CONSTRAINTS');
    expect(aiRules).toContain('NEVER invent arbitrary colors');
    expect(aiRules).toContain('Primary Design Tokens');
  });
});
