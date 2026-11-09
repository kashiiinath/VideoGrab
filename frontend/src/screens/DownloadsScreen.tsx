'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import DownloadItem from '@/components/DownloadItem';
import { DownloadJob } from '@/lib/types';
import { clearAllDownloads, formatBytes, buildProxyUrl } from '@/lib/api';
import {
  ArrowLeft, RefreshCw, Download, Film, Music, Trash2, Play, Pause,
  HardDrive, X, Volume2, CheckCircle2
} from 'lucide-react';

type VidmateTab = 'downloading' | 'downloaded' | 'failed';
type MediaFilter = 'all' | 'video' | 'music';

export default function DownloadsScreen() {
  const {
    jobs,
    refreshJobs,
    setActiveTab,
    isQueuePaused,
    pauseQueue,
    resumeQueue,
    currentlyDownloadingJob
  } = useApp();

  const [activeVidmateTab, setActiveVidmateTab] = useState<VidmateTab>('downloading');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [activePlayingJob, setActivePlayingJob] = useState<DownloadJob | null>(null);

  // Filter logic
  const filtered = jobs.filter(j => {
    // Status check
    if (activeVidmateTab === 'downloading' && !['pending', 'ready', 'processing', 'paused'].includes(j.status)) return false;
    if (activeVidmateTab === 'downloaded' && j.status !== 'completed') return false;
    if (activeVidmateTab === 'failed' && !['failed', 'cancelled'].includes(j.status)) return false;

    // Media type check
    const isAudio = j.mediaType === 'music' || ['mp3', 'm4a', 'wav', 'flac', 'aac'].includes(j.format?.toLowerCase() || '');
    if (mediaFilter === 'video' && isAudio) return false;
    if (mediaFilter === 'music' && !isAudio) return false;

    return true;
  });

  const counts = {
    downloading: jobs.filter(j => ['pending', 'ready', 'processing', 'paused'].includes(j.status)).length,
    downloaded: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => ['failed', 'cancelled'].includes(j.status)).length,
  };

  const isAnyDownloading = jobs.some(j => j.status === 'processing');

  // Total downloaded storage calculation
  const totalCompletedBytes = jobs
    .filter(j => j.status === 'completed')
    .reduce((sum, j) => sum + (j.fileSize || 0), 0);

  // Clear all jobs
  async function handleClearAll() {
    if (window.confirm('Clear all downloads history?')) {
      await clearAllDownloads();
      refreshJobs();
    }
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('home')}
            className="p-2 -ml-2 rounded-full text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/10 transition-colors"
            aria-label="Back to Home"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[var(--vg-text-primary)] leading-tight">
              Download Manager
            </h1>
            <p className="text-[11px] text-[var(--vg-text-muted)] font-medium">
              VidMate Engine • {counts.downloading} active, {counts.downloaded} saved
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {jobs.length > 0 && (
            <button
              onClick={handleClearAll}
              className="p-2 rounded-full text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              aria-label="Clear All Downloads"
              title="Clear all downloads"
            >
              <Trash2 size={17} />
            </button>
          )}

          <button
            onClick={refreshJobs}
            className="p-2 rounded-full text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/10 transition-colors"
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      {/* VidMate Style Primary Tabs: Downloading vs Downloaded */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[var(--vg-card)] border border-[var(--vg-border)] shadow-sm">
        {/* Tab 1: Downloading */}
        <button
          onClick={() => setActiveVidmateTab('downloading')}
          className={`
            py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2
            ${
              activeVidmateTab === 'downloading'
                ? 'gradient-btn shadow-md text-white'
                : 'text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/5'
            }
          `}
        >
          <div className="flex items-center gap-1.5">
            <Download size={14} className={isAnyDownloading ? 'animate-bounce' : ''} />
            <span>Downloading</span>
          </div>
          {counts.downloading > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeVidmateTab === 'downloading'
                  ? 'bg-white/25 text-white'
                  : 'bg-[#00B8FF]/15 text-[#00B8FF]'
              }`}
            >
              {counts.downloading}
            </span>
          )}
        </button>

        {/* Tab 2: Downloaded (Saved) */}
        <button
          onClick={() => setActiveVidmateTab('downloaded')}
          className={`
            py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2
            ${
              activeVidmateTab === 'downloaded'
                ? 'gradient-btn shadow-md text-white'
                : 'text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/5'
            }
          `}
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            <span>Downloaded</span>
          </div>
          {counts.downloaded > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeVidmateTab === 'downloaded'
                  ? 'bg-white/25 text-white'
                  : 'bg-emerald-500/15 text-emerald-500'
              }`}
            >
              {counts.downloaded}
            </span>
          )}
        </button>
      </div>

      {/* Sub-Filters: Media type (All, Music, Videos) & Failed toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {[
            { id: 'all' as MediaFilter, label: 'All' },
            { id: 'music' as MediaFilter, label: 'Music', icon: Music },
            { id: 'video' as MediaFilter, label: 'Videos', icon: Film },
          ].map(m => {
            const active = mediaFilter === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setMediaFilter(m.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#00B8FF]/15 text-[#00B8FF] border border-[#00B8FF]/40 font-bold'
                    : 'bg-[var(--vg-card)] text-[var(--vg-text-muted)] border border-[var(--vg-border)] hover:text-[var(--vg-text-primary)]'
                }`}
              >
                {Icon && <Icon size={12} />}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Failed items counter pill if any failed */}
        {counts.failed > 0 && (
          <button
            onClick={() => setActiveVidmateTab(activeVidmateTab === 'failed' ? 'downloading' : 'failed')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
              activeVidmateTab === 'failed'
                ? 'bg-rose-500 text-white border-rose-500'
                : 'bg-rose-500/10 text-rose-500 border-rose-500/25 hover:bg-rose-500/20'
            }`}
          >
            Failed ({counts.failed})
          </button>
        )}
      </div>

      {/* Automatic Queue Status Banner in "Downloading" tab */}
      {activeVidmateTab === 'downloading' && counts.downloading > 0 && (
        <div
          className={`flex items-center justify-between p-3 rounded-2xl border shadow-sm transition-all ${
            isQueuePaused
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-gradient-to-r from-[#00B8FF]/10 via-[#563BFF]/10 to-[#DB20E8]/10 border-[#00B8FF]/25'
          }`}
        >
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-[var(--vg-text-primary)] truncate">
              {isQueuePaused
                ? 'Queue Paused'
                : currentlyDownloadingJob
                ? `Auto-Downloading: ${currentlyDownloadingJob.title || currentlyDownloadingJob.filename}`
                : isAnyDownloading
                ? 'Downloading directly to device storage…'
                : 'Auto-Download Engine Active'}
            </p>
            <p className="text-[10px] text-[var(--vg-text-muted)] mt-0.5 font-medium truncate">
              {isQueuePaused
                ? `${counts.downloading} task${counts.downloading > 1 ? 's' : ''} paused • Tap Resume to continue auto-download`
                : currentlyDownloadingJob?.speed
                ? `Saving to device Downloads folder • ${currentlyDownloadingJob.speed}`
                : `${counts.downloading} song${counts.downloading > 1 ? 's' : ''} downloading automatically one by one`}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isQueuePaused ? (
              <button
                onClick={resumeQueue}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl gradient-btn text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
                title="Resume all downloads"
              >
                <Play size={12} className="fill-white ml-0.5" />
                <span>Resume All</span>
              </button>
            ) : (
              <button
                onClick={pauseQueue}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border border-amber-500/30 text-xs font-bold transition-all active:scale-95"
                title="Pause all active downloads"
              >
                <Pause size={13} className="fill-amber-500" />
                <span>Pause All</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Downloaded Storage Summary (In Downloaded Tab) */}
      {activeVidmateTab === 'downloaded' && counts.downloaded > 0 && (
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[var(--vg-card)] border border-[var(--vg-border)] text-xs text-[var(--vg-text-muted)] font-medium">
          <div className="flex items-center gap-2">
            <HardDrive size={15} className="text-[#00B8FF]" />
            <span className="font-semibold text-[var(--vg-text-primary)]">
              {counts.downloaded} file{counts.downloaded > 1 ? 's' : ''} saved to device
            </span>
          </div>
          {totalCompletedBytes > 0 && (
            <span className="font-mono text-[#00B8FF] font-bold">
              {formatBytes(totalCompletedBytes)}
            </span>
          )}
        </div>
      )}

      {/* Task List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[var(--vg-card)] border border-[var(--vg-border)] flex items-center justify-center mb-3 text-[var(--vg-text-muted)] shadow-sm">
            {activeVidmateTab === 'downloaded' ? (
              <CheckCircle2 size={26} className="text-emerald-500" />
            ) : (
              <Download size={26} className="text-[#00B8FF]" />
            )}
          </div>
          <p className="text-sm font-bold text-[var(--vg-text-primary)]">
            {activeVidmateTab === 'downloading'
              ? 'No active downloads'
              : activeVidmateTab === 'downloaded'
              ? 'No downloaded files yet'
              : 'No failed downloads'}
          </p>
          <p className="text-xs text-[var(--vg-text-muted)] mt-1 max-w-[260px] leading-relaxed">
            {activeVidmateTab === 'downloading'
              ? 'Songs or videos queued will automatically download one by one directly to your device.'
              : 'Files saved directly to your device storage will be cataloged here for quick playback.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(job => (
            <DownloadItem
              key={job.id}
              job={job}
              onPlayMedia={(j) => setActivePlayingJob(j)}
            />
          ))}
        </div>
      )}

      {/* VidMate Style Built-in Floating Media Player Bar (When a completed song is tapped) */}
      {activePlayingJob && (
        <div className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="rounded-2xl bg-[#0D1020]/95 backdrop-blur-xl border border-[#00B8FF]/40 p-3 shadow-2xl space-y-2 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 flex-shrink-0">
                  {activePlayingJob.thumbnail ? (
                    <img
                      src={activePlayingJob.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                      <Music size={16} className="text-[#00B8FF]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {activePlayingJob.title || activePlayingJob.filename}
                  </p>
                  <p className="text-[10px] text-neutral-400 truncate">
                    {activePlayingJob.artist || 'VidGrab Music Player'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActivePlayingJob(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close player"
              >
                <X size={16} />
              </button>
            </div>

            {/* Audio Stream Player */}
            {activePlayingJob.downloadUrl && (
              <audio
                controls
                autoPlay
                className="w-full h-8 rounded-lg accent-[#00B8FF]"
                src={buildProxyUrl(activePlayingJob.downloadUrl, activePlayingJob.filename || 'track.mp3')}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
