import { IProvider, ProviderResult, VideoMetadata, VideoFormat } from './types';
import axios from 'axios';

export class HlsProvider implements IProvider {
  name = 'HLS Stream';

  canHandle(url: URL): boolean {
    const pathname = url.pathname.toLowerCase();
    const search = url.search.toLowerCase();
    return pathname.endsWith('.m3u8') || 
           search.includes('.m3u8') ||
           pathname.includes('playlist') ||
           pathname.endsWith('.mpd');  // DASH
  }

  async getMetadata(url: URL, rawUrl: string): Promise<ProviderResult<VideoMetadata>> {
    try {
      const res = await axios.get(rawUrl, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VidGrab/1.0)' },
        validateStatus: (s) => s < 400,
      });

      const content = res.data as string;
      const formats: VideoFormat[] = [];

      if (typeof content === 'string' && content.includes('#EXTM3U')) {
        // Parse master playlist
        const lines = content.split('\n');
        let streamIndex = 0;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('#EXT-X-STREAM-INF')) {
            const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);
            const resMatch = line.match(/RESOLUTION=(\d+x\d+)/);
            const nextLine = lines[i + 1]?.trim();

            if (nextLine && !nextLine.startsWith('#')) {
              const streamUrl = nextLine.startsWith('http') 
                ? nextLine 
                : new URL(nextLine, rawUrl).toString();

              const bandwidth = bandwidthMatch ? parseInt(bandwidthMatch[1]) : 0;
              const resolution = resMatch ? resMatch[1] : 'unknown';
              const height = resMatch ? parseInt(resMatch[1].split('x')[1]) : 0;
              const quality = height ? `${height}p` : `Stream ${streamIndex + 1}`;

              formats.push({
                id: `hls_${streamIndex}`,
                label: `HLS ${quality} (${Math.round(bandwidth / 1000)}k)`,
                quality,
                format: 'm3u8',
                mimeType: 'application/x-mpegURL',
                bitrate: bandwidth,
                url: streamUrl,
                hasVideo: true,
                hasAudio: true,
              });
              streamIndex++;
              i++; // skip next line
            }
          } else if (line.startsWith('#EXT-X-MEDIA:') && line.includes('TYPE=AUDIO')) {
            // Ignore audio-only streams for now
          }
        }

        // If no streams found, treat the URL itself as a stream
        if (formats.length === 0) {
          formats.push({
            id: 'hls_0',
            label: 'HLS Stream',
            quality: 'auto',
            format: 'm3u8',
            mimeType: 'application/x-mpegURL',
            url: rawUrl,
            hasVideo: true,
            hasAudio: true,
          });
        }

        // Sort by quality (highest first)
        formats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

        return {
          success: true,
          data: {
            url: rawUrl,
            title: `HLS Stream - ${url.hostname}`,
            sourceDomain: url.hostname,
            provider: this.name,
            formats,
            isLive: content.includes('#EXT-X-STREAM-INF') && !content.includes('#EXT-X-ENDLIST'),
          },
        };
      }

      return { success: false, error: 'URL did not return a valid HLS playlist' };
    } catch (err: any) {
      return { success: false, error: `HLS analysis failed: ${err.message}` };
    }
  }
}
