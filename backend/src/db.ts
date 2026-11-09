/**
 * Simple JSON file-based database (no native deps needed).
 * Suitable for local development. Replace with a real DB for production.
 */
import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'data');
const JOBS_FILE = path.join(DB_DIR, 'jobs.json');
const HISTORY_FILE = path.join(DB_DIR, 'history.json');

export interface DownloadJob {
  id: string;
  url: string;
  title?: string;
  artist?: string;
  mediaType?: 'video' | 'music';
  thumbnail?: string;
  sourceDomain?: string;
  format?: string;
  quality?: string;
  mimeType?: string;
  fileSize?: number;
  filename?: string;
  status: 'pending' | 'ready' | 'processing' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  errorMessage?: string;
  tempFilePath?: string;
  downloadUrl?: string;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
}

export interface HistoryEntry {
  id: string;
  jobId: string;
  url: string;
  title?: string;
  artist?: string;
  mediaType?: 'video' | 'music';
  thumbnail?: string;
  sourceDomain?: string;
  format?: string;
  quality?: string;
  fileSize?: number;
  filename?: string;
  status: string;
  errorMessage?: string;
  createdAt: number;
  completedAt?: number;
}

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

function readFile<T>(filePath: string): T[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T[];
  } catch {
    return [];
  }
}

function writeFile<T>(filePath: string, data: T[]): void {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ────────────── Jobs ──────────────

export function getAllJobs(): DownloadJob[] {
  return readFile<DownloadJob>(JOBS_FILE).sort((a, b) => b.createdAt - a.createdAt);
}

export function getJob(id: string): DownloadJob | undefined {
  return readFile<DownloadJob>(JOBS_FILE).find(j => j.id === id);
}

export function createJob(job: DownloadJob): void {
  const jobs = readFile<DownloadJob>(JOBS_FILE);
  jobs.push(job);
  writeFile(JOBS_FILE, jobs);
}

export function updateJob(id: string, updates: Partial<DownloadJob>): void {
  const jobs = readFile<DownloadJob>(JOBS_FILE);
  const idx = jobs.findIndex(j => j.id === id);
  if (idx !== -1) {
    jobs[idx] = { ...jobs[idx], ...updates, updatedAt: Date.now() };
    writeFile(JOBS_FILE, jobs);
  }
}

export function deleteJob(id: string): void {
  const jobs = readFile<DownloadJob>(JOBS_FILE).filter(j => j.id !== id);
  writeFile(JOBS_FILE, jobs);
}

export function clearAllJobs(): void {
  writeFile<DownloadJob>(JOBS_FILE, []);
}

// ────────────── History ──────────────

export function getAllHistory(search?: string, status?: string, limit = 50, offset = 0): HistoryEntry[] {
  let items = readFile<HistoryEntry>(HISTORY_FILE).sort((a, b) => b.createdAt - a.createdAt);
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(i => i.title?.toLowerCase().includes(q) || i.url.toLowerCase().includes(q));
  }
  if (status) {
    items = items.filter(i => i.status === status);
  }
  return items.slice(offset, offset + limit);
}

export function getTotalHistory(): number {
  return readFile<HistoryEntry>(HISTORY_FILE).length;
}

export function createHistory(entry: HistoryEntry): void {
  const items = readFile<HistoryEntry>(HISTORY_FILE);
  items.push(entry);
  writeFile(HISTORY_FILE, items);
}

export function updateHistory(jobId: string, updates: Partial<HistoryEntry>): void {
  const items = readFile<HistoryEntry>(HISTORY_FILE);
  const idx = items.findIndex(i => i.jobId === jobId);
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...updates };
    writeFile(HISTORY_FILE, items);
  }
}

export function deleteHistory(id: string): void {
  const items = readFile<HistoryEntry>(HISTORY_FILE).filter(i => i.id !== id);
  writeFile(HISTORY_FILE, items);
}

export function clearHistory(): void {
  writeFile<HistoryEntry>(HISTORY_FILE, []);
}

export async function initDatabase(): Promise<void> {
  ensureDir();
  // Ensure files exist
  if (!fs.existsSync(JOBS_FILE)) writeFile<DownloadJob>(JOBS_FILE, []);
  if (!fs.existsSync(HISTORY_FILE)) writeFile<HistoryEntry>(HISTORY_FILE, []);
  console.log('✅ Database initialized at', DB_DIR);
}
