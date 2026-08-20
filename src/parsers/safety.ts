/**
 * Safety & Defensive parsing utilities.
 * Ensures untrusted markdown files cannot execute arbitrary scripts,
 * and ensures prompt injection patterns are treated purely as inert text.
 */

const SCRIPT_BLOCK_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const SCRIPT_TAG_PATTERN = /<\/?script\b[^>]*>/gi;
const JAVASCRIPT_URI_PATTERN = /javascript:/gi;

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(SCRIPT_BLOCK_PATTERN, '')
    .replace(JAVASCRIPT_URI_PATTERN, '')
    .trim();
}

/**
 * Neutralizes the same constructs as sanitizeText, but guarantees the result
 * has exactly as many lines as the input: a removed span is replaced by the
 * newlines it contained and nothing is trimmed. Parsers depend on this so that
 * every recorded line number is an index into the original document the user
 * uploaded, which is what the Source view renders.
 */
export function sanitizeTextPreservingLines(text: string): string {
  if (!text) return '';
  return text
    .replace(SCRIPT_BLOCK_PATTERN, preservedNewlines)
    .replace(SCRIPT_TAG_PATTERN, '')
    .replace(JAVASCRIPT_URI_PATTERN, '');
}

function preservedNewlines(match: string): string {
  let count = 0;
  for (let i = 0; i < match.length; i++) {
    if (match.charCodeAt(i) === 10) count++;
  }
  return '\n'.repeat(count);
}

/**
 * Validates that extracted values conform to safe CSS or identifier formats,
 * discarding any suspicious or malformed executable content.
 */
export function isSafeCssValue(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  // Disallow javascript/url(data:...) execution injections
  if (/javascript:/i.test(val) || /data:text\/html/i.test(val)) return false;
  // Reasonable length guard
  if (val.length > 500) return false;
  return true;
}

export function isSafeIdentifier(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_\-\.\:\/ ]{1,100}$/.test(id.trim());
}
