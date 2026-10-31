'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import DownloadItem from '@/components/DownloadItem';
import { ArrowLeft, RefreshCw, Download, MoreVertical } from 'lucide-react';

type Filter = 'active' | 'completed' | 'failed';

const filters: { id: Filter; label: string }[] = [
  { id: 'active',    label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed',    label: 'Failed' },
];

export default function DownloadsScreen() {
  const { jobs, refreshJobs, setActiveTab } = useApp();
  const [filter, setFilter] = useState<Filter>('active');

  const filtered = jobs.filter(j => {
    if (filter === 'active') return ['pending', 'ready', 'processing'].includes(j.status);
    if (filter === 'completed') return j.status === 'completed';
    if (filter === 'failed') return ['failed', 'cancelled'].includes(j.status);
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
          <button
            className="p-2 rounded-full text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/10 transition-colors"
            aria-label="More"
          >
            <MoreVertical size={17} />
          </button>
        </div>
      </div>

      {/* Filter Tabs matching Design 2 */}
      <div className="flex gap-2 p-1 rounded-2xl bg-[var(--vg-card)] border border-[var(--vg-border)]">
        {filters.map(({ id, label }) => {
          const isActive = filter === id;
          return (
            <button
              key={id}
              onClick={() => setFilter(id)}
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
            <Download size={26} />
          </div>
          <p className="text-sm font-bold text-[var(--vg-text-primary)]">
            No {filter} downloads
          </p>
          <p className="text-xs text-[var(--vg-text-muted)] mt-1 max-w-[240px]">
            {filter === 'active'
              ? 'New downloads in progress will appear here.'
              : `Your ${filter} items will be listed here.`}
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
