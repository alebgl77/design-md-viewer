import { DesignSystemOverview, ColorToken, TypographyToken } from '../schema/designSystem';
import { ParsedMarkdownStructure } from './markdownStructure';

export function extractOverview(
  structure: ParsedMarkdownStructure,
  colors: ColorToken[],
  typography: TypographyToken[],
  fileName: string
): DesignSystemOverview {
  let name: string | undefined;
  let description: string | undefined = undefined;
  let philosophy: string | undefined = undefined;
  let visualTone: string | undefined = undefined;
  const principles: string[] = [];

  // 1. Detect System Name from first level 1 heading (# System Name)
  const h1 = structure.sections.find(s => s.level === 1);
  if (h1) {
    name = h1.heading.replace(/^design system:?\s*/i, '').trim();
  } else {
    name = fileName.replace(/\.md$/i, '').replace(/[-_]/g, ' ');
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  // 2. Scan for Overview / Philosophy / Principles / Guidelines sections
  for (const section of structure.sections) {
    const headingLower = section.heading.toLowerCase();
    
    // Overview / Intro description
    if ((headingLower.includes('overview') || headingLower.includes('introduction') || section.level === 1) && !description) {
      const firstParagraph = section.content
        .split('\n')
        .map(l => l.trim())
        .find(l => l.length > 20 && !l.startsWith('#') && !l.startsWith('-') && !l.startsWith('|') && !l.startsWith('`'));
      if (firstParagraph) {
        description = firstParagraph;
      }
    }

    // Philosophy / Vision
    if (headingLower.includes('philosoph') || headingLower.includes('vision') || headingLower.includes('concept')) {
      philosophy = section.content.trim().split('\n\n')[0].replace(/[*_#]/g, '').trim();
    }

    // Tone / Aesthetic
    if (headingLower.includes('tone') || headingLower.includes('aesthetic') || headingLower.includes('direction') || headingLower.includes('brand')) {
      visualTone = section.content.trim().split('\n\n')[0].replace(/[*_#]/g, '').trim();
    }

    // Principles
    if (headingLower.includes('principle') || headingLower.includes('rule') || headingLower.includes('guideline')) {
      const lines = section.content.split('\n');
      lines.forEach(l => {
        const itemMatch = l.trim().match(/^[-*+]\s+(.+)$/);
        if (itemMatch && principles.length < 8) {
          principles.push(itemMatch[1].replace(/[*_`]/g, '').trim());
        }
      });
    }
  }

  // Default principles if none found
  if (principles.length === 0) {
    // Check if any list in first section has principles
    const firstSec = structure.sections[0];
    if (firstSec) {
      firstSec.content.split('\n').forEach(l => {
        const m = l.trim().match(/^[-*+]\s+(.+)$/);
        if (m && principles.length < 5) {
          principles.push(m[1].replace(/[*_`]/g, '').trim());
        }
      });
    }
  }

  // Primary colors for fingerprint (take up to 6 key colors)
  const primaryColors = colors.slice(0, 8);
  const typographySample = typography.find(t => /h1|display|heading|body/i.test(t.name)) || typography[0];

  return {
    name,
    description: description || `Interactive visual design system extracted from ${fileName}.`,
    philosophy,
    principles,
    visualTone,
    primaryColors,
    typographySample,
    totalTokensCount: 0, // calculated in pipeline
    categoriesDetected: [], // calculated in pipeline
  };
}
