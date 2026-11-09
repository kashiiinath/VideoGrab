import { Router, Request, Response } from 'express';
import axios from 'axios';
import { validateUrl, checkSsrf } from '../utils/security';
import { getYtDlpMetadata, getYtDlpPlaylistMetadata, isYtDlpAvailable } from '../utils/ytdlp';

const router = Router();

export interface MusicFormat {
  id: string;
  label: string;
  quality: string;
  format: 'mp3' | 'm4a' | 'wav' | 'flac';
  mimeType: string;
  fileSize?: number;
  url: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
  thumbnail?: string;
  url?: string;
  canDownload: boolean;
  drmNotice?: string;
  officialUrl?: string;
  formats?: MusicFormat[];
}

export interface MusicMetadata {
  type: 'song' | 'playlist' | 'album';
  platform: string;
  platformId: string;
  platformColor: string;
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
  duration?: number;
  trackCount?: number;
  tracks?: MusicTrack[];
  canDownload: boolean;
  drmProtected?: boolean;
  drmNotice?: string;
  officialUrl?: string;
  formats?: MusicFormat[];
  url: string;
}

// Standard high-quality audio formats generated for downloadable sources
function generateAudioFormats(rawUrl: string, approxDuration?: number): MusicFormat[] {
  // Approximate bitrates (bytes per second = kbps * 125)
  const d = approxDuration || 210; // default ~3.5 min
  return [
    {
      id: 'audio_mp3_320',
      label: 'MP3 • 320 kbps (Ultra High Quality)',
      quality: '320kbps',
      format: 'mp3',
      mimeType: 'audio/mpeg',
      fileSize: Math.round(d * 40000), // ~320kbps
      url: `ytdlp:audio:mp3:320k||${rawUrl}`,
    },
    {
      id: 'audio_m4a_256',
      label: 'M4A • 256 kbps (Apple & Mobile AAC)',
      quality: '256kbps',
      format: 'm4a',
      mimeType: 'audio/mp4',
      fileSize: Math.round(d * 32000), // ~256kbps
      url: `ytdlp:audio:m4a:256k||${rawUrl}`,
    },
    {
      id: 'audio_mp3_192',
      label: 'MP3 • 192 kbps (Standard Quality)',
      quality: '192kbps',
      format: 'mp3',
      mimeType: 'audio/mpeg',
      fileSize: Math.round(d * 24000), // ~192kbps
      url: `ytdlp:audio:mp3:192k||${rawUrl}`,
    },
    {
      id: 'audio_mp3_128',
      label: 'MP3 • 128 kbps (Fast & Compact)',
      quality: '128kbps',
      format: 'mp3',
      mimeType: 'audio/mpeg',
      fileSize: Math.round(d * 16000), // ~128kbps
      url: `ytdlp:audio:mp3:128k||${rawUrl}`,
    },
    {
      id: 'audio_wav',
      label: 'WAV • Lossless Audio (Studio Master)',
      quality: 'Lossless',
      format: 'wav',
      mimeType: 'audio/wav',
      fileSize: Math.round(d * 176400), // 16-bit 44.1kHz stereo
      url: `ytdlp:audio:wav:lossless||${rawUrl}`,
    },
  ];
}

