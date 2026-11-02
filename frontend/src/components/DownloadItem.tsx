'use client';

import React, { useState } from 'react';
import { DownloadJob } from '@/lib/types';
import { formatBytes, formatDate, buildProxyUrl, deleteDownload } from '@/lib/api';
import { downloadViaProxy } from '@/lib/download';
import { useApp } from '@/context/AppContext';
import StatusBadge from './StatusBadge';
import {
  Trash2, RefreshCw, Download, Film, ChevronDown, ChevronUp, AlertCircle, Play, CheckCircle2, Music
} from 'lucide-react';

interface DownloadItemProps {
  job: DownloadJob;
}

export default function DownloadItem({ job }: DownloadItemProps) {
  const { refreshJobs, updateJobLocal } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const isMusic = job.mediaType === 'music' || ['mp3', 'm4a', 'wav', 'flac', 'aac'].includes(job.format?.toLowerCase() || '');

  async function handleDelete() {
    await deleteDownload(job.id);
    refreshJobs();
  }

  async function handleRetry() {
    if (retrying || !job.downloadUrl || !job.filename) return;
    setRetrying(true);
    updateJobLocal(job.id, { status: 'processing', progress: 0 });

    await downloadViaProxy({
      jobId: job.id,
      formatUrl: job.downloadUrl,
      filename: job.filename,
      onProgress: (p) => updateJobLocal(job.id, { progress: p }),
      onComplete: () => {
        updateJobLocal(job.id, { status: 'completed', progress: 100 });
        setRetrying(false);
        refreshJobs();
      },
      onError: (err) => {
        updateJobLocal(job.id, { status: 'failed', errorMessage: err });
        setRetrying(false);
        refreshJobs();
      },
    });
  }

  async function handleDownloadAgain() {
    if (!job.downloadUrl || !job.filename) return;
    const a = document.createElement('a');
    a.href = buildProxyUrl(job.downloadUrl, job.filename);
    a.download = job.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div
      className="rounded-2xl border p-3 space-y-2.5 transition-all shadow-sm"
      style={{
        backgroundColor: 'var(--vg-card)',
        borderColor: 'var(--vg-border)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Thumbnail */}
        <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-neutral-900 border border-[var(--vg-border)] flex-shrink-0">
          {job.thumbnail ? (
            <img
              src={job.thumbnail}
              alt=""
              className="w-full h-full object-cover"
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
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
            {isMusic ? (
              <Music size={11} className="text-white opacity-90" />
            ) : (
              <Play size={10} className="fill-white text-white opacity-90" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-[var(--vg-text-primary)] truncate">
            {job.title || job.filename || 'Untitled'}
          </p>
          {job.artist && (
            <p className="text-[11px] text-[var(--vg-text-secondary)] truncate font-semibold">
              {job.artist}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[var(--vg-text-muted)] font-medium">
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${isMusic ? 'bg-[#00B8FF]/15 text-[#00B8FF]' : 'bg-[#563BFF]/15 text-[#563BFF]'}`}>
              {isMusic ? 'MUSIC' : 'VIDEO'}
            </span>
            <span>•</span>
            <span>{job.quality || (isMusic ? '320k' : 'HD')}</span>
            <span>•</span>
            <span>{job.format?.toUpperCase() || (isMusic ? 'MP3' : 'MP4')}</span>
            {job.fileSize && (
              <>
                <span>•</span>
                <span>{formatBytes(job.fileSize)}</span>
              </>
            )}
          </div>
        </div>

        {/* Status / Quick Action */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {job.status === 'completed' && (
            <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-500/20" />
          )}

          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-full text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/10 transition-colors"
            aria-label="Toggle details"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Progress Bar (if processing) */}
      {job.status === 'processing' && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-semibold text-[var(--vg-text-muted)]">
            <span>Downloading…</span>
            <span>{job.progress}%</span>
          </div>
          <div className="h-1.5 bg-[var(--vg-bg-secondary)] rounded-full overflow-hidden border border-[var(--vg-border)]">
            <div
              className="h-full gradient-bg transition-all duration-300 rounded-full"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Expanded Actions & Info */}
      {expanded && (
        <div className="border-t border-[var(--vg-border)] pt-2.5 space-y-2.5 text-xs text-[var(--vg-text-secondary)]">
          {job.errorMessage && (
            <div className="flex items-start gap-2 bg-red-500/10 rounded-xl p-2.5 text-red-500 font-medium">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{job.errorMessage}</span>
            </div>
          )}

          <div className="space-y-1 text-[11px]">
            {job.filename && <p><span className="font-semibold">File:</span> {job.filename}</p>}
            {job.sourceDomain && <p><span className="font-semibold">Source:</span> {job.sourceDomain}</p>}
            <p><span className="font-semibold">Started:</span> {formatDate(job.createdAt)}</p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {(job.status === 'failed' || job.status === 'cancelled') && job.downloadUrl && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl gradient-btn text-white text-[11px] font-bold"
              >
                <RefreshCw size={12} className={retrying ? 'animate-spin' : ''} />
                Retry
              </button>
            )}
            {job.status === 'completed' && job.downloadUrl && (
              <button
                onClick={handleDownloadAgain}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors"
              >
                <Download size={12} />
                Save Again
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
