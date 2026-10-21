import { afterEach, describe, expect, it, vi } from 'vitest';
import { importFiles, IMPORT_LIMITS } from '../index';
import { adaptImage, inspectRaster, quantizePalette } from '../image';
import { parseDesignDocument } from '../../parsers/pipeline';

function png(width = 2, height = 2): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  bytes.set([73, 72, 68, 82], 12);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return bytes;
}

function fakeFile(name: string, size: number, read = vi.fn(async () => new ArrayBuffer(0))): File {
  return { name, size, arrayBuffer: read } as unknown as File;
}

afterEach(() => vi.unstubAllGlobals());

describe('binary source validation and palette extraction', () => {
  it('accepts PNG, JPEG and WebP magic and inspects dimensions without decoding', () => {
    expect(inspectRaster(png())).toEqual({ width: 2, height: 2, mime: 'image/png' });
    expect(
      inspectRaster(new Uint8Array([255, 216, 255, 192, 0, 17, 8, 0, 2, 0, 3, 3, 1, 0, 0, 2, 0, 0, 3, 0, 0]))
    ).toEqual({ width: 3, height: 2, mime: 'image/jpeg' });
    const webp = new Uint8Array(30);
    webp.set(new TextEncoder().encode('RIFF'), 0);
    webp.set(new TextEncoder().encode('WEBPVP8X'), 8);
    webp[24] = 2;
    webp[27] = 1;
    expect(inspectRaster(webp)).toEqual({ width: 3, height: 2, mime: 'image/webp' });
    webp[20] = 2;
    expect(() => inspectRaster(webp)).toThrow(/Animated WebP/);
  });

  it('rejects disguised SVG and excessive dimensions before any image decoder is called', async () => {
    const decoder = vi.fn();
    vi.stubGlobal('createImageBitmap', decoder);
    await expect(
      adaptImage(new TextEncoder().encode('<svg><image href="https://evil.test"/></svg>'))
    ).rejects.toThrow(/not a valid supported/);
    await expect(adaptImage(png(9000, 1))).rejects.toThrow(/dimensions/);
    await expect(adaptImage(png(6000, 6000))).rejects.toThrow(/dimensions/);
    expect(decoder).not.toHaveBeenCalled();
  });

  it('uses a bounded quantized palette and ignores transparent pixels', () => {
    const palette = quantizePalette(
      new Uint8ClampedArray([255, 0, 0, 255, 250, 0, 0, 255, 0, 255, 0, 0, 0, 0, 255, 255])
    );
    expect(palette).toHaveLength(2);
    expect(palette[0].hex).toBe('#fd0000');
    expect(palette[0].share).toBeCloseTo(2 / 3);
    expect(quantizePalette(new Uint8ClampedArray([255, 0, 0, 0]))).toEqual([]);
  });

  it('closes the bitmap and releases canvas storage after successful extraction', async () => {
    const close = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        drawImage: vi.fn(),
        getImageData: () => ({ data: new Uint8ClampedArray([18, 52, 86, 255]) }),
      }),
    };
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 2, height: 2, close }))
    );
    vi.stubGlobal('document', { createElement: () => canvas });
    const result = await adaptImage(png());
    expect(parseDesignDocument(result.markdown).colors[0].hex).toBe('#123456');
    expect(result.warnings.join(' ')).toMatch(/No fonts, layout, spacing, semantics or OCR/);
    expect(close).toHaveBeenCalledOnce();
    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
  });

  it('cleans up after canvas failures and reports decoder failures clearly', async () => {
    const close = vi.fn();
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => null }) });
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 2, height: 2, close }))
    );
    await expect(adaptImage(png())).rejects.toThrow(/Canvas palette extraction/);
    expect(close).toHaveBeenCalledOnce();
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        throw new Error('corrupt image');
      })
    );
    await expect(adaptImage(png())).rejects.toThrow(/corrupt image/);
  });
});

describe('file batch reading', () => {
  it('rejects count and aggregate limits before any file is read', async () => {
    const read = vi.fn();
    await expect(importFiles(Array.from({ length: 21 }, () => fakeFile('a.md', 1, read)))).rejects.toThrow(
      /at most 20/
    );
    await expect(
      importFiles([
        fakeFile('a.pdf', IMPORT_LIMITS.binaryBytes + 1, read),
        fakeFile('b.pdf', IMPORT_LIMITS.binaryBytes, read),
      ])
    ).rejects.toThrow(/20 MiB total/);
    expect(read).not.toHaveBeenCalled();
  });

  it('checks per-file limits and unsupported extensions before reading, retaining good files', async () => {
    const read = vi.fn();
    const result = await importFiles([
      fakeFile('large.txt', IMPORT_LIMITS.textBytes + 1, read),
      fakeFile('large.pdf', IMPORT_LIMITS.binaryBytes + 1, read),
      fakeFile('archive.zip', 2, read),
      new File(['--color-brand:#123456;'], 'ok.css'),
    ]);
    expect(read).not.toHaveBeenCalled();
    expect(result.sources).toHaveLength(4);
    expect(result.sources[0].warnings[0]).toMatch(/2 MiB/);
    expect(result.sources[1].warnings[0]).toMatch(/10 MiB/);
    expect(result.sources[2].warnings[0]).toMatch(/Unsupported source/);
    expect(parseDesignDocument(result.markdown).colors[0].hex).toBe('#123456');
  });

  it('reports UTF-8 errors and reader failures without losing successful files', async () => {
    const result = await importFiles([
      new File([new Uint8Array([0xff])], 'invalid.txt'),
      fakeFile(
        'unreadable.css',
        1,
        vi.fn(async () => {
          throw new Error('File is unavailable');
        })
      ),
      new File(['# Valid'], 'valid.md'),
    ]);
    expect(result.sources).toHaveLength(3);
    expect(result.warnings.join(' ')).toMatch(/UTF-8/);
    expect(result.warnings.join(' ')).toMatch(/File is unavailable/);
  });

  it('checks actual read sizes and rejects a binary masquerading as a raster', async () => {
    await expect(
      importFiles([
        fakeFile(
          'oversize.txt',
          1,
          vi.fn(async () => new ArrayBuffer(IMPORT_LIMITS.textBytes + 1))
        ),
      ])
    ).rejects.toThrow(/Read content exceeds/);
    await expect(
      importFiles([new File(['<svg><image href="https://evil.test"/></svg>'], 'renamed.png')])
    ).rejects.toThrow(/not a valid supported/);
  });
});
