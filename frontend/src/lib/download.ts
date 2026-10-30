/**
 * Triggers a real browser download that saves the file to the user's device.
 * Uses the backend proxy endpoint which sets Content-Disposition: attachment.
 *
 * Always uses native anchor-tag download for maximum speed — the browser's
 * built-in C++ download engine is dramatically faster than JavaScript
 * chunk-by-chunk streaming via showSaveFilePicker / Streams API.
 */
import { buildProxyUrl, completeDownload, failDownload } from './api';

export interface DownloadOptions {
  jobId: string;
  formatUrl: string;
  filename: string;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

/**
 * Download via backend proxy using native browser download for maximum speed.
 */
export async function downloadViaProxy(options: DownloadOptions): Promise<void> {
  const { jobId, formatUrl, filename, onProgress, onComplete, onError } = options;
  const proxyUrl = buildProxyUrl(formatUrl, filename);

  try {
    await anchorDownload(proxyUrl, filename, jobId, onProgress, onComplete, onError);
  } catch (err: any) {
    const msg = err?.message || 'Download failed';
    onError?.(msg);
    await failDownload(jobId, msg).catch(() => {});
  }
}

async function anchorDownload(
  url: string,
  filename: string,
  jobId: string,
  onProgress?: (n: number) => void,
  onComplete?: () => void,
  onError?: (e: string) => void,
): Promise<void> {
  // The browser will use its own high-speed native download engine
  onProgress?.(10); // indicate we started

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // We can't track progress for anchor downloads, so mark complete after a short delay
  setTimeout(() => {
    onProgress?.(100);
    onComplete?.();
    completeDownload(jobId).catch(() => {});
  }, 1500);
}

/**
 * For direct URLs that don't need proxy (already have proper CORS + Content-Disposition).
 */
export function directAnchorDownload(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
