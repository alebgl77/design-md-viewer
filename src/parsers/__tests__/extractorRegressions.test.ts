import { describe, it, expect } from 'vitest';
import { parseDesignDocument } from '../pipeline';
import { parseMarkdownStructure } from '../markdownStructure';
import {
  SAMPLE_APEX_DESIGN_SYSTEM,
  SAMPLE_IAB2B_DESIGN_SYSTEM,
  SAMPLE_MINIMAL_COLORS,
  SAMPLE_CYBERPUNK_TOKENS,
} from '../../samples/fixtures';

const ELEVATION_DOC = `# Elevation Only

## Depth & Elevation

| Level | Shadow | Usage |
|---|---|---|
| Low | \`0 1px 2px rgba(0, 0, 0, 0.2)\` | Cards |
| Deep | \`0 10px 30px rgba(0, 0, 0, 0.5)\` | Modals |
`;

describe('Typography extractor: look-alike tables', () => {
  it('should yield zero typography tokens for an elevation table with a Level column', () => {
    const ds = parseDesignDocument(ELEVATION_DOC, 'elevation.md');

    expect(ds.typography).toEqual([]);
    expect(ds.overview.categoriesDetected).not.toContain('Typography');
    // The rows belong to the shadow extractor, and it still gets them.
    expect(ds.shadows.map(s => s.name)).toEqual(['Low', 'Deep']);
  });

  it('should still parse a genuine Level column when the table is about type', () => {
    const ds = parseDesignDocument(
      '# Type\n\n## Typography\n\n| Level | Font Size | Weight |\n|---|---|---|\n| H1 | 36px | 700 |\n| H2 | 28px | 600 |\n',
      'type.md'
    );

    expect(ds.typography.map(t => [t.name, t.fontSize, t.fontWeight])).toEqual([
      ['H1', '36px', '700'],
      ['H2', '28px', '600'],
    ]);
  });

  it('should never fabricate a font size for a row that has none', () => {
    const ds = parseDesignDocument(SAMPLE_IAB2B_DESIGN_SYSTEM, 'ia-b2b.md');

    expect(ds.typography.length).toBeGreaterThan(0);
    ds.typography.forEach(t => {
      expect(t.fontSize).toMatch(/^[\d.]+(px|rem|em|pt)$/i);
      expect(t.fontSizePx).toBeGreaterThan(0);
      // The elevation and radius tables must not contribute type styles.
      expect(t.name).not.toMatch(/shadow|glow|ring|radius/i);
    });
  });
});

describe('Spacing extractor: spacing-specific evidence', () => {
  const ds = parseDesignDocument(SAMPLE_IAB2B_DESIGN_SYSTEM, 'ia-b2b.md');

  it('should yield exactly the documented spacing scale', () => {
    expect(ds.spacing.map(s => s.value).sort()).toEqual(
      ['10px', '12.8px', '22.4px', '24px', '28px', '3.52px', '5.6px', '8px'].sort()
    );
    expect(ds.spacing).toHaveLength(8);
  });

  it('should not name a spacing token after a type style or a radius', () => {
    ds.spacing.forEach(s => {
      expect(s.name).toMatch(/^spacing \d+$/);
      expect(s.name).not.toMatch(/h[1-6]|display|body|caption|letter|radius|shadow/i);
    });
  });

  it('should ignore a Letter Spacing column inside a type hierarchy table', () => {
    // -1.44px and -0.96px live in the Type Hierarchy table and are not spacing.
    expect(ds.spacing.some(s => s.value.startsWith('-'))).toBe(false);
    expect(ds.spacing.some(s => s.value === '1.44px')).toBe(false);
  });

  it('should reject a value that is not a whole CSS length', () => {
    const ds2 = parseDesignDocument(
      '# S\n\n## Spacing\n\n| Token | Value |\n|---|---|\n| gap-ok | 16px |\n| gap-prose | roughly 3 columns |\n| gap-keyword | auto |\n',
      'spacing.md'
    );

    expect(ds2.spacing.map(s => s.value)).toEqual(['16px']);
  });
});

