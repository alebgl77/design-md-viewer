import { hexToRgb, rgbToHex } from './colorNormalizer';

export type ColorVisionMode = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

/**
 * Simulates Color Vision Deficiency (CVD) using standard Brettel/Viénot color transformation matrices.
 */
export function simulateColorVision(hex: string, mode: ColorVisionMode): string {
  if (mode === 'normal') return hex;

  const { r, g, b } = hexToRgb(hex);

  // Normalize 0..1
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  let rSim = rNorm;
  let gSim = gNorm;
  let bSim = bNorm;

  switch (mode) {
    case 'protanopia': // Red-blind
      rSim = 0.56667 * rNorm + 0.43333 * gNorm + 0.0 * bNorm;
      gSim = 0.55833 * rNorm + 0.44167 * gNorm + 0.0 * bNorm;
      bSim = 0.0 * rNorm + 0.24167 * gNorm + 0.75833 * bNorm;
      break;

    case 'deuteranopia': // Green-blind
      rSim = 0.625 * rNorm + 0.375 * gNorm + 0.0 * bNorm;
      gSim = 0.7 * rNorm + 0.3 * gNorm + 0.0 * bNorm;
      bSim = 0.0 * rNorm + 0.3 * gNorm + 0.7 * bNorm;
      break;

    case 'tritanopia': // Blue-blind
      rSim = 0.95 * rNorm + 0.05 * gNorm + 0.0 * bNorm;
      gSim = 0.0 * rNorm + 0.43333 * gNorm + 0.56667 * bNorm;
      bSim = 0.0 * rNorm + 0.475 * gNorm + 0.525 * bNorm;
      break;

    case 'achromatopsia': {
      // Monochromacy / Grayscale
      const gray = 0.299 * rNorm + 0.587 * gNorm + 0.114 * bNorm;
      rSim = gray;
      gSim = gray;
      bSim = gray;
      break;
    }
  }

  const rFinal = Math.max(0, Math.min(255, Math.round(rSim * 255)));
  const gFinal = Math.max(0, Math.min(255, Math.round(gSim * 255)));
  const bFinal = Math.max(0, Math.min(255, Math.round(bSim * 255)));

  return rgbToHex(rFinal, gFinal, bFinal);
}
