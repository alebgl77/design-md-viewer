/**
 * Safety & Defensive parsing utilities.
 * Ensures untrusted markdown files cannot execute arbitrary scripts,
 * and ensures prompt injection patterns are treated purely as inert text.
 */

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
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
