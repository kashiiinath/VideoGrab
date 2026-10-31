import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';

// ffmpeg-static provides a bundled ffmpeg binary
let ffmpegPath: string | null = null;
try {
  ffmpegPath = require('ffmpeg-static');
} catch {
  // ffmpeg-static not installed — yt-dlp will try system ffmpeg
}

/**
 * Resolve a command name to its full path on the system.
 * Works on both Windows and Linux. Returns null if not found.
 */
function resolveCommand(cmd: string): string | null {
  try {
    if (process.platform === 'win32') {
      const result = execSync(`where ${cmd}`, { encoding: 'utf-8', timeout: 5000 }).trim();
      return result.split('\n')[0].trim() || null;
    } else {
      const result = execSync(`which ${cmd}`, { encoding: 'utf-8', timeout: 5000 }).trim();
      return result || null;
    }
  } catch {
    return null;
  }
}

// Cache resolved paths to avoid calling which/where repeatedly
let _ytdlpPath: string | null = null;
let _ffmpegPath: string | null = null;
let _nodePath: string | null = null;
let _ytdlpAvailable: boolean | null = null;

export function getYtDlpPath(): string {
  if (_ytdlpPath) return _ytdlpPath;

  if (process.platform === 'win32') {
    // Check local bin directories first (for development)
    const localBin = path.join(process.cwd(), 'bin', 'yt-dlp.exe');
    if (fs.existsSync(localBin)) { _ytdlpPath = localBin; return localBin; }

    const backendBin = path.join('D:', 'VideoDownloader', 'backend', 'bin', 'yt-dlp.exe');
    if (fs.existsSync(backendBin)) { _ytdlpPath = backendBin; return backendBin; }

    const uvBin = 'C:\\Users\\Hp\\AppData\\Roaming\\uv\\python\\cpython-3.12-windows-x86_64-none\\Scripts\\yt-dlp.exe';
    if (fs.existsSync(uvBin)) { _ytdlpPath = uvBin; return uvBin; }
  } else {
    // Linux/Docker: check common paths
    const commonPaths = ['/usr/local/bin/yt-dlp', '/usr/bin/yt-dlp'];
    for (const p of commonPaths) {
      if (fs.existsSync(p)) { _ytdlpPath = p; return p; }
    }
  }

  // Fallback: resolve via PATH
  const resolved = resolveCommand('yt-dlp');
  if (resolved) { _ytdlpPath = resolved; return resolved; }

  // Last resort: return bare command name (spawn will search PATH)
  return 'yt-dlp';
}

function getNodePath(): string | null {
  if (_nodePath !== null) return _nodePath || null;

  if (process.platform === 'win32') {
    const winPath = 'C:\\Program Files\\nodejs\\node.exe';
    if (fs.existsSync(winPath)) { _nodePath = winPath; return winPath; }
  } else {
    // Linux/Docker: check common paths
    const commonPaths = ['/usr/local/bin/node', '/usr/bin/node'];
    for (const p of commonPaths) {
      if (fs.existsSync(p)) { _nodePath = p; return p; }
    }
  }

  const resolved = resolveCommand('node');
  if (resolved) { _nodePath = resolved; return resolved; }

  _nodePath = '';
  return null;
}

function getFfmpegPath(): string | null {
  if (_ffmpegPath !== null) return _ffmpegPath || null;

  if (process.platform === 'win32') {
    const localBin = path.join(process.cwd(), 'bin', 'ffmpeg.exe');
    if (fs.existsSync(localBin)) { _ffmpegPath = localBin; return localBin; }

    const backendBin = path.join('D:', 'VideoDownloader', 'backend', 'bin', 'ffmpeg.exe');
    if (fs.existsSync(backendBin)) { _ffmpegPath = backendBin; return backendBin; }

    if (ffmpegPath && fs.existsSync(ffmpegPath)) { _ffmpegPath = ffmpegPath; return ffmpegPath; }
  } else {
    // Linux/Docker: check common paths
    const commonPaths = ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg'];
    for (const p of commonPaths) {
      if (fs.existsSync(p)) { _ffmpegPath = p; return p; }
    }
  }

  const resolved = resolveCommand('ffmpeg');
  if (resolved) { _ffmpegPath = resolved; return resolved; }

  _ffmpegPath = '';
  return null;
}

