import { IProvider, ProviderResult, VideoMetadata, VideoFormat } from './types';
import { getYtDlpMetadata } from '../utils/ytdlp';

/**
 * YouTube provider that uses yt-dlp for metadata extraction.
 *
 * Since YouTube no longer serves progressive (video+audio) MP4 formats,
 * all downloads go through yt-dlp which merges DASH video+audio streams
 * into a single MP4 file using ffmpeg.
 *
 * Format URLs use a special `ytdlp:` prefix:
 *   ytdlp:FORMAT_SPEC||ORIGINAL_VIDEO_URL
 * The backend stream route detects this and uses yt-dlp for downloading.
 */
export class YouTubeProvider implements IProvider {
  name = 'YouTube';

  canHandle(url: URL): boolean {
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    return host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com';
  }

  async getMetadata(url: URL, rawUrl: string): Promise<ProviderResult<VideoMetadata>> {
    try {
      const info = await getYtDlpMetadata(rawUrl);

      const title = info.title || 'YouTube Video';
      const duration = info.duration ? Math.round(info.duration) : undefined;
      const thumbnail = info.thumbnail;

      const rawFormats = info.formats || [];
      const formats: VideoFormat[] = [];

      // Determine which resolutions are available
      const availableHeights = new Set<number>();
      for (const f of rawFormats) {
        if (f.height && f.vcodec !== 'none') {
          availableHeights.add(f.height);
        }
      }

      // Calculate approximate file sizes for each quality tier
      const getApproxSize = (height: number): number | undefined => {
        // Find video format matching this height (prefer avc1/mp4)
        const videoFmt = rawFormats.find(
          f => f.height === height && f.vcodec !== 'none' && (f.ext === 'mp4' || f.vcodec?.startsWith('avc'))
        );
        const audioFmt = rawFormats.find(
          f => f.vcodec === 'none' && f.acodec !== 'none' && f.ext === 'm4a'
        );

        const vSize = videoFmt?.filesize || videoFmt?.filesize_approx || 0;
        const aSize = audioFmt?.filesize || audioFmt?.filesize_approx || 0;
        return (vSize + aSize) || undefined;
      };

      // Build format choices using yt-dlp format specifiers
      // These will be processed by the backend ytdl download route
      const qualityTiers: Array<{
        height: number;
        label: string;
        formatSpec: string;
        recommended?: boolean;
      }> = [
        {
          height: 360,
          label: '360p MP4 (Small & Fast)',
          formatSpec: 'bestvideo[height<=360][vcodec^=avc]+bestaudio[ext=m4a]/bestvideo[height<=360]+bestaudio/best[height<=360]',
        },
        {
          height: 480,
          label: '480p MP4 (Medium)',
          formatSpec: 'bestvideo[height<=480][vcodec^=avc]+bestaudio[ext=m4a]/bestvideo[height<=480]+bestaudio/best[height<=480]',
        },
        {
          height: 720,
          label: '⭐ 720p MP4 (Recommended - HD)',
          formatSpec: 'bestvideo[height<=720][vcodec^=avc]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best[height<=720]',
          recommended: true,
        },
        {
          height: 1080,
          label: '1080p MP4 (Full HD)',
          formatSpec: 'bestvideo[height<=1080][vcodec^=avc]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]',
        },
        {
          height: 1440,
          label: '1440p MP4 (2K)',
          formatSpec: 'bestvideo[height<=1440]+bestaudio[ext=m4a]/bestvideo[height<=1440]+bestaudio/best[height<=1440]',
        },
        {
          height: 2160,
          label: '2160p MP4 (4K)',
          formatSpec: 'bestvideo[height<=2160]+bestaudio[ext=m4a]/bestvideo[height<=2160]+bestaudio/best[height<=2160]',
        },
      ];

      // Add video formats that are actually available
      for (const tier of qualityTiers) {
        if (availableHeights.has(tier.height) || 
            // Also include if a close resolution exists
            [...availableHeights].some(h => Math.abs(h - tier.height) <= 20)) {
          formats.push({
            id: `ytdlp_${tier.height}p`,
            label: tier.label,
            quality: `${tier.height}p`,
            format: 'mp4',
            mimeType: 'video/mp4',
            fileSize: getApproxSize(tier.height),
            // Special URL format: ytdlp:FORMAT_SPEC||VIDEO_URL
            url: `ytdlp:${tier.formatSpec}||${rawUrl}`,
            hasVideo: true,
            hasAudio: true,
          });
        }
      }

      // Add audio-only option
      const bestAudio = rawFormats.find(
        f => f.vcodec === 'none' && f.acodec !== 'none' && f.ext === 'm4a'
      );
      if (bestAudio) {
        formats.push({
          id: 'ytdlp_audio',
          label: '🎵 Audio Only (M4A)',
          quality: 'Audio',
          format: 'm4a',
          mimeType: 'audio/mp4',
          fileSize: bestAudio.filesize || bestAudio.filesize_approx,
          url: `ytdlp:bestaudio[ext=m4a]/bestaudio||${rawUrl}`,
          hasVideo: false,
          hasAudio: true,
        });
      }

      if (formats.length === 0) {
        // Fallback: just offer "best available"
        formats.push({
          id: 'ytdlp_best',
          label: '⭐ Best Available (MP4)',
          quality: 'Best',
          format: 'mp4',
          mimeType: 'video/mp4',
          url: `ytdlp:bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best||${rawUrl}`,
          hasVideo: true,
          hasAudio: true,
        });
      }

      // Sort: recommended (720p) first, then ascending resolution, audio last
      formats.sort((a, b) => {
        if (!a.hasVideo && b.hasVideo) return 1;
        if (a.hasVideo && !b.hasVideo) return -1;

        const isRecommendedA = a.label.includes('Recommended');
        const isRecommendedB = b.label.includes('Recommended');
        if (isRecommendedA && !isRecommendedB) return -1;
        if (!isRecommendedA && isRecommendedB) return 1;

        const resA = parseInt(a.quality.replace(/\D/g, '') || '0', 10);
        const resB = parseInt(b.quality.replace(/\D/g, '') || '0', 10);
        return resA - resB;
      });

      return {
        success: true,
        data: {
          url: rawUrl,
          title,
          thumbnail,
          duration,
          sourceDomain: 'youtube.com',
          provider: this.name,
          formats,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'YouTube extraction failed',
      };
    }
  }
}
