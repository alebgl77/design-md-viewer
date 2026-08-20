import { ComponentSpec, DesignSystem, TypographyToken } from '../../schema/designSystem';
import { auditDesignSystemHealth } from '../../normalizers/healthAuditor';

/**
 * One dimension of the design-system profile.
 *
 * Every axis is a percentage from 0 to 100 in which higher is better, which is the only
 * situation where a radar chart is honest: one entity, several axes, one shared unit and one
 * shared direction of good. An axis that cannot be expressed that way is omitted rather than
 * rescaled - see `SystemProfile.omittedLabels`.
 */
export interface ProfileAxis {
  id: string;
  label: string;
  /** 0 - 100, rounded. Higher is better on every axis. */
  percent: number;
  /** The raw counts behind `percent`, in words, so the number is never only a shape. */
  detail: string;
}

export interface SystemProfile {
  axes: ProfileAxis[];
  /** Axes this document gives nothing to measure. Named so their absence is not silent. */
  omittedLabels: string[];
}

/**
 * The token categories `parseDesignDocument` can actually detect, mirroring the conditional
 * `categoriesDetected.push(...)` calls in `src/parsers/pipeline.ts`. Overview, Audit and Source
 * are excluded on purpose: they are chrome the pipeline appends regardless of what the document
 * contains, so counting them would inflate every score by a constant. The denominator of the
 * coverage axis is this list's length rather than a number typed by hand.
 */
const DETECTABLE_CATEGORIES: readonly string[] = [
  'Colors',
  'Typography',
  'Spacing',
  'Radius',
  'Shadows',
  'Borders',
  'Breakpoints',
  'Components',
  'Motion',
  'Accessibility',
  'Tokens',
];

/**
 * `typographyExtractor` back-fills a weight of 400 and a line height of 1.5 on every token,
 * so the fields alone cannot tell a declared value from a parser default - a naive
 * `token.fontWeight && token.lineHeight` test reads 100% on a document that declares neither.
 * Treating the two fill-in values as "not declared" is the only signal available downstream of
 * the extractor. It can only understate the axis (a document that really does specify 400/1.5
 * is not credited), never overstate it.
 */
const FILLED_IN_FONT_WEIGHT = '400';
const FILLED_IN_LINE_HEIGHT = '1.5';

/**
 * Same problem in `componentExtractor`, one degree worse: a component whose section lists no
 * states gets this exact stock array, and because `markdownStructure` closes a section at the
 * next heading of any level, a `#### States` block is never even read as part of its component.
 * A component carrying this array therefore tells us nothing about the document - the document
 * may have specified every state or none. That is an absent measurement, not a score of zero,
 * so such components are excluded from the axis and the axis itself disappears when no component
 * has a recorded state list. Reporting the parser's constant as a design-system score would be
 * fabricating a number.
 */
const STOCK_COMPONENT_STATES = ['default', 'hover', 'focus', 'active', 'disabled'];

/** The three states an interactive component has to specify to be considered complete. */
const REQUIRED_COMPONENT_STATES = ['hover', 'focus', 'disabled'];

function share(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((numerator / denominator) * 100)));
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function declaresWeightAndLineHeight(token: TypographyToken): boolean {
  const weight = String(token.fontWeight ?? '').trim();
  const lineHeight = (token.lineHeight ?? '').trim();
  return (
    weight !== '' &&
    weight !== FILLED_IN_FONT_WEIGHT &&
    lineHeight !== '' &&
    lineHeight !== FILLED_IN_LINE_HEIGHT
  );
}

/** True only when the state list came from the document rather than from the extractor. */
function hasRecordedStates(component: ComponentSpec): boolean {
  const states = (component.states ?? []).map(state => state.toLowerCase());
  if (states.length === 0) return false;
  const isParserFallback =
    states.length === STOCK_COMPONENT_STATES.length &&
    STOCK_COMPONENT_STATES.every((state, index) => states[index] === state);
  return !isParserFallback;
}

function coversRequiredStates(component: ComponentSpec): boolean {
  const states = (component.states ?? []).map(state => state.toLowerCase());
  return REQUIRED_COMPONENT_STATES.every(required => states.some(state => state.includes(required)));
}

/**
 * Derives the six profile axes from the parsed document. Nothing here is a constant standing in
 * for a measurement: every percentage is a ratio of things the parser actually found, and any
 * axis whose denominator would be zero is dropped instead of being reported as a confident zero.
 */