// Detect which music platform the URL belongs to
export function detectMusicPlatform(url: URL): {
  id: string;
  name: string;
  color: string;
  type: 'song' | 'playlist' | 'album';
} {
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const path = url.pathname.toLowerCase();

  if (host === 'music.youtube.com' || host === 'youtube.com' || host === 'youtu.be') {
    const isPlaylist = url.searchParams.has('list') || path.includes('/playlist');
    return {
      id: 'ytmusic',
      name: host.includes('music') ? 'YouTube Music' : 'YouTube Audio',
      color: '#FF0000',
      type: isPlaylist ? 'playlist' : 'song',
    };
  }

  if (host === 'open.spotify.com' || host === 'spotify.com') {
    const isPlaylist = path.includes('/playlist/');
    const isAlbum = path.includes('/album/');
    return {
      id: 'spotify',
      name: 'Spotify',
      color: '#1DB954',
      type: isPlaylist ? 'playlist' : isAlbum ? 'album' : 'song',
    };
  }

  if (host === 'music.apple.com' || host === 'itunes.apple.com') {
    const isPlaylist = path.includes('/playlist/');
    const isAlbum = path.includes('/album/');
    return {
      id: 'apple',
      name: 'Apple Music',
      color: '#FA2D48',
      type: isPlaylist ? 'playlist' : isAlbum ? 'album' : 'song',
    };
  }

  if (host === 'soundcloud.com' || host === 'm.soundcloud.com') {
    const isPlaylist = path.includes('/sets/');
    return {
      id: 'soundcloud',
      name: 'SoundCloud',
      color: '#FF5500',
      type: isPlaylist ? 'playlist' : 'song',
    };
  }

  if (host === 'jiosaavn.com') {
    const isPlaylist = path.includes('/featured/') || path.includes('/playlist/');
    const isAlbum = path.includes('/album/');
    return {
      id: 'jiosaavn',
      name: 'JioSaavn',
      color: '#00D166',
      type: isPlaylist ? 'playlist' : isAlbum ? 'album' : 'song',
    };
  }

  if (host === 'gaana.com') {
    const isPlaylist = path.includes('/playlist/');
    const isAlbum = path.includes('/album/');
    return {
      id: 'gaana',
      name: 'Gaana',
      color: '#E72C30',
      type: isPlaylist ? 'playlist' : isAlbum ? 'album' : 'song',
    };
  }

  if (host === 'wynk.in') {
    return {
      id: 'wynk',
      name: 'Wynk Music',
      color: '#0072D2',
      type: path.includes('/playlist/') ? 'playlist' : 'song',
    };
  }

  if (host.includes('amazon.') && (path.includes('/music') || host.includes('music.amazon'))) {
    return {
      id: 'amazon',
      name: 'Amazon Music',
      color: '#00A8E1',
      type: path.includes('/playlists/') ? 'playlist' : path.includes('/albums/') ? 'album' : 'song',
    };
  }

  if (host === 'deezer.com' || host === 'deezer.page.link') {
    return {
      id: 'deezer',
      name: 'Deezer',
      color: '#A238FF',
      type: path.includes('/playlist/') ? 'playlist' : path.includes('/album/') ? 'album' : 'song',
    };
  }

  if (host === 'audiomack.com') {
    return {
      id: 'audiomack',
      name: 'Audiomack',
      color: '#FFA200',
      type: path.includes('/album/') || path.includes('/playlist/') ? 'playlist' : 'song',
    };
  }

  if (host.endsWith('bandcamp.com')) {
    return {
      id: 'bandcamp',
      name: 'Bandcamp',
      color: '#1DA0C3',
      type: path.includes('/album/') ? 'album' : 'song',
    };
  }

  // Direct Audio stream detection
  const audioExtensions = ['.mp3', '.m4a', '.wav', '.flac', '.aac', '.ogg'];
  if (audioExtensions.some(ext => path.endsWith(ext))) {
    return {
      id: 'direct',
      name: 'Direct Audio File',
      color: '#563BFF',
      type: 'song',
    };
  }

  // Fallback to Universal Audio
  return {
    id: 'universal',
    name: 'Universal Audio',
    color: '#00B8FF',
    type: 'song',
  };
}

