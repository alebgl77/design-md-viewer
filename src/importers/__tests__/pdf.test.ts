import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pdfMocks = vi.hoisted(() => ({ getDocument: vi.fn(), createWorker: vi.fn() }));
vi.mock('pdfjs-dist', () => ({
  getDocument: pdfMocks.getDocument,
  PDFWorker: { create: pdfMocks.createWorker },
}));
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '/assets/local-pdf.worker.mjs' }));
import { adaptPdf } from '../pdf';
import { IMPORT_LIMITS } from '../limits';

const bytes = () => new TextEncoder().encode('%PDF-1.7\n');
let terminate: ReturnType<typeof vi.fn>;
let destroy: ReturnType<typeof vi.fn>;
let workerDestroy: ReturnType<typeof vi.fn>;
let workerListeners: Map<string, () => void>;

function documentFixture(text = 'Design notes', count = 1) {
  const cleanup = vi.fn();
  const cancel = vi.fn(async () => undefined);
  const releaseLock = vi.fn();
  const getPage = vi.fn(async () => {
    let read = false;
    return {
      cleanup,
      streamTextContent: () => ({
        getReader: () => ({
          read: vi.fn(async () => {
            if (read) return { done: true };
            read = true;
            return { done: false, value: { items: [{ str: text, hasEOL: true }] } };
          }),
          cancel,
          releaseLock,
        }),
      }),
    };
  });
  return { document: { numPages: count, getPage }, cleanup, cancel, releaseLock, getPage };
}

beforeEach(() => {
  terminate = vi.fn();
  destroy = vi.fn(async () => undefined);
  workerDestroy = vi.fn();
  workerListeners = new Map();
  vi.stubGlobal(
    'Worker',
    class {
      terminate = terminate;
      addEventListener = vi.fn((name: string, callback: () => void) => workerListeners.set(name, callback));
      removeEventListener = vi.fn((name: string) => workerListeners.delete(name));
    }
  );
  pdfMocks.createWorker.mockReturnValue({ destroy: workerDestroy });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('local PDF reader', () => {
  it('uses only supplied bytes and local worker, escapes text, and releases all resources', async () => {
    const fixture = documentFixture('<script>alert(1)</script>\n```');
    pdfMocks.getDocument.mockReturnValue({ promise: Promise.resolve(fixture.document), destroy });
    const result = await adaptPdf(bytes());
    expect(pdfMocks.getDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.any(Uint8Array),
        useWorkerFetch: false,
        useWasm: false,
        disableFontFace: true,
        useSystemFonts: false,
        enableXfa: false,
        disableAutoFetch: true,
      })
    );
    expect(pdfMocks.getDocument.mock.calls[0][0]).not.toHaveProperty('url');
    expect(result.markdown).not.toContain('<script>');
    expect(result.markdown).toContain('&#96;&#96;&#96;');
    expect(fixture.cleanup).toHaveBeenCalledOnce();
    expect(fixture.releaseLock).toHaveBeenCalledOnce();
    expect(destroy).toHaveBeenCalledOnce();
    expect(workerDestroy).toHaveBeenCalledOnce();
    expect(terminate).toHaveBeenCalledOnce();
  });

  it('limits extraction to 25 pages and describes scanned/image-only PDFs', async () => {
    const fixture = documentFixture('', 26);
    pdfMocks.getDocument.mockReturnValue({ promise: Promise.resolve(fixture.document), destroy });
    const result = await adaptPdf(bytes());
    expect(fixture.getPage).toHaveBeenCalledTimes(25);
    expect(result.warnings.join(' ')).toMatch(/first 25 of 26/);
    expect(result.warnings.join(' ')).toMatch(/scanned or image-only/);
    expect(result.markdown).toBe('');
  });

  it('cancels the text stream at the output limit with a partial extraction warning', async () => {
    const fixture = documentFixture('<'.repeat(IMPORT_LIMITS.sourceOutputBytes), 2);
    pdfMocks.getDocument.mockReturnValue({ promise: Promise.resolve(fixture.document), destroy });
    const result = await adaptPdf(bytes());
    expect(fixture.getPage).toHaveBeenCalledOnce();
    expect(fixture.cancel).toHaveBeenCalledOnce();
    expect(new TextEncoder().encode(result.markdown).byteLength).toBeLessThan(
      IMPORT_LIMITS.sourceOutputBytes
    );
    expect(result.warnings.join(' ')).toMatch(/document is partial/);
  });

  it('reports missing worker support and corrupt PDF bytes before loading', async () => {
    await expect(adaptPdf(new Uint8Array([1, 2, 3]))).rejects.toThrow(/PDF header/);
    vi.stubGlobal('Worker', undefined);
    await expect(adaptPdf(bytes())).rejects.toThrow(/module worker support/);
    expect(pdfMocks.getDocument).not.toHaveBeenCalled();
  });

  it('cleans up after synchronous initialization or asynchronous reader failures', async () => {
    pdfMocks.getDocument.mockImplementationOnce(() => {
      throw new Error('invalid');
    });
    await expect(adaptPdf(bytes())).rejects.toThrow(/could not be extracted/);
    expect(terminate).toHaveBeenCalledOnce();
    pdfMocks.getDocument.mockReturnValue({ promise: Promise.reject(new Error('invalid')), destroy });
    await expect(adaptPdf(bytes())).rejects.toThrow(/could not be extracted/);
    expect(destroy).toHaveBeenCalledOnce();
    expect(workerDestroy).toHaveBeenCalledTimes(2);
    expect(terminate).toHaveBeenCalledTimes(2);
  });

  it('times out a stuck reader and destroys the task and worker', async () => {
    vi.useFakeTimers();
    let rejectTask: (error: Error) => void = () => undefined;
    const promise = new Promise((_resolve, reject) => {
      rejectTask = reject;
    });
    destroy.mockImplementation(async () => {
      rejectTask(new Error('destroyed'));
    });
    pdfMocks.getDocument.mockReturnValue({ promise, destroy });
    const result = adaptPdf(bytes());
    const assertion = expect(result).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(30_000);
    await assertion;
    expect(terminate).toHaveBeenCalled();
    expect(workerDestroy).toHaveBeenCalledOnce();
  });

  it('rejects on timeout even when PDF.js loading and cleanup never settle', async () => {
    vi.useFakeTimers();
    destroy.mockReturnValue(new Promise(() => undefined));
    pdfMocks.getDocument.mockReturnValue({ promise: new Promise(() => undefined), destroy });
    const assertion = expect(adaptPdf(bytes())).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(30_500);
    await assertion;
    expect(workerDestroy).toHaveBeenCalledOnce();
    expect(terminate).toHaveBeenCalled();
  });

  it('rejects promptly when the local module worker fails', async () => {
    pdfMocks.getDocument.mockReturnValue({ promise: new Promise(() => undefined), destroy });
    const assertion = expect(adaptPdf(bytes())).rejects.toThrow(/local PDF worker could not load/);
    workerListeners.get('error')?.();
    await assertion;
    expect(workerDestroy).toHaveBeenCalledOnce();
    expect(workerListeners.size).toBe(0);
  });
});
