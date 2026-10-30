import { IProvider, ProviderResult, VideoMetadata, VideoFormat } from './types';
import { getYtDlpMetadata, isYtDlpAvailable } from '../utils/ytdlp';
import axios from 'axios';

export class InstagramProvider implements IProvider {
  name = 'Instagram';

  canHandle(url: URL): boolean {
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    return host === 'instagram.com';
  }

  async getMetadata(url: URL, rawUrl: string): Promise<ProviderResult<VideoMetadata>> {
    const shortcodeMatch = url.pathname.match(/\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/);
    const shortcode = shortcodeMatch ? shortcodeMatch[1] : null;

    // 1. First attempt: Use yt-dlp engine
    if (isYtDlpAvailable()) {
      try {
        const info = await getYtDlpMetadata(rawUrl);
        if (info && (info.formats?.length || info.url)) {
          const title = info.title || `Instagram Reel ${shortcode || ''}`.trim();
          const thumbnail = info.thumbnail;
          const duration = info.duration ? Math.round(info.duration) : undefined;

          const formats: VideoFormat[] = [];
          const rawFormats = info.formats || [];

          // Check if there are any video formats with direct URLs
          const videoFormats = rawFormats.filter(f => f.url && f.vcodec !== 'none');

          if (videoFormats.length > 0) {
            // Instagram typically has progressive formats, use direct URL
            const best = videoFormats[videoFormats.length - 1];
            formats.push({
              id: 'insta_best',
              label: 'MP4 (Original Video + Audio)',
              quality: best.height ? `${best.height}p` : 'Original',
              format: 'mp4',
              mimeType: 'video/mp4',
              fileSize: best.filesize || best.filesize_approx,
              url: best.url!,
              hasVideo: true,
              hasAudio: true,
            });
          } else if (info.url) {
            formats.push({
              id: 'insta_direct',
              label: 'MP4 (Original Video)',
              quality: 'Original',
              format: 'mp4',
              mimeType: 'video/mp4',
              url: info.url,
              hasVideo: true,
              hasAudio: true,
            });
          }

          // Also add a yt-dlp based fallback format for merging
          if (formats.length === 0) {
            formats.push({
              id: 'insta_ytdlp',
              label: '⭐ Best Available (MP4)',
              quality: 'Best',
              format: 'mp4',
              mimeType: 'video/mp4',
              url: `ytdlp:bestvideo+bestaudio/best||${rawUrl}`,
              hasVideo: true,
              hasAudio: true,
            });
          }

          if (formats.length > 0) {
            return {
              success: true,
              data: {
                url: rawUrl,
                title,
                thumbnail,
                duration,
                sourceDomain: 'instagram.com',
                provider: this.name,
                formats,
              },
            };
          }
        }
      } catch {
        // Fall through to fallback methods
      }
    }

    // 2. Fallback: Try OpenGraph/embed extraction
    if (shortcode) {
      try {
        const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
        const res = await axios.get(embedUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
          timeout: 8000,
        });

        const html = String(res.data || '');
        const vMatch = html.match(/"video_url":\s*"([^"]+)"/);
        if (vMatch) {
          const cleanUrl = vMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
          return {
            success: true,
            data: {
              url: rawUrl,
              title: `Instagram Reel ${shortcode}`,
              sourceDomain: 'instagram.com',
              provider: this.name,
              formats: [
                {
                  id: 'insta_embed',
                  label: 'MP4 (Direct)',
                  quality: 'HD',
                  format: 'mp4',
                  mimeType: 'video/mp4',
                  url: cleanUrl,
                  hasVideo: true,
                  hasAudio: true,
                },
              ],
            },
          };
        }
      } catch {
        // Ignore
      }

      // 3. Fallback: Try yt-dlp with format for Instagram
      if (isYtDlpAvailable()) {
        // Return a yt-dlp format that will attempt download with best effort
        return {
          success: true,
          data: {
            url: rawUrl,
            title: `Instagram Reel ${shortcode}`,
            sourceDomain: 'instagram.com',
            provider: this.name,
            formats: [
              {
                id: 'insta_ytdlp_fallback',
                label: '⭐ Best Available (MP4)',
                quality: 'Best',
                format: 'mp4',
                mimeType: 'video/mp4',
                url: `ytdlp:best||${rawUrl}`,
                hasVideo: true,
                hasAudio: true,
              },
            ],
          },
        };
      }
    }

    return {
      success: false,
      error:
        'Instagram requires login to access this reel. Instagram has strict anti-scraping measures — try pasting a YouTube, Twitter/X, or Facebook video URL instead.',
    };
  }
}