// ── Analyze Music URL Handler ──────────────────────────────────
router.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  const { url: rawUrl } = req.body;

  const validation = validateUrl(rawUrl);
  if (!validation.valid || !validation.url) {
    res.status(400).json({ success: false, error: validation.error });
    return;
  }

  const parsedUrl = validation.url;
  const ssrfCheck = await checkSsrf(parsedUrl.hostname);
  if (!ssrfCheck.safe) {
    res.status(400).json({ success: false, error: ssrfCheck.reason });
    return;
  }

  const platformInfo = detectMusicPlatform(parsedUrl);

  try {
    // 1. SPOTIFY Handler
    if (platformInfo.id === 'spotify') {
      try {
        const oembedRes = await axios.get(
          `https://open.spotify.com/oembed?url=${encodeURIComponent(rawUrl)}`,
          { timeout: 8000 }
        );
        const data = oembedRes.data;
        const title = data.title || 'Spotify Track';
        const artwork = data.thumbnail_url;

        // Clean artist/title if formatted like "Song by Artist"
        let trackTitle = title;
        let artistName = '';
        if (title.includes(' by ')) {
          const parts = title.split(' by ');
          trackTitle = parts[0];
          artistName = parts.slice(1).join(' by ');
        }

        const metadata: MusicMetadata = {
          type: platformInfo.type,
          platform: 'Spotify',
          platformId: 'spotify',
          platformColor: '#1DB954',
          title: trackTitle,
          artist: artistName,
          artwork,
          canDownload: false,
          drmProtected: true,
          drmNotice:
            'Spotify audio streams are protected by Widevine DRM and platform copyright agreements. Direct raw MP3 stream extraction is restricted by platform DRM. You can stream it directly on Spotify.',
          officialUrl: rawUrl,
          url: rawUrl,
        };

        res.json({ success: true, data: metadata });
        return;
      } catch {
        // Fallback Spotify metadata
        res.json({
          success: true,
          data: {
            type: platformInfo.type,
            platform: 'Spotify',
            platformId: 'spotify',
            platformColor: '#1DB954',
            title: 'Spotify Media',
            canDownload: false,
            drmProtected: true,
            drmNotice:
              'Spotify audio streams are protected by Widevine DRM. Direct file downloading is not supported.',
            officialUrl: rawUrl,
            url: rawUrl,
          },
        });
        return;
      }
    }

    // 2. APPLE MUSIC Handler
    if (platformInfo.id === 'apple') {
      try {
        const pageRes = await axios.get(rawUrl, {
          timeout: 8000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        const html = String(pageRes.data || '');
        const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/i)?.[1] || 'Apple Music Track';
        const ogImage = html.match(/property="og:image"\s+content="([^"]+)"/i)?.[1];
        const ogDesc = html.match(/property="og:description"\s+content="([^"]+)"/i)?.[1];

        res.json({
          success: true,
          data: {
            type: platformInfo.type,
            platform: 'Apple Music',
            platformId: 'apple',
            platformColor: '#FA2D48',
            title: ogTitle.replace(/ on Apple\s*Music/i, ''),
            artist: ogDesc || 'Apple Music',
            artwork: ogImage,
            canDownload: false,
            drmProtected: true,
            drmNotice:
              'Apple Music tracks are protected by FairPlay DRM. Direct downloading of encrypted AAC streams is restricted.',
            officialUrl: rawUrl,
            url: rawUrl,
          },
        });
        return;
      } catch {
        res.json({
          success: true,
          data: {
            type: platformInfo.type,
            platform: 'Apple Music',
            platformId: 'apple',
            platformColor: '#FA2D48',
            title: 'Apple Music Audio',
            canDownload: false,
            drmProtected: true,
            drmNotice:
              'Apple Music audio streams are protected by FairPlay DRM. Direct downloading is not supported.',
            officialUrl: rawUrl,
            url: rawUrl,
          },
        });
        return;
      }
    }

    // 3. AMAZON MUSIC / GAANA / WYNK / DEEZER (DRM Protected)
    if (['amazon', 'gaana', 'wynk', 'deezer'].includes(platformInfo.id)) {
      try {
        const pageRes = await axios.get(rawUrl, {
          timeout: 8000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        const html = String(pageRes.data || '');
        const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/i)?.[1] || `${platformInfo.name} Music`;
        const ogImage = html.match(/property="og:image"\s+content="([^"]+)"/i)?.[1];
        const ogDesc = html.match(/property="og:description"\s+content="([^"]+)"/i)?.[1];

        res.json({
          success: true,
          data: {
            type: platformInfo.type,
            platform: platformInfo.name,
            platformId: platformInfo.id,
            platformColor: platformInfo.color,
            title: ogTitle,
            artist: ogDesc,
            artwork: ogImage,
            canDownload: false,
            drmProtected: true,
            drmNotice: `${platformInfo.name} audio streams are protected by subscription DRM and terms of service. Direct downloading of protected streams is not supported.`,
            officialUrl: rawUrl,
            url: rawUrl,
          },
        });
        return;
      } catch {
        res.json({
          success: true,
          data: {
            type: platformInfo.type,
            platform: platformInfo.name,
            platformId: platformInfo.id,
            platformColor: platformInfo.color,
            title: `${platformInfo.name} Media`,
            canDownload: false,
            drmProtected: true,
            drmNotice: `${platformInfo.name} audio streams are protected by subscription DRM.`,
            officialUrl: rawUrl,
            url: rawUrl,
          },
        });
        return;
      }
    }

    // 4. SOUNDCLOUD Handler
    if (platformInfo.id === 'soundcloud') {
      try {
        const isSet = parsedUrl.pathname.includes('/sets/');
        if (isSet && isYtDlpAvailable()) {
          const pl = await getYtDlpPlaylistMetadata(rawUrl, 60);
          const tracks: MusicTrack[] = pl.entries.map((entry) => ({
            id: entry.id,
            title: entry.title,
            artist: entry.uploader || pl.uploader || 'SoundCloud Artist',
            duration: entry.duration,
            thumbnail: entry.thumbnail || pl.thumbnail,
            url: entry.url || rawUrl,
            canDownload: true,
            formats: generateAudioFormats(entry.url || rawUrl, entry.duration),
          }));

          res.json({
            success: true,
            data: {
              type: 'playlist',
              platform: 'SoundCloud',
              platformId: 'soundcloud',
              platformColor: '#FF5500',
              title: pl.title,
              artist: pl.uploader || 'SoundCloud Artist',
              artwork: pl.thumbnail,
              trackCount: tracks.length,
              tracks,
              canDownload: true,
              formats: generateAudioFormats(rawUrl, 240),
              officialUrl: rawUrl,
              url: rawUrl,
            },
          });
          return;
        }

        const oembedRes = await axios.get(
          `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(rawUrl)}`,
          { timeout: 8000 }
        );
        const data = oembedRes.data;
        const title = data.title || 'SoundCloud Track';
        const artist = data.author_name || 'SoundCloud Artist';
        const artwork = data.thumbnail_url;

        // Check if yt-dlp can process it directly
        const canYtDlp = isYtDlpAvailable();

        res.json({
          success: true,
          data: {
            type: platformInfo.type,
            platform: 'SoundCloud',
            platformId: 'soundcloud',
            platformColor: '#FF5500',
            title,
            artist,
            artwork,
            canDownload: canYtDlp,
            formats: canYtDlp ? generateAudioFormats(rawUrl, 240) : undefined,
            officialUrl: rawUrl,
            url: rawUrl,
          },
        });
        return;
      } catch {}
    }

    // 5. DIRECT AUDIO STREAM (.mp3, .m4a, .wav)
    if (platformInfo.id === 'direct') {
      const filename = parsedUrl.pathname.split('/').pop() || 'audio.mp3';
      const ext = (filename.split('.').pop() || 'mp3').toLowerCase();

      res.json({
        success: true,
        data: {
          type: 'song',
          platform: 'Direct Audio Stream',
          platformId: 'direct',
          platformColor: '#563BFF',
          title: decodeURIComponent(filename),
          artist: parsedUrl.hostname,
          canDownload: true,
          formats: [
            {
              id: 'direct_stream',
              label: `Direct ${ext.toUpperCase()} Audio`,
              quality: 'Original',
              format: ext as any,
              mimeType: ext === 'mp3' ? 'audio/mpeg' : ext === 'm4a' ? 'audio/mp4' : 'audio/wav',
              url: rawUrl,
            },
          ],
          url: rawUrl,
        },
      });
      return;
    }

    // 6. YOUTUBE MUSIC & UNIVERSAL ENGINE (Supported for real audio download)
    if (isYtDlpAvailable()) {
      const isPlaylistUrl =
        platformInfo.type === 'playlist' ||
        platformInfo.type === 'album' ||
        parsedUrl.searchParams.has('list') ||
        parsedUrl.pathname.includes('/playlist') ||
        parsedUrl.pathname.includes('/album');

      if (isPlaylistUrl) {
        try {
          const pl = await getYtDlpPlaylistMetadata(rawUrl, 60);
          const tracks: MusicTrack[] = pl.entries.map((entry) => ({
            id: entry.id,
            title: entry.title,
            artist: entry.uploader || pl.uploader || platformInfo.name,
            duration: entry.duration,
            thumbnail: entry.thumbnail || pl.thumbnail,
            url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
            canDownload: true,
            formats: generateAudioFormats(entry.url || `https://www.youtube.com/watch?v=${entry.id}`, entry.duration),
          }));

          res.json({
            success: true,
            data: {
              type: 'playlist',
              platform: platformInfo.name,
              platformId: platformInfo.id,
              platformColor: platformInfo.color,
              title: pl.title,
              artist: pl.uploader || platformInfo.name,
              artwork: pl.thumbnail,
              trackCount: tracks.length,
              tracks,
              canDownload: true,
              formats: generateAudioFormats(rawUrl, 210),
              officialUrl: rawUrl,
              url: rawUrl,
            },
          });
          return;
        } catch (plErr: any) {
          console.warn('[yt-dlp] Direct playlist analyze failed, falling back:', plErr?.message);
        }
      }

      // Single track extraction with playlist fallback
      try {
        const info = await getYtDlpMetadata(rawUrl);
        if ((info as any)._type === 'playlist') {
          const pl = await getYtDlpPlaylistMetadata(rawUrl, 60);
          const tracks: MusicTrack[] = pl.entries.map((entry) => ({
            id: entry.id,
            title: entry.title,
            artist: entry.uploader || pl.uploader || platformInfo.name,
            duration: entry.duration,
            thumbnail: entry.thumbnail || pl.thumbnail,
            url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
            canDownload: true,
            formats: generateAudioFormats(entry.url || `https://www.youtube.com/watch?v=${entry.id}`, entry.duration),
          }));

          res.json({
            success: true,
            data: {
              type: 'playlist',
              platform: platformInfo.name,
              platformId: platformInfo.id,
              platformColor: platformInfo.color,
              title: pl.title,
              artist: pl.uploader || platformInfo.name,
              artwork: pl.thumbnail,
              trackCount: tracks.length,
              tracks,
              canDownload: true,
              formats: generateAudioFormats(rawUrl, 210),
              officialUrl: rawUrl,
              url: rawUrl,
            },
          });
          return;
        }

        const title = info.title || 'Audio Track';
        const artist = info.uploader || (info as any).artist || platformInfo.name;
        const duration = info.duration ? Math.round(info.duration) : undefined;
        const artwork = info.thumbnail;
        const formats = generateAudioFormats(rawUrl, duration);

        res.json({
          success: true,
          data: {
            type: 'song',
            platform: platformInfo.name,
            platformId: platformInfo.id,
            platformColor: platformInfo.color,
            title,
            artist,
            album: (info as any).album,
            artwork,
            duration,
            canDownload: true,
            formats,
            officialUrl: rawUrl,
            url: rawUrl,
          },
        });
        return;
      } catch (singleErr: any) {
        if (singleErr?.message?.includes('playlist')) {
          const pl = await getYtDlpPlaylistMetadata(rawUrl, 60);
          const tracks: MusicTrack[] = pl.entries.map((entry) => ({
            id: entry.id,
            title: entry.title,
            artist: entry.uploader || pl.uploader || platformInfo.name,
            duration: entry.duration,
            thumbnail: entry.thumbnail || pl.thumbnail,
            url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
            canDownload: true,
            formats: generateAudioFormats(entry.url || `https://www.youtube.com/watch?v=${entry.id}`, entry.duration),
          }));

          res.json({
            success: true,
            data: {
              type: 'playlist',
              platform: platformInfo.name,
              platformId: platformInfo.id,
              platformColor: platformInfo.color,
              title: pl.title,
              artist: pl.uploader || platformInfo.name,
              artwork: pl.thumbnail,
              trackCount: tracks.length,
              tracks,
              canDownload: true,
              formats: generateAudioFormats(rawUrl, 210),
              officialUrl: rawUrl,
              url: rawUrl,
            },
          });
          return;
        }
        throw singleErr;
      }
    }

    res.status(422).json({
      success: false,
      error: `Could not analyze audio from ${platformInfo.name}.`,
    });
  } catch (err: any) {
    console.error('[Music Analyze Error]', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to analyze music URL.',
    });
  }
});

