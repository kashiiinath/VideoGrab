import { Router, Request, Response } from 'express';
import axios from 'axios';
import fs from 'fs';
import { validateUrl, checkSsrf, sanitizeFilename } from '../utils/security';
import { downloadWithYtDlp } from '../utils/ytdlp';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limit for stream proxy
const streamLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, error: 'Too many download requests, please slow down.' },
});

const MAX_FILE_SIZE = 4 * 1024 * 1024 * 1024; // 4 GB limit

/**
 * GET /api/stream/proxy?url=...&filename=...
 * Proxies a video file download through the backend.
 * Sets proper Content-Disposition so the browser saves it to disk.
 *
 * If the URL starts with "ytdlp:", it routes to the yt-dlp download handler
 * which downloads and merges video+audio using yt-dlp + ffmpeg.
 */
router.get('/proxy', streamLimiter, async (req: Request, res: Response): Promise<void> => {
  const { url: rawUrl, filename: rawFilename } = req.query;

  if (!rawUrl || typeof rawUrl !== 'string') {
    res.status(400).json({ success: false, error: 'url parameter is required' });
    return;
  }

  const safeFilename = sanitizeFilename(
    typeof rawFilename === 'string' ? rawFilename : 'video.mp4'
  );

  // ── yt-dlp download handler ──────────────────────────────
  // URL format: ytdlp:FORMAT_SPEC||VIDEO_URL
  if (rawUrl.startsWith('ytdlp:')) {
    const payload = rawUrl.slice(6); // remove 'ytdlp:' prefix
    const separatorIdx = payload.indexOf('||');
    if (separatorIdx === -1) {
      res.status(400).json({ success: false, error: 'Invalid ytdlp URL format' });
      return;
    }

    const formatSpec = payload.slice(0, separatorIdx);
    const videoUrl = payload.slice(separatorIdx + 2);

    if (!videoUrl || !formatSpec) {
      res.status(400).json({ success: false, error: 'Missing video URL or format spec' });
      return;
    }

    console.log(`[stream/ytdl] Downloading: ${videoUrl} format: ${formatSpec}`);

    try {
      const { filePath, filename: downloadedFilename } = await downloadWithYtDlp(
        videoUrl,
        formatSpec,
        safeFilename.replace(/\.[^.]+$/, ''), // remove extension, yt-dlp adds it
      );

      const stat = fs.statSync(filePath);
      const ext = filePath.split('.').pop() || 'mp4';
      const finalFilename = safeFilename.endsWith(`.${ext}`)
        ? safeFilename
        : safeFilename.replace(/\.[^.]+$/, `.${ext}`);

      const mimeMap: Record<string, string> = {
        mp3: 'audio/mpeg',
        m4a: 'audio/mp4',
        aac: 'audio/aac',
        wav: 'audio/wav',
        flac: 'audio/flac',
        ogg: 'audio/ogg',
        mp4: 'video/mp4',
        webm: 'video/webm',
        mkv: 'video/x-matroska',
      };
      const contentType = mimeMap[ext.toLowerCase()] || (['mp3', 'm4a', 'wav', 'flac'].includes(ext.toLowerCase()) ? 'audio/mpeg' : 'video/mp4');
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${finalFilename}"; filename*=UTF-8''${encodeURIComponent(finalFilename)}`
      );
      res.setHeader('Content-Length', String(stat.size));
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);

      // Clean up the temp file after download completes or fails
      stream.on('end', () => {
        setTimeout(() => {
          fs.unlink(filePath, () => {});
        }, 5000);
      });

      stream.on('error', (err) => {
        console.error('[stream/ytdl] File stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: 'File streaming failed' });
        }
        fs.unlink(filePath, () => {});
      });

      res.on('close', () => {
        // Client disconnected early
        stream.destroy();
        setTimeout(() => {
          fs.unlink(filePath, () => {});
        }, 5000);
      });

      return;
    } catch (err: any) {
      console.error('[stream/ytdl] Download error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: `Download failed: ${err.message}`,
        });
      }
      return;
    }
  }

  // ── Standard proxy handler ────────────────────────────────
  // Validate URL
  const validation = validateUrl(rawUrl);
  if (!validation.valid || !validation.url) {
    res.status(400).json({ success: false, error: validation.error });
    return;
  }

  const ssrfCheck = await checkSsrf(validation.url.hostname);
  if (!ssrfCheck.safe) {
    res.status(400).json({ success: false, error: ssrfCheck.reason });
    return;
  }

  const browserHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Fetch-Mode': 'no-cors',
  };

  try {
    // Check file size first with HEAD if possible
    try {
      const headRes = await axios.head(rawUrl, {
        timeout: 8000,
        headers: browserHeaders,
        maxRedirects: 5,
        validateStatus: (s) => s < 400,
      });

      const rawContentLength = headRes.headers['content-length'];
      if (rawContentLength && parseInt(String(rawContentLength), 10) > MAX_FILE_SIZE) {
        res.status(413).json({ success: false, error: `File is too large (max ${MAX_FILE_SIZE / 1024 / 1024 / 1024}GB)` });
        return;
      }
    } catch {
      // HEAD may fail on signed URLs, proceed anyway
    }

    // Stream the file directly
    const upstream = await axios.get(rawUrl, {
      responseType: 'stream',
      timeout: 300000,
      headers: {
        ...browserHeaders,
        ...(req.headers.range ? { Range: req.headers.range } : {}),
      },
      maxRedirects: 5,
      validateStatus: (s) => s < 400,
    });

    const contentType = String(upstream.headers['content-type'] || 'application/octet-stream');
    const contentLength = upstream.headers['content-length'];
    const contentRange = upstream.headers['content-range'];

    // Set response headers to force download on client
    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`
    );
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, Content-Range');

    if (contentLength) res.setHeader('Content-Length', String(contentLength));
    if (contentRange) res.setHeader('Content-Range', String(contentRange));

    res.status(upstream.status);
    upstream.data.pipe(res);

    upstream.data.on('error', (err: Error) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(502).json({ success: false, error: 'Stream failed' });
      }
    });
  } catch (err: any) {
    if (!res.headersSent) {
      if (err.response?.status === 403) {
        res.status(403).json({ success: false, error: 'Access denied by source server (403 Forbidden)' });
      } else if (err.response?.status === 404) {
        res.status(404).json({ success: false, error: 'File not found at source URL' });
      } else {
        res.status(502).json({ success: false, error: `Proxy error: ${err.message}` });
      }
    }
  }
});

export default router;
