'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { VideoMetadata, VideoFormat } from '@/lib/types';
import { formatBytes, formatDuration, buildProxyUrl } from '@/lib/api';
import { createDownload } from '@/lib/api';
import { downloadViaProxy } from '@/lib/download';
import { useApp } from '@/context/AppContext';
import { Download, Clock, Globe, Film, Music, Check, Loader2, AlertCircle } from 'lucide-react';

interface VideoCardProps {
  metadata: VideoMetadata;
}

export default function VideoCard({ metadata }: VideoCardProps) {
  const { refreshJobs, setActiveTab } = useApp();
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat>(metadata.formats[0]);
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  async function handleDownload() {
    if (downloading || done) return;
    setDownloading(true);
    setError('');
    setProgress(0);

    try {
      const job = await createDownload({
        url: metadata.url,
        title: metadata.title,
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
        onProgress: (p) => setProgress(p),
        onComplete: () => {
          setDone(true);
          setDownloading(false);
          refreshJobs();
          // Switch to downloads tab after 1.5s
          setTimeout(() => setActiveTab('downloads'), 1500);
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

  const hasMultipleFormats = metadata.formats.length > 1;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl overflow-hidden shadow-sm border border-neutral-100 dark:border-neutral-700">
      {/* Thumbnail */}
      {metadata.thumbnail && (
        <div className="relative w-full aspect-video bg-neutral-900">
          <img
            src={metadata.thumbnail}
            alt={metadata.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {metadata.duration && (
            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-mono">
              {formatDuration(metadata.duration)}
            </span>
          )}
          {metadata.isLive && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE
            </span>
          )}
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Title & source */}
        <div>
          <h3 className="font-semibold text-neutral-900 dark:text-white text-sm leading-snug line-clamp-2">
            {metadata.title}
          </h3>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {metadata.sourceDomain}
            </span>
            <span className="flex items-center gap-1">
              <Film className="w-3 h-3" />
              {metadata.provider}
            </span>
            {metadata.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(metadata.duration)}
              </span>
            )}
          </div>
        </div>

        {/* Format selector */}
        {hasMultipleFormats ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
              Available Formats
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {metadata.formats.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all ${
                    selectedFormat.id === fmt.id
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-500'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-violet-300 dark:hover:border-violet-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {fmt.hasVideo && fmt.hasAudio ? (
                      <Film className="w-3.5 h-3.5 text-violet-500" />
                    ) : (
                      <Music className="w-3.5 h-3.5 text-blue-500" />
                    )}
                    <div>
                      <span className="text-sm font-medium text-neutral-800 dark:text-white">
                        {fmt.quality}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-1.5">
                        {fmt.format.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {fmt.fileSize && (
                      <span className="text-xs text-neutral-400">{formatBytes(fmt.fileSize)}</span>
                    )}
                    {selectedFormat.id === fmt.id && (
                      <Check className="w-4 h-4 text-violet-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Single format — just show info chips */
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs px-2.5 py-1 rounded-full font-medium">
              <Film className="w-3 h-3" />
              {selectedFormat.format.toUpperCase()}
            </span>
            <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs px-2.5 py-1 rounded-full font-medium">
              {selectedFormat.quality}
            </span>
            {selectedFormat.fileSize && (
              <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs px-2.5 py-1 rounded-full font-medium">
                {formatBytes(selectedFormat.fileSize)}
              </span>
            )}
          </div>
        )}

        {/* Selected format summary */}
        {hasMultipleFormats && (
          <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-700/50 rounded-xl px-3 py-2">
            <span>Selected:</span>
            <span className="font-semibold text-neutral-800 dark:text-white">{selectedFormat.quality} · {selectedFormat.format.toUpperCase()}</span>
            {selectedFormat.fileSize && <span>· {formatBytes(selectedFormat.fileSize)}</span>}
          </div>
        )}

        {/* Progress bar */}
        {downloading && progress > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span>Downloading…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={downloading || done}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all ${
            done
              ? 'bg-green-500 text-white'
              : downloading
              ? 'bg-violet-400 text-white cursor-wait'
              : 'bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white shadow-lg shadow-violet-500/25'
          }`}
        >
          {done ? (
            <>
              <Check className="w-4 h-4" />
              Download Started
            </>
          ) : downloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {progress > 0 ? `${progress}%` : 'Starting…'}
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download {selectedFormat.quality} {selectedFormat.format.toUpperCase()}
            </>
          )}
        </button>

        {done && (
          <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
            Check your browser's Downloads folder or notification bar.
          </p>
        )}
      </div>
    </div>
  );
}
