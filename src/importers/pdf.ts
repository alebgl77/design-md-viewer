import { getDocument, PDFWorker } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { byteLength, IMPORT_LIMITS } from './limits';
import { inertText } from './markdown';
import type { AdaptedSource } from './types';

/** Lazy-loaded by importFiles. The worker is a bundled same-origin asset, never a CDN. */
export async function adaptPdf(bytes: Uint8Array): Promise<AdaptedSource> {
  if (String.fromCharCode(...bytes.subarray(0, 5)) !== '%PDF-')
    throw new Error('The file does not have a PDF header. Export a valid PDF and retry.');
  if (typeof Worker === 'undefined')
    throw new Error('PDF text extraction requires a browser with module worker support.');
  const port = new Worker(workerUrl, { type: 'module', name: 'local-pdf-text-import' });
  let worker: ReturnType<typeof PDFWorker.create> | undefined;
  let task: ReturnType<typeof getDocument> | undefined;
  const warnings = [
    'PDF extraction reads embedded text only. Images, visual layout, fonts and scanned pages are not analyzed; no OCR is performed.',
  ];
  const pages: string[] = [];
  let outputBytes = 0;
  let timedOut = false;
  let workerFailed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectInterrupted: (error: Error) => void = () => undefined;
  const interrupted = new Promise<never>((_resolve, reject) => {
    rejectInterrupted = reject;
  });
  const bounded = <T>(promise: Promise<T>) => Promise.race([promise, interrupted]);
  const workerError = () => {
    workerFailed = true;
    rejectInterrupted(new Error('PDF module worker failed to load.'));
  };
  port.addEventListener('error', workerError);
  port.addEventListener('messageerror', workerError);
  try {
    worker = PDFWorker.create({ port });
    task = getDocument({
      data: bytes,
      worker,
      useWorkerFetch: false,
      useWasm: false,
      useSystemFonts: false,
      disableFontFace: true,
      enableXfa: false,
      isOffscreenCanvasSupported: false,
      isImageDecoderSupported: false,
      maxImageSize: 0,
      disableAutoFetch: true,
      disableRange: true,
      disableStream: true,
      verbosity: 0,
    });
    timer = setTimeout(() => {
      timedOut = true;
      rejectInterrupted(new Error('PDF extraction timed out.'));
      void Promise.resolve()
        .then(() => task?.destroy())
        .catch(() => undefined);
      port.terminate();
    }, 30_000);
    const pdf = await bounded(task.promise);
    if (pdf.numPages > IMPORT_LIMITS.pdfPages)
      warnings.push(
        `Only the first ${IMPORT_LIMITS.pdfPages} of ${pdf.numPages} PDF pages were inspected; extraction is partial.`
      );
    let limited = false;
    for (let number = 1; number <= Math.min(pdf.numPages, IMPORT_LIMITS.pdfPages); number++) {
      const page = await bounded(pdf.getPage(number));
      const reader = page.streamTextContent().getReader();
      const chunks: string[] = [];
      try {
        while (true) {
          const { done, value } = await bounded(reader.read());
          if (done) break;
          for (const item of value.items) {
            if (!('str' in item)) continue;
            const remaining = Math.max(0, IMPORT_LIMITS.sourceOutputBytes - 2_048 - outputBytes);
            let text = inertText(item.str);
            if (byteLength(text) > remaining) {
              text = new TextDecoder().decode(
                new TextEncoder().encode(text).subarray(0, Math.max(0, remaining - 4))
              );
              limited = true;
            }
            chunks.push(text, item.hasEOL ? '\n' : ' ');
            outputBytes += byteLength(text) + 1;
            if (limited || outputBytes >= IMPORT_LIMITS.sourceOutputBytes - 2_048) {
              limited = true;
              break;
            }
          }
          if (limited) {
            await bounded(reader.cancel());
            break;
          }
        }
      } finally {
        reader.releaseLock();
        page.cleanup();
      }
      const text = chunks.join('').trim();
      if (text) pages.push(`### PDF page ${number}\n\n${text}`);
      if (limited) break;
    }
    if (limited)
      warnings.push('PDF text exceeded the extraction size limit; the generated document is partial.');
    if (!pages.length)
      warnings.push(
        'No embedded text was found. This PDF may be scanned or image-only; provide OCR text or an original design document.'
      );
    return { format: 'PDF text', markdown: pages.join('\n\n'), warnings };
  } catch {
    throw new Error(
      timedOut
        ? 'PDF text extraction timed out. Import fewer pages or export a smaller PDF.'
        : workerFailed
          ? 'The local PDF worker could not load. Reload the app and retry in a browser with module worker support.'
          : 'PDF text could not be extracted. Check that the PDF is valid, unencrypted, and contains selectable text.'
    );
  } finally {
    clearTimeout(timer);
    port.removeEventListener('error', workerError);
    port.removeEventListener('messageerror', workerError);
    let cleanupTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        Promise.resolve()
          .then(() => task?.destroy())
          .catch(() => undefined),
        new Promise<void>(resolve => {
          cleanupTimer = setTimeout(resolve, 500);
        }),
      ]);
    } finally {
      clearTimeout(cleanupTimer);
      try {
        worker?.destroy();
      } finally {
        port.terminate();
      }
    }
  }
}