describe('Provenance: line numbers index the original document', () => {
  it('should keep rawLines aligned with a plain split of the input', () => {
    const docs = [
      SAMPLE_APEX_DESIGN_SYSTEM,
      SAMPLE_IAB2B_DESIGN_SYSTEM,
      SAMPLE_MINIMAL_COLORS,
      SAMPLE_CYBERPUNK_TOKENS,
    ];

    docs.forEach(doc => {
      expect(parseMarkdownStructure(doc).rawLines).toHaveLength(doc.split(/\r?\n/).length);
    });
  });

  it('should stay aligned when a script block is stripped out', () => {
    const doc = '# Guarded\n\n<script>\nlet a = 1;\nlet b = 2;\n</script>\n\n## Colors\n\n* **Primary Brand**: #1d4ed8\n';

    expect(parseMarkdownStructure(doc).rawLines).toHaveLength(doc.split(/\r?\n/).length);

    const ds = parseDesignDocument(doc, 'guarded.md');
    const brand = ds.colors.find(c => c.hex === '#1d4ed8');
    expect(doc.split('\n')[(brand?.provenance.lineNumber ?? 0) - 1]).toContain('#1d4ed8');
  });

  it('should record the original line number for a document that starts with blank lines', () => {
    const doc = '\n\n\n# Delayed Start\n\n## Colors\n\n* **Primary Brand**: #1d4ed8\n';
    const ds = parseDesignDocument(doc, 'delayed.md');
    const brand = ds.colors.find(c => c.hex === '#1d4ed8');

    expect(brand?.provenance.lineNumber).toBe(8);
    expect(doc.split('\n')[7]).toContain('#1d4ed8');
  });

  it('should point every extracted color at the source line that declares it', () => {
    const lines = SAMPLE_APEX_DESIGN_SYSTEM.split(/\r?\n/);
    const ds = parseDesignDocument(SAMPLE_APEX_DESIGN_SYSTEM, 'apex.md');

    expect(ds.colors.length).toBeGreaterThan(0);
    ds.colors.forEach(col => {
      expect(lines[(col.provenance.lineNumber ?? 0) - 1]).toContain(col.hex);
    });
  });
});

describe('Color extractor: names carry no markdown punctuation', () => {
  it('should strip backticks, asterisks and underscores from every fixture', () => {
    const docs = [
      SAMPLE_APEX_DESIGN_SYSTEM,
      SAMPLE_IAB2B_DESIGN_SYSTEM,
      SAMPLE_MINIMAL_COLORS,
      SAMPLE_CYBERPUNK_TOKENS,
    ];

    docs.forEach(doc => {
      parseDesignDocument(doc, 'fixture.md').colors.forEach(col => {
        expect(col.name).not.toMatch(/[`*_~]/);
        expect(col.name.trim()).toBe(col.name);
        expect(col.name.length).toBeGreaterThan(0);
      });
    });
  });

  it('should prefer the declared custom property over a bolded label', () => {
    const ds = parseDesignDocument(
      '# Names\n\n## Colors\n\n* **`--color-brand`** `#1d4ed8`: Brand color.\n* **_Muted Slate_**: #4b5563\n',
      'names.md'
    );

    expect(ds.colors.map(c => c.name)).toEqual(['brand', 'Muted Slate']);
    expect(ds.colors[0].cssVariable).toBe('--color-brand');
  });

  it('should keep one token per distinct hex and record the losing label as an alias', () => {
    const ds = parseDesignDocument(
      '# Dupes\n\n## Colors\n\n* **Primary Brand**: #1d4ed8\n* **Action Blue**: #1d4ed8\n',
      'dupes.md'
    );

    expect(ds.colors).toHaveLength(1);
    expect(ds.colors[0].aliases).toContain('Action Blue');
  });
});
