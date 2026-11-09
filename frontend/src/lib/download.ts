/**
 * Triggers a real browser download that saves the file to the user's device.
 * Uses the backend proxy endpoint which streams the audio/video file with Content-Disposition: attachment.
 * Supports Pause / Resume via AbortController, real-time speed tracking, and instant native file saving.
 */
import { buildProxyUrl, completeDownload, failDownload, formatBytes } from './api';

export interface ProgressInfo {
  percent: number;
  speed?: string;
  downloadedBytes?: number;
  totalBytes?: number;
}

export interface DownloadOptions {
  jobId: string;
  formatUrl: string;
  filename: string;
  onProgress?: (info: ProgressInfo) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  onPause?: () => void;
}

// Global registry of active download controllers for Pause/Resume
const activeControllers = new Map<string, AbortController>();
const pausedJobs = new Set<string>();

export function isJobActive(jobId: string): boolean {
  return activeControllers.has(jobId);
}

export function pauseDownloadJob(jobId: string): void {
  pausedJobs.add(jobId);
  const controller = activeControllers.get(jobId);
  if (controller) {
    try {
      controller.abort('paused');
    } catch {}
    activeControllers.delete(jobId);
  }
}

export function cancelDownloadJob(jobId: string): void {
  pausedJobs.delete(jobId);
  const controller = activeControllers.get(jobId);
  if (controller) {
    try {
      controller.abort('cancelled');
    } catch {}
    activeControllers.delete(jobId);
  }
}

export async function downloadViaProxy(options: DownloadOptions): Promise<void> {
  const { jobId, formatUrl, filename, onProgress, onComplete, onError, onPause } = options;
  const proxyUrl = buildProxyUrl(formatUrl, filename);

  // Register abort controller for pause / cancel
  const controller = new AbortController();
  activeControllers.set(jobId, controller);
  pausedJobs.delete(jobId);

  try {
    onProgress?.({ percent: 10, speed: 'Connecting…' });

    // Fetch stream from backend with progress tracking
    const res = await fetch(proxyUrl, { signal: controller.signal });
    if (!res.ok) {
      let errMsg = `Download failed with HTTP ${res.status}`;
      try {
        const json = await res.json();
        errMsg = json.error || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    const contentLengthHeader = res.headers.get('content-length');
    const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
    const contentType = res.headers.get('content-type') || 'application/octet-stream';

    let blob: Blob;

    if (res.body && totalBytes > 0) {
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;
      let lastTime = Date.now();
      let lastReceived = 0;
      let currentSpeed = 'Calculating…';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          receivedBytes += value.length;

          const now = Date.now();
          if (now - lastTime >= 500) {
            const timeDelta = (now - lastTime) / 1000;
            const bytesDelta = receivedBytes - lastReceived;
            if (timeDelta > 0) {
              currentSpeed = formatBytes(bytesDelta / timeDelta) + '/s';
            }
            lastTime = now;
            lastReceived = receivedBytes;
          }

          const pct = Math.min(95, Math.round(15 + (receivedBytes / totalBytes) * 80));
          onProgress?.({
            percent: pct,
            speed: currentSpeed,
            downloadedBytes: receivedBytes,
            totalBytes,
          });
        }
      }

      blob = new Blob(chunks as BlobPart[], { type: contentType });
    } else {
      onProgress?.({ percent: 50, speed: 'Processing stream…' });
      blob = await res.blob();
    }

    onProgress?.({ percent: 99, speed: 'Saving to device…' });

    // Save directly to user's device via native Blob URL
    saveBlobToDevice(blob, filename);

    activeControllers.delete(jobId);
    onProgress?.({ percent: 100, speed: 'Completed', downloadedBytes: blob.size, totalBytes: blob.size });
    onComplete?.();
    await completeDownload(jobId, blob.size).catch(() => {});
  } catch (err: any) {
    activeControllers.delete(jobId);

    // If download was intentionally paused by the user
    if (pausedJobs.has(jobId) || err?.name === 'AbortError' || err === 'paused') {
      pausedJobs.delete(jobId);
      onPause?.();
      return;
    }

    console.warn('[downloadViaProxy] Blob fetch failed, falling back to direct anchor:', err?.message);

    try {
      // Fallback: direct anchor download
      directAnchorDownload(proxyUrl, filename);
      onProgress?.({ percent: 100, speed: 'Completed' });
      onComplete?.();
      await completeDownload(jobId).catch(() => {});
    } catch (fallbackErr: any) {
      const msg = err?.message || fallbackErr?.message || 'Download failed';
      onError?.(msg);
      await failDownload(jobId, msg).catch(() => {});
    }
  }
}

/**
 * Triggers an instant download of a Blob file directly to the user's device.
 */
export function saveBlobToDevice(blob: Blob, filename: string): void {
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  }, 3000);
}

/**
 * For direct URLs that don't need proxy (already have proper CORS + Content-Disposition).
 */
export function directAnchorDownload(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
  }, 3000);
}
