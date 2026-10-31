import { IProvider, ProviderResult, VideoMetadata, VideoFormat } from './types';
import { getYtDlpMetadata, YtDlpInfo } from '../utils/ytdlp';

const POPULAR_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'instagram.com',
  'twitter.com',
  'x.com',
  'facebook.com',
  'fb.watch',
  'tiktok.com',
  'reddit.com',
  'dailymotion.com',
  'twitch.tv',
  'pinterest.com',
  'threads.net',
  'linkedin.com',
];

export class YtDlpProvider implements IProvider {
  name = 'Universal Media';

  canHandle(url: URL): boolean {
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    if (POPULAR_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
      return true;
    }
    // Also handle any non-static URL if not ending with direct extensions
    return false;
  }

  async getMetadata(url: URL, rawUrl: string): Promise<ProviderResult<VideoMetadata>> {
    try {
      const info: YtDlpInfo = await getYtDlpMetadata(rawUrl);

      const title = info.title || 'Video';
      const duration = info.duration ? Math.round(info.duration) : undefined;
      const thumbnail = info.thumbnail;

      // Group and sort available video formats
      const rawFormats = info.formats || [];
      const formats: VideoFormat[] = [];

      // Look for standard heights (1080, 720, 480, 360)
      const heights = [1080, 720, 480, 360];
      const seenHeights = new Set<number>();

      // Add standard resolution choices using yt-dlp format specs
      for (const h of heights) {
        const matching = rawFormats.filter(f => f.height === h);
        if (matching.length > 0 && !seenHeights.has(h)) {
          seenHeights.add(h);
          const best = matching.find(f => f.ext === 'mp4') || matching[0];
          formats.push({
            id: `ytdlp_${h}p`,
            label: `${h}p (MP4 Video + Audio)`,
            quality: `${h}p`,
            format: 'mp4',
            mimeType: 'video/mp4',
            fileSize: best.filesize || best.filesize_approx,
            url: `ytdlp:bestvideo[height<=${h}]+bestaudio/best[height<=${h}]||${rawUrl}`,
            hasVideo: true,
            hasAudio: true,
          });
        }
      }

      // If no standard heights were mapped, provide a "Best Quality" format
      if (formats.length === 0) {
        formats.push({
          id: 'ytdlp_best',
          label: 'Best Quality (MP4 Video + Audio)',
          quality: 'Best',
          format: 'mp4',
          mimeType: 'video/mp4',
          url: `ytdlp:bestvideo+bestaudio/best||${rawUrl}`,
          hasVideo: true,
          hasAudio: true,
        });
      } else {
        // Also put a "Best Quality (Default)" option at the very top
        formats.unshift({
          id: 'ytdlp_best',
          label: 'Best Available (Auto)',
          quality: 'Best',
          format: 'mp4',
          mimeType: 'video/mp4',
          url: `ytdlp:bestvideo+bestaudio/best||${rawUrl}`,
          hasVideo: true,
          hasAudio: true,
        });
      }

      // Add audio-only option
      formats.push({
        id: 'ytdlp_audio',
        label: 'Audio Only (MP3)',
        quality: 'audio',
        format: 'mp3',
        mimeType: 'audio/mp3',
        url: `ytdlp://${encodeURIComponent(rawUrl)}?format=audio`,
        hasVideo: false,
        hasAudio: true,
      });

      const providerName = info.extractor_key || this.name;

      return {
        success: true,
        data: {
          url: rawUrl,
          title,
          thumbnail,
          duration,
          sourceDomain: url.hostname,
          provider: providerName,
          formats,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to extract video with yt-dlp',
      };
    }
  }
}

