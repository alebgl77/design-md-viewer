import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  sanitizeTextPreservingLines,
  isSafeCssValue,
  isSafeIdentifier,
} from '../safety';

const SCRIPT_DOC = '# Title\n\n<script>\nwindow.stolen = document.cookie;\n</script>\n\nBody text.\n';

describe('sanitizeText', () => {
  it('should remove a complete script block', () => {
    const out = sanitizeText(SCRIPT_DOC);

    expect(out).not.toContain('<script');
    expect(out).not.toContain('document.cookie');
    expect(out).toContain('# Title');
    expect(out).toContain('Body text.');
  });

  it('should strip javascript: URIs regardless of case', () => {
    expect(sanitizeText('[click](JavaScript:alert(1))')).toBe('[click](alert(1))');
  });

  it('should leave ordinary markdown untouched apart from trimming', () => {
    expect(sanitizeText('  ## Colors\n* **Brand**: #1d4ed8  ')).toBe('## Colors\n* **Brand**: #1d4ed8');
  });

  it('should return an empty string for empty input', () => {
    expect(sanitizeText('')).toBe('');
  });
});

describe('sanitizeTextPreservingLines', () => {
  it('should neutralize the same constructs as sanitizeText', () => {
    const out = sanitizeTextPreservingLines(SCRIPT_DOC);

    expect(out).not.toContain('<script');
    expect(out).not.toContain('document.cookie');
    expect(out).toContain('Body text.');
  });

  it('should keep the line count identical to the input', () => {
    const lineCount = (value: string) => value.split(/\r?\n/).length;

    expect(lineCount(sanitizeTextPreservingLines(SCRIPT_DOC))).toBe(lineCount(SCRIPT_DOC));

    const multiline = 'a\n<script>\nlet i = 0;\nlet j = 1;\n</script>\nb';
    expect(lineCount(sanitizeTextPreservingLines(multiline))).toBe(lineCount(multiline));

    const inline = 'a\n<script>alert(1)</script>\nb';
    expect(lineCount(sanitizeTextPreservingLines(inline))).toBe(lineCount(inline));
  });

  it('should not trim, so line 1 stays line 1', () => {
    const padded = '\n\n# Late Title\n\n';

    const out = sanitizeTextPreservingLines(padded);
    expect(out).toBe(padded);
    expect(out.split('\n')[2]).toBe('# Late Title');
  });

  it('should strip an unpaired script tag that has no closing partner', () => {
    expect(sanitizeTextPreservingLines('before <script src="x.js"> after')).toBe('before  after');
    expect(sanitizeTextPreservingLines('before </script> after')).toBe('before  after');
  });

  it('should strip javascript: URIs regardless of case', () => {
    expect(sanitizeTextPreservingLines('url(JAVASCRIPT:alert(1))')).toBe('url(alert(1))');
  });

  it('should return an empty string for empty input', () => {
    expect(sanitizeTextPreservingLines('')).toBe('');
  });
});

describe('isSafeCssValue', () => {
  it('should accept ordinary token values', () => {
    expect(isSafeCssValue('#1d4ed8')).toBe(true);
    expect(isSafeCssValue('0 4px 6px -1px rgba(0, 0, 0, 0.4)')).toBe(true);
    expect(isSafeCssValue('clamp(1rem, 2vw, 1.5rem)')).toBe(true);
  });

  it('should reject executable and oversized values', () => {
    expect(isSafeCssValue('javascript:alert(1)')).toBe(false);
    expect(isSafeCssValue('url(data:text/html;base64,PHNjcmlwdD4=)')).toBe(false);
    expect(isSafeCssValue('a'.repeat(501))).toBe(false);
    expect(isSafeCssValue('')).toBe(false);
  });
});

describe('isSafeIdentifier', () => {
  it('should accept token identifiers', () => {
    expect(isSafeIdentifier('color-primary')).toBe(true);
    expect(isSafeIdentifier('--space-4')).toBe(true);
    expect(isSafeIdentifier('Body Large')).toBe(true);
  });

  it('should reject markup, empty and oversized identifiers', () => {
    expect(isSafeIdentifier('<script>')).toBe(false);
    expect(isSafeIdentifier('drop; table')).toBe(false);
    expect(isSafeIdentifier('')).toBe(false);
    expect(isSafeIdentifier('a'.repeat(101))).toBe(false);
  });
});
