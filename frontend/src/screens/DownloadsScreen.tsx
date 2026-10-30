'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import DownloadItem from '@/components/DownloadItem';
import { Download, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';

type Filter = 'all' | 'active' | 'completed' | 'failed';

const filters: { id: Filter; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'all',       label: 'All',       icon: Clock },
  { id: 'active',    label: 'Active',    icon: Download },
  { id: 'completed', label: 'Done',      icon: CheckCircle2 },
  { id: 'failed',    label: 'Failed',    icon: XCircle },
];

export default function DownloadsScreen() {
  const { jobs, refreshJobs } = useApp();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = jobs.filter(j => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['pending', 'ready', 'processing'].includes(j.status);
    if (filter === 'completed') return j.status === 'completed';
    if (filter === 'failed') return ['failed', 'cancelled'].includes(j.status);
    return true;
  });

  const counts = {
    all: jobs.length,
    active: jobs.filter(j => ['pending', 'ready', 'processing'].includes(j.status)).length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => ['failed', 'cancelled'].includes(j.status)).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Downloads</h1>
        <button
          onClick={refreshJobs}
          className="p-2 text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-1">
        {filters.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === id
                ? 'bg-white dark:bg-neutral-700 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {counts[id] > 0 && (
              <span className={`text-[10px] px-1.5 rounded-full ${
                filter === id ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400' : 'bg-neutral-200 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400'
              }`}>
                {counts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-3xl flex items-center justify-center mb-4">
            <Download className="w-7 h-7 text-neutral-300 dark:text-neutral-600" />
          </div>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {filter === 'all' ? 'No downloads yet' : `No ${filter} downloads`}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            Head to Home and paste a video URL to start.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(job => (
            <DownloadItem key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
