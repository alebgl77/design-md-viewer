import { IMPORT_LIMITS } from './limits';
import { table } from './markdown';
import type { AdaptedSource } from './types';

interface RasterInfo {
  width: number;
  height: number;
  mime: string;
}

/** Inspect magic bytes and dimensions before a browser decoder sees untrusted bytes. */
export function inspectRaster(bytes: Uint8Array): RasterInfo {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.subarray(start, start + length));
  let info: RasterInfo | undefined;
  if (bytes.length >= 24 && bytes[0] === 137 && ascii(1, 7) === 'PNG\r\n\x1a\n' && ascii(12, 4) === 'IHDR') {
    info = { width: view.getUint32(16), height: view.getUint32(20), mime: 'image/png' };
  } else if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset] !== 0xff) break;
      const marker = bytes[offset + 1];
      if (marker === 0xff) {
        offset++;
        continue;
      }
      if (marker === 0xd9 || marker === 0xda) break;
      const length = view.getUint16(offset + 2);
      if (length < 2 || offset + 2 + length > bytes.length) break;
      if (
        [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) &&
        length >= 7
      ) {
        info = { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7), mime: 'image/jpeg' };
        break;
      }
      offset += length + 2;
    }
  } else if (bytes.length >= 30 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    const kind = ascii(12, 4);
    const uint24 = (offset: number) => bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
    if (kind === 'VP8X') {
      if (bytes[20] & 2)
        throw new Error('Animated WebP is not supported. Export one static frame as PNG or JPEG.');
      info = { width: uint24(24) + 1, height: uint24(27) + 1, mime: 'image/webp' };
    } else if (kind === 'VP8L' && bytes[20] === 0x2f) {
      const packed = view.getUint32(21, true);
      info = { width: (packed & 0x3fff) + 1, height: ((packed >>> 14) & 0x3fff) + 1, mime: 'image/webp' };
    } else if (kind === 'VP8 ' && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
      info = {
        width: view.getUint16(26, true) & 0x3fff,
        height: view.getUint16(28, true) & 0x3fff,
        mime: 'image/webp',
      };
    }
  }
  if (!info)
    throw new Error(
      'The file is not a valid supported PNG, JPEG or WebP image. Renaming another format does not convert it.'
    );
  validateDimensions(info.width, info.height);
  return info;
}

function validateDimensions(width: number, height: number): void {
  if (
    width <= 0 ||
    height <= 0 ||
    width > IMPORT_LIMITS.imageDimension ||
    height > IMPORT_LIMITS.imageDimension ||
    width * height > IMPORT_LIMITS.imagePixels
  ) {
    throw new Error(
      'Image dimensions exceed the limit (8192 per side, 16 megapixels). Resize the image before importing.'
    );
  }
}

/** Quantized, alpha-weighted palette; samples never imply font, spacing or layout measurements. */
export function quantizePalette(pixels: Uint8ClampedArray, count = 12): { hex: string; share: number }[] {
  const buckets = new Map<number, { r: number; g: number; b: number; weight: number }>();
  let total = 0;
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] < 32) continue;
    const weight = pixels[i + 3] / 255;
    const key = (pixels[i] >> 4) * 256 + (pixels[i + 1] >> 4) * 16 + (pixels[i + 2] >> 4);
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, weight: 0 };
    bucket.r += pixels[i] * weight;
    bucket.g += pixels[i + 1] * weight;
    bucket.b += pixels[i + 2] * weight;
    bucket.weight += weight;
    total += weight;
    buckets.set(key, bucket);
  }
  return [...buckets.values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, count)
    .map(bucket => ({
      hex: `#${[bucket.r, bucket.g, bucket.b]
        .map(channel =>
          Math.round(channel / bucket.weight)
            .toString(16)
            .padStart(2, '0')
        )
        .join('')}`,
      share: bucket.weight / total,
    }));
}

export async function adaptImage(bytes: Uint8Array): Promise<AdaptedSource> {
  const info = inspectRaster(bytes);
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    throw new Error(
      'Image palette extraction is unavailable in this browser. Use a current browser or supply CSS/JSON colors.'
    );
  }
  const scale = Math.min(1, 128 / Math.max(info.width, info.height));
  const width = Math.max(1, Math.round(info.width * scale));
  const height = Math.max(1, Math.round(info.height * scale));
  const blob = new Blob([new Uint8Array(bytes)], { type: info.mime });
  let bitmap: ImageBitmap | undefined;
  const canvas = document.createElement('canvas');
  try {
    bitmap = await createImageBitmap(blob, {
      resizeWidth: width,
      resizeHeight: height,
      resizeQuality: 'high',
    });
    validateDimensions(bitmap.width, bitmap.height);
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Canvas palette extraction is unavailable in this browser.');
    context.drawImage(bitmap, 0, 0, width, height);
    const palette = quantizePalette(context.getImageData(0, 0, width, height).data);
    const warnings = [
      'Colors are a quantized pixel sample, not declared design tokens. No fonts, layout, spacing, semantics or OCR were inferred.',
    ];
    if (!palette.length)
      warnings.push('The image contains no sufficiently opaque pixels; no colors were inferred.');
    return {
      format: 'Image palette',
      markdown: table(
        'Sampled image colors',
        ['Name', 'Color', 'Sample share'],
        palette.map((entry, i) => [`Sample ${i + 1}`, entry.hex, `${(entry.share * 100).toFixed(1)}%`])
      ),
      warnings,
    };
  } catch (error) {
    throw Object.assign(
      new Error(
        error instanceof Error
          ? `Image palette extraction failed: ${error.message}`
          : 'Image decoding failed. Export a valid PNG, JPEG or static WebP and retry.'
      ),
      { cause: error }
    );
  } finally {
    bitmap?.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}
