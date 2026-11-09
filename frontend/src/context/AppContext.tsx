'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { VideoMetadata, MusicMetadata, DownloadJob, AppSettings, Theme } from '@/lib/types';
import { getDownloads } from '@/lib/api';
import { downloadViaProxy, pauseDownloadJob } from '@/lib/download';
import axios from 'axios';

interface AppContextType {
  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Active metadata (from analyze)
  analyzedVideo: VideoMetadata | null;
  setAnalyzedVideo: (v: VideoMetadata | null) => void;

  analyzedMusic: MusicMetadata | null;
  setAnalyzedMusic: (m: MusicMetadata | null) => void;

  // Download jobs & automatic queue
  jobs: DownloadJob[];
  refreshJobs: () => void;
  updateJobLocal: (id: string, updates: Partial<DownloadJob>) => void;
  isQueuePaused: boolean;
  setIsQueuePaused: (paused: boolean) => void;
  currentlyDownloadingJob: DownloadJob | null;
  pauseQueue: () => void;
  resumeQueue: () => void;

  // Tab navigation
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;

  // Backend status
  backendOnline: boolean;
}

export type TabName = 'home' | 'music' | 'downloads' | 'history' | 'settings';

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  defaultAudioQuality: '320k',
  defaultVideoQuality: '720p',
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [analyzedVideo, setAnalyzedVideo] = useState<VideoMetadata | null>(null);
  const [analyzedMusic, setAnalyzedMusic] = useState<MusicMetadata | null>(null);
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [backendOnline, setBackendOnline] = useState(true);
  const isRateLimitedRef = useRef(false);

  // Automatic Background Queue State
  const [isQueuePaused, setIsQueuePaused] = useState(false);
  const [currentlyDownloadingJob, setCurrentlyDownloadingJob] = useState<DownloadJob | null>(null);
  const isWorkerRunningRef = useRef(false);
  const activeJobIdRef = useRef<string | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vidgrab_settings');
      if (saved) setSettings(JSON.parse(saved));
    } catch {}
  }, []);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    const { theme } = settings;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  }, [settings.theme]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('vidgrab_settings', JSON.stringify(next));
      return next;
    });
  }, []);

  const refreshJobs = useCallback(async () => {
    // If currently rate limited, skip auto poll
    if (isRateLimitedRef.current) return;

    try {
      const data = await getDownloads();
      setJobs(data);
      setBackendOnline(true);
      isRateLimitedRef.current = false;
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 429) {
          // Backend is alive, but rate-limited! Keep backendOnline = true
          setBackendOnline(true);
          isRateLimitedRef.current = true;
          setTimeout(() => {
            isRateLimitedRef.current = false;
          }, 20000);
          return;
        }
        if (!err.response) {
          setBackendOnline(false);
          return;
        }
      }
    }
  }, []);

  const updateJobLocal = useCallback((id: string, updates: Partial<DownloadJob>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
  }, []);

  // Intelligent polling
  useEffect(() => {
    refreshJobs();

    const hasActiveJob = jobs.some(j => ['pending', 'ready', 'processing'].includes(j.status));
    const intervalMs = hasActiveJob ? 4000 : activeTab === 'downloads' ? 20000 : 60000;

    const interval = setInterval(() => {
      refreshJobs();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [refreshJobs, activeTab, jobs.length]);

  // Pause entire queue
  const pauseQueue = useCallback(() => {
    setIsQueuePaused(true);
    if (activeJobIdRef.current) {
      pauseDownloadJob(activeJobIdRef.current);
      updateJobLocal(activeJobIdRef.current, { status: 'paused', speed: undefined });
    }
  }, [updateJobLocal]);

  // Resume entire queue
  const resumeQueue = useCallback(() => {
    setIsQueuePaused(false);
    // Mark paused items as ready so the runner will pick them up
    setJobs(prev => prev.map(j => j.status === 'paused' ? { ...j, status: 'ready' } : j));
  }, []);

  // VidMate Automatic Sequential Queue Runner:
  // Automatically picks up pending/ready jobs one by one and saves directly to user's device
  useEffect(() => {
    if (isQueuePaused) return;
    if (isWorkerRunningRef.current) return;

    // Find next pending or ready job with valid formatUrl & filename
    const nextJob = jobs.find(j =>
      ['pending', 'ready'].includes(j.status) &&
      Boolean(j.downloadUrl) &&
      Boolean(j.filename)
    );

    if (!nextJob) {
      if (currentlyDownloadingJob) {
        setCurrentlyDownloadingJob(null);
      }
      return;
    }

    isWorkerRunningRef.current = true;
    activeJobIdRef.current = nextJob.id;
    setCurrentlyDownloadingJob(nextJob);

    updateJobLocal(nextJob.id, {
      status: 'processing',
      progress: Math.max(5, nextJob.progress || 0),
      speed: 'Connecting…'
    });

    (async () => {
      try {
        await downloadViaProxy({
          jobId: nextJob.id,
          formatUrl: nextJob.downloadUrl!,
          filename: nextJob.filename || 'media.mp3',
          onProgress: (info) => {
            updateJobLocal(nextJob.id, {
              status: 'processing',
              progress: info.percent,
              speed: info.speed,
              downloadedBytes: info.downloadedBytes,
              totalBytes: info.totalBytes,
            });
          },
          onComplete: () => {
            updateJobLocal(nextJob.id, {
              status: 'completed',
              progress: 100,
              speed: undefined,
            });
            refreshJobs();
          },
          onPause: () => {
            updateJobLocal(nextJob.id, {
              status: 'paused',
              speed: undefined,
            });
            refreshJobs();
          },
          onError: (err) => {
            updateJobLocal(nextJob.id, {
              status: 'failed',
              errorMessage: err,
              speed: undefined,
            });
            refreshJobs();
          },
        });
      } catch (err) {
        console.error('Queue download execution error:', err);
      } finally {
        isWorkerRunningRef.current = false;
        activeJobIdRef.current = null;
        setCurrentlyDownloadingJob(null);
        // Brief settle delay between consecutive file saves
        setTimeout(() => {
          refreshJobs();
        }, 1200);
      }
    })();
  }, [jobs, isQueuePaused, updateJobLocal, refreshJobs, currentlyDownloadingJob]);

  return (
    <AppContext.Provider value={{
      settings,
      updateSettings,
      analyzedVideo,
      setAnalyzedVideo,
      analyzedMusic,
      setAnalyzedMusic,
      jobs,
      refreshJobs,
      updateJobLocal,
      isQueuePaused,
      setIsQueuePaused,
      currentlyDownloadingJob,
      pauseQueue,
      resumeQueue,
      activeTab,
      setActiveTab,
      backendOnline,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
