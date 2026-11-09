export interface VideoFormat {
  id: string;
  label: string;
  quality: string;
  format: string;
  mimeType: string;
  fileSize?: number;
  bitrate?: number;
  fps?: number;
  url: string;
  hasVideo: boolean;
  hasAudio: boolean;
}

export interface VideoMetadata {
  url: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  sourceDomain: string;
  provider: string;
  formats: VideoFormat[];
  isLive?: boolean;
}

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
  thumbnail?: string;
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

export interface MusicSource {
  id: string;
  name: string;
  category: string;
  canDownload: boolean;
  formats: string[];
  description: string;
  examples: string[];
}

export interface DownloadJob {
  id: string;
  url: string;
  title?: string;
  artist?: string;
  mediaType?: 'video' | 'music';
  thumbnail?: string;
  sourceDomain?: string;
  format?: string;
  quality?: string;
  mimeType?: string;
  fileSize?: number;
  filename?: string;
  status: 'pending' | 'ready' | 'processing' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  speed?: string;
  downloadedBytes?: number;
  totalBytes?: number;
  errorMessage?: string;
  downloadUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface HistoryEntry {
  id: string;
  jobId: string;
  url: string;
  title?: string;
  artist?: string;
  mediaType?: 'video' | 'music';
  thumbnail?: string;
  sourceDomain?: string;
  format?: string;
  quality?: string;
  fileSize?: number;
  filename?: string;
  status: string;
  errorMessage?: string;
  createdAt: number;
  completedAt?: number;
}

export interface SupportedSource {
  name: string;
  description: string;
  examples: string[];
}

export type Theme = 'light' | 'dark' | 'system';
export type DefaultAudioQuality = '320k' | '256k' | '192k' | '128k' | 'lossless';
export type DefaultVideoQuality = '1080p' | '720p' | '480p' | '360p';

export type AppSettings = {
  theme: Theme;
  language: string;
  defaultAudioQuality?: DefaultAudioQuality;
  defaultVideoQuality?: DefaultVideoQuality;
  notificationsEnabled?: boolean;
};
