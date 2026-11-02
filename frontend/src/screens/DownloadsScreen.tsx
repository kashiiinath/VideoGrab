'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import DownloadItem from '@/components/DownloadItem';
import { ArrowLeft, RefreshCw, Download, MoreVertical, Film, Music } from 'lucide-react';

type StatusFilter = 'active' | 'completed' | 'failed';
type MediaFilter = 'all' | 'video' | 'music';

const statusFilters: { id: StatusFilter; label: string }[] = [
  { id: 'active',    label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed',    label: 'Failed' },
];

export default function DownloadsScreen() {
  const { jobs, refreshJobs, setActiveTab } = useApp();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');

  const filtered = jobs.filter(j => {
    // Status check
    if (statusFilter === 'active' && !['pending', 'ready', 'processing'].includes(j.status)) return false;
    if (statusFilter === 'completed' && j.status !== 'completed') return false;
    if (statusFilter === 'failed' && !['failed', 'cancelled'].includes(j.status)) return false;

    // Media type check
    const isAudio = j.mediaType === 'music' || ['mp3', 'm4a', 'wav', 'flac', 'aac'].includes(j.format?.toLowerCase() || '');
    if (mediaFilter === 'video' && isAudio) return false;
    if (mediaFilter === 'music' && !isAudio) return false;

    return true;
  });

  const counts = {
    active: jobs.filter(j => ['pending', 'ready', 'processing'].includes(j.status)).length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => ['failed', 'cancelled'].includes(j.status)).length,
  };

  return (
    <div className="space-y-4">
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
          <h1 className="text-lg font-bold text-[var(--vg-text-primary)]">
            Downloads
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={refreshJobs}
            className="p-2 rounded-full text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/10 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      {/* Media Type Sub-Filter Pills */}
      <div className="flex items-center gap-1.5">
        {[
          { id: 'all' as MediaFilter, label: 'All Media' },
          { id: 'video' as MediaFilter, label: 'Videos', icon: Film },
          { id: 'music' as MediaFilter, label: 'Music', icon: Music },
        ].map(m => {
          const active = mediaFilter === m.id;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setMediaFilter(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'bg-gradient-to-r from-[#00B8FF]/20 to-[#563BFF]/20 text-[#00B8FF] border border-[#00B8FF]/40 font-bold'
                  : 'bg-[var(--vg-card)] text-[var(--vg-text-muted)] border border-[var(--vg-border)] hover:text-[var(--vg-text-primary)]'
              }`}
            >
              {Icon && <Icon size={12} />}
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 p-1 rounded-2xl bg-[var(--vg-card)] border border-[var(--vg-border)]">
        {statusFilters.map(({ id, label }) => {
          const isActive = statusFilter === id;
          return (
            <button
              key={id}
              onClick={() => setStatusFilter(id)}
              className={`
                flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5
                ${
                  isActive
                    ? 'gradient-btn shadow-md text-white'
                    : 'text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)]'
                }
              `}
            >
              <span>{label}</span>
              {counts[id] > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-neutral-500/15 text-[var(--vg-text-muted)]'
                }`}>
                  {counts[id]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[var(--vg-card)] border border-[var(--vg-border)] flex items-center justify-center mb-3 text-[var(--vg-text-muted)] shadow-sm">
            <Download size={24} />
          </div>
          <p className="text-sm font-bold text-[var(--vg-text-primary)]">
            No {statusFilter} downloads
          </p>
          <p className="text-xs text-[var(--vg-text-muted)] mt-1 max-w-[240px]">
            {statusFilter === 'active'
              ? 'Downloads in progress will show here in real-time.'
              : 'Completed downloads will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(job => (
            <DownloadItem key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