export function buildSystemProfile(system: DesignSystem): SystemProfile {
  const { metrics } = auditDesignSystemHealth(system);
  const axes: ProfileAxis[] = [];
  const omittedLabels: string[] = [];

  const colorCount = system.colors.length;
  const typographyCount = system.typography.length;

  // 1. Contrast - how much of the palette clears WCAG AA against the document's own canvas.
  if (colorCount > 0) {
    const passing = system.colors.filter(color => color.contrastWithBg?.aaCompliant).length;
    axes.push({
      id: 'contrast',
      label: 'Contrast',
      percent: share(passing, colorCount),
      detail: `${passing} of ${plural(colorCount, 'color', 'colors')} pass WCAG AA`,
    });
  } else {
    omittedLabels.push('Contrast');
  }

  // 2. Palette clarity - near-duplicate swatches are design debt, so they are a penalty.
  if (colorCount > 0) {
    const duplicatePenalty = Math.min(100, (metrics.nearDuplicatesFound / Math.max(1, colorCount)) * 100);
    axes.push({
      id: 'palette-clarity',
      label: 'Palette clarity',
      percent: Math.max(0, Math.min(100, Math.round(100 - duplicatePenalty))),
      detail: `${plural(metrics.nearDuplicatesFound, 'near-duplicate pair', 'near-duplicate pairs')} across ${colorCount} colors`,
    });
  } else {
    omittedLabels.push('Palette clarity');
  }

  // 3. Type scale - a scale is only reusable if each step says how heavy and how tall it is.
  if (typographyCount > 0) {
    const specified = system.typography.filter(declaresWeightAndLineHeight).length;
    axes.push({
      id: 'type-scale',
      label: 'Type scale',
      percent: share(specified, typographyCount),
      detail: `${specified} of ${plural(typographyCount, 'type style', 'type styles')} declare weight and line height`,
    });
  } else {
    omittedLabels.push('Type scale');
  }

  // 4. Grid rhythm - taken verbatim from the health audit, which owns this rule. The audit
  //    returns 100 when it measured nothing at all, so the axis is dropped in that case rather
  //    than reporting a perfect score for an empty measurement.
  const gridMeasurements = system.spacing.length + system.typography.filter(t => t.fontSizePx).length;
  if (gridMeasurements > 0) {
    axes.push({
      id: 'grid-rhythm',
      label: 'Grid rhythm',
      percent: Math.max(0, Math.min(100, metrics.gridCompliancePercent)),
      detail: `4px/8px rhythm across ${plural(gridMeasurements, 'spacing and font-size value', 'spacing and font-size values')}`,
    });
  } else {
    omittedLabels.push('Grid rhythm');
  }

  // 5. Component states - a component that documents no states documents no keyboard story.
  //    Only components whose state list survived extraction can be judged; see the note on
  //    STOCK_COMPONENT_STATES for why the rest are not evidence of anything.
  const statedComponents = system.components.filter(hasRecordedStates);
  if (statedComponents.length > 0) {
    const complete = statedComponents.filter(coversRequiredStates).length;
    axes.push({
      id: 'component-states',
      label: 'Component states',
      percent: share(complete, statedComponents.length),
      detail: `${complete} of ${plural(statedComponents.length, 'component', 'components')} with a documented state list cover hover, focus and disabled`,
    });
  } else {
    omittedLabels.push('Component states');
  }

  // 6. Coverage - how many of the categories the parser can find this document actually fills.
  const detected = system.overview.categoriesDetected.filter(category =>
    DETECTABLE_CATEGORIES.includes(category)
  ).length;
  axes.push({
    id: 'coverage',
    label: 'Coverage',
    percent: share(detected, DETECTABLE_CATEGORIES.length),
    detail: `${detected} of ${DETECTABLE_CATEGORIES.length} token categories documented`,
  });

  return { axes, omittedLabels };
}

/** A one-sentence spoken equivalent of the polygon, for the chart's `aria-label`. */
export function describeProfile(profile: SystemProfile, systemName: string): string {
  const readings = profile.axes.map(axis => `${axis.label} ${axis.percent} percent`).join(', ');
  const dimensions = plural(profile.axes.length, 'dimension', 'dimensions');
  return `Radar chart profiling ${systemName} across ${dimensions}, each a percentage where higher is better: ${readings}.`;
}