function getBaseArgs(): string[] {
  const args = [
    '--no-warnings',
    '--no-playlist',
    '--no-check-certificates',
    '--socket-timeout', '15',
    '--no-cache-dir',
  ];

  // Tell yt-dlp where node.js is (for JS-based extractors)
  const node = getNodePath();
  if (node) {
    args.push('--js-runtimes', `node:${node}`);
  }

  // Tell yt-dlp where ffmpeg is (needed for merging video+audio)
  const ff = getFfmpegPath();
  if (ff) {
    args.push('--ffmpeg-location', ff);
  }

  return args;
}

export function isYtDlpAvailable(): boolean {
  if (_ytdlpAvailable !== null) return _ytdlpAvailable;

  const p = getYtDlpPath();

  // If it's an absolute path, check file exists
  if (path.isAbsolute(p)) {
    _ytdlpAvailable = fs.existsSync(p);
  } else {
    // It's a bare command name — try to resolve it via PATH
    const resolved = resolveCommand(p);
    _ytdlpAvailable = resolved !== null;
  }

  console.log(`[yt-dlp] Available: ${_ytdlpAvailable}, Path: ${p}`);
  return _ytdlpAvailable;
}

export interface YtDlpFormat {
  format_id: string;
  ext: string;
  format_note?: string;
  height?: number;
  width?: number;
  filesize?: number;
  filesize_approx?: number;
  vcodec?: string;
  acodec?: string;
  url?: string;
  fps?: number;
  tbr?: number;
  qualityLabel?: string;
}

export interface YtDlpInfo {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  extractor_key?: string;
  formats?: YtDlpFormat[];
  url?: string;
}

/**
 * Extract metadata (title, thumbnail, formats) from a URL using yt-dlp.
 * Does NOT download — only fetches JSON info.
 */
export async function getYtDlpMetadata(url: string): Promise<YtDlpInfo> {
  const binary = getYtDlpPath();

  return new Promise((resolve, reject) => {
    const args = [
      ...getBaseArgs(),
      '--dump-single-json',
      '--extractor-args', 'youtube:player_client=android,web;player_skip=configs',
      url,
    ];

    console.log(`[yt-dlp] Analyzing: ${url}`);
    console.log(`[yt-dlp] Binary: ${binary}`);
    const child = spawn(binary, args);
    // Kill if it takes more than 90 seconds (Render cold start needs time)
    const killTimer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Video analysis timed out. Please try again.'));
    }, 90000);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      const msg = chunk.toString();
      stderr += msg;
      // Log important stderr messages
      if (!msg.includes('[download]') && !msg.includes('WARNING')) {
        console.log(`[yt-dlp stderr] ${msg.trim()}`);
      }
    });

    child.on('error', (err) => {
      clearTimeout(killTimer);
      console.error(`[yt-dlp] Spawn error: ${err.message}`);
      reject(new Error(`Failed to execute yt-dlp: ${err.message}`));
    });

    child.on('close', (code) => {
      clearTimeout(killTimer);
      console.log(`[yt-dlp] Analyze exited with code: ${code}`);
      if (code === 0 && stdout.trim()) {
        try {
          const parsed = JSON.parse(stdout);
          console.log(`[yt-dlp] Parsed metadata: title="${parsed.title}", formats=${parsed.formats?.length || 0}`);
          resolve(parsed);
        } catch (e: any) {
          reject(new Error(`Failed to parse metadata: ${e.message}`));
        }
      } else {
        const err = stderr.trim();
        console.error(`[yt-dlp] Analysis failed. stderr: ${err.substring(0, 500)}`);
        if (err.includes('Sign in to confirm')) {
          reject(new Error('This video requires authentication or age verification.'));
        } else if (err.includes('Private video') || err.includes('Video unavailable')) {
          reject(new Error('Video is private or unavailable on YouTube.'));
        } else if (err.includes('login') || err.includes('Login')) {
          reject(new Error('This content requires login to access. Try a different video.'));
        } else {
          reject(new Error(err.split('\n').pop() || `yt-dlp exited with code ${code}`));
        }
      }
    });
  });
}

/**
 * Download a video using yt-dlp with the specified format.
 * Returns the path to the downloaded file.
 */
