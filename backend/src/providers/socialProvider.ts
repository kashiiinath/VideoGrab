import { IProvider, ProviderResult, VideoMetadata, VideoFormat } from './types';
import axios from 'axios';

export class SocialProvider implements IProvider {
  name = 'Social Media';

  canHandle(url: URL): boolean {
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    return host === 'tiktok.com' || host === 'vm.tiktok.com' || host === 'facebook.com' || host === 'fb.watch';
  }

  async getMetadata(url: URL, rawUrl: string): Promise<ProviderResult<VideoMetadata>> {
    const host = url.hostname.toLowerCase().replace(/^www\./, '');

    if (host.includes('tiktok.com')) {
      return this.handleTikTok(rawUrl);
    } else {
      return this.handleFacebook(rawUrl);
    }
  }

  private async handleTikTok(rawUrl: string): Promise<ProviderResult<VideoMetadata>> {
    try {
      const res = await axios.post(
        'https://www.tikwm.com/api/',
        new URLSearchParams({ url: rawUrl, count: '12', cursor: '0', web: '1', hd: '1' }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (compatible; VidGrab/1.0)',
          },
          timeout: 12000,
        }
      );

      const data = res.data?.data;
      if (!data || (!data.play && !data.hdplay)) {
        return { success: false, error: 'Could not extract TikTok video. Video may be private or deleted.' };
      }

      const videoUrl = data.hdplay || data.play;
      const title = data.title || 'TikTok Video';
      const thumbnail = data.cover;
      const duration = data.duration;

      const formats: VideoFormat[] = [
        {
          id: 'tiktok_hd',
          label: 'HD (No Watermark)',
          quality: 'HD',
          format: 'mp4',
          mimeType: 'video/mp4',
          fileSize: data.size || undefined,
          url: videoUrl.startsWith('http') ? videoUrl : `https://www.tikwm.com${videoUrl}`,
          hasVideo: true,
          hasAudio: true,
        },
      ];

      return {
        success: true,
        data: {
          url: rawUrl,
          title,
          thumbnail,
          duration,
          sourceDomain: 'tiktok.com',
          provider: 'TikTok',
          formats,
        },
      };
    } catch (err: any) {
      return { success: false, error: `TikTok extraction failed: ${err.message}` };
    }
  }

  private async handleFacebook(rawUrl: string): Promise<ProviderResult<VideoMetadata>> {
    try {
      const res = await axios.get(rawUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 12000,
      });

      const html = String(res.data || '');
      let hdMatch = html.match(/browser_native_hd_url["']:\s*["']([^"']+)["']/i) ||
                    html.match(/playable_url_quality_hd["']:\s*["']([^"']+)["']/i);
      let sdMatch = html.match(/browser_native_sd_url["']:\s*["']([^"']+)["']/i) ||
                    html.match(/playable_url["']:\s*["']([^"']+)["']/i);

      let videoUrl = hdMatch?.[1] || sdMatch?.[1];
      if (!videoUrl) {
        // Try og:video
        const ogMatch = html.match(/<meta\s+property=["']og:video["']\s+content=["']([^"']+)["']/i);
        videoUrl = ogMatch?.[1];
      }

      if (!videoUrl) {
        return {
          success: false,
          error: 'Could not extract direct video from Facebook. The video may be private or requires login.',
        };
      }

      videoUrl = videoUrl.replace(/\\u0026/g, '&').replace(/\\/g, '');

      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/ \| Facebook$/i, '').trim() : 'Facebook Video';

      const thumbMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
      const thumbnail = thumbMatch?.[1]?.replace(/&amp;/g, '&');

      const formats: VideoFormat[] = [
        {
          id: 'fb_mp4',
          label: 'MP4 (Video)',
          quality: hdMatch ? 'HD' : 'SD',
          format: 'mp4',
          mimeType: 'video/mp4',
          url: videoUrl,
          hasVideo: true,
          hasAudio: true,
        },
      ];

      return {
        success: true,
        data: {
          url: rawUrl,
          title,
          thumbnail,
          sourceDomain: 'facebook.com',
          provider: 'Facebook',
          formats,
        },
      };
    } catch (err: any) {
      return { success: false, error: `Facebook extraction failed: ${err.message}` };
    }
  }
}

