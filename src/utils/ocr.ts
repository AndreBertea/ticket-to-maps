/**
 * OCR utilities using Tesseract.js
 * - initOcr(): loads worker with eng + fra
 * - recognize(): preprocess image to grayscale/contrast and return raw text
 */
import { createWorker, ImageLike } from 'tesseract.js';

let worker: ReturnType<typeof createWorker> | null = null;
let initializing = false;

export async function initOcr() {
  if (worker) return;
  if (initializing) {
    // Wait if another call is already initializing
    while (initializing) await new Promise((r) => setTimeout(r, 100));
    return;
  }
  initializing = true;
  try {
    // Avoid passing a logger function to prevent structured-clone errors in some bundlers
    worker = await createWorker();
    await worker.loadLanguage('eng+fra');
    await worker.initialize('eng+fra');
    await worker.setParameters({
      // Improve consistency; tesseract likes knowing a DPI
      user_defined_dpi: '150',
      preserve_interword_spaces: '1',
    } as any);
  } finally {
    initializing = false;
  }
}

type PreprocessOptions = { maxWidth?: number; contrast?: number; threshold?: number; brightness?: number };

async function preprocess(input: Blob | HTMLImageElement, opts: PreprocessOptions = {}): Promise<HTMLCanvasElement> {
  const maxWidth = opts.maxWidth ?? 1600;
  const contrast = opts.contrast ?? 1.35; // 1.3–1.6 works well
  const threshold = opts.threshold ?? 140; // tweak 130–160 depending on lighting
  const brightness = opts.brightness ?? 1.1;

  let bitmap: ImageBitmap;
  if (input instanceof HTMLImageElement) {
    // createImageBitmap supports HTMLImageElement in modern browsers
    bitmap = await createImageBitmap(input);
  } else {
    bitmap = await createImageBitmap(input);
  }

  const scale = Math.min(1, maxWidth / Math.max(1, bitmap.width));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(bitmap, 0, 0, w, h);

  // Pixel processing: grayscale + contrast boost + simple threshold (binarization)
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const midpoint = 128;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    // brightness + contrast
    const bright = gray * brightness;
    const boosted = midpoint + (bright - midpoint) * contrast;
    const v = boosted < threshold ? 0 : 255;
    d[i] = d[i + 1] = d[i + 2] = v;
    // alpha kept
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export type OcrDetailed = { digits: string; text: string; raw: string };

export async function recognizeDetailed(imageOrBlob: Blob | HTMLImageElement, opts?: PreprocessOptions): Promise<OcrDetailed> {
  await initOcr();
  if (!worker) throw new Error('OCR worker not initialized');

  // Preprocess image aggressively for handwriting on colored paper
  const canvas = await preprocess(imageOrBlob, opts);

  // Pass 1: digits focused (phone/time); sparse layout
  await worker.initialize('eng');
  await worker.setParameters({
    tessedit_pageseg_mode: '11',
    tessedit_char_whitelist: '+0123456789: hH',
  } as any);
  const p1 = await worker.recognize((canvas as unknown) as ImageLike);
  const digits = (p1.data.text || '').trim();

  // Pass 2: free text (address/city/notes)
  await worker.initialize('eng+fra');
  await worker.setParameters({
    tessedit_pageseg_mode: '6',
  } as any);
  const p2 = await worker.recognize((canvas as unknown) as ImageLike);
  const text = (p2.data.text || '').trim();

  const raw = [digits, text].filter(Boolean).join('\n');
  return { digits, text, raw };
}

export async function recognize(imageOrBlob: Blob | HTMLImageElement): Promise<string> {
  const res = await recognizeDetailed(imageOrBlob);
  return res.raw;
}
