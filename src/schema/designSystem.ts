import { z } from 'zod';

export type ExtractionConfidence = 'explicit' | 'inferred';

export interface Provenance {
  sectionTitle?: string;
  headingPath: string[];
  lineNumber?: number;
  lineEnd?: number;
  rawSourceSnippet: string;
}

export const ProvenanceSchema = z.object({
  sectionTitle: z.string().optional(),
  headingPath: z.array(z.string()),
  lineNumber: z.number().optional(),
  lineEnd: z.number().optional(),
  rawSourceSnippet: z.string(),
});

export interface ColorContrastReport {
  /** Ratio against `bgHex`, rounded down for display; compliance is decided before rounding. */
  ratio: number;
  ratioOnLight: number;
  ratioOnDark: number;
  aaCompliant: boolean;
  aaaCompliant: boolean;
  /** The background the ratio was measured against: the document's own, or a default canvas. */
  bgHex: string;
}

export interface ColorToken {
  id: string;
  name: string;
  cssVariable?: string;
  rawValue: string;
  hex: string;
  rgb: string;
  hsl: string;
  role?: string;
  paletteGroup: 'brand' | 'neutral' | 'semantic' | 'accent' | 'surface' | 'other';
  aliases?: string[];
  contrastWithBg?: ColorContrastReport;
  provenance: Provenance;
  confidence: ExtractionConfidence;
}

export interface TypographyToken {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: string;
  fontSizePx?: number;
  fontWeight: string | number;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: string;
  role?: string;
  sampleText?: string;
  provenance: Provenance;
  confidence: ExtractionConfidence;
}

export interface SpacingToken {
  id: string;
  name: string;
  value: string;
  pxValue: number;
  remValue?: string;
  role?: string;
  provenance: Provenance;
  confidence: ExtractionConfidence;
}

export interface RadiusToken {
  id: string;
  name: string;
  value: string;
  pxValue: number;
  role?: string;
  provenance: Provenance;
  confidence: ExtractionConfidence;
}

export interface ShadowToken {
  id: string;
  name: string;
  value: string;
  elevationLevel?: number;
  role?: string;
  provenance: Provenance;
  confidence: ExtractionConfidence;
}

export interface BorderToken {
  id: string;
  name: string;
  width: string;
  style: string;
  color?: string;
  role?: string;
  provenance: Provenance;
  confidence: ExtractionConfidence;
}

export interface BreakpointToken {
  id: string;
  name: string;
  minWidth?: string;
  maxWidth?: string;
  pxValue: number;
  role?: string;
  provenance: Provenance;
  confidence: ExtractionConfidence;
}

export interface LayoutToken {
  id: string;
  name: string;
  value: string;
  type: 'container' | 'grid' | 'gap' | 'max-width' | 'other';
  description?: string;
  provenance: Provenance;
  confidence: ExtractionConfidence;
}

export interface ComponentVariant {
  name: string;
  description?: string;
  props?: Record<string, string>;
  previewClass?: string;
}

export interface ComponentSpec {
  id: string;
  name: string;
  description?: string;
  anatomy?: string[];
  variants?: ComponentVariant[];
  sizes?: string[];
  states?: string[];
  tokensUsed?: string[];
  behaviorNotes?: string[];
  a11yNotes?: string[];
  previewType?: 'button' | 'input' | 'badge' | 'card' | 'checkbox' | 'switch' | 'alert' | 'modal' | 'custom';
  rawCodeExample?: string;
  provenance: Provenance;
  confidence: ExtractionConfidence;
}

export interface MotionToken {
  id: string;
  name: string;
  duration?: string;
  durationMs?: number;
  easing?: string;
  cssTransition?: string;
  usage?: string;
  provenance: Provenance;
  confidence: ExtractionConfidence;
}

export interface A11yRule {
  id: string;
  title: string;
  category: 'contrast' | 'focus' | 'target-size' | 'keyboard' | 'motion' | 'aria' | 'general';
  description: string;
  ruleType: string;
  wcagLevel?: 'A' | 'AA' | 'AAA';
  provenance: Provenance;
  confidence: ExtractionConfidence;
}

export interface GenericToken {
  id: string;
  name: string;
  cssVariable?: string;
  value: string;
  resolvedValue?: string;
  category: string;
  references?: string[];
  provenance: Provenance;
  confidence: ExtractionConfidence;
}

export interface DesignSystemOverview {
  name?: string;
  description?: string;
  philosophy?: string;
  principles: string[];
  visualTone?: string;
  primaryColors: ColorToken[];
  typographySample?: TypographyToken;
  totalTokensCount: number;
  categoriesDetected: string[];
}

export interface RawSection {
  id: string;
  heading: string;
  level: number;
  lineNumber: number;
  lineEnd: number;
  content: string;
}

export interface DesignSystem {
  metadata: {
    fileName: string;
    fileSize: number;
    parsedAt: string;
    isAiEnriched: boolean;
    hash: string;
  };
  overview: DesignSystemOverview;
  colors: ColorToken[];
  typography: TypographyToken[];
  spacing: SpacingToken[];
  radii: RadiusToken[];
  shadows: ShadowToken[];
  borders: BorderToken[];
  layout: LayoutToken[];
  breakpoints: BreakpointToken[];
  components: ComponentSpec[];
  motion: MotionToken[];
  accessibility: A11yRule[];
  tokens: GenericToken[];
  rawSections: RawSection[];
  rawContent: string;
}
