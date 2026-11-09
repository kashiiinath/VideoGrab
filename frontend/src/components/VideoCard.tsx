'use client';

import React, { useState } from 'react';
import { VideoMetadata, VideoFormat } from '@/lib/types';
import { formatBytes, formatDuration } from '@/lib/api';
import { createDownload } from '@/lib/api';
import { downloadViaProxy } from '@/lib/download';
import { useApp } from '@/context/AppContext';
import {
  Download, Clock, Film, Music, Check, Loader2, AlertCircle, ArrowLeft, Heart, Play
} from 'lucide-react';

interface VideoCardProps {
  metadata: VideoMetadata;
  onBack?: () => void;
}

export default function VideoCard({ metadata, onBack }: VideoCardProps) {
  const { refreshJobs, setActiveTab, setAnalyzedVideo } = useApp();
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat>(metadata.formats[0]);
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  async function handleDownload() {
    if (downloading || done) return;
    setDownloading(true);
    setError('');
    setProgress(0);

    try {
      const job = await createDownload({
        url: metadata.url,
        title: metadata.title,
        mediaType: 'video',
        thumbnail: metadata.thumbnail,
        sourceDomain: metadata.sourceDomain,
        format: selectedFormat.format,
        quality: selectedFormat.quality,
        mimeType: selectedFormat.mimeType,
        fileSize: selectedFormat.fileSize,
        formatUrl: selectedFormat.url,
      });

      await downloadViaProxy({
        jobId: job.id,
        formatUrl: selectedFormat.url,
        filename: job.filename,
        onProgress: (info) => setProgress(typeof info === 'number' ? info : info.percent),
        onComplete: () => {
          setDone(true);
          setDownloading(false);
          refreshJobs();
          // Switch to downloads tab after 1.5s
          setTimeout(() => setActiveTab('downloads'), 1200);
        },
        onError: (msg) => {
          setError(msg);
          setDownloading(false);
        },
      });
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to start download');
      setDownloading(false);
    }
  }

  function handleClose() {
    if (onBack) {
      onBack();
    } else {
      setAnalyzedVideo(null);
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={handleClose}
          className="p-2 -ml-2 rounded-full text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/10 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>

        <h2 className="text-[16px] font-bold text-[var(--vg-text-primary)]">
          Video Preview
        </h2>

        <button
          onClick={() => setIsFavorite(v => !v)}
          className={`p-2 -mr-2 rounded-full transition-colors ${
            isFavorite ? 'text-red-500' : 'text-[var(--vg-text-secondary)] hover:text-red-400'
          }`}
          aria-label="Favorite"
        >
          <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Main Preview Card */}
      <div
        className="rounded-3xl overflow-hidden border p-4 space-y-4 shadow-xl transition-all"
        style={{
          backgroundColor: 'var(--vg-card)',
          borderColor: 'var(--vg-border)',
        }}
      >
        {/* Thumbnail Preview Player */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-neutral-900 border border-[var(--vg-border)] group">
          {metadata.thumbnail ? (
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0D1020] to-[#191D31]">
              <Film size={36} className="text-[var(--vg-text-muted)]" />
            </div>
          )}

          {/* Central Glow Play Icon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
              <Play size={20} className="text-white fill-white ml-0.5" />
            </div>
          </div>

          {/* Duration Badge */}
          {metadata.duration && (
            <span className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-md font-mono">
              {formatDuration(metadata.duration)}
            </span>
          )}

          {/* Source Platform Badge */}
          <span className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {metadata.provider || metadata.sourceDomain}
          </span>
        </div>

        {/* Video Info: Title, Platform, Duration, Size */}
        <div>
          <h3 className="font-bold text-[var(--vg-text-primary)] text-[15px] leading-snug line-clamp-2">
            {metadata.title}
          </h3>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--vg-text-secondary)] font-medium">
            {metadata.duration && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatDuration(metadata.duration)}
              </span>
            )}
            {selectedFormat.fileSize && (
              <span>• {formatBytes(selectedFormat.fileSize)}</span>
            )}
            <span>• {selectedFormat.format.toUpperCase()}</span>
          </div>
        </div>

        {/* Available Quality Options */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--vg-text-secondary)] uppercase tracking-wider">
              Available Quality
            </span>
            <span className="text-[11px] text-[var(--vg-text-muted)] font-medium">
              {metadata.formats.length} formats
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5 scrollbar-hide">
            {metadata.formats.map((fmt) => {
              const isSelected = selectedFormat.id === fmt.id;
              return (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-3 rounded-2xl border text-left transition-all
                    ${
                      isSelected
                        ? 'border-[#563BFF] bg-[#563BFF]/10 shadow-[0_0_15px_rgba(86,59,255,0.15)]'
                        : 'border-[var(--vg-border)] hover:border-[#563BFF]/40 bg-[var(--vg-bg-secondary)]'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Radio Indicator */}
                    <div
                      className={`
                        w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                        ${
                          isSelected
                            ? 'border-[#563BFF] bg-[#563BFF]'
                            : 'border-[var(--vg-text-muted)]'
                        }
                      `}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>

                    <div className="flex items-center gap-2">
                      {fmt.hasVideo ? (
                        <Film size={14} className={isSelected ? 'text-[#00B8FF]' : 'text-[var(--vg-text-muted)]'} />
                      ) : (
                        <Music size={14} className={isSelected ? 'text-[#DB20E8]' : 'text-[var(--vg-text-muted)]'} />
                      )}
                      <span className="text-[13px] font-bold text-[var(--vg-text-primary)]">
                        {fmt.quality}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <span className="text-xs font-semibold text-[var(--vg-text-secondary)]">
                      {fmt.format.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-[var(--vg-text-muted)] min-w-[55px]">
                      {fmt.fileSize ? formatBytes(fmt.fileSize) : 'Direct'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Display */}
        {downloading && progress > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-semibold text-[var(--vg-text-secondary)]">
              <span>Preparing download…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-[var(--vg-bg-secondary)] rounded-full overflow-hidden border border-[var(--vg-border)]">
              <div
                className="h-full gradient-bg transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-2xl p-3 text-red-500 text-xs font-medium">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Download Button: Gradient Pill */}
        <button
          onClick={handleDownload}
          disabled={downloading || done}
          className={`
            w-full flex items-center justify-center gap-2 py-4 rounded-full font-bold text-[15px]
            ${
              done
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : downloading
                ? 'bg-neutral-600 text-white cursor-wait opacity-80'
                : 'gradient-btn active:scale-[0.98]'
            }
          `}
        >
          {done ? (
            <>
              <Check size={18} strokeWidth={2.5} />
              <span>Download Started</span>
            </>
          ) : downloading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Starting Download…</span>
            </>
          ) : (
            <>
              <Download size={18} strokeWidth={2.5} />
              <span>Download Now</span>
            </>
          )}
        </button>

        {done && (
          <p className="text-center text-[11px] text-[var(--vg-text-muted)] font-medium">
            File is saving to your device&apos;s Downloads folder.
          </p>
        )}
      </div>
    </div>
  );
}
