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

export interface DownloadJob {
  id: string;
  url: string;
  title?: string;
  thumbnail?: string;
  sourceDomain?: string;
  format?: string;
  quality?: string;
  mimeType?: string;
  fileSize?: number;
  filename?: string;
  status: 'pending' | 'ready' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
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
export type AppSettings = {
  theme: Theme;
  language: string;
};
