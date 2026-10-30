export interface VideoFormat {
  id: string;
  label: string;
  quality: string;       // e.g. "1080p", "720p", "480p", "audio"
  format: string;        // e.g. "mp4", "webm"
  mimeType: string;
  fileSize?: number;     // bytes
  bitrate?: number;
  fps?: number;
  url: string;           // direct download URL for this format
  hasVideo: boolean;
  hasAudio: boolean;
}

export interface VideoMetadata {
  url: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;     // seconds
  sourceDomain: string;
  provider: string;
  formats: VideoFormat[];
  isLive?: boolean;
}

export interface ProviderResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface IProvider {
  name: string;
  canHandle(url: URL): boolean;
  getMetadata(url: URL, rawUrl: string): Promise<ProviderResult<VideoMetadata>>;
}