// ── Analyze Playlist Endpoint ──────────────────────────────────
router.post('/playlist/analyze', async (req: Request, res: Response): Promise<void> => {
  const { url: rawUrl } = req.body;

  const validation = validateUrl(rawUrl);
  if (!validation.valid || !validation.url) {
    res.status(400).json({ success: false, error: validation.error });
    return;
  }

  const platformInfo = detectMusicPlatform(validation.url);

  // If DRM protected playlist, return metadata with explanation
  if (['spotify', 'apple', 'amazon', 'gaana', 'wynk'].includes(platformInfo.id)) {
    res.json({
      success: true,
      data: {
        type: 'playlist',
        platform: platformInfo.name,
        platformId: platformInfo.id,
        platformColor: platformInfo.color,
        title: `${platformInfo.name} Playlist`,
        canDownload: false,
        drmProtected: true,
        drmNotice: `${platformInfo.name} playlists contain DRM-protected streaming assets. Direct bulk batch extraction of encrypted streams is prohibited.`,
        officialUrl: rawUrl,
        url: rawUrl,
        tracks: [],
      },
    });
    return;
  }

  try {
    const pl = await getYtDlpPlaylistMetadata(rawUrl, 60);
    const tracks: MusicTrack[] = pl.entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      artist: entry.uploader || pl.uploader || platformInfo.name,
      duration: entry.duration,
      thumbnail: entry.thumbnail || pl.thumbnail,
      url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
      canDownload: true,
      formats: generateAudioFormats(entry.url || `https://www.youtube.com/watch?v=${entry.id}`, entry.duration),
    }));

    res.json({
      success: true,
      data: {
        type: 'playlist',
        platform: platformInfo.name,
        platformId: platformInfo.id,
        platformColor: platformInfo.color,
        title: pl.title,
        artist: pl.uploader || platformInfo.name,
        artwork: pl.thumbnail,
        trackCount: tracks.length,
        tracks,
        canDownload: true,
        formats: generateAudioFormats(rawUrl, 210),
        officialUrl: rawUrl,
        url: rawUrl,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to analyze playlist.',
    });
  }
});

