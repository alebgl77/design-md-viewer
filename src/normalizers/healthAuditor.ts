import { DesignSystem, ColorToken } from '../schema/designSystem';
import { hexToRgb } from './colorNormalizer';

export interface AuditIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'accessibility' | 'consistency' | 'grid-rhythm' | 'completeness';
  title: string;
  description: string;
  recommendation: string;
  impactScore: number; // penalty to health score
  itemRef?: string;
}

export interface DesignSystemHealthReport {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  summary: string;
  issues: AuditIssue[];
  metrics: {
    passedChecks: number;
    warningCount: number;
    errorCount: number;
    nearDuplicatesFound: number;
    gridCompliancePercent: number;
  };
}

export function auditDesignSystemHealth(system: DesignSystem): DesignSystemHealthReport {
  const issues: AuditIssue[] = [];
  let passedChecks = 0;

  // 1. Accessibility & Contrast Checks
  let failingContrastCount = 0;
  system.colors.forEach((col) => {
    if (col.contrastWithBg && !col.contrastWithBg.aaCompliant && col.paletteGroup !== 'surface') {
      failingContrastCount++;
      issues.push({
        id: `a11y-contrast-${col.id}`,
        type: 'warning',
        category: 'accessibility',
        title: `Low Contrast on Color "${col.name}" (${col.hex})`,
        description: `Contrast ratio is ${col.contrastWithBg.ratio}:1, which is below the WCAG AA minimum of 4.5:1 for body text.`,
        recommendation: `Adjust the luminance of ${col.name} or use it only on high-contrast surfaces.`,
        impactScore: 4,
        itemRef: col.name,
      });
    } else {
      passedChecks++;
    }
  });

  // 2. Near-Duplicate Color Detection (Orphan colors)
  const nearDuplicatePairs: { col1: ColorToken; col2: ColorToken; distance: number }[] = [];
  for (let i = 0; i < system.colors.length; i++) {
    for (let j = i + 1; j < system.colors.length; j++) {
      const c1 = system.colors[i];
      const c2 = system.colors[j];
      if (c1.hex.toLowerCase() === c2.hex.toLowerCase()) continue;

      const rgb1 = hexToRgb(c1.hex);
      const rgb2 = hexToRgb(c2.hex);
      const distance = Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
      );

      // Distance < 25 indicates visually almost indistinguishable colors
      if (distance > 0 && distance < 25) {
        nearDuplicatePairs.push({ col1: c1, col2: c2, distance });
        issues.push({
          id: `dup-color-${c1.id}-${c2.id}`,
          type: 'warning',
          category: 'consistency',
          title: `Near-Duplicate Colors: "${c1.name}" (${c1.hex}) & "${c2.name}" (${c2.hex})`,
          description: `These colors have only a ${Math.round(distance)} unit RGB delta and look nearly identical to users.`,
          recommendation: `Consolidate into a single shared token to avoid design debt and CSS bloat.`,
          impactScore: 5,
          itemRef: `${c1.name} / ${c2.name}`,
        });
      }
    }
  }

  // 3. Grid Rhythm (4px / 8px multiple conformance)
  let gridCompliantCount = 0;
  let totalMeasurements = 0;

  system.spacing.forEach((s) => {
    totalMeasurements++;
    if (s.pxValue > 0 && s.pxValue % 4 !== 0 && s.pxValue % 8 !== 0) {
      issues.push({
        id: `grid-spacing-${s.id}`,
        type: 'info',
        category: 'grid-rhythm',
        title: `Off-Grid Spacing Token "${s.name}" (${s.value})`,
        description: `Value ${s.pxValue}px does not follow the standard 4px/8px geometric grid rhythm.`,
        recommendation: `Consider snapping to the nearest 4px multiple (${Math.round(s.pxValue / 4) * 4}px).`,
        impactScore: 2,
        itemRef: s.name,
      });
    } else {
      gridCompliantCount++;
      passedChecks++;
    }
  });

  system.typography.forEach((t) => {
    if (t.fontSizePx) {
      totalMeasurements++;
      if (t.fontSizePx % 2 !== 0 && t.fontSizePx > 11) {
        issues.push({
          id: `grid-typo-${t.id}`,
          type: 'info',
          category: 'grid-rhythm',
          title: `Odd-Pixel Font Size "${t.name}" (${t.fontSize})`,
          description: `Font size ${t.fontSizePx}px is an odd number and may cause pixel-snapping blur on low-DPI screens.`,
          recommendation: `Use even font sizes (e.g. 14px, 16px, 18px, 20px) for crisp subpixel alignment.`,
          impactScore: 2,
          itemRef: t.name,
        });
      } else {
        gridCompliantCount++;
        passedChecks++;
      }
    }
  });

  const gridCompliancePercent = totalMeasurements > 0
    ? Math.round((gridCompliantCount / totalMeasurements) * 100)
    : 100;

  // 4. Semantic Completeness
  const semanticGroups = new Set(system.colors.map(c => c.paletteGroup));
  const hasBrand = semanticGroups.has('brand');
  const hasNeutral = semanticGroups.has('neutral') || semanticGroups.has('surface');
  const hasSemantic = semanticGroups.has('semantic');

  if (!hasBrand && system.colors.length > 0) {
    issues.push({
      id: 'semantic-missing-brand',
      type: 'info',
      category: 'completeness',
      title: 'No Explicit Brand / Primary Palette Identified',
      description: 'The design system does not clearly tag a Primary or Brand color token.',
      recommendation: 'Tag your primary interactive color as "Primary" or "Brand".',
      impactScore: 3,
    });
  } else {
    passedChecks++;
  }

  if (!hasSemantic && system.colors.length > 3) {
    issues.push({
      id: 'semantic-missing-functional',
      type: 'info',
      category: 'completeness',
      title: 'Missing Functional / Status Colors (Success, Error, Warning)',
      description: 'No explicit feedback colors (green/success, red/danger, yellow/warning) were detected.',
      recommendation: 'Add status tokens for validation, alerts, and feedback banners.',
      impactScore: 3,
    });
  } else {
    passedChecks++;
  }

  // 5. Component States Completeness
  system.components.forEach((comp) => {
    if (comp.previewType === 'button' || comp.name.toLowerCase().includes('button')) {
      const states = (comp.states || []).map(s => s.toLowerCase());
      const missingStates: string[] = [];
      if (!states.some(s => s.includes('hover'))) missingStates.push('Hover');
      if (!states.some(s => s.includes('focus'))) missingStates.push('Focus');
      if (!states.some(s => s.includes('disabled'))) missingStates.push('Disabled');

      if (missingStates.length > 0) {
        issues.push({
          id: `comp-states-${comp.id}`,
          type: 'warning',
          category: 'completeness',
          title: `Incomplete Interactive States for "${comp.name}"`,
          description: `Component is missing explicit specifications for: ${missingStates.join(', ')}.`,
          recommendation: `Define focus rings and disabled opacity to ensure keyboard and accessible navigation.`,
          impactScore: 4,
          itemRef: comp.name,
        });
      } else {
        passedChecks++;
      }
    }
  });

  // Calculate final score
  const totalDeductions = issues.reduce((acc, issue) => acc + issue.impactScore, 0);
  const score = Math.max(20, Math.min(100, 100 - totalDeductions));

  let grade: DesignSystemHealthReport['grade'] = 'A+';
  if (score >= 95) grade = 'A+';
  else if (score >= 88) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 60) grade = 'C';
  else grade = 'D';

  let summary = '';
  if (grade === 'A+' || grade === 'A') {
    summary = 'Outstanding architecture! Clean tokens, high accessibility compliance, and well-structured grid rhythm.';
  } else if (grade === 'B') {
    summary = 'Solid foundations. Minor consistency or accessibility adjustments recommended before production release.';
  } else {
    summary = 'Requires attention. Several duplicate colors or off-grid values could be streamlined.';
  }

  return {
    score,
    grade,
    summary,
    issues,
    metrics: {
      passedChecks,
      warningCount: issues.filter(i => i.type === 'warning').length,
      errorCount: issues.filter(i => i.type === 'error').length,
      nearDuplicatesFound: nearDuplicatePairs.length,
      gridCompliancePercent,
    },
  };
}
