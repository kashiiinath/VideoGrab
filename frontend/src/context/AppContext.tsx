'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { VideoMetadata, DownloadJob, AppSettings, Theme } from '@/lib/types';
import { getDownloads } from '@/lib/api';
import axios from 'axios';

interface AppContextType {
  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Active metadata (from analyze)
  analyzedVideo: VideoMetadata | null;
  setAnalyzedVideo: (v: VideoMetadata | null) => void;

  // Download jobs
  jobs: DownloadJob[];
  refreshJobs: () => void;
  updateJobLocal: (id: string, updates: Partial<DownloadJob>) => void;

  // Tab navigation
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;

  // Backend status
  backendOnline: boolean;
}

export type TabName = 'home' | 'downloads' | 'history' | 'settings';

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [analyzedVideo, setAnalyzedVideo] = useState<VideoMetadata | null>(null);
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [backendOnline, setBackendOnline] = useState(true);
  const isRateLimitedRef = useRef(false);

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
    // If currently rate limited, skip auto poll for 15s
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
          // Reset rate limit lockout after 20 seconds
          setTimeout(() => {
            isRateLimitedRef.current = false;
          }, 20000);
          return;
        }
        // Only set offline on genuine network connection failure
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

  // Intelligent polling:
  // 1. Initial fetch once.
  // 2. Only poll frequently (4s) if there is an active downloading job.
  // 3. Otherwise, poll very infrequently (30s) only if on downloads tab.
  useEffect(() => {
    refreshJobs();

    const hasActiveJob = jobs.some(j => ['pending', 'ready', 'processing'].includes(j.status));
    const intervalMs = hasActiveJob ? 4000 : activeTab === 'downloads' ? 20000 : 60000;

    const interval = setInterval(() => {
      refreshJobs();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [refreshJobs, activeTab, jobs.length]);

  return (
    <AppContext.Provider value={{
      settings,
      updateSettings,
      analyzedVideo,
      setAnalyzedVideo,
      jobs,
      refreshJobs,
      updateJobLocal,
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
