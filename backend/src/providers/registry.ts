import { IProvider, ProviderResult, VideoMetadata } from './types';
import { DirectMediaProvider } from './directMedia';
import { HlsProvider } from './hlsProvider';
import { VimeoProvider } from './vimeoProvider';
import { YouTubeProvider } from './youtubeProvider';
import { InstagramProvider } from './instagramProvider';
import { TwitterProvider } from './twitterProvider';
import { SocialProvider } from './socialProvider';

const providers: IProvider[] = [
  new YouTubeProvider(),
  new InstagramProvider(),
  new TwitterProvider(),
  new SocialProvider(),
  new VimeoProvider(),
  new HlsProvider(),
  new DirectMediaProvider(),
];

// Domains we explicitly do NOT support (DRM protected content)
const UNSUPPORTED_DOMAINS: Record<string, string> = {
  'netflix.com': 'Netflix content is DRM-protected. Download is not permitted.',
  'www.netflix.com': 'Netflix content is DRM-protected. Download is not permitted.',
  'disneyplus.com': 'Disney+ content is DRM-protected. Download is not permitted.',
  'hulu.com': 'Hulu content is DRM-protected. Download is not permitted.',
  'amazon.com': 'Amazon Prime Video content is DRM-protected. Download is not permitted.',
  'primevideo.com': 'Amazon Prime Video content is DRM-protected. Download is not permitted.',
  'spotify.com': 'Spotify content is DRM-protected. Download is not permitted.',
};

export interface DetectionResult {
  supported: boolean;
  providerName?: string;
  reason?: string;
}

export function detectProvider(url: URL): DetectionResult {
  // Check explicitly unsupported DRM domains first
  const domain = url.hostname.toLowerCase();
  if (UNSUPPORTED_DOMAINS[domain]) {
    return { supported: false, reason: UNSUPPORTED_DOMAINS[domain] };
  }

  // Find a matching provider
  for (const provider of providers) {
    if (provider.canHandle(url)) {
      return { supported: true, providerName: provider.name };
    }
  }

  return {
    supported: false,
    reason: `"${url.hostname}" is not directly supported yet. VidGrab supports YouTube, Instagram Reels, Twitter/X, TikTok, Facebook, Vimeo, HLS streams, and direct video files (.mp4, .webm).`,
  };
}

export async function analyzeUrl(url: URL, rawUrl: string): Promise<ProviderResult<VideoMetadata>> {
  for (const provider of providers) {
    if (provider.canHandle(url)) {
      return provider.getMetadata(url, rawUrl);
    }
  }

  return {
    success: false,
    error: 'No provider available for this URL',
  };
}

export function getSupportedSources(): Array<{ name: string; description: string; examples: string[] }> {
  return [
    {
      name: 'YouTube',
      description: 'Videos, Shorts, and audio from YouTube',
      examples: ['https://www.youtube.com/watch?v=...', 'https://youtu.be/...'],
    },
    {
      name: 'Instagram',
      description: 'Public Reels, posts, and video clips',
      examples: ['https://www.instagram.com/reel/...', 'https://www.instagram.com/p/...'],
    },
    {
      name: 'Twitter / X',
      description: 'Videos and GIFs posted in tweets',
      examples: ['https://x.com/user/status/...', 'https://twitter.com/user/status/...'],
    },
    {
      name: 'TikTok',
      description: 'HD video downloads without watermark',
      examples: ['https://www.tiktok.com/@user/video/...'],
    },
    {
      name: 'Facebook',
      description: 'Public Facebook videos and reels',
      examples: ['https://www.facebook.com/watch?v=...'],
    },
    {
      name: 'Direct Video Files',
      description: 'Any publicly accessible MP4, WebM, MOV, AVI, or MKV file URL',
      examples: ['https://example.com/video.mp4', 'https://cdn.example.com/clip.webm'],
    },
    {
      name: 'HLS Streams',
      description: 'HTTP Live Streaming playlists (.m3u8)',
      examples: ['https://example.com/stream/playlist.m3u8'],
    },
    {
      name: 'Vimeo (Public)',
      description: 'Public Vimeo videos without DRM protection',
      examples: ['https://vimeo.com/123456789'],
    },
  ];
}
