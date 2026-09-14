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
import { SAMPLE_APEX_DESIGN_SYSTEM, SAMPLE_SCRAPED_DESIGN_SYSTEM } from '../../samples/fixtures';

/**
 * A deliberately unremarkable system: light canvas, every swatch AA against it,
 * no near-duplicate pair, a 4px grid and a button that documents its states.
 * It exists so the top of the scoring range stays defended by a document that
 * has nothing an auditor could legitimately object to.
 */
const WELL_FORMED_SYSTEM = `# Nimbus Core

A light, high-contrast reference system.

## Colors

* **Background**: #ffffff
* **Surface Card**: #e5e7eb
* **Primary Brand**: #1d4ed8
* **Secondary Brand**: #6d28d9
* **Accent Teal**: #0f766e
* **Success Green**: #166534
* **Warning Amber**: #92400e
* **Danger Red**: #b91c1c
* **Text Primary**: #111827
* **Text Muted**: #4b5563
* **Border Strong**: #6b7280

## Typography

| Level | Size | Weight | Line Height |
| :--- | :--- | :--- | :--- |
| Display | 32px | 700 | 40px |
| Heading | 24px | 600 | 32px |
| Subheading | 20px | 600 | 28px |
| Body | 16px | 400 | 24px |
| Caption | 12px | 500 | 16px |

## Spacing

* **space-1**: 4px (tight icon gaps)
* **space-2**: 8px (component inline padding)
* **space-4**: 16px (standard component padding)
* **space-6**: 24px (card separation)
* **space-8**: 32px (section vertical rhythm)

## Border Radius

* **radius-sm**: 4px (badges and tags)
* **radius-md**: 8px (buttons and inputs)
* **radius-lg**: 16px (cards and modals)

## Components

### Button
Primary interactive control.

#### States
* Default, Hover, Focus, Active, Disabled
`;

describe('Design System Health Auditor & Modern Enhancements', () => {
  const system = parseDesignDocument(SAMPLE_APEX_DESIGN_SYSTEM, 'apex.md');

  it('should calculate a high health score for well-structured design system', () => {
    const report = auditDesignSystemHealth(parseDesignDocument(WELL_FORMED_SYSTEM, 'nimbus.md'));

    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(['A+', 'A', 'B']).toContain(report.grade);
    expect(report.metrics.passedChecks).toBeGreaterThan(0);
    expect(report.metrics.gridCompliancePercent).toBeGreaterThanOrEqual(80);
    expect(report.metrics.errorCount).toBe(0);
    expect(report.metrics.warningCount).toBe(0);
  });

  it('should charge a dark system only for the contrast its own canvas produces', () => {
    const report = auditDesignSystemHealth(system);

    // Apex is well-formed everywhere the auditor can be objective: a clean 4px
    // grid, no errors, and a B grade. It loses points solely because indigo and
    // a subtle border sit below 4.5:1 on its near-black canvas, which the
    // auditor charges regardless of whether the swatch carries body text.
    expect(report.metrics.gridCompliancePercent).toBe(100);
    expect(report.metrics.errorCount).toBe(0);
    expect(report.grade).toBe('B');
    expect(report.issues.every(i => i.category === 'accessibility' || i.category === 'consistency')).toBe(
      true
    );
    expect(report.issues.every(i => i.impactScore > 0)).toBe(true);
    // Every deduction is itemized: the score is the sum of what is shown.
    const deductions = report.issues.reduce((acc, i) => acc + i.impactScore, 0);
    expect(report.score).toBe(100 - deductions);
  });

  it('should characterize a real-world site scrape without scoring it as clean', () => {
    const scrape = parseDesignDocument(SAMPLE_SCRAPED_DESIGN_SYSTEM, 'meridian.md');
    const report = auditDesignSystemHealth(scrape);

    // A 22.4px base unit cannot satisfy a 4px grid, so this document legitimately
    // sits in the lower band. What matters is that the reasons are itemized.
    expect(report.metrics.gridCompliancePercent).toBeLessThan(100);
    expect(report.issues.some(i => i.category === 'grid-rhythm')).toBe(true);
    expect(report.issues.some(i => i.id.startsWith('grid-spacing-'))).toBe(true);
    expect(report.metrics.errorCount).toBe(0);
    expect(report.score).toBeGreaterThanOrEqual(20);
  });

  it('should report an accessibility issue for a deliberately failing color pair', () => {
    const failingPair = `# Faint Contrast
## Colors
* **Background**: #ffffff
* **Primary Brand**: #fef08a
`;
    const ds = parseDesignDocument(failingPair, 'faint.md');
    const brand = ds.colors.find(c => c.name === 'Primary Brand');

    expect(brand?.contrastWithBg?.bgHex).toBe('#ffffff');
    expect(brand?.contrastWithBg?.aaCompliant).toBe(false);

    const report = auditDesignSystemHealth(ds);
    const issue = report.issues.find(i => i.category === 'accessibility');
    expect(issue).toBeDefined();
    expect(issue?.itemRef).toBe('Primary Brand');
    expect(issue?.description).toContain('#ffffff');
  });

  it('should cap the aggregate consistency penalty at the itemized deductions', () => {
    const rampDoc = `# Ramp
## Colors
${Array.from({ length: 10 }, (_, i) => `* **Slate ${i}**: #1e2${i}3b`).join('\n')}
`;
    const report = auditDesignSystemHealth(parseDesignDocument(rampDoc, 'ramp.md'));
    const consistencyPenalty = report.issues
      .filter(i => i.category === 'consistency')
      .reduce((acc, i) => acc + i.impactScore, 0);

    expect(report.metrics.nearDuplicatesFound).toBeGreaterThan(3);
    expect(consistencyPenalty).toBeLessThanOrEqual(15);
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

  it('should preserve the exact order of near-duplicate issue IDs', () => {
    const nearDuplicateRamp = `# Ordered Ramp
## Colors
* **Slate One**: #1e293b
* **Slate Two**: #1f2937
* **Slate Three**: #20293a
`;
    const report = auditDesignSystemHealth(parseDesignDocument(nearDuplicateRamp, 'ordered.md'));

    expect(report.issues.filter(issue => issue.id.startsWith('dup-color-')).map(issue => issue.id)).toEqual([
      'dup-color-col-1-slate-one-col-2-slate-two',
      'dup-color-col-1-slate-one-col-3-slate-three',
      'dup-color-col-2-slate-two-col-3-slate-three',
    ]);
  });

  it('should cache a report by DesignSystem identity without sharing across clones', () => {
    const firstReport = auditDesignSystemHealth(system);
    const secondReport = auditDesignSystemHealth(system);
    const clonedReport = auditDesignSystemHealth({ ...system });

    expect(secondReport).toBe(firstReport);
    expect(clonedReport).not.toBe(firstReport);
    expect(clonedReport).toEqual(firstReport);
  });

  it('should audit a 5,000-color input with 41,616 unique palette pairs', () => {
    const color = system.colors[0];
    const largeSystem = {
      ...system,
      colors: Array.from({ length: 5_000 }, (_, index) => ({
        ...color,
        id: `benchmark-${index}`,
        name: `Benchmark ${index}`,
        hex: `#${(index % 289).toString(16).padStart(6, '0')}`,
      })),
    };

    const report = auditDesignSystemHealth(largeSystem);

    expect(report.metrics.nearDuplicatesFound).toBeGreaterThan(0);
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
