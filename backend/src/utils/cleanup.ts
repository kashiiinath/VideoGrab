import fs from 'fs';
import path from 'path';
import { getAllJobs, updateJob } from '../db';

const TEMP_DIR = path.join(process.cwd(), 'temp');

export function getTempDir(): string {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  return TEMP_DIR;
}

export async function cleanupExpiredFiles(): Promise<void> {
  const now = Date.now();
  const jobs = getAllJobs();

  for (const job of jobs) {
    if (job.expiresAt && job.expiresAt < now && job.tempFilePath) {
      try {
        if (fs.existsSync(job.tempFilePath)) {
          fs.unlinkSync(job.tempFilePath);
          console.log(`🧹 Cleaned up temp file: ${job.tempFilePath}`);
        }
      } catch (err) {
        console.error(`Failed to delete temp file for job ${job.id}:`, err);
      }
      updateJob(job.id, { tempFilePath: undefined, downloadUrl: undefined });
    }
  }

  // Clean orphaned temp files older than 2 hours
  if (fs.existsSync(TEMP_DIR)) {
    const files = fs.readdirSync(TEMP_DIR);
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.mtimeMs < twoHoursAgo) {
          fs.unlinkSync(filePath);
          console.log(`🧹 Cleaned orphaned file: ${filePath}`);
        }
      } catch { /* ignore */ }
    }
  }
}

export function deleteTempFile(filePath: string): void {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('Failed to delete temp file:', err);
  }
}