// ── Supported Music Sources List ───────────────────────────────
router.get('/sources', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'ytmusic',
        name: 'YouTube Music',
        category: 'Full Download (MP3 / M4A / WAV)',
        canDownload: true,
        formats: ['MP3 (320k)', 'M4A (256k)', 'MP3 (192k)', 'WAV'],
        description: 'Download songs, high-res audio tracks, and music videos.',
        examples: ['https://music.youtube.com/watch?v=...'],
      },
      {
        id: 'spotify',
        name: 'Spotify',
        category: 'Metadata & Stream Link (DRM Protected)',
        canDownload: false,
        formats: ['Open in Spotify App'],
        description: 'Rich track & playlist metadata preview with instant open in official app.',
        examples: ['https://open.spotify.com/track/...', 'https://open.spotify.com/playlist/...'],
      },
      {
        id: 'apple',
        name: 'Apple Music',
        category: 'Metadata & Stream Link (FairPlay DRM)',
        canDownload: false,
        formats: ['Open in Apple Music'],
        description: 'Album artwork, artist, and track identification with official platform link.',
        examples: ['https://music.apple.com/...'],
      },
      {
        id: 'soundcloud',
        name: 'SoundCloud',
        category: 'Stream & Download (Public Tracks)',
        canDownload: true,
        formats: ['MP3', 'M4A'],
        description: 'Stream previews and direct audio downloads for public creators.',
        examples: ['https://soundcloud.com/user/track'],
      },
      {
        id: 'jiosaavn',
        name: 'JioSaavn',
        category: 'Indian Music & Regional Audio',
        canDownload: false,
        formats: ['Open in JioSaavn'],
        description: 'Bollywood, Punjabi, and Regional music metadata with official stream links.',
        examples: ['https://www.jiosaavn.com/song/...'],
      },
      {
        id: 'bandcamp',
        name: 'Bandcamp',
        category: 'Independent Artists & High Quality Audio',
        canDownload: true,
        formats: ['MP3', 'WAV'],
        description: 'Direct audio stream extraction for independent artists on Bandcamp.',
        examples: ['https://artist.bandcamp.com/track/...'],
      },
      {
        id: 'direct',
        name: 'Direct Audio Files',
        category: 'Direct MP3, M4A, AAC, WAV, FLAC',
        canDownload: true,
        formats: ['MP3', 'M4A', 'WAV', 'FLAC'],
        description: 'Any public downloadable audio file URL.',
        examples: ['https://example.com/audio.mp3'],
      },
    ],
  });
});

export default router;

