import axios from 'axios';
import { VideoMetadata, DownloadJob, HistoryEntry, SupportedSource } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
});

// ── Analyze ──────────────────────────────────────────────

export async function analyzeUrl(url: string): Promise<VideoMetadata> {
  const res = await api.post('/analyze', { url });
  return res.data.data as VideoMetadata;
}

let _cachedSources: SupportedSource[] | null = null;

export async function getSupportedSources(): Promise<SupportedSource[]> {
  if (_cachedSources && _cachedSources.length > 0) {
    return _cachedSources;
  }
  try {
    const res = await api.get('/analyze/sources');
    _cachedSources = res.data.data as SupportedSource[];
    return _cachedSources;
  } catch {
    if (_cachedSources) return _cachedSources;
    return [
      { name: 'YouTube', description: 'Videos & Audio', examples: [] },
      { name: 'Instagram', description: 'Reels & Clips', examples: [] },
      { name: 'Twitter / X', description: 'Video Tweets', examples: [] },
      { name: 'TikTok', description: 'HD Videos', examples: [] },
      { name: 'Facebook', description: 'Public Videos', examples: [] },
      { name: 'Vimeo', description: 'Public Videos', examples: [] },
    ];
  }
}

// ── Downloads ────────────────────────────────────────────

export async function createDownload(params: {
  url: string;
  title?: string;
  thumbnail?: string;
  sourceDomain?: string;
  format?: string;
  quality?: string;
  mimeType?: string;
  fileSize?: number;
  formatUrl: string;
}): Promise<{ id: string; filename: string; status: string }> {
  const res = await api.post('/downloads', params);
  return res.data.data;
}

export async function getDownloads(): Promise<DownloadJob[]> {
  const res = await api.get('/downloads');
  return res.data.data as DownloadJob[];
}

export async function getDownload(id: string): Promise<DownloadJob> {
  const res = await api.get(`/downloads/${id}`);
  return res.data.data as DownloadJob;
}

export async function deleteDownload(id: string): Promise<void> {
  await api.delete(`/downloads/${id}`);
}

export async function cancelDownload(id: string): Promise<void> {
  await api.post(`/downloads/${id}/cancel`);
}

export async function completeDownload(id: string, fileSize?: number): Promise<void> {
  await api.post(`/downloads/${id}/complete`, { fileSize });
}

export async function failDownload(id: string, error: string): Promise<void> {
  await api.post(`/downloads/${id}/fail`, { error });
}

// ── History ──────────────────────────────────────────────

export async function getHistory(params?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: HistoryEntry[]; total: number }> {
  const res = await api.get('/history', { params });
  return { data: res.data.data as HistoryEntry[], total: res.data.total };
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  await api.delete(`/history/${id}`);
}

export async function clearHistory(): Promise<void> {
  await api.delete('/history');
}

// ── Stream proxy URL builder ──────────────────────────────

export function buildProxyUrl(formatUrl: string, filename: string): string {
  const params = new URLSearchParams({ url: formatUrl, filename });
  return `${BASE_URL}/stream/proxy?${params.toString()}`;
}

// ── Helpers ──────────────────────────────────────────────

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return 'Unknown size';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 429) {
      return 'Rate limit reached. Please wait a few seconds before trying again.';
    }
    return err.response?.data?.error || err.message;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
}
