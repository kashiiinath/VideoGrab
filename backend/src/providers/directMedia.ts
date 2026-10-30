import { IProvider, ProviderResult, VideoMetadata, VideoFormat } from './types';
import axios from 'axios';
import path from 'path';

const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/mpeg',
  'video/3gpp',
  'video/x-flv',
];

const SUPPORTED_EXTENSIONS = ['.mp4', '.webm', '.ogv', '.mov', '.avi', '.mkv', '.mpeg', '.mpg', '.3gp', '.flv', '.m4v'];

export class DirectMediaProvider implements IProvider {
  name = 'Direct Media';

  canHandle(url: URL): boolean {
    const pathname = url.pathname.toLowerCase();
    return SUPPORTED_EXTENSIONS.some(ext => pathname.endsWith(ext));
  }

  async getMetadata(url: URL, rawUrl: string): Promise<ProviderResult<VideoMetadata>> {
    let contentType = 'video/mp4';
    let fileSize: number | undefined;

    // Step 1: Try HEAD
    try {
      const headRes = await axios.head(rawUrl, {
        timeout: 10000,
        maxRedirects: 5,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VidGrab/1.0)' },
        validateStatus: (s) => s < 500,
      });

      if (headRes.status < 400) {
        const ct = String(headRes.headers['content-type'] || '').split(';')[0].trim();
        if (ct) contentType = ct;
        const rawLen = headRes.headers['content-length'];
        if (rawLen) fileSize = parseInt(String(rawLen), 10);
      }
    } catch {
      // HEAD failed — will try GET range below
    }

    // Step 2: Try GET with Range header to confirm accessibility
    try {
      const rangeRes = await axios.get(rawUrl, {
        timeout: 12000,
        headers: {
          Range: 'bytes=0-1023',
          'User-Agent': 'Mozilla/5.0 (compatible; VidGrab/1.0)',
        },
        maxRedirects: 5,
        validateStatus: (s) => s < 500,
      });

      if (rangeRes.status === 403) {
        return { success: false, error: 'Access denied (403). The server does not allow downloading this file.' };
      }
      if (rangeRes.status === 404) {
        return { success: false, error: 'File not found (404). Check the URL is correct.' };
      }

      if (rangeRes.status < 400) {
        const ct = String(rangeRes.headers['content-type'] || '').split(';')[0].trim();
        if (ct && ct !== contentType) contentType = ct;
        // Try to get total size from Content-Range
        const cr = String(rangeRes.headers['content-range'] || '');
        const match = cr.match(/\/(\d+)$/);
        if (match) fileSize = parseInt(match[1], 10);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        return { success: false, error: 'Access denied (403). The server does not allow downloading this file.' };
      }
      if (err.response?.status === 404) {
        return { success: false, error: 'File not found (404). Check the URL is correct.' };
      }
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        return { success: false, error: 'Cannot connect to server. Check the URL.' };
      }
      // Network errors — if we have a valid extension, proceed anyway
      if (!this.canHandle(url)) {
        return { success: false, error: `Failed to verify URL: ${err.message}` };
      }
    }

    // Validate content type
    const isVideo = SUPPORTED_VIDEO_TYPES.some(t => contentType.startsWith(t.split('/')[0]));
    if (!isVideo && !this.canHandle(url)) {
      return { success: false, error: `URL does not point to a supported video file (detected type: ${contentType})` };
    }

    // Derive extension and title
    const ext = path.extname(url.pathname).replace('.', '') || this.extFromMime(contentType);
    const basename = path.basename(decodeURIComponent(url.pathname)) || `video.${ext}`;
    const title = basename.replace(/\.[^.]+$/, '').replace(/[-_+]/g, ' ').trim() || 'Video';

    const format: VideoFormat = {
      id: 'direct',
      label: `${ext.toUpperCase()} – Direct Download`,
      quality: 'original',
      format: ext || 'mp4',
      mimeType: contentType,
      fileSize: fileSize && !isNaN(fileSize) && fileSize > 0 ? fileSize : undefined,
      url: rawUrl,
      hasVideo: true,
      hasAudio: true,
    };

    return {
      success: true,
      data: {
        url: rawUrl,
        title,
        sourceDomain: url.hostname,
        provider: this.name,
        formats: [format],
        thumbnail: undefined,
      },
    };
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/ogg': 'ogv',
      'video/quicktime': 'mov',
      'video/x-msvideo': 'avi',
      'video/x-matroska': 'mkv',
      'video/mpeg': 'mpeg',
    };
    return map[mime] || 'mp4';
  }
}