export async function downloadWithYtDlp(
  videoUrl: string,
  formatSpec: string,
  outputFilename?: string,
): Promise<{ filePath: string; filename: string }> {
  const binary = getYtDlpPath();
  const tmpDir = path.join(os.tmpdir(), 'vidgrab-downloads');

  // Ensure tmp directory exists
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // Clean old files (> 30 min) to prevent disk usage buildup
  cleanOldFiles(tmpDir, 30 * 60 * 1000);

  const fileId = crypto.randomBytes(8).toString('hex');
  // Use yt-dlp's output template — %(ext)s lets yt-dlp pick the right extension
  const outputTemplate = path.join(tmpDir, `${fileId}_%(title).50s.%(ext)s`);

  return new Promise((resolve, reject) => {
    const args = [
      ...getBaseArgs(),
      '-f', formatSpec,
      '--merge-output-format', 'mp4',
      '-o', outputTemplate,
      '--no-part',
      '--restrict-filenames',
      videoUrl,
    ];

    console.log(`[yt-dlp] Downloading: ${videoUrl} with format: ${formatSpec}`);
    console.log(`[yt-dlp] Output template: ${outputTemplate}`);
    const child = spawn(binary, args);

    // Kill if download takes more than 5 minutes
    const killTimer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Download timed out after 5 minutes.'));
    }, 5 * 60 * 1000);

    let stderr = '';

    child.stdout.on('data', (chunk) => {
      const msg = chunk.toString();
      if (msg.includes('[download]') || msg.includes('[Merger]')) {
        process.stdout.write(msg);
      }
    });

    child.stderr.on('data', (chunk) => {
      const msg = chunk.toString();
      stderr += msg;
      // Log progress lines
      if (msg.includes('[download]') || msg.includes('[Merger]')) {
        process.stdout.write(msg);
      } else {
        console.log(`[yt-dlp download stderr] ${msg.trim()}`);
      }
    });

    child.on('error', (err) => {
      clearTimeout(killTimer);
      console.error(`[yt-dlp] Download spawn error: ${err.message}`);
      reject(new Error(`Failed to execute yt-dlp: ${err.message}`));
    });

    child.on('close', (code) => {
      clearTimeout(killTimer);
      console.log(`[yt-dlp] Download exited with code: ${code}`);

      if (code !== 0) {
        const errMsg = stderr.trim().split('\n').pop() || `yt-dlp exited with code ${code}`;
        console.error(`[yt-dlp] Download failed: ${errMsg}`);
        reject(new Error(errMsg));
        return;
      }

      // Find all files created for this download job
      let allFiles: Array<{ name: string; path: string; time: number }>;
      try {
        allFiles = fs.readdirSync(tmpDir)
          .filter(f => f.startsWith(fileId))
          .map(f => ({
            name: f,
            path: path.join(tmpDir, f),
            time: fs.statSync(path.join(tmpDir, f)).mtimeMs,
          }))
          .sort((a, b) => b.time - a.time);
      } catch (err: any) {
        console.error(`[yt-dlp] Error reading tmp dir: ${err.message}`);
        reject(new Error('Download completed but could not read output directory.'));
        return;
      }

      console.log(`[yt-dlp] Found ${allFiles.length} files: ${allFiles.map(f => f.name).join(', ')}`);

      if (allFiles.length === 0) {
        reject(new Error('Download completed but output file not found.'));
        return;
      }

      // Prioritize the merged final file (does NOT have intermediate stream format suffix like .f398. or .f401. or .f140.)
      const mergedFile = allFiles.find(f => !/\.f[a-zA-Z0-9_-]+\./.test(f.name) && !f.name.endsWith('.part'));
      const downloadedFile = mergedFile || allFiles[0];

      // Clean up any remaining unmerged intermediate stream files for this fileId
      allFiles.forEach(f => {
        if (f.path !== downloadedFile.path) {
          try { fs.unlinkSync(f.path); } catch {}
        }
      });

      console.log(`[yt-dlp] Downloaded final merged file: ${downloadedFile.path} (${fs.statSync(downloadedFile.path).size} bytes)`);

      resolve({
        filePath: downloadedFile.path,
        filename: outputFilename
          ? `${outputFilename}.${path.extname(downloadedFile.name).slice(1)}`
          : downloadedFile.name,
      });
    });
  });
}

/**
 * Clean up old temporary download files.
 */
function cleanOldFiles(dir: string, maxAgeMs: number): void {
  try {
    const now = Date.now();
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
        }
      } catch {
        // Ignore individual file errors
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}
