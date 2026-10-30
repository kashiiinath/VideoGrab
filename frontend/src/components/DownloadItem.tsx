'use client';

import React, { useState } from 'react';
import { DownloadJob } from '@/lib/types';
import { formatBytes, formatDate, buildProxyUrl, deleteDownload } from '@/lib/api';
import { downloadViaProxy } from '@/lib/download';
import { useApp } from '@/context/AppContext';
import StatusBadge from './StatusBadge';
import {
  Trash2, RefreshCw, Download, Film, X, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';

interface DownloadItemProps {
  job: DownloadJob;
}

export default function DownloadItem({ job }: DownloadItemProps) {
  const { refreshJobs, updateJobLocal } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [retrying, setRetrying] = useState(false);

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

  const thumbnailUrl = job.thumbnail;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        {/* Thumbnail */}
        <div className="w-16 h-12 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-700 flex-shrink-0 flex items-center justify-center">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <Film className="w-5 h-5 text-neutral-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-800 dark:text-white truncate leading-snug">
            {job.title || job.filename || 'Untitled'}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StatusBadge status={job.status} />
            {job.format && (
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                {job.format.toUpperCase()} · {job.quality}
              </span>
            )}
            {job.fileSize && (
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                {formatBytes(job.fileSize)}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {job.status === 'processing' && (
            <div className="mt-2 space-y-0.5">
              <div className="h-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-300"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-neutral-400">{job.progress}%</p>
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors flex-shrink-0"
          aria-label="Toggle details"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-neutral-100 dark:border-neutral-700 px-3 py-3 space-y-3">
          {/* Error */}
          {job.errorMessage && (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 rounded-xl px-2.5 py-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 dark:text-red-400">{job.errorMessage}</p>
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
            {job.filename && <p><span className="font-medium">File:</span> {job.filename}</p>}
            {job.sourceDomain && <p><span className="font-medium">Source:</span> {job.sourceDomain}</p>}
            <p><span className="font-medium">Started:</span> {formatDate(job.createdAt)}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {(job.status === 'failed' || job.status === 'cancelled') && job.downloadUrl && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                Retry
              </button>
            )}
            {job.status === 'completed' && job.downloadUrl && (
              <button
                onClick={handleDownloadAgain}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Again
              </button>
            )}
            {job.status === 'ready' && job.downloadUrl && (
              <button
                onClick={handleDownloadAgain}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            )}
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
