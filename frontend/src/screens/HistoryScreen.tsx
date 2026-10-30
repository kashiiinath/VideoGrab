'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HistoryEntry } from '@/lib/types';
import { getHistory, deleteHistoryEntry, clearHistory, formatBytes, formatDate, getApiError } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import {
  History, Search, Trash2, Film, AlertCircle, RefreshCw, X, CheckCircle2,
} from 'lucide-react';

export default function HistoryScreen() {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getHistory({ search: search || undefined, limit: 50 });
      setItems(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function handleDelete(id: string) {
    await deleteHistoryEntry(id);
    setItems(prev => prev.filter(i => i.id !== id));
    setTotal(prev => prev - 1);
  }

  async function handleClearAll() {
    if (!confirm('Clear all download history?')) return;
    setClearing(true);
    await clearHistory();
    setItems([]);
    setTotal(0);
    setClearing(false);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white">History</h1>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">{total} entries</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search history…"
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-sm text-neutral-800 dark:text-white placeholder-neutral-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* List */}
      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-5 h-5 text-violet-400 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-3xl flex items-center justify-center mb-4">
            <History className="w-7 h-7 text-neutral-300 dark:text-neutral-600" />
          </div>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {search ? 'No results found' : 'No history yet'}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            {search ? 'Try a different search term.' : 'Downloads will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(entry => (
            <HistoryRow key={entry.id} entry={entry} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryRow({ entry, onDelete }: { entry: HistoryEntry; onDelete: (id: string) => void }) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        {/* Thumbnail */}
        <div className="w-14 h-10 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-700 flex-shrink-0 flex items-center justify-center">
          {entry.thumbnail ? (
            <img src={entry.thumbnail} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <Film className="w-4 h-4 text-neutral-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-800 dark:text-white truncate leading-snug">
            {entry.title || entry.filename || 'Untitled'}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StatusBadge status={entry.status} />
            <span className="text-[10px] text-neutral-400">
              {entry.format?.toUpperCase()} · {entry.quality}
            </span>
            {entry.fileSize && (
              <span className="text-[10px] text-neutral-400">{formatBytes(entry.fileSize)}</span>
            )}
          </div>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">{formatDate(entry.createdAt)}</p>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(entry.id)}
          className="p-1.5 text-neutral-300 dark:text-neutral-600 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
          aria-label="Delete"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Error */}
      {entry.errorMessage && (
        <div className="border-t border-neutral-100 dark:border-neutral-700 px-3 py-2">
          <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {entry.errorMessage}
          </p>
        </div>
      )}
    </div>
  );
}
