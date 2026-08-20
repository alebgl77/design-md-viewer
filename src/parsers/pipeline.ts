import { DesignSystem } from '../schema/designSystem';
import { parseMarkdownStructure } from './markdownStructure';
import { extractColors } from './colorExtractor';
import { extractTypography } from './typographyExtractor';
import { extractSpacing } from './spacingExtractor';
import { extractRadii } from './radiusExtractor';
import { extractShadows } from './shadowExtractor';
import { extractBorders } from './borderExtractor';
import { extractBreakpoints } from './breakpointExtractor';
import { extractComponents } from './componentExtractor';
import { extractMotion } from './motionExtractor';
import { extractAccessibility } from './a11yExtractor';
import { resolveTokensAndReferences } from './referenceResolver';
import { extractOverview } from './overviewExtractor';

export function parseDesignDocument(
  rawMarkdown: string,
  fileName = 'design.md'
): DesignSystem {
  const structure = parseMarkdownStructure(rawMarkdown);

  // 1. Extract tokens & primitives
  const { colors, tokenVars } = extractColors(structure);
  const typography = extractTypography(structure);
  const spacing = extractSpacing(structure);
  const radii = extractRadii(structure);
  const shadows = extractShadows(structure);
  const borders = extractBorders(structure);
  const breakpoints = extractBreakpoints(structure);
  const components = extractComponents(structure);
  const motion = extractMotion(structure);
  const accessibility = extractAccessibility(structure);
  const tokens = resolveTokensAndReferences(structure, tokenVars);

  // 2. Extract overview
  const overview = extractOverview(structure, colors, typography, fileName);

  // 3. Determine categories detected
  const categoriesDetected: string[] = ['Overview'];
  if (colors.length > 0) categoriesDetected.push('Colors');
  if (typography.length > 0) categoriesDetected.push('Typography');
  if (spacing.length > 0) categoriesDetected.push('Spacing');
  if (radii.length > 0) categoriesDetected.push('Radius');
  if (shadows.length > 0) categoriesDetected.push('Shadows');
  if (borders.length > 0) categoriesDetected.push('Borders');
  if (breakpoints.length > 0) categoriesDetected.push('Breakpoints');
  if (components.length > 0) categoriesDetected.push('Components');
  if (motion.length > 0) categoriesDetected.push('Motion');
  if (accessibility.length > 0) categoriesDetected.push('Accessibility');
  if (tokens.length > 0) categoriesDetected.push('Tokens');
  
  // Health & Linter Audit is available when we have parsed tokens
  if (colors.length > 0 || typography.length > 0 || spacing.length > 0) {
    categoriesDetected.push('Audit');
  }

  categoriesDetected.push('Source');

  const totalTokensCount =
    colors.length +
    typography.length +
    spacing.length +
    radii.length +
    shadows.length +
    borders.length +
    breakpoints.length +
    tokens.length;

  overview.totalTokensCount = totalTokensCount;
  overview.categoriesDetected = categoriesDetected;

  // Simple hash for revision detection
  const hash = Math.abs(
    rawMarkdown.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0)
  ).toString(36);

  return {
    metadata: {
      fileName,
      fileSize: new Blob([rawMarkdown]).size,
      parsedAt: new Date().toISOString(),
      isAiEnriched: false,
      hash,
    },
    overview,
    colors,
    typography,
    spacing,
    radii,
    shadows,
    borders,
    layout: [],
    breakpoints,
    components,
    motion,
    accessibility,
    tokens,
    rawSections: structure.sections,
    rawContent: rawMarkdown,
  };
}
