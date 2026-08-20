export interface NormalizedColor {
  hex: string;
  rgb: string;
  hsl: string;
  isValid: boolean;
}

const NAMED_COLORS: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  yellow: '#eab308',
  purple: '#a855f7',
  gray: '#6b7280',
  slate: '#64748b',
  zinc: '#71717a',
  orange: '#f97316',
  amber: '#f59e0b',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  fuchsia: '#d946ef',
  pink: '#ec4899',
  rose: '#f43f5e',
};

export function normalizeColorValue(input: string): NormalizedColor {
  const clean = input.trim().toLowerCase();

  // 1. Check named colors
  if (NAMED_COLORS[clean]) {
    const hex = NAMED_COLORS[clean];
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return {
      hex,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      isValid: true,
    };
  }

  // 2. Check HEX (#fff or #ffffff or #ffffffff)
  const hexMatch = clean.match(/^#([0-9a-f]{3,8})$/i);
  if (hexMatch) {
    let rawHex = hexMatch[1];
    if (rawHex.length === 3) {
      rawHex = rawHex
        .split('')
        .map(c => c + c)
        .join('');
    } else if (rawHex.length === 4) {
      rawHex =
        rawHex
          .slice(0, 3)
          .split('')
          .map(c => c + c)
          .join('') +
        rawHex[3] +
        rawHex[3];
    }

    // standard 6 chars
    const baseHex = '#' + rawHex.slice(0, 6);
    const rgb = hexToRgb(baseHex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return {
      hex: baseHex,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      isValid: true,
    };
  }

  // 3. Check RGB/RGBA
  const rgbMatch = clean.match(/^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/i);
  if (rgbMatch) {
    const r = Math.min(255, parseInt(rgbMatch[1], 10));
    const g = Math.min(255, parseInt(rgbMatch[2], 10));
    const b = Math.min(255, parseInt(rgbMatch[3], 10));
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    return {
      hex,
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      isValid: true,
    };
  }

  // 4. Check HSL/HSLA
  const hslMatch = clean.match(/^hsla?\(\s*(\d{1,3}(?:\.\d+)?)\s*[, ]\s*(\d{1,3})%?\s*[, ]\s*(\d{1,3})%?/i);
  if (hslMatch) {
    const h = Math.round(parseFloat(hslMatch[1]) % 360);
    const s = Math.min(100, parseInt(hslMatch[2], 10));
    const l = Math.min(100, parseInt(hslMatch[3], 10));
    const rgb = hslToRgb(h, s, l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    return {
      hex,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${h}, ${s}%, ${l}%)`,
      isValid: true,
    };
  }

  return {
    hex: '#000000',
    rgb: 'rgb(0, 0, 0)',
    hsl: 'hsl(0, 0%, 0%)',
    isValid: false,
  };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
}

export function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  const ratio = (brightest + 0.05) / (darkest + 0.05);
  return Math.round(ratio * 100) / 100;
}

export function classifyColorRole(
  name: string,
  role?: string
): {
  paletteGroup: 'brand' | 'neutral' | 'semantic' | 'accent' | 'surface' | 'other';
  detectedRole: string;
} {
  const lower = (name + ' ' + (role || '')).toLowerCase();

  if (lower.includes('primary') || lower.includes('brand') || lower.includes('main')) {
    return { paletteGroup: 'brand', detectedRole: 'Primary Brand' };
  }
  if (lower.includes('secondary')) {
    return { paletteGroup: 'brand', detectedRole: 'Secondary' };
  }
  if (lower.includes('accent') || lower.includes('highlight') || lower.includes('cta')) {
    return { paletteGroup: 'accent', detectedRole: 'Accent' };
  }
  if (lower.includes('surface') || lower.includes('card') || lower.includes('panel')) {
    return { paletteGroup: 'surface', detectedRole: 'Surface' };
  }
  if (lower.includes('bg') || lower.includes('background') || lower.includes('canvas')) {
    return { paletteGroup: 'surface', detectedRole: 'Background' };
  }
  if (lower.includes('text') || lower.includes('foreground') || lower.includes('font')) {
    return { paletteGroup: 'neutral', detectedRole: 'Text' };
  }
  if (lower.includes('border') || lower.includes('divider') || lower.includes('stroke')) {
    return { paletteGroup: 'neutral', detectedRole: 'Border' };
  }
  if (
    lower.includes('gray') ||
    lower.includes('neutral') ||
    lower.includes('slate') ||
    lower.includes('zinc') ||
    lower.includes('muted')
  ) {
    return { paletteGroup: 'neutral', detectedRole: 'Neutral' };
  }
  if (
    lower.includes('success') ||
    lower.includes('green') ||
    lower.includes('valid') ||
    lower.includes('passed')
  ) {
    return { paletteGroup: 'semantic', detectedRole: 'Success' };
  }
  if (
    lower.includes('error') ||
    lower.includes('danger') ||
    lower.includes('destructive') ||
    lower.includes('red') ||
    lower.includes('alert')
  ) {
    return { paletteGroup: 'semantic', detectedRole: 'Destructive' };
  }
  if (lower.includes('warn') || lower.includes('yellow') || lower.includes('amber')) {
    return { paletteGroup: 'semantic', detectedRole: 'Warning' };
  }
  if (lower.includes('info') || lower.includes('cyan') || lower.includes('blue')) {
    return { paletteGroup: 'semantic', detectedRole: 'Info' };
  }

  return { paletteGroup: 'other', detectedRole: role || 'Custom' };
}
