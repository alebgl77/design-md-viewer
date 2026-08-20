/**
 * Unit conversion & normalization helper.
 * Standard base font size is 16px.
 */

const BASE_FONT_SIZE = 16;

export function parsePxValue(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const str = value.toString().trim().toLowerCase();

  // 16px
  const pxMatch = str.match(/^([\d.]+)\s*px$/);
  if (pxMatch) return parseFloat(pxMatch[1]);

  // 1.5rem or 1.5em
  const remMatch = str.match(/^([\d.]+)\s*(?:rem|em)$/);
  if (remMatch) return parseFloat(remMatch[1]) * BASE_FONT_SIZE;

  // Pure number
  const numMatch = str.match(/^([\d.]+)$/);
  if (numMatch) return parseFloat(numMatch[1]);

  // Named keywords
  if (str === 'none' || str === '0') return 0;
  if (str === 'xs' || str === 'sm') return 4;
  if (str === 'md') return 8;
  if (str === 'lg') return 16;
  if (str === 'xl') return 24;
  if (str === '2xl') return 32;
  if (str === 'full' || str === '9999px') return 9999;

  return 0;
}

export function parseDurationMs(value: string | undefined): number {
  if (!value) return 0;
  const str = value.trim().toLowerCase();

  // 200ms
  const msMatch = str.match(/^([\d.]+)\s*ms$/);
  if (msMatch) return parseFloat(msMatch[1]);

  // 0.2s
  const sMatch = str.match(/^([\d.]+)\s*s$/);
  if (sMatch) return parseFloat(sMatch[1]) * 1000;

  const numMatch = str.match(/^([\d.]+)$/);
  if (numMatch) return parseFloat(numMatch[1]);

  return 0;
}

export function formatRem(px: number): string {
  const rem = Math.round((px / BASE_FONT_SIZE) * 1000) / 1000;
  return `${rem}rem`;
}
