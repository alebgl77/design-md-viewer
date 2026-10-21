export const IMPORT_LIMITS = {
  files: 20,
  textBytes: 2 * 1024 * 1024,
  binaryBytes: 10 * 1024 * 1024,
  totalBytes: 20 * 1024 * 1024,
  outputBytes: 24 * 1024 * 1024,
  sourceOutputBytes: 2 * 1024 * 1024,
  jsonDepth: 32,
  jsonNodes: 10_000,
  declarations: 5_000,
  pdfPages: 25,
  imageDimension: 8_192,
  imagePixels: 16_777_216,
} as const;

export function byteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

export function checkBatch(sizes: number[]): void {
  if (sizes.length === 0) throw new Error('Choose at least one supported source file or paste design text.');
  if (sizes.length > IMPORT_LIMITS.files) {
    throw new Error(`Import at most ${IMPORT_LIMITS.files} files at a time.`);
  }
  if (sizes.some(size => !Number.isFinite(size) || size < 0)) {
    throw new Error('A source reports an invalid file size. Select the files again.');
  }
  if (sizes.reduce((sum, size) => sum + size, 0) > IMPORT_LIMITS.totalBytes) {
    throw new Error('The selected sources exceed the 20 MiB total limit. Import a smaller batch.');
  }
}

export function extension(name: string): string {
  return name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '';
}
