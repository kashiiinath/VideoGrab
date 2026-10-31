'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HistoryEntry } from '@/lib/types';
import { getHistory, deleteHistoryEntry, clearHistory, formatBytes, formatDate, getApiError } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import { useApp } from '@/context/AppContext';
import {
  Search, Trash2, Film, AlertCircle, RefreshCw, X, ArrowLeft, Play, Clock
} from 'lucide-react';

export default function HistoryScreen() {
  const { setActiveTab } = useApp();
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
            <h1 className="text-lg font-bold text-[var(--vg-text-primary)]">History</h1>
            <p className="text-[11px] text-[var(--vg-text-muted)] font-medium">{total} total items</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={load}
            className="p-2 rounded-full text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/10 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw size={17} />
          </button>
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-full border border-red-500/20 transition-colors"
            >
              <Trash2 size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Pill Search Field */}
      <div className="relative">
        <div
          className="flex items-center rounded-full border px-4 py-1.5 transition-all"
          style={{
            backgroundColor: 'var(--vg-input-bg)',
            borderColor: 'var(--vg-border)',
          }}
        >
          <Search size={16} className="text-[var(--vg-text-muted)] mr-2 flex-shrink-0" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search downloads…"
            className="flex-1 py-1.5 text-[13px] font-medium text-[var(--vg-text-primary)] placeholder-[var(--vg-text-muted)] bg-transparent outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="p-1 text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)]">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-2.5 text-red-500 text-xs font-medium">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* List */}
      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={22} className="text-[#563BFF] animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[var(--vg-card)] border border-[var(--vg-border)] flex items-center justify-center mb-3 text-[var(--vg-text-muted)] shadow-sm">
            <Clock size={26} />
          </div>
          <p className="text-sm font-bold text-[var(--vg-text-primary)]">
            {search ? 'No matches found' : 'History is empty'}
          </p>
          <p className="text-xs text-[var(--vg-text-muted)] mt-1 max-w-[220px]">
            {search ? 'Try searching with another keyword.' : 'Downloaded videos will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(entry => (
            <div
              key={entry.id}
              className="rounded-2xl border p-3 flex items-center gap-3 transition-all shadow-sm"
              style={{
                backgroundColor: 'var(--vg-card)',
                borderColor: 'var(--vg-border)',
              }}
            >
              {/* Thumbnail */}
              <div className="relative w-14 h-11 rounded-xl overflow-hidden bg-neutral-900 border border-[var(--vg-border)] flex-shrink-0">
                {entry.thumbnail ? (
                  <img
                    src={entry.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                    <Film size={16} className="text-neutral-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                  <Play size={10} className="fill-white text-white opacity-80" />
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-[var(--vg-text-primary)] truncate">
                  {entry.title || entry.filename || 'Untitled'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[var(--vg-text-muted)] font-medium flex-wrap">
                  <StatusBadge status={entry.status} />
                  <span>•</span>
                  <span>{entry.quality || 'HD'}</span>
                  {entry.fileSize && (
                    <>
                      <span>•</span>
                      <span>{formatBytes(entry.fileSize)}</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-[var(--vg-text-muted)] mt-0.5">{formatDate(entry.createdAt)}</p>
              </div>

              {/* Delete Icon */}
              <button
                onClick={() => handleDelete(entry.id)}
                className="p-2 text-[var(--vg-text-muted)] hover:text-red-500 rounded-full hover:bg-neutral-500/10 transition-colors flex-shrink-0"
                aria-label="Delete entry"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
