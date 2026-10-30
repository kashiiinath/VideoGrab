import { IProvider, ProviderResult, VideoMetadata, VideoFormat } from './types';
import axios from 'axios';

// Vimeo oEmbed + public config API — no auth required for public videos
export class VimeoProvider implements IProvider {
  name = 'Vimeo';

  canHandle(url: URL): boolean {
    return url.hostname === 'vimeo.com' || url.hostname === 'www.vimeo.com';
  }

  async getMetadata(url: URL, rawUrl: string): Promise<ProviderResult<VideoMetadata>> {
    const videoId = this.extractVideoId(url.pathname);
    if (!videoId) {
      return { success: false, error: 'Could not extract Vimeo video ID from URL' };
    }

    try {
      // Use Vimeo oEmbed API (public, no auth needed)
      const oembedRes = await axios.get(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(rawUrl)}`, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VidGrab/1.0)' },
        validateStatus: (s) => s < 400,
      });

      const oembed = oembedRes.data;

      // Try Vimeo config API for direct video URLs (public videos only)
      let formats: VideoFormat[] = [];
      try {
        const configRes = await axios.get(`https://player.vimeo.com/video/${videoId}/config`, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; VidGrab/1.0)',
            'Referer': 'https://vimeo.com/',
          },
          validateStatus: (s) => s < 400,
        });

        const config = configRes.data;
        const progressive = config?.request?.files?.progressive;

        if (Array.isArray(progressive) && progressive.length > 0) {
          formats = progressive.map((p: any, idx: number) => ({
            id: `vimeo_${p.quality || idx}`,
            label: `MP4 ${p.quality || 'SD'}`,
            quality: p.quality || 'sd',
            format: 'mp4',
            mimeType: 'video/mp4',
            fileSize: undefined,
            url: p.url,
            hasVideo: true,
            hasAudio: true,
          }));

          // Sort by quality
          const qOrder: Record<string, number> = { '1080p': 5, '720p': 4, '540p': 3, '480p': 2, '360p': 1, '240p': 0 };
          formats.sort((a, b) => (qOrder[b.quality] || 0) - (qOrder[a.quality] || 0));
        }
      } catch {
        // Config API might fail for some videos — that's okay
      }

      if (formats.length === 0) {
        return {
          success: false,
          error: 'This Vimeo video does not have publicly accessible direct download URLs. It may be private or DRM-protected.',
        };
      }

      return {
        success: true,
        data: {
          url: rawUrl,
          title: oembed.title || `Vimeo Video ${videoId}`,
          description: oembed.description,
          thumbnail: oembed.thumbnail_url,
          duration: oembed.duration,
          sourceDomain: 'vimeo.com',
          provider: this.name,
          formats,
        },
      };
    } catch (err: any) {
      if (err.response?.status === 404) {
        return { success: false, error: 'Vimeo video not found. It may be deleted or private.' };
      }
      if (err.response?.status === 403) {
        return { success: false, error: 'Access denied. This Vimeo video is private.' };
      }
      return { success: false, error: `Vimeo analysis failed: ${err.message}` };
    }
  }

  private extractVideoId(pathname: string): string | null {
    const match = pathname.match(/^\/(\d+)/);
    return match ? match[1] : null;
  }
}
