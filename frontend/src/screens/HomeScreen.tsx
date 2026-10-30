'use client';

import React, { useState, useEffect } from 'react';
import { analyzeUrl, getSupportedSources, getApiError } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import Logo from '@/components/Logo';
import UrlInput from '@/components/UrlInput';
import VideoCard from '@/components/VideoCard';
import { SupportedSource } from '@/lib/types';
import { Wifi, WifiOff, ChevronDown, ChevronUp, Globe, Zap, Shield } from 'lucide-react';

export default function HomeScreen() {
  const { analyzedVideo, setAnalyzedVideo, backendOnline, jobs } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sources, setSources] = useState<SupportedSource[]>([]);
  const [showSources, setShowSources] = useState(false);

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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <Logo size="md" showText={true} />
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
          backendOnline
            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
        }`}>
          {backendOnline
            ? <><Wifi className="w-3 h-3" />Online</>
            : <><WifiOff className="w-3 h-3" />Offline</>}
        </div>
      </div>

      {/* Hero headline */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white leading-tight">
          Download any<br />
          <span className="text-violet-600 dark:text-violet-400">video, instantly.</span>
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5">
          Paste a video URL below to get started.
        </p>
      </div>

      {/* URL Input */}
      <UrlInput onAnalyze={handleAnalyze} loading={loading} error={error} />

      {/* Backend offline warning */}
      {!backendOnline && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <div className="flex items-start gap-2.5">
            <WifiOff className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Backend not running</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5 leading-snug">
                Start the backend server with <code className="bg-amber-100 dark:bg-amber-800/50 px-1 rounded">npm run dev:backend</code> in the project root.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Video result */}
      {analyzedVideo && <VideoCard metadata={analyzedVideo} />}

      {/* Recent activity */}
      {recentJobs.length > 0 && !analyzedVideo && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Recent Downloads</h2>
          <div className="space-y-2">
            {recentJobs.map(job => (
              <div key={job.id} className="flex items-center gap-3 bg-white dark:bg-neutral-800 rounded-xl px-3 py-2.5 border border-neutral-100 dark:border-neutral-700">
                {job.thumbnail ? (
                  <img src={job.thumbnail} alt="" className="w-10 h-8 rounded-lg object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-10 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-800 dark:text-white truncate">{job.title || job.filename}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{job.quality} · {job.format?.toUpperCase()}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  job.status === 'completed' ? 'bg-green-100 text-green-600' :
                  job.status === 'failed' ? 'bg-red-100 text-red-500' :
                  'bg-violet-100 text-violet-600'
                }`}>{job.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features strip */}
      {!analyzedVideo && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Zap, title: 'Fast', desc: 'Direct stream' },
            { icon: Shield, title: 'Private', desc: 'Local only' },
            { icon: Globe, title: 'Multi-source', desc: 'MP4, WebM, HLS' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white dark:bg-neutral-800 rounded-2xl p-3 text-center border border-neutral-100 dark:border-neutral-700">
              <div className="w-8 h-8 bg-violet-50 dark:bg-violet-900/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Icon className="w-4 h-4 text-violet-500" />
              </div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-white">{title}</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Supported sources */}
      {sources.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 overflow-hidden">
          <button
            onClick={() => setShowSources(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-neutral-800 dark:text-white"
          >
            <span>Supported Sources</span>
            {showSources ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </button>
          {showSources && (
            <div className="border-t border-neutral-100 dark:border-neutral-700 divide-y divide-neutral-100 dark:divide-neutral-700">
              {sources.map(src => (
                <div key={src.name} className="px-4 py-3">
                  <p className="text-xs font-semibold text-neutral-800 dark:text-white">{src.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{src.description}</p>
                  {src.examples.length > 0 && (
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 font-mono truncate">
                      e.g. {src.examples[0]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
