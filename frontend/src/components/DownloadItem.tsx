'use client';

import React, { useState } from 'react';
import { DownloadJob } from '@/lib/types';
import { formatBytes, formatDate, deleteDownload, pauseDownload, resumeDownload } from '@/lib/api';
import { pauseDownloadJob } from '@/lib/download';
import { useApp } from '@/context/AppContext';
import {
  Trash2, RefreshCw, Download, Film, ChevronDown, ChevronUp, AlertCircle, Play, Pause, CheckCircle2, Music
} from 'lucide-react';

interface DownloadItemProps {
  job: DownloadJob;
  onPlayMedia?: (job: DownloadJob) => void;
}

export default function DownloadItem({ job, onPlayMedia }: DownloadItemProps) {
  const { refreshJobs, updateJobLocal, setIsQueuePaused } = useApp();
  const [expanded, setExpanded] = useState(false);
  const isMusic = job.mediaType === 'music' || ['mp3', 'm4a', 'wav', 'flac', 'aac'].includes(job.format?.toLowerCase() || '');

  const isDownloading = job.status === 'processing';
  const isPaused = job.status === 'paused';
  const isReady = ['pending', 'ready'].includes(job.status);
  const isCompleted = job.status === 'completed';

  async function handleDelete() {
    pauseDownloadJob(job.id);
    await deleteDownload(job.id);
    refreshJobs();
  }

  function handleStartDownload() {
    if (!job.downloadUrl || !job.filename) return;
    updateJobLocal(job.id, { status: 'ready', speed: undefined });
    setIsQueuePaused(false);
  }

  function handlePause() {
    pauseDownloadJob(job.id);
    pauseDownload(job.id).catch(() => {});
    updateJobLocal(job.id, { status: 'paused', speed: undefined });
  }

  async function handleResume() {
    resumeDownload(job.id).catch(() => {});
    updateJobLocal(job.id, { status: 'ready', speed: undefined });
    setIsQueuePaused(false);
  }

  function handleRetry() {
    updateJobLocal(job.id, { status: 'ready', progress: 0, errorMessage: undefined, speed: undefined });
    setIsQueuePaused(false);
  }

  function handleDownloadAgain() {
    if (!job.downloadUrl || !job.filename) return;
    updateJobLocal(job.id, { status: 'ready', progress: 0, errorMessage: undefined, speed: undefined });
    setIsQueuePaused(false);
  }

  return (
    <div
      className={`rounded-2xl border p-3 transition-all shadow-sm ${
        isDownloading
          ? 'border-[#00B8FF]/40 bg-[var(--vg-card)] shadow-[0_0_15px_rgba(0,184,255,0.08)]'
          : isPaused
          ? 'border-amber-500/30 bg-[var(--vg-card)]'
          : 'border-[var(--vg-border)] bg-[var(--vg-card)]'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* VidMate Style Thumbnail with format tag */}
        <div
          onClick={() => isCompleted && onPlayMedia?.(job)}
          className={`relative w-16 h-14 rounded-xl overflow-hidden bg-neutral-900 border border-[var(--vg-border)] flex-shrink-0 group ${
            isCompleted ? 'cursor-pointer hover:border-[#00B8FF]' : ''
          }`}
        >
          {job.thumbnail ? (
            <img
              src={job.thumbnail}
              alt=""
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-800">
              {isMusic ? (
                <Music size={18} className="text-[#00B8FF]" />
              ) : (
                <Film size={18} className="text-neutral-500" />
              )}
            </div>
          )}

          {/* Overlay Tag / Icon */}
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
            {isCompleted ? (
              <div className="w-6 h-6 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play size={10} className="fill-white text-white ml-0.5" />
              </div>
            ) : isMusic ? (
              <Music size={11} className="text-white opacity-85" />
            ) : (
              <Film size={11} className="text-white opacity-85" />
            )}
          </div>

          {/* Bottom format pill on thumbnail */}
          <span className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-xs text-[8px] font-bold px-1 rounded text-white font-mono uppercase">
            {job.format || (isMusic ? 'MP3' : 'MP4')}
          </span>
        </div>

        {/* Middle Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-[var(--vg-text-primary)] truncate leading-snug">
            {job.title || job.filename || 'Untitled'}
          </p>

          {job.artist && (
            <p className="text-[11px] text-[var(--vg-text-secondary)] truncate font-semibold mt-0.5">
              {job.artist}
            </p>
          )}

          {/* Subtext info based on status */}
          <div className="mt-1 flex items-center gap-1.5 text-[11px] flex-wrap">
            {isDownloading && (
              <div className="flex items-center gap-2 text-[#00B8FF] font-semibold">
                <span className="font-mono text-[10px]">
                  {job.downloadedBytes && job.totalBytes
                    ? `${formatBytes(job.downloadedBytes)} / ${formatBytes(job.totalBytes)}`
                    : `${job.progress}%`}
                </span>
                {job.speed && (
                  <>
                    <span className="text-[var(--vg-text-muted)]">•</span>
                    <span className="text-xs font-mono font-bold">{job.speed}</span>
                  </>
                )}
              </div>
            )}

            {isPaused && (
              <div className="flex items-center gap-1.5 text-amber-500 font-semibold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Paused • {job.progress}%</span>
                {job.downloadedBytes && (
                  <span className="text-[var(--vg-text-muted)] font-mono">
                    ({formatBytes(job.downloadedBytes)})
                  </span>
                )}
              </div>
            )}

            {isReady && (
              <span className="text-[11px] text-[var(--vg-text-muted)] font-medium">
                Ready to save • {job.quality || '320k'} {job.format?.toUpperCase() || 'MP3'}
              </span>
            )}

            {isCompleted && (
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--vg-text-muted)] font-medium">
                <span className="text-emerald-500 font-bold">Saved</span>
                {job.fileSize && (
                  <>
                    <span>•</span>
                    <span>{formatBytes(job.fileSize)}</span>
                  </>
                )}
                <span>•</span>
                <span>{job.quality || '320k'}</span>
              </div>
            )}

            {job.status === 'failed' && (
              <span className="text-xs text-rose-500 font-semibold truncate max-w-[200px]">
                {job.errorMessage || 'Download failed'}
              </span>
            )}
          </div>
        </div>

        {/* VidMate Style Action Button (Right Side) */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* 1. Downloading: Show PAUSE button (⏸️) */}
          {isDownloading && (
            <button
              onClick={handlePause}
              className="w-9 h-9 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-500 flex items-center justify-center transition-transform active:scale-90"
              title="Pause download"
            >
              <Pause size={15} className="fill-amber-500 text-amber-500" />
            </button>
          )}

          {/* 2. Paused: Show RESUME button (▶️) */}
          {isPaused && (
            <button
              onClick={handleResume}
              className="w-9 h-9 rounded-full bg-[#00B8FF]/15 hover:bg-[#00B8FF]/25 border border-[#00B8FF]/40 text-[#00B8FF] flex items-center justify-center transition-transform active:scale-90 shadow-sm"
              title="Resume download"
            >
              <Play size={14} className="fill-[#00B8FF] text-[#00B8FF] ml-0.5" />
            </button>
          )}

          {/* 3. Ready: Show DOWNLOAD button (⬇️) */}
          {isReady && (
            <button
              onClick={handleStartDownload}
              className="w-9 h-9 rounded-full gradient-btn text-white flex items-center justify-center transition-transform active:scale-90 shadow-md hover:scale-105"
              title="Download to device"
            >
              <Download size={15} strokeWidth={2.5} />
            </button>
          )}

          {/* 4. Completed: Show Direct Action Buttons */}
          {isCompleted && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPlayMedia ? onPlayMedia(job) : handleDownloadAgain()}
                className="w-8 h-8 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 flex items-center justify-center transition-all active:scale-90"
                title={isMusic ? 'Play track' : 'Open media'}
              >
                <Play size={13} className="fill-emerald-500 ml-0.5" />
              </button>
              <button
                onClick={handleDownloadAgain}
                className="w-8 h-8 rounded-full bg-neutral-500/10 hover:bg-neutral-500/20 text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] flex items-center justify-center transition-all active:scale-90"
                title="Download file again"
              >
                <Download size={13} />
              </button>
            </div>
          )}

          {/* 5. Failed: Show RETRY button */}
          {job.status === 'failed' && (
            <button
              onClick={handleRetry}
              className="w-9 h-9 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-500 flex items-center justify-center transition-transform active:scale-90"
              title="Retry download"
            >
              <RefreshCw size={13} />
            </button>
          )}

          {/* More Details Chevron */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-full text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/10 transition-colors"
            aria-label="Toggle details"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* VidMate Style Live Progress Bar (when downloading or paused) */}
      {(isDownloading || isPaused) && (
        <div className="mt-2.5 space-y-1">
          <div className="h-1.5 bg-[var(--vg-bg-secondary)] rounded-full overflow-hidden border border-[var(--vg-border)]">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isPaused
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-[#00B8FF] via-[#563BFF] to-[#DB20E8]'
              }`}
              style={{ width: `${Math.max(6, job.progress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Expanded Details Section */}
      {expanded && (
        <div className="border-t border-[var(--vg-border)] mt-3 pt-2.5 space-y-2 text-xs text-[var(--vg-text-secondary)]">
          {job.errorMessage && (
            <div className="flex items-start gap-2 bg-red-500/10 rounded-xl p-2.5 text-red-500 font-medium">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{job.errorMessage}</span>
            </div>
          )}

          <div className="space-y-1 text-[11px]">
            {job.filename && <p><span className="font-semibold text-[var(--vg-text-primary)]">File:</span> {job.filename}</p>}
            {job.sourceDomain && <p><span className="font-semibold text-[var(--vg-text-primary)]">Source:</span> {job.sourceDomain}</p>}
            <p><span className="font-semibold text-[var(--vg-text-primary)]">Started:</span> {formatDate(job.createdAt)}</p>
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {isReady && job.downloadUrl && (
              <button
                onClick={handleStartDownload}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl gradient-btn text-white text-[11px] font-bold"
              >
                <Download size={13} strokeWidth={2.5} />
                <span>Start Download</span>
              </button>
            )}

            {isDownloading && (
              <button
                onClick={handlePause}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 text-white text-[11px] font-bold"
              >
                <Pause size={13} />
                <span>Pause</span>
              </button>
            )}

            {isPaused && (
              <button
                onClick={handleResume}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl gradient-btn text-white text-[11px] font-bold"
              >
                <Play size={13} className="fill-white" />
                <span>Resume Download</span>
              </button>
            )}

            {isCompleted && (
              <button
                onClick={handleDownloadAgain}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors"
              >
                <Download size={12} />
                Save Again to Device
              </button>
            )}

            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 text-[11px] font-semibold transition-colors ml-auto"
            >
              <Trash2 size={12} />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
