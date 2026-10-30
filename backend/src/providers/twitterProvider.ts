import { IProvider, ProviderResult, VideoMetadata, VideoFormat } from './types';
import axios from 'axios';

export class TwitterProvider implements IProvider {
  name = 'Twitter/X';

  canHandle(url: URL): boolean {
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    return host === 'twitter.com' || host === 'x.com' || host === 'mobile.twitter.com';
  }

  async getMetadata(url: URL, rawUrl: string): Promise<ProviderResult<VideoMetadata>> {
    const statusId = this.extractStatusId(url.pathname);
    if (!statusId) {
      return { success: false, error: 'Could not find a valid Twitter/X post ID in the URL.' };
    }

    // Try VxTwitter API first, then FxTwitter API
    const apiEndpoints = [
      `https://api.vxtwitter.com/status/${statusId}`,
      `https://api.fxtwitter.com/status/${statusId}`,
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const res = await axios.get(endpoint, {
          timeout: 10000,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VidGrab/1.0)' },
          validateStatus: (s) => s < 400,
        });

        const data = res.data;
        const mediaList = data.media_extended || data.media || [];
        const videoMedia = mediaList.find((m: any) => m.type === 'video' || m.type === 'gif');

        if (!videoMedia || !videoMedia.url) {
          continue;
        }

        const title = data.text ? data.text.slice(0, 100).replace(/\n/g, ' ') : `Twitter Video ${statusId}`;
        const thumbnail = videoMedia.thumbnail_url || data.mediaURLs?.[0];
        const duration = videoMedia.duration_millis ? Math.round(videoMedia.duration_millis / 1000) : undefined;

        const formats: VideoFormat[] = [
          {
            id: 'twitter_mp4',
            label: 'MP4 (Original Quality)',
            quality: 'original',
            format: 'mp4',
            mimeType: 'video/mp4',
            fileSize: videoMedia.size_bytes || undefined,
            url: videoMedia.url,
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
            sourceDomain: 'x.com',
            provider: this.name,
            formats,
          },
        };
      } catch {
        // Continue to next endpoint
      }
    }

    return {
      success: false,
      error: 'Could not extract video from Twitter/X. The tweet might not contain a video, or it is private/deleted.',
    };
  }

  private extractStatusId(pathname: string): string | null {
    const match = pathname.match(/\/status(?:es)?\/(\d+)/i);
    return match ? match[1] : null;
  }
}

