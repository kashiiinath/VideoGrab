'use client';

import React, { useState, useEffect } from 'react';
import { analyzeUrl, getSupportedSources, getApiError } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import Logo from '@/components/Logo';
import UrlInput from '@/components/UrlInput';
import VideoCard from '@/components/VideoCard';
import { SupportedSource } from '@/lib/types';
import {
  Play, CheckCircle2, Clock, MoreVertical,
  AlertCircle, WifiOff
} from 'lucide-react';

export default function HomeScreen() {
  const { analyzedVideo, setAnalyzedVideo, backendOnline, jobs, setActiveTab } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sources, setSources] = useState<SupportedSource[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  useEffect(() => {
    getSupportedSources()
      .then(setSources)
      .catch(() => {});
  }, []);

  async function handleAnalyze(url: string) {
    setLoading(true);
    setError('');
    setAnalyzedVideo(null);
    try {
      const metadata = await analyzeUrl(url);
      setAnalyzedVideo(metadata);
    } catch (err: any) {
      const msg = err?.response?.data?.error || getApiError(err);
      setError(msg || 'Failed to analyze URL');
    } finally {
      setLoading(false);
    }
  }

  const recentJobs = jobs.slice(0, 3);

  // Social Platforms with brand colors matching Design 2
  const platforms = [
    {
      id: 'youtube',
      name: 'YouTube',
      bg: 'bg-red-600',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
      sample: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      bg: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      sample: 'https://www.instagram.com/reel/...',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      bg: 'bg-blue-600',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      sample: 'https://www.facebook.com/watch?v=...',
    },
    {
      id: 'twitter',
      name: 'X',
      bg: 'bg-black dark:bg-neutral-900 border border-neutral-700',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      sample: 'https://x.com/user/status/...',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Glassmorphic Top Header with Logo & Dynamic Online/Offline Status */}
      <div className="sticky top-0 z-30 -mx-1 px-3.5 py-2.5 rounded-2xl bg-white/50 dark:bg-white/[0.04] backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex items-center justify-between transition-all">
        <Logo size="md" showText={true} showSubtitle={true} />

        {/* Online / Offline Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold tracking-wide select-none transition-all shadow-sm ${
            backendOnline
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              backendOnline
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse'
                : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
            }`}
          />
          <span>{backendOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Backend Offline Banner */}
      {!backendOnline && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-3">
          <WifiOff size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-500">Backend is reconnecting</p>
            <p className="text-[11px] text-[var(--vg-text-muted)] mt-0.5 leading-snug">
              Ensuring connection to VidGrab backend engine at localhost:3001.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area - Arranged lower with comfortable breathing room */}
      <div className="space-y-6 pt-3 sm:pt-6">
        {/* 2. Hero URL Input Section */}
        <UrlInput onAnalyze={handleAnalyze} loading={loading} error={error} />

      {/* 3. Video Preview Screen (when analyzed) OR Home Content */}
      {analyzedVideo ? (
        <VideoCard metadata={analyzedVideo} onBack={() => setAnalyzedVideo(null)} />
      ) : (
        <>
          {/* 4. Supported Platforms Grid / Row */}
          <div className="space-y-3">
            <div className="px-1">
              <span className="text-xs font-bold text-[var(--vg-text-secondary)] uppercase tracking-wider">
                Supported Platforms
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-[var(--vg-card)] border border-transparent hover:border-[var(--vg-border)] transition-all group"
                >
                  <div className={`w-11 h-11 rounded-2xl ${p.bg} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                    {p.icon}
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--vg-text-secondary)] group-hover:text-[var(--vg-text-primary)] truncate max-w-full">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Recent Downloads Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-[var(--vg-text-primary)]">
                Recent Downloads
              </h2>
              <button
                onClick={() => setActiveTab('downloads')}
                className="text-xs font-bold text-[#563BFF] dark:text-[#00B8FF] hover:underline"
              >
                See All
              </button>
            </div>

            {recentJobs.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--vg-border)] p-6 text-center bg-[var(--vg-card)]">
                <p className="text-xs font-medium text-[var(--vg-text-secondary)]">
                  No downloads yet.
                </p>
                <p className="text-[11px] text-[var(--vg-text-muted)] mt-1">
                  Paste a video link above and click Analyze to start your first download!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--vg-border)] bg-[var(--vg-card)] shadow-sm hover:border-[#563BFF]/30 transition-all"
                  >
                    {/* Thumbnail with mini play overlay */}
                    <div className="relative w-14 h-11 rounded-xl overflow-hidden bg-neutral-900 flex-shrink-0 border border-[var(--vg-border)]">
                      {job.thumbnail ? (
                        <img
                          src={job.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                          <Play size={12} className="text-neutral-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                        <Play size={10} className="fill-white text-white opacity-80" />
                      </div>
                    </div>

                    {/* Title & Format Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[var(--vg-text-primary)] truncate">
                        {job.title || job.filename}
                      </p>
                      <p className="text-[11px] font-semibold text-[var(--vg-text-muted)] mt-0.5">
                        {job.format?.toUpperCase() || 'MP4'} • {job.quality || 'HD'}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {job.status === 'completed' ? (
                        <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-500/20" />
                      ) : job.status === 'failed' ? (
                        <AlertCircle size={18} className="text-rose-500" />
                      ) : (
                        <Clock size={18} className="text-[#563BFF] animate-pulse" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      </div>
    </div>
  );
}
